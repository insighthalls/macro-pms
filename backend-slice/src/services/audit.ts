import crypto from 'node:crypto';
import type { PrismaClient, EntityKind } from '@prisma/client';
import { db } from '../lib/db.js';
import type { AuthClaims } from '../lib/auth.js';

/**
 * Hash-chained audit log. Each entry's hash is sha256 over the previous
 * hash plus this entry's content; the chain is verifiable end-to-end.
 *
 * MUST be called in the same transaction as the mutation it records.
 */
export async function record(
  tx: PrismaClient | Parameters<Parameters<PrismaClient['$transaction']>[0]>[0],
  args: {
    whoId: string;
    entity: EntityKind;
    entityId: string;
    action: string;
    note?: string;
    ip?: string;
    userAgent?: string;
  },
): Promise<void> {
  const last = await (tx as PrismaClient).auditEntry.findFirst({
    orderBy: { id: 'desc' },
    select: { hash: true },
  });
  const prevHash = last?.hash ?? '0000000000000000000000000000000000000000000000000000000000000000';
  const at = new Date();
  const payload = `${prevHash}|${at.toISOString()}|${args.whoId}|${args.entity}|${args.entityId}|${args.action}|${args.note ?? ''}`;
  const hash = crypto.createHash('sha256').update(payload).digest('hex');

  await (tx as PrismaClient).auditEntry.create({
    data: {
      at,
      whoId: args.whoId,
      entity: args.entity,
      entityId: args.entityId,
      action: args.action,
      note: args.note,
      prevHash,
      hash,
      ip: args.ip,
      userAgent: args.userAgent,
    },
  });
}

/** Convenience wrapper matching the positional call-style used in eft-batches. */
export async function writeAudit(
  tx: PrismaClient | Parameters<Parameters<PrismaClient['$transaction']>[0]>[0],
  who: AuthClaims,
  entity: EntityKind,
  entityId: string,
  action: string,
  note?: string,
): Promise<void> {
  return record(tx, { whoId: who.sub, entity, entityId, action, note });
}

export async function verifyChain(): Promise<{ ok: true } | { ok: false; brokenAt: string }> {
  let prev = '0000000000000000000000000000000000000000000000000000000000000000';
  const cursor = await db.auditEntry.findMany({ orderBy: { id: 'asc' } });
  for (const e of cursor) {
    const payload = `${prev}|${e.at.toISOString()}|${e.whoId}|${e.entity}|${e.entityId}|${e.action}|${e.note ?? ''}`;
    const expected = crypto.createHash('sha256').update(payload).digest('hex');
    if (expected !== e.hash || e.prevHash !== prev) {
      return { ok: false, brokenAt: e.id.toString() };
    }
    prev = e.hash;
  }
  return { ok: true };
}
