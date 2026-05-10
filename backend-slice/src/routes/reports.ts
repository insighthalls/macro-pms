import { Router } from 'express';
import { ok } from '../lib/json.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../lib/errors.js';
import * as svc from '../services/reports.js';
import { BadRequest } from '../lib/errors.js';

const r = Router();
r.use(requireAuth);

r.get('/burn-down', asyncHandler(async (req, res) => {
  const projId = typeof req.query.projId === 'string' ? req.query.projId : undefined;
  if (!projId) throw BadRequest('projId required');
  res.json(ok(await svc.burnDown(projId)));
}));

r.get('/variance', asyncHandler(async (req, res) => {
  const projId = typeof req.query.projId === 'string' ? req.query.projId : undefined;
  if (!projId) throw BadRequest('projId required');
  res.json(ok(await svc.variance(projId)));
}));

r.get('/vendors', asyncHandler(async (_req, res) => {
  res.json(ok(await svc.vendorScorecards()));
}));

r.get('/ar-ageing', asyncHandler(async (_req, res) => {
  res.json(ok(await svc.arAgeing()));
}));

r.get('/donor-pack', asyncHandler(async (_req, res) => {
  res.json(ok(await svc.donorPack()));
}));

export default r;
