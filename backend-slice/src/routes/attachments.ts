import { Router } from 'express';
import { z } from 'zod';
import { ok } from '../lib/json.js';
import { db } from '../lib/db.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../lib/errors.js';
import * as storage from '../lib/storage.js';

const r = Router();
r.use(requireAuth);

/** Step 1: client asks for signed URL. We compute the storage path. */
const SignReq = z.object({
  entity: z.enum(['AR', 'PV', 'PR', 'AP', 'ACT', 'VENDOR', 'BR', 'EFT']),
  entityId: z.string(),
  filename: z.string(),
});
r.post('/sign', asyncHandler(async (req, res) => {
  const body = SignReq.parse(req.body);
  const safe = body.filename.replace(/[^A-Za-z0-9._-]/g, '_');
  const path = `${body.entity.toLowerCase()}/${body.entityId}/${Date.now()}-${safe}`;
  const sig = await storage.signUpload(path);
  res.json(ok({ ...sig, path, filename: body.filename }));
}));

/** Step 2: after uploading, client registers the attachment metadata. */
const Register = z.object({
  entity: z.enum(['AR', 'PV', 'PR', 'AP', 'ACT', 'VENDOR', 'BR', 'EFT']),
  entityId: z.string(),
  bucket: z.string().optional(),
  path: z.string(),
  filename: z.string(),
  mime: z.string().optional(),
  sizeBytes: z.number().int().nonnegative(),
});
r.post('/', asyncHandler(async (req, res) => {
  const b = Register.parse(req.body);
  const row = await db.attachment.create({
    data: { ...b, bucket: b.bucket || storage.STORAGE_BUCKET, uploadedBy: req.auth!.sub },
  });
  res.status(201).json(ok(row));
}));

/** List attachments for an entity. */
r.get('/', asyncHandler(async (req, res) => {
  const entity = req.query.entity as any;
  const entityId = req.query.entityId as string;
  if (!entity || !entityId) { res.status(400).json({ error: 'entity & entityId required' }); return; }
  res.json(ok(await db.attachment.findMany({ where: { entity, entityId }, orderBy: { createdAt: 'desc' } })));
}));

/** Download URL — client redirects or fetches blob. */
r.get('/:id/url', asyncHandler(async (req, res) => {
  const a = await db.attachment.findUnique({ where: { id: req.params.id! } });
  if (!a) { res.status(404).json({ error: 'not found' }); return; }
  const sig = await storage.signDownload(a.path);
  res.json(ok({ ...sig, filename: a.filename }));
}));

r.delete('/:id', asyncHandler(async (req, res) => {
  const a = await db.attachment.findUnique({ where: { id: req.params.id! } });
  if (!a) { res.status(404).end(); return; }
  await storage.removeObject(a.path);
  await db.attachment.delete({ where: { id: a.id } });
  res.status(204).end();
}));

export default r;
