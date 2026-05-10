import { Router } from 'express';
import { ok } from '../lib/json.js';
import { db } from '../lib/db.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../lib/errors.js';

const r = Router();
r.use(requireAuth);

/** Lists projects the current user has access to. ED/FM/Admin see all. */
r.get('/', asyncHandler(async (req, res) => {
  const userId = req.auth!.sub;
  const role = req.auth!.role;
  const seeAll = role === 'EXECUTIVE_DIRECTOR' || role === 'FINANCE_MANAGER' || role === 'ADMINISTRATOR';
  const where = seeAll
    ? {}
    : { userAccess: { some: { userId } } };
  const projs = await db.project.findMany({
    where,
    orderBy: { code: 'asc' },
    select: {
      id: true, code: true, name: true, donor: true,
      colorHex: true, ccy: true,
      budgetTotal: true, spentTotal: true,
      periodStart: true, periodEnd: true,
    },
  });
  res.json(ok(projs.map((p) => ({
    ...p,
    budgetTotal: Number(p.budgetTotal),
    spentTotal: Number(p.spentTotal),
  }))));
}));

export default r;
