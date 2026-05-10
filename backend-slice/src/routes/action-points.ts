import { Router } from 'express';
import { z } from 'zod';
import { db } from '../lib/db.js';
import { ok } from '../lib/json.js';
import { NotFound, ValidationFailed, RuleViolation, asyncHandler } from '../lib/errors.js';
import { requireAuth } from '../middleware/auth.js';
import { record as audit } from '../services/audit.js';

const router = Router();
router.use(requireAuth);

router.get('/', asyncHandler(async (req, res) => {
  const { status, ownerId, raisedById, projId } = req.query;
  const where: Record<string, unknown> = {};
  if (status) where['status'] = status;
  if (ownerId) where['ownerId'] = ownerId;
  if (raisedById) where['raisedById'] = raisedById;
  if (projId) where['projId'] = projId;
  // Default: items I own OR items I raised, scoped to my projects
  if (!ownerId && !raisedById) {
    where['OR'] = [{ ownerId: req.auth!.sub }, { raisedById: req.auth!.sub }];
  }
  res.json(ok(await db.actionPoint.findMany({ where, orderBy: [{ status: 'asc' }, { dueDate: 'asc' }], take: 200 })));
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const ap = await db.actionPoint.findUnique({ where: { id: req.params.id! } });
  if (!ap) throw NotFound();
  res.json(ok(ap));
}));

const Create = z.object({
  title: z.string().min(3), description: z.string().optional(),
  ownerId: z.string(),
  priority: z.enum(['LOW','MEDIUM','HIGH','CRITICAL']).default('MEDIUM'),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  linkedEntity: z.enum(['AR','PV','PR','AP','ACT','VENDOR','BR','EFT']).optional(),
  linkedEntityId: z.string().optional(),
  projId: z.string().optional(),
});
router.post('/', asyncHandler(async (req, res) => {
  const p = Create.safeParse(req.body);
  if (!p.success) throw ValidationFailed(Object.fromEntries(p.error.issues.map(i => [i.path.join('.'), i.message])));
  const last = await db.actionPoint.findFirst({ where: { id: { startsWith: 'AP-' } }, orderBy: { id: 'desc' } });
  const n = last ? parseInt(last.id.slice(3), 10) + 1 : 480;
  const id = `AP-${String(n).padStart(4, '0')}`;
  const ap = await db.$transaction(async (tx) => {
    const created = await tx.actionPoint.create({
      data: { id, ...p.data, raisedById: req.auth!.sub, dueDate: p.data.dueDate ? new Date(p.data.dueDate) : null, status: 'OPEN' },
    });
    await audit(tx as never, { whoId: req.auth!.sub, entity: 'AP', entityId: id, action: 'create', note: p.data.title });
    return created;
  });
  res.status(201).json(ok(ap));
}));

const setStatus = (status: 'OPEN'|'IN_PROGRESS'|'CLOSED'|'REOPENED') => asyncHandler(async (req: import('express').Request, res: import('express').Response) => {
  const ap = await db.actionPoint.findUnique({ where: { id: req.params.id! } });
  if (!ap) throw NotFound();
  if (status === 'CLOSED' && ap.ownerId !== req.auth!.sub && ap.raisedById !== req.auth!.sub)
    throw RuleViolation('not_owner', 'Only the owner or raiser can close.');
  const note = String(req.body?.note ?? '');
  const updated = await db.$transaction(async (tx) => {
    const u = await tx.actionPoint.update({
      where: { id: ap.id },
      data: { status, closedAt: status === 'CLOSED' ? new Date() : null, closedNote: status === 'CLOSED' ? note : null },
    });
    await audit(tx as never, { whoId: req.auth!.sub, entity: 'AP', entityId: ap.id, action: status.toLowerCase(), note });
    return u;
  });
  res.json(ok(updated));
});

router.post('/:id/start',   setStatus('IN_PROGRESS'));
router.post('/:id/close',   setStatus('CLOSED'));
router.post('/:id/reopen',  setStatus('REOPENED'));

export default router;
