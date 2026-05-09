/**
 * Supabase client (browser-side).  Today we use this for storage uploads
 * (receipts, attendance scans) only — auth still goes through backend-slice.
 * Session-5 cutover will switch the auth layer here too.
 */
import { createBrowserClient } from '@supabase/ssr';

export const getSupabase = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key',
  );
