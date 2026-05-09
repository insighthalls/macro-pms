import { Router } from 'express';
import { ok } from '../lib/json.js';
import { requireAuth } from '../middleware/auth.js';
import * as svc from '../services/reports.js';
import { BadRequest } from '../lib/errors.js';

const r = Router();
r.use(requireAuth);

r.get('/burn-down', async (req, res, next) => {
  try {
    const projId = typeof req.query.projId === 'string' ? req.query.projId : undefined;
    if (!projId) throw BadRequest('projId required');
    res.json(ok(await svc.burnDown(projId)));
  } catch (e) { next(e); }
});

r.get('/variance', async (req, res, next) => {
  try {
    const projId = typeof req.query.projId === 'string' ? req.query.projId : undefined;
    if (!projId) throw BadRequest('projId required');
    res.json(ok(await svc.variance(projId)));
  } catch (e) { next(e); }
});

r.get('/vendors', async (_req, res, next) => {
  try { res.json(ok(await svc.vendorScorecards())); } catch (e) { next(e); }
});

r.get('/ar-ageing', async (_req, res, next) => {
  try { res.json(ok(await svc.arAgeing())); } catch (e) { next(e); }
});

r.get('/donor-pack', async (_req, res, next) => {
  try { res.json(ok(await svc.donorPack())); } catch (e) { next(e); }
});

export default r;
