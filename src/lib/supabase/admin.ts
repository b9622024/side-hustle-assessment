import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | undefined;

export function databaseIsConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY);
}

export function getSupabaseAdmin(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secretKey) throw new Error("DATABASE_NOT_CONFIGURED");
  client ??= createClient(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
  return client;
}
