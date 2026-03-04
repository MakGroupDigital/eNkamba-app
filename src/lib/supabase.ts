import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseConfig } from './decode-secrets';

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseClient) return supabaseClient;

  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey) {
    return null;
  }

  supabaseClient = createClient(url, anonKey);
  return supabaseClient;
}
