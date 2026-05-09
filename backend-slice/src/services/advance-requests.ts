import type { ArStage, UserRole } from '@prisma/client';
import { db } from '../lib/db.js';
import { InvalidTransition, RuleViolation, NotFound } from '../lib/errors.js';
import { record as audit } from './audit.js';
import type { AuthClaims } from '../lib/auth.js';

// =====================================================================
// AR state machine
// =====================================================================
type Transition = { from: ArStage; to: ArStage; actorRole: UserRole; action: string };

const TRANSITIONS: Transition[] = [
  { from: 'DRAFT',                to: 'PO_SUBMITTED',         actorRole: 'PROJECT_OFFICER',       action: 'submit' },
  { from: 'PO_SUBMITTED',         to: 'HOP_RECOMMENDED',      actorRole: 'HEAD_OF_PROGRAMS',      action: 'recommend' },
  { from: 'PO_SUBMITTED',         to: 'RETURNED',             actorRole: 'HEAD_OF_PROGRAMS',      action: 'return' },
  { from: 'HOP_RECOMMENDED',      to: 'FM_APPROVED',          actorRole: 'FINANCE_MANAGER',       action: 'fm-approve' },
  { from: 'HOP_RECOMMENDED',      to: 'RETURNED',             actorRole: 'FINANCE_MANAGER',       action: 'return' },
  { from: 'FM_APPROVED',          to: 'ED_APPROVED',          actorRole: 'EXECUTIVE_DIRECTOR',    action: 'ed-approve' },
  { from: 'FM_APPROVED',          to: 'DISBURSED',            actorRole: 'GRANT_FINANCE_OFFICER', action: 'disburse' },
  { from: 'ED_APPROVED',          to: 'DISBURSED',            actorRole: 'GRANT_FINANCE_OFFICER', action: 'disburse' },
  { from: 'DISBURSED',            to: 'LIQUIDATION_PENDING',  actorRole: 'PROJECT_OFFICER',       action: 'submit-liquidation' },
  { from: 'LIQUIDATION_PENDING',  to: 'LIQUIDATED',           actorRole: 'FINANCE_MANAGER',       action: 'accept-liquidation' },
  { from: 'LIQUIDATION_PENDING',  to: 'RETURNED',             actorRole: 'FINANCE_MANAGER',       action: 'return' },
  { from: 'RETURNED',             to: 'PO_SUBMITTED',         actorRole: 'PROJECT_OFFICER',       action: 'resubmit' },
];

export function allowedTo(from: ArStage, role: UserRole): ArStage[] {
  return TRANSITIONS.filter((t) => t.from === from && t.actorRole === role).map((t) => t.to);
}

export function findTransition(from: ArStage, to: ArStage, role: UserRole): Transition {
  const t = TRANSITIONS.find((x) => x.from === from && x.to === to && x.actorRole === role);
  if (!t) throw InvalidTransition(from, to, allowedTo(from, role));
  return t;
}

// =====================================================================
// Approval routing
// =====================================================================
export async function nextApproverRole(amount: bigint, currentStage: ArStage): Promise<UserRole | null> {
  if (currentStage === 'PO_SUBMITTED')    return 'HEAD_OF_PROGRAMS';
  if (currentStage === 'HOP_RECOMMENDED') return 'FINANCE_MANAGER';
  if (currentStage === 'FM_APPROVED') {
    const rule = await db.approvalRule.findFirst({
      where: {
        entityKind: 'AR',
        thresholdLow: { lte: amount },
        OR: [{ thresholdHigh: null }, { thresholdHigh: { gte: amount } }],
      },
    });
    const route = (rule?.route as string[] | undefined) || [];
    return route.includes('ED') ? 'EXECUTIVE_DIRECTOR' : 'GRANT_FINANCE_OFFICER';
  }
  if (currentStage === 'ED_APPROVED') return 'GRANT_FINANCE_OFFICER';
  return null;
}

// =====================================================================
// Pre-submission guards
// =====================================================================
export async function assertCanSubmit(args: { officerId: string; dipCode: string; amount: bigint }) {
  // Rule 50: officer cannot raise a new advance while an earlier one is overdue past liquidation
  const today = new Date();
  const overdue = await db.advanceRequest.findFirst({
    where: {
      requestedById: args.officerId,
      stage: { in: ['DISBURSED', 'LIQUIDATION_PENDING'] },
      dueLiqDate: { lt: today },
    },
  });
  if (overdue) {
    throw RuleViolation(
      'outstanding_advance_block',
      `Officer has an outstanding overdue advance (${overdue.id}). Liquidate before requesting another.`,
      { blockingArId: overdue.id },
    );
  }

  // DIP balance
  const dip = await db.dipLine.findUnique({ where: { code: args.dipCode } });
  if (!dip) throw NotFound(`DIP line ${args.dipCode} not found`);
  const available = dip.budgetAmount - dip.committed - dip.spent;
  if (args.amount > available) {
    throw RuleViolation(
      'dip_overdraft_no_justification',
      `Amount ${args.amount} exceeds available ${available} on ${args.dipCode}.`,
      { available: available.toString(), requested: args.amount.toString() },
    );
  }
}

// =====================================================================
// Transition executor (used by every state-changing route)
// =====================================================================
export async function transition(args: {
  arId: string;
  to: ArStage;
  actor: AuthClaims;
  note?: string;
  patch?: Record<string, unknown>;
}) {
  return db.$transaction(async (tx) => {
    const ar = await tx.advanceRequest.findUnique({ where: { id: args.arId } });
    if (!ar) throw NotFound(`AR ${args.arId} not found`);
    if (!args.actor.projects.includes(ar.projId)) {
      throw RuleViolation('project_access_denied', `No access to project ${ar.projId}`);
    }

    const t = findTransition(ar.stage, args.to, args.actor.role);

    const next = await nextApproverRole(ar.amount, args.to);
    const updated = await tx.advanceRequest.update({
      where: { id: ar.id },
      data: {
        stage: args.to,
        nextApproverRole: next,
        ...args.patch,
      },
    });

    await audit(tx as never, {
      whoId: args.actor.sub,
      entity: 'AR',
      entityId: ar.id,
      action: t.action,
      note: args.note,
    });

    return updated;
  });
}

// =====================================================================
// ID generator (year + sequence)
// =====================================================================
export async function nextArId(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `AR-${year}-`;
  const last = await db.advanceRequest.findFirst({
    where: { id: { startsWith: prefix } },
    orderBy: { id: 'desc' },
    select: { id: true },
  });
  const n = last ? parseInt(last.id.slice(prefix.length), 10) + 1 : 1;
  return `${prefix}${String(n).padStart(4, '0')}`;
}
