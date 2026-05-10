import { Router } from 'express';
import { z } from 'zod';
import { db } from '../lib/db.js';
import { ok } from '../lib/json.js';
import { NotFound, ValidationFailed, asyncHandler } from '../lib/errors.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  transition,
  assertCanSubmit,
  nextArId,
  nextApproverRole,
} from '../services/advance-requests.js';
import { record as audit } from '../services/audit.js';

const router = Router();
router.use(requireAuth);

// ---------- list / get ----------
router.get('/', asyncHandler(async (req, res) => {
  const { projId, stage, requestedBy } = req.query;
  const where: Record<string, unknown> = {};
  if (projId) where['projId'] = projId;
  if (stage) where['stage'] = stage;
  if (requestedBy) where['requestedById'] = requestedBy;

  // PO sees only their own; others scoped to accessible projects
  if (req.auth!.role === 'PROJECT_OFFICER') where['requestedById'] = req.auth!.sub;
  else where['projId'] = where['projId'] ?? { in: req.auth!.projects };

  const rows = await db.advanceRequest.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
  res.json(ok(rows));
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const ar = await db.advanceRequest.findUnique({ where: { id: req.params.id! } });
  if (!ar) throw NotFound();
  if (!req.auth!.projects.includes(ar.projId)) throw NotFound();
  res.json(ok(ar));
}));

// ---------- create (PO only) ----------
const Create = z.object({
  activityId: z.string(),
  amount: z.union([z.number().int().positive(), z.string().regex(/^\d+$/)]),
  title: z.string().min(3).max(200),
});
router.post('/', requireRole('PROJECT_OFFICER'), asyncHandler(async (req, res) => {
  const parsed = Create.safeParse(req.body);
  if (!parsed.success) {
    throw ValidationFailed(Object.fromEntries(parsed.error.issues.map((i) => [i.path.join('.'), i.message])));
  }
  const { activityId, title } = parsed.data;
  const amount = BigInt(parsed.data.amount);

  const act = await db.activity.findUnique({ where: { id: activityId } });
  if (!act) throw NotFound(`Activity ${activityId} not found`);
  if (act.officerId !== req.auth!.sub) {
    throw ValidationFailed({ activityId: 'You can only raise advances for your own activities' });
  }

  await assertCanSubmit({ officerId: req.auth!.sub, dipCode: act.dipCode, amount });

  const id = await nextArId();
  const ar = await db.$transaction(async (tx) => {
    const created = await tx.advanceRequest.create({
      data: {
        id,
        activityId: act.id,
        projId: act.projId,
        dipCode: act.dipCode,
        title,
        amount,
        requestedById: req.auth!.sub,
        stage: 'PO_SUBMITTED',
        nextApproverRole: await nextApproverRole(amount, 'PO_SUBMITTED'),
        submittedAt: new Date(),
        dueLiqDate: act.dueLiqDate,
      },
    });
    await audit(tx as never, {
      whoId: req.auth!.sub,
      entity: 'AR',
      entityId: id,
      action: 'submit',
      note: `Submitted ${title}`,
    });
    return created;
  });
  res.status(201).json(ok(ar));
}));

// ---------- transitions ----------
router.post('/:id/recommend', requireRole('HEAD_OF_PROGRAMS'), asyncHandler(async (req, res) => {
  const ar = await transition({ arId: req.params.id!, to: 'HOP_RECOMMENDED', actor: req.auth!, note: req.body?.note });
  res.json(ok(ar));
}));

router.post('/:id/fm-approve', requireRole('FINANCE_MANAGER'), asyncHandler(async (req, res) => {
  const ar = await transition({ arId: req.params.id!, to: 'FM_APPROVED', actor: req.auth! });
  res.json(ok(ar));
}));

router.post('/:id/ed-approve', requireRole('EXECUTIVE_DIRECTOR'), asyncHandler(async (req, res) => {
  const ar = await transition({ arId: req.params.id!, to: 'ED_APPROVED', actor: req.auth! });
  res.json(ok(ar));
}));

const Disburse = z.object({
  eftRef: z.string().min(1),
  disbursedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
router.post('/:id/disburse', requireRole('GRANT_FINANCE_OFFICER'), asyncHandler(async (req, res) => {
  const parsed = Disburse.safeParse(req.body);
  if (!parsed.success) throw ValidationFailed(Object.fromEntries(parsed.error.issues.map((i) => [i.path.join('.'), i.message])));
  const ar = await transition({
    arId: req.params.id!,
    to: 'DISBURSED',
    actor: req.auth!,
    patch: { eftRef: parsed.data.eftRef, disbursedOn: new Date(parsed.data.disbursedOn) },
    note: `EFT ${parsed.data.eftRef}`,
  });
  res.json(ok(ar));
}));

router.post('/:id/return', requireRole('HEAD_OF_PROGRAMS', 'FINANCE_MANAGER'), asyncHandler(async (req, res) => {
  const note = (req.body?.note as string) || 'Returned without comment';
  const ar = await transition({ arId: req.params.id!, to: 'RETURNED', actor: req.auth!, note, patch: { returnReason: note } });
  res.json(ok(ar));
}));

const Liquidate = z.object({
  spentAmount: z.union([z.number().int().nonnegative(), z.string().regex(/^\d+$/)]),
  varianceNote: z.string().optional(),
});
router.post('/:id/submit-liquidation', requireRole('PROJECT_OFFICER'), asyncHandler(async (req, res) => {
  const parsed = Liquidate.safeParse(req.body);
  if (!parsed.success) throw ValidationFailed(Object.fromEntries(parsed.error.issues.map((i) => [i.path.join('.'), i.message])));
  const ar = await transition({
    arId: req.params.id!,
    to: 'LIQUIDATION_PENDING',
    actor: req.auth!,
    patch: {
      spentAmount: BigInt(parsed.data.spentAmount),
      varianceNote: parsed.data.varianceNote,
    },
  });
  res.json(ok(ar));
}));

router.post('/:id/accept-liquidation', requireRole('FINANCE_MANAGER'), asyncHandler(async (req, res) => {
  const ar = await transition({ arId: req.params.id!, to: 'LIQUIDATED', actor: req.auth! });
  res.json(ok(ar));
}));

export default router;
