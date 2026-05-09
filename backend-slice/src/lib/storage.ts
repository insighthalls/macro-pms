/**
 * Supabase Storage adapter.
 * The frontend uploads directly to Supabase using a signed URL we issue here.
 * After upload the client POSTs /attachments to register the metadata row.
 *
 * Env:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY  (server only — never exposed)
 *   STORAGE_BUCKET (default: macro-attachments)
 */

import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucket = process.env.STORAGE_BUCKET || 'macro-attachments';

let _client: ReturnType<typeof createClient> | null = null;
function client() {
  if (!url || !key) throw new Error('Supabase env not configured');
  if (!_client) _client = createClient(url, key, { auth: { persistSession: false } });
  return _client;
}

/** Issue a signed upload URL the client can PUT to. */
export async function signUpload(path: string, expiresInSec = 60) {
  const { data, error } = await client().storage.from(bucket).createSignedUploadUrl(path);
  if (error) throw error;
  return { ...data, bucket, expiresInSec };
}

/** Issue a short-lived download URL. */
export async function signDownload(path: string, expiresInSec = 300) {
  const { data, error } = await client().storage.from(bucket).createSignedUrl(path, expiresInSec);
  if (error) throw error;
  return { url: data.signedUrl, bucket, expiresInSec };
}

export async function removeObject(path: string) {
  const { error } = await client().storage.from(bucket).remove([path]);
  if (error) throw error;
}

export const STORAGE_BUCKET = bucket;
