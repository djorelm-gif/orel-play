import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';

let cached: SupabaseClient | null = null;

// Server-side data client.
// Prefers service-role (bypasses RLS); falls back to anon when RLS is not enabled
// on the schema — which is fine for MVP since all writes go through our API routes.
//
// IMPORTANT: Next.js 14 wraps the global `fetch` with an opt-in cache that
// dedupes GETs across the React Server Component render. supabase-js uses
// fetch under the hood — without overriding it here, two reads of the same row
// in the same instance would return the same payload even after a write. We
// force `cache: 'no-store'` on every internal request so admin actions show
// up immediately on the next snapshot poll.
export function getSupabaseAdmin(): SupabaseClient | null {
  if (!env.supabaseUrl) return null;
  const key = env.supabaseServiceKey || env.supabaseAnonKey;
  if (!key) return null;
  if (cached) return cached;
  cached = createClient(env.supabaseUrl, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (url, options = {}) =>
        fetch(url, { ...options, cache: 'no-store' as RequestCache }),
    },
  });
  return cached;
}
