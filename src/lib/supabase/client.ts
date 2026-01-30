import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

// Check if Supabase is configured
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

export function createClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase environment variables not configured. Using mock mode.');
    return null;
  }
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}

// Singleton client for client-side usage
let browserClient: ReturnType<typeof createClient> | undefined = undefined;

export function getSupabaseClient() {
  if (browserClient === undefined) {
    browserClient = createClient();
  }
  return browserClient;
}

// Export a default client for convenience (null if not configured)
export const supabase = typeof window !== 'undefined' ? createClient() : null;
