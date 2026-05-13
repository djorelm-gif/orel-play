function read(name: string): string {
  return (process.env[name] ?? '').trim();
}

export const env = {
  siteUrl: read('NEXT_PUBLIC_SITE_URL') || 'http://localhost:3000',
  supabaseUrl: read('NEXT_PUBLIC_SUPABASE_URL'),
  supabaseAnonKey: read('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  supabaseServiceKey: read('SUPABASE_SERVICE_ROLE_KEY'),
  openaiKey: read('OPENAI_API_KEY'),
  adminPassword: read('ADMIN_PASSWORD'),
};

export const isSupabaseConfigured = Boolean(env.supabaseUrl && env.supabaseAnonKey);
export const isOpenAIConfigured = Boolean(env.openaiKey);

export const DEMO_EVENT_CODE = 'DEMO12';
export const DEMO_EVENT_ID = 'demo-event-00000000-0000-0000-0000-000000000001';
