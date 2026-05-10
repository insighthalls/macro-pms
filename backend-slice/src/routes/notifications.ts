import { Router } from 'express';
import { z } from 'zod';
import { ok } from '../lib/json.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../lib/errors.js';
import * as svc from '../services/notifications.js';

const r = Router();

// SSE stream — clients use EventSource('/notifications/stream?token=…')
// Token via query for EventSource (browser-native EventSource cannot set headers).
r.get('/stream', asyncHandler(async (req, res) => {
  // requireAuth normally reads Authorization header; SSE needs token in querystring fallback.
  const token = (req.query.token as string) || (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) { res.status(401).end(); return; }
  const { verifyAccess } = await import('../lib/auth.js');
  const auth = verifyAccess(token);
  if (!auth) { res.status(401).end(); return; }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();
  res.write(`: connected\n\n`);
  svc.subscribe(auth.sub, res);

  // Heartbeat so proxies don't time out
  const hb = setInterval(() => res.write(`: hb\n\n`), 25_000);
  res.on('close', () => clearInterval(hb));
}));

r.use(requireAuth);

r.get('/', asyncHandler(async (req, res) => {
  const unreadOnly = req.query.unreadOnly === '1';
  const limit = req.query.limit ? Number(req.query.limit) : 50;
  res.json(ok(await svc.listForUser(req.auth!.sub, { unreadOnly, limit })));
}));

const ReadIds = z.object({ ids: z.array(z.string()).min(1) });
r.post('/read', asyncHandler(async (req, res) => {
  res.json(ok(await svc.markRead(req.auth!.sub, ReadIds.parse(req.body).ids)));
}));

r.post('/read-all', asyncHandler(async (req, res) => {
  res.json(ok(await svc.markAllRead(req.auth!.sub)));
}));

export default r;
