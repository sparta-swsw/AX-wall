import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _supabase: SupabaseClient | undefined;
let _supabaseAdmin: SupabaseClient | undefined;

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    _supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return _supabase;
}

export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    _supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return _supabaseAdmin;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) { return (getSupabase() as any)[prop as string]; },
});

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_, prop) { return (getSupabaseAdmin() as any)[prop as string]; },
});
/* eslint-enable @typescript-eslint/no-explicit-any */
