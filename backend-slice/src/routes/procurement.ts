import { Router } from 'express';
import { z } from 'zod';
import { db } from '../lib/db.js';
import { ok } from '../lib/json.js';
import { NotFound, ValidationFailed, asyncHandler } from '../lib/errors.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { transition, nextPrId } from '../services/procurement.js';
import { record as audit } from '../services/audit.js';

const router = Router();
router.use(requireAuth);

router.get('/', asyncHandler(async (req, res) => {
  const { stage, projId, vendorId } = req.query;
  const where: Record<string, unknown> = {};
  if (stage) where['stage'] = stage;
  if (vendorId) where['vendorId'] = vendorId;
  if (projId) where['projId'] = projId;
  else where['projId'] = { in: req.auth!.projects };
  res.json(ok(await db.purchaseRequisition.findMany({ where, orderBy: { createdAt: 'desc' }, take: 200 })));
}));

router.get('/vendors', asyncHandler(async (_req, res) => res.json(ok(await db.vendor.findMany({ orderBy: { name: 'asc' } })))));

router.get('/:id', asyncHandler(async (req, res) => {
  const pr = await db.purchaseRequisition.findUnique({ where: { id: req.params.id! } });
  if (!pr || !req.auth!.projects.includes(pr.projId)) throw NotFound();
  res.json(ok(pr));
}));

const Create = z.object({
  projId: z.string(), dipCode: z.string(), title: z.string().min(3),
  estimatedAmount: z.union([z.number().int().positive(), z.string().regex(/^\d+$/)]),
  vendorId: z.string().optional(),
});
router.post('/', requireRole('PROJECT_OFFICER', 'PROCUREMENT_OFFICER'), asyncHandler(async (req, res) => {
  const p = Create.safeParse(req.body);
  if (!p.success) throw ValidationFailed(Object.fromEntries(p.error.issues.map(i => [i.path.join('.'), i.message])));
  const id = await nextPrId();
  const pr = await db.$transaction(async (tx) => {
    const created = await tx.purchaseRequisition.create({
      data: { id, projId: p.data.projId, dipCode: p.data.dipCode, title: p.data.title, estimatedAmount: BigInt(p.data.estimatedAmount), vendorId: p.data.vendorId, stage: 'PR_SUBMITTED', raisedById: req.auth!.sub },
    });
    await audit(tx as never, { whoId: req.auth!.sub, entity: 'PR', entityId: id, action: 'submit', note: p.data.title });
    return created;
  });
  res.status(201).json(ok(pr));
}));

router.post('/:id/open-rfq', requireRole('PROCUREMENT_OFFICER'), asyncHandler(async (req, res) => {
  const deadline = req.body?.rfqDeadline ? new Date(String(req.body.rfqDeadline)) : null;
  res.json(ok(await transition({ prId: req.params.id!, to: 'RFQ_OPEN', actor: req.auth!, patch: { rfqDeadline: deadline } })));
}));
router.post('/:id/evaluate', requireRole('PROCUREMENT_OFFICER'), asyncHandler(async (req, res) => {
  const vendorId = String(req.body?.winningVendorId ?? '');
  if (!vendorId) throw ValidationFailed({ winningVendorId: 'required' });
  res.json(ok(await transition({ prId: req.params.id!, to: 'RFQ_EVALUATED', actor: req.auth!, patch: { vendorId } })));
}));
router.post('/:id/issue-lpo', requireRole('PROCUREMENT_OFFICER'), asyncHandler(async (req, res) => {
  const lpoRef = String(req.body?.lpoRef ?? '');
  if (!lpoRef) throw ValidationFailed({ lpoRef: 'required' });
  res.json(ok(await transition({ prId: req.params.id!, to: 'LPO_ISSUED', actor: req.auth!, patch: { lpoRef } })));
}));
router.post('/:id/record-grn', requireRole('PROCUREMENT_OFFICER'), asyncHandler(async (req, res) => {
  const grnRef = String(req.body?.grnRef ?? '');
  if (!grnRef) throw ValidationFailed({ grnRef: 'required' });
  res.json(ok(await transition({ prId: req.params.id!, to: 'GRN_RECEIVED', actor: req.auth!, patch: { grnRef, grnReceivedOn: new Date() } })));
}));
router.post('/:id/close', requireRole('PROCUREMENT_OFFICER'), asyncHandler(async (req, res) =>
  res.json(ok(await transition({ prId: req.params.id!, to: 'CLOSED', actor: req.auth! })))));

export default router;
