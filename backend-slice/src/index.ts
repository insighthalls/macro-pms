import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import authRoutes from './routes/auth.js';
import arRoutes from './routes/advance-requests.js';
import pvRoutes from './routes/payment-vouchers.js';
import prRoutes from './routes/procurement.js';
import apRoutes from './routes/action-points.js';
import eftRoutes from './routes/eft-batches.js';
import reportsRoutes from './routes/reports.js';
import notifRoutes from './routes/notifications.js';
import attachRoutes from './routes/attachments.js';
import projectRoutes from './routes/projects.js';
import { stringify } from './lib/json.js';
import { HttpError } from './lib/errors.js';

export function buildApp() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));
  // Serialise BigInt as string in all res.json() calls (amounts are stored as BigInt)
  app.set('json replacer', (_key: string, val: unknown) =>
    typeof val === 'bigint' ? val.toString() : val);

  app.get('/health', (_req, res) => res.json({ ok: true }));

  app.use('/v1/auth', authRoutes);
  app.use('/v1/advance-requests',  arRoutes);
  app.use('/v1/payment-vouchers',  pvRoutes);
  app.use('/v1/procurement',       prRoutes);
  app.use('/v1/action-points',     apRoutes);
  app.use('/v1/eft-batches',       eftRoutes);
  app.use('/v1/reports',           reportsRoutes);
  app.use('/v1/notifications',     notifRoutes);
  app.use('/v1/attachments',       attachRoutes);
  app.use('/v1/projects',          projectRoutes);

  // Centralised error handler — last middleware
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof HttpError) {
      res.status(err.status).type('application/json').send(stringify({
        error: err.code, message: err.message, details: err.details,
      }));
      return;
    }
    console.error(err);
    res.status(500).type('application/json').send(stringify({
      error: 'internal', message: 'Unexpected server error',
    }));
  });

  return app;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = Number(process.env.PORT || 4000);
  buildApp().listen(port, () => console.log(`MACRO PMS slice listening on :${port}`));
}
