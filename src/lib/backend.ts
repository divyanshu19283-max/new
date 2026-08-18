// Backend adapter: gracefully degrades to local demo mode when Supabase is not configured.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export interface BackendStatus {
  configured: boolean;
  connected: boolean;
  mode: 'local' | 'supabase';
}

let client: SupabaseClient | null = null;

export function getBackendStatus(): BackendStatus {
  const url = (import.meta as any).env?.VITE_SUPABASE_URL as string | undefined;
  const anon = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string | undefined;
  const configured = !!(url && anon);
  if (configured && !client) {
    try {
      client = createClient(url as string, anon as string);
    } catch {
      client = null;
    }
  }
  return {
    configured,
    connected: !!client,
    mode: configured ? 'supabase' : 'local',
  };
}

export function supabase(): SupabaseClient | null {
  getBackendStatus();
  return client;
}
