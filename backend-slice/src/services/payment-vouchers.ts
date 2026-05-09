import type { PvStage, UserRole } from '@prisma/client';
import { db } from '../lib/db.js';
import { InvalidTransition, RuleViolation, NotFound } from '../lib/errors.js';
import { record as audit } from './audit.js';
import type { AuthClaims } from '../lib/auth.js';

type T = { from: PvStage; to: PvStage; actorRole: UserRole; action: string };

const TRANSITIONS: T[] = [
  { from: 'DRAFT',          to: 'PO_SUBMITTED',  actorRole: 'PROJECT_OFFICER',       action: 'submit' },
  { from: 'PO_SUBMITTED',   to: 'GFO_REVIEWED',  actorRole: 'GRANT_FINANCE_OFFICER', action: 'gfo-review' },
  { from: 'PO_SUBMITTED',   to: 'RETURNED',      actorRole: 'GRANT_FINANCE_OFFICER', action: 'return' },
  { from: 'GFO_REVIEWED',   to: 'FM_APPROVED',   actorRole: 'FINANCE_MANAGER',       action: 'fm-approve' },
  { from: 'GFO_REVIEWED',   to: 'RETURNED',      actorRole: 'FINANCE_MANAGER',       action: 'return' },
  { from: 'FM_APPROVED',    to: 'ED_APPROVED',   actorRole: 'EXECUTIVE_DIRECTOR',    action: 'ed-approve' },
  { from: 'FM_APPROVED',    to: 'SCHEDULED',     actorRole: 'GRANT_FINANCE_OFFICER', action: 'schedule' },
  { from: 'ED_APPROVED',    to: 'SCHEDULED',     actorRole: 'GRANT_FINANCE_OFFICER', action: 'schedule' },
  { from: 'SCHEDULED',      to: 'PAID',          actorRole: 'GRANT_FINANCE_OFFICER', action: 'mark-paid' },
  { from: 'RETURNED',       to: 'PO_SUBMITTED',  actorRole: 'PROJECT_OFFICER',       action: 'resubmit' },
];

export const allowedTo = (from: PvStage, role: UserRole) =>
  TRANSITIONS.filter((t) => t.from === from && t.actorRole === role).map((t) => t.to);

export function findTransition(from: PvStage, to: PvStage, role: UserRole) {
  const t = TRANSITIONS.find((x) => x.from === from && x.to === to && x.actorRole === role);
  if (!t) throw InvalidTransition(from, to, allowedTo(from, role));
  return t;
}

export async function nextApproverRole(amount: bigint, currentStage: PvStage): Promise<UserRole | null> {
  if (currentStage === 'PO_SUBMITTED')   return 'GRANT_FINANCE_OFFICER';
  if (currentStage === 'GFO_REVIEWED')   return 'FINANCE_MANAGER';
  if (currentStage === 'FM_APPROVED') {
    const rule = await db.approvalRule.findFirst({
      where: { entityKind: 'PV', thresholdLow: { lte: amount }, OR: [{ thresholdHigh: null }, { thresholdHigh: { gte: amount } }] },
    });
    const route = (rule?.route as string[] | undefined) || [];
    return route.includes('ED') ? 'EXECUTIVE_DIRECTOR' : 'GRANT_FINANCE_OFFICER';
  }
  if (currentStage === 'ED_APPROVED' || currentStage === 'SCHEDULED') return 'GRANT_FINANCE_OFFICER';
  return null;
}

export async function assertWtecValid(vendorId: string | null) {
  if (!vendorId) return;
  const v = await db.vendor.findUnique({ where: { id: vendorId } });
  if (!v) throw NotFound(`Vendor ${vendorId} not found`);
  if (!v.wtecValid) {
    throw RuleViolation('wtec_invalid', `Vendor ${v.name} has no valid WTEC.`, { vendorId });
  }
  if (v.wtecExpiry && v.wtecExpiry < new Date()) {
    throw RuleViolation('wtec_expired', `Vendor ${v.name} WTEC expired ${v.wtecExpiry.toISOString().slice(0,10)}.`, { vendorId });
  }
}

export async function transition(args: {
  pvId: string; to: PvStage; actor: AuthClaims; note?: string; patch?: Record<string, unknown>;
}) {
  return db.$transaction(async (tx) => {
    const pv = await tx.paymentVoucher.findUnique({ where: { id: args.pvId } });
    if (!pv) throw NotFound(`PV ${args.pvId} not found`);
    if (!args.actor.projects.includes(pv.projId)) throw RuleViolation('project_access_denied', 'No access');

    const t = findTransition(pv.stage, args.to, args.actor.role);
    const next = await nextApproverRole(pv.grossAmount, args.to);
    const updated = await tx.paymentVoucher.update({
      where: { id: pv.id },
      data: { stage: args.to, nextApproverRole: next, ...args.patch },
    });
    await audit(tx as never, { whoId: args.actor.sub, entity: 'PV', entityId: pv.id, action: t.action, note: args.note });
    return updated;
  });
}

export async function nextPvId(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `PV-${year}-`;
  const last = await db.paymentVoucher.findFirst({ where: { id: { startsWith: prefix } }, orderBy: { id: 'desc' }, select: { id: true } });
  const n = last ? parseInt(last.id.slice(prefix.length), 10) + 1 : 1248;
  return `${prefix}${String(n).padStart(4, '0')}`;
}
