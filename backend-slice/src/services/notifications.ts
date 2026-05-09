/**
 * Persistent notifications + lightweight SSE broadcast.
 *
 * Pattern: services that mutate state call `notify(userId, payload)` —
 * we write a row AND publish to any open SSE streams for that user.
 */

import { db } from '../lib/db.js';
import type { NotifKind, EntityKind } from '@prisma/client';

type Sub = { userId: string; res: import('express').Response };
const subs = new Set<Sub>();

export function subscribe(userId: string, res: import('express').Response) {
  const sub: Sub = { userId, res };
  subs.add(sub);
  res.on('close', () => subs.delete(sub));
}

function broadcast(userId: string, payload: any) {
  for (const s of subs) {
    if (s.userId !== userId) continue;
    s.res.write(`event: notification\ndata: ${JSON.stringify(payload)}\n\n`);
  }
}

export interface NotifyArgs {
  userId: string;
  kind: NotifKind;
  title: string;
  body?: string;
  entity: EntityKind;
  entityId: string;
  link?: string;
}

export async function notify(args: NotifyArgs) {
  const row = await db.notification.create({ data: args });
  broadcast(args.userId, row);
  return row;
}

/** Notify every user holding a given role (used when escalating up the matrix). */
export async function notifyRole(role: string, args: Omit<NotifyArgs, 'userId'>) {
  const users = await db.user.findMany({ where: { role: role as any, active: true }, select: { id: true } });
  return Promise.all(users.map((u) => notify({ ...args, userId: u.id })));
}

export async function listForUser(userId: string, opts?: { unreadOnly?: boolean; limit?: number }) {
  return db.notification.findMany({
    where: { userId, ...(opts?.unreadOnly ? { readAt: null } : {}) },
    orderBy: { createdAt: 'desc' },
    take: opts?.limit ?? 50,
  });
}

export async function markRead(userId: string, ids: string[]) {
  return db.notification.updateMany({
    where: { userId, id: { in: ids }, readAt: null },
    data: { readAt: new Date() },
  });
}

export async function markAllRead(userId: string) {
  return db.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } });
}
