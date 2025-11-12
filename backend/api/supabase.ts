import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export interface SupabaseEnv {
  url: string;
  serviceRoleKey: string;
  anonKey: string | null;
}

function resolveKey(prefix: string | undefined, suffix: string): string | null {
  const normalized = prefix ? `${prefix.toUpperCase()}_${suffix}` : suffix;
  return Deno.env.get(normalized) ?? null;
}

export function resolveSupabaseEnv(prefix?: string): SupabaseEnv {
  const url = resolveKey(prefix, "SUPABASE_URL") ?? Deno.env.get("SUPABASE_URL") ?? null;
  const serviceRoleKey = resolveKey(prefix, "SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? null;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? null;
  if (!url || !serviceRoleKey) {
    const scope = prefix ? `${prefix.toUpperCase()}_*` : "default";
    throw new Error(`Missing Supabase env for ${scope}`);
  }
  return { url, serviceRoleKey, anonKey };
}

export function createServiceClient(prefix?: string): SupabaseClient {
  const env = resolveSupabaseEnv(prefix);
  return createClient(env.url, env.serviceRoleKey, { auth: { persistSession: false } });
}

export function createRlsClient(url: string, anonKey: string, authHeader: string): SupabaseClient {
  return createClient(url, anonKey, {
    auth: { persistSession: false },
    global: { headers: { Authorization: authHeader } },
  });
}

export function getSupabaseClients(prefix?: string, authHeader?: string | null) {
  const env = resolveSupabaseEnv(prefix);
  const admin = createClient(env.url, env.serviceRoleKey, { auth: { persistSession: false } });
  const useRls = Boolean(authHeader && env.anonKey);
  const client = useRls
    ? createClient(env.url, env.anonKey!, {
        auth: { persistSession: false },
        global: { headers: { Authorization: authHeader! } },
      })
    : admin;
  return { admin, client, env };
}

export function decodeAuthUserId(authHeader: string | null): string | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const payload = JSON.parse(
      new TextDecoder().decode(Uint8Array.from(atob(parts[1]), (c) => c.charCodeAt(0)))
    );
    return typeof payload?.sub === "string" ? payload.sub : null;
  } catch (_e) {
    return null;
  }
}
