import { Router } from 'express';
import { z } from 'zod';
import { ok } from '../lib/json.js';
import { requireAuth } from '../middleware/auth.js';
import * as svc from '../services/eft-batches.js';

const r = Router();
r.use(requireAuth);

r.get('/', async (req, res, next) => {
  try {
    const projId = typeof req.query.projId === 'string' ? req.query.projId : undefined;
    res.json(ok(await svc.listBatches(projId)));
  } catch (e) { next(e); }
});

r.get('/:id', async (req, res, next) => {
  try { res.json(ok(await svc.getBatch(req.params.id!))); } catch (e) { next(e); }
});

const Create = z.object({ projId: z.string(), pvIds: z.array(z.string()).min(1) });
r.post('/', async (req, res, next) => {
  try { res.status(201).json(ok(await svc.createBatch(Create.parse(req.body), req.auth!))); } catch (e) { next(e); }
});

r.post('/:id/lock', async (req, res, next) => {
  try { res.json(ok(await svc.lockBatch(req.params.id!, req.auth!))); } catch (e) { next(e); }
});

r.post('/:id/export', async (req, res, next) => {
  try {
    const out = await svc.exportBatch(req.params.id!, req.auth!);
    // Stream the XML directly so the client can save the file
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Content-Disposition', `attachment; filename="${out.batch.id}.xml"`);
    res.send(out.xml);
  } catch (e) { next(e); }
});

const Ack = z.object({ ackFile: z.string() });
r.post('/:id/ack', async (req, res, next) => {
  try { res.json(ok(await svc.ackBatch(req.params.id!, Ack.parse(req.body).ackFile, req.auth!))); } catch (e) { next(e); }
});

export default r;
