import type { PrStage, UserRole } from '@prisma/client';
import { db } from '../lib/db.js';
import { InvalidTransition, RuleViolation, NotFound } from '../lib/errors.js';
import { record as audit } from './audit.js';
import type { AuthClaims } from '../lib/auth.js';

type T = { from: PrStage; to: PrStage; actorRole: UserRole; action: string };

const TRANSITIONS: T[] = [
  { from: 'DRAFT',         to: 'PR_SUBMITTED',   actorRole: 'PROJECT_OFFICER',     action: 'submit' },
  { from: 'PR_SUBMITTED',  to: 'RFQ_OPEN',       actorRole: 'PROCUREMENT_OFFICER', action: 'open-rfq' },
  { from: 'RFQ_OPEN',      to: 'RFQ_EVALUATED',  actorRole: 'PROCUREMENT_OFFICER', action: 'evaluate' },
  { from: 'RFQ_EVALUATED', to: 'LPO_ISSUED',     actorRole: 'PROCUREMENT_OFFICER', action: 'issue-lpo' },
  { from: 'LPO_ISSUED',    to: 'GRN_RECEIVED',   actorRole: 'PROCUREMENT_OFFICER', action: 'record-grn' },
  { from: 'GRN_RECEIVED',  to: 'CLOSED',         actorRole: 'PROCUREMENT_OFFICER', action: 'close' },
  { from: 'PR_SUBMITTED',  to: 'CANCELLED',      actorRole: 'PROCUREMENT_OFFICER', action: 'cancel' },
];

const allowed = (from: PrStage, role: UserRole) =>
  TRANSITIONS.filter((t) => t.from === from && t.actorRole === role).map((t) => t.to);

export function findTransition(from: PrStage, to: PrStage, role: UserRole) {
  const t = TRANSITIONS.find((x) => x.from === from && x.to === to && x.actorRole === role);
  if (!t) throw InvalidTransition(from, to, allowed(from, role));
  return t;
}

export async function transition(args: { prId: string; to: PrStage; actor: AuthClaims; patch?: Record<string, unknown>; note?: string }) {
  return db.$transaction(async (tx) => {
    const pr = await tx.purchaseRequisition.findUnique({ where: { id: args.prId } });
    if (!pr) throw NotFound(`PR ${args.prId} not found`);
    if (!args.actor.projects.includes(pr.projId)) throw RuleViolation('project_access_denied', 'No access');
    const t = findTransition(pr.stage, args.to, args.actor.role);
    const updated = await tx.purchaseRequisition.update({ where: { id: pr.id }, data: { stage: args.to, ...args.patch } });
    await audit(tx as never, { whoId: args.actor.sub, entity: 'PR', entityId: pr.id, action: t.action, note: args.note });
    return updated;
  });
}

export async function nextPrId(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `PR-${year}-`;
  const last = await db.purchaseRequisition.findFirst({ where: { id: { startsWith: prefix } }, orderBy: { id: 'desc' }, select: { id: true } });
  const n = last ? parseInt(last.id.slice(prefix.length), 10) + 1 : 1;
  return `${prefix}${String(n).padStart(4, '0')}`;
}
