import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';

let cached: SupabaseClient | null = null;

// Server-side data client.
// Prefers service-role (bypasses RLS); falls back to anon when RLS is not enabled
// on the schema — which is fine for MVP since all writes go through our API routes.
export function getSupabaseAdmin(): SupabaseClient | null {
  if (!env.supabaseUrl) return null;
  const key = env.supabaseServiceKey || env.supabaseAnonKey;
  if (!key) return null;
  if (cached) return cached;
  cached = createClient(env.supabaseUrl, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
