import { createClient } from "@supabase/supabase-js";

const url =
  (import.meta as any).env?.VITE_SUPABASE_URL ||
  (window as any).__NULLSEC__?.supabaseUrl ||
  "";
const anonKey =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
  (window as any).__NULLSEC__?.supabaseAnonKey ||
  "";

export const supabase = createClient(url, anonKey, {
  auth: { persistSession: false },
  realtime: { params: { eventsPerSecond: 5 } },
});

export function projectId(): string {
  return (window as any).__NULLSEC__?.projectId || "species";
}

export function table(name: string): string {
  return `app_${projectId()}_${name}`;
}

export const OBSERVATIONS_TABLE = () => table("observations");
export const SPECIES_TABLE = () => table("species");
export const OCCURRENCES_TABLE = () => table("occurrences");

export function hasSupabase(): boolean {
  return Boolean(url && anonKey);
}
