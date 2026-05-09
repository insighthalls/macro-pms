import { Router } from 'express';
import { z } from 'zod';
import { login } from '../lib/auth.js';
import { ok } from '../lib/json.js';
import { ValidationFailed } from '../lib/errors.js';
import { requireAuth } from '../middleware/auth.js';
import { db } from '../lib/db.js';

const router = Router();

const Login = z.object({ email: z.string().email(), password: z.string().min(8) });

router.post('/login', async (req, res) => {
  const parsed = Login.safeParse(req.body);
  if (!parsed.success) throw ValidationFailed(Object.fromEntries(parsed.error.issues.map((i) => [i.path.join('.'), i.message])));
  const result = await login(parsed.data.email, parsed.data.password);
  res.json(ok(result));
});

router.get('/me', requireAuth, async (req, res) => {
  const u = await db.user.findUnique({ where: { id: req.auth!.sub } });
  res.json(ok({
    id: u!.id,
    fullName: u!.fullName,
    role: u!.role,
    email: u!.email,
    region: u!.region,
    initials: u!.initials,
    projects: req.auth!.projects,
  }));
});

export default router;
