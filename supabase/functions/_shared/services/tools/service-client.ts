import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

let cachedClient: SupabaseClient | null = null;

export function createServiceClient(): SupabaseClient {
  if (cachedClient) return cachedClient;
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  cachedClient = createClient(url, key, { auth: { persistSession: false } });
  return cachedClient;
}
