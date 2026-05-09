import { Router } from 'express';
import { z } from 'zod';
import { db } from '../lib/db.js';
import { ok } from '../lib/json.js';
import { NotFound, ValidationFailed } from '../lib/errors.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { transition, nextApproverRole, nextPvId, assertWtecValid } from '../services/payment-vouchers.js';
import { record as audit } from '../services/audit.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const { stage, projId, vendorId, arId } = req.query;
  const where: Record<string, unknown> = {};
  if (stage) where['stage'] = stage;
  if (vendorId) where['vendorId'] = vendorId;
  if (arId) where['arId'] = arId;
  if (projId) where['projId'] = projId;
  else where['projId'] = { in: req.auth!.projects };
  if (req.auth!.role === 'PROJECT_OFFICER') where['raisedById'] = req.auth!.sub;
  const rows = await db.paymentVoucher.findMany({ where, orderBy: { createdAt: 'desc' }, take: 200 });
  res.json(ok(rows));
});

router.get('/:id', async (req, res) => {
  const pv = await db.paymentVoucher.findUnique({ where: { id: req.params.id! } });
  if (!pv || !req.auth!.projects.includes(pv.projId)) throw NotFound();
  res.json(ok(pv));
});

const Item = z.object({ description: z.string(), qty: z.number().nonnegative(), unitPrice: z.union([z.number(), z.string()]) });
const Create = z.object({
  arId: z.string().optional(),
  vendorId: z.string().optional(),
  projId: z.string(),
  dipCode: z.string(),
  title: z.string().min(3),
  grossAmount: z.union([z.number().int().positive(), z.string().regex(/^\d+$/)]),
  whtAmount: z.union([z.number().int().nonnegative(), z.string().regex(/^\d+$/)]).default(0),
  items: z.array(Item).default([]),
  attachments: z.array(z.string()).default([]),
});
router.post('/', requireRole('PROJECT_OFFICER'), async (req, res) => {
  const p = Create.safeParse(req.body);
  if (!p.success) throw ValidationFailed(Object.fromEntries(p.error.issues.map(i => [i.path.join('.'), i.message])));
  await assertWtecValid(p.data.vendorId ?? null);
  const gross = BigInt(p.data.grossAmount);
  const wht   = BigInt(p.data.whtAmount);
  const id = await nextPvId();
  const pv = await db.$transaction(async (tx) => {
    const created = await tx.paymentVoucher.create({
      data: {
        id, projId: p.data.projId, dipCode: p.data.dipCode, arId: p.data.arId, vendorId: p.data.vendorId,
        title: p.data.title, grossAmount: gross, whtAmount: wht, netAmount: gross - wht,
        itemsJson: p.data.items as never, attachmentsJson: p.data.attachments as never,
        raisedById: req.auth!.sub, stage: 'PO_SUBMITTED',
        nextApproverRole: await nextApproverRole(gross, 'PO_SUBMITTED'),
      },
    });
    await audit(tx as never, { whoId: req.auth!.sub, entity: 'PV', entityId: id, action: 'submit', note: p.data.title });
    return created;
  });
  res.status(201).json(ok(pv));
});

router.post('/:id/gfo-review', requireRole('GRANT_FINANCE_OFFICER'), async (req, res) =>
  res.json(ok(await transition({ pvId: req.params.id!, to: 'GFO_REVIEWED', actor: req.auth!, patch: { threeWayMatchOk: !!req.body?.threeWayMatchOk } }))));
router.post('/:id/fm-approve', requireRole('FINANCE_MANAGER'), async (req, res) =>
  res.json(ok(await transition({ pvId: req.params.id!, to: 'FM_APPROVED', actor: req.auth! }))));
router.post('/:id/ed-approve', requireRole('EXECUTIVE_DIRECTOR'), async (req, res) =>
  res.json(ok(await transition({ pvId: req.params.id!, to: 'ED_APPROVED', actor: req.auth! }))));
router.post('/:id/schedule', requireRole('GRANT_FINANCE_OFFICER'), async (req, res) =>
  res.json(ok(await transition({ pvId: req.params.id!, to: 'SCHEDULED', actor: req.auth! }))));
router.post('/:id/mark-paid', requireRole('GRANT_FINANCE_OFFICER'), async (req, res) => {
  const eftRef = String(req.body?.eftRef ?? '');
  if (!eftRef) throw ValidationFailed({ eftRef: 'required' });
  res.json(ok(await transition({ pvId: req.params.id!, to: 'PAID', actor: req.auth!, patch: { eftRef, paidOn: new Date() }, note: `EFT ${eftRef}` })));
});
router.post('/:id/return', requireRole('GRANT_FINANCE_OFFICER', 'FINANCE_MANAGER'), async (req, res) => {
  const note = String(req.body?.note ?? 'Returned without comment');
  res.json(ok(await transition({ pvId: req.params.id!, to: 'RETURNED', actor: req.auth!, note, patch: { returnReason: note } })));
});

export default router;
