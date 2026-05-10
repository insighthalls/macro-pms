import { Router } from 'express';
import { z } from 'zod';
import { ok } from '../lib/json.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../lib/errors.js';
import * as svc from '../services/eft-batches.js';

const r = Router();
r.use(requireAuth);

r.get('/', asyncHandler(async (req, res) => {
  const projId = typeof req.query.projId === 'string' ? req.query.projId : undefined;
  res.json(ok(await svc.listBatches(projId)));
}));

r.get('/:id', asyncHandler(async (req, res) => {
  res.json(ok(await svc.getBatch(req.params.id!)));
}));

const Create = z.object({ projId: z.string(), pvIds: z.array(z.string()).min(1) });
r.post('/', asyncHandler(async (req, res) => {
  res.status(201).json(ok(await svc.createBatch(Create.parse(req.body), req.auth!)));
}));

r.post('/:id/lock', asyncHandler(async (req, res) => {
  res.json(ok(await svc.lockBatch(req.params.id!, req.auth!)));
}));

r.post('/:id/export', asyncHandler(async (req, res) => {
  const out = await svc.exportBatch(req.params.id!, req.auth!);
  // Stream the XML directly so the client can save the file
  res.setHeader('Content-Type', 'application/xml');
  res.setHeader('Content-Disposition', `attachment; filename="${out.batch.id}.xml"`);
  res.send(out.xml);
}));

const Ack = z.object({ ackFile: z.string() });
r.post('/:id/ack', asyncHandler(async (req, res) => {
  res.json(ok(await svc.ackBatch(req.params.id!, Ack.parse(req.body).ackFile, req.auth!)));
}));

export default r;
