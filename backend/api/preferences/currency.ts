/**
 * Deno Edge Function: /api/preferences/currency
 * Persists a user's default currency in Supabase while remaining tolerant of
 * missing identity or unsupported codes (no hard failures for the client).
 */

import { createCorsHeaders } from "../../utils/cors.ts";
import { createServiceClient, decodeAuthUserId } from "../supabase.ts";

// Codes allowed by the user_preferences DB check constraint
const ALLOWED_PERSIST_CODES = new Set(["SGD", "USD", "MYR", "CNY", "INR", "EUR", "GBP"]);

type CurrencyPreferencePayload = {
  currency?: string;
  code?: string;
  default_currency?: string;
  user_id?: string;
  userId?: string;
  advisorId?: string;
};

function normalizeCurrency(input: unknown): string | null {
  if (!input || typeof input !== "string") return null;
  const trimmed = input.trim().toUpperCase();
  if (!trimmed) return null;
  // Strip symbols like "$" or "SGD " prefixes if present
  const cleaned = trimmed.replace(/[^A-Z]/g, "");
  if (cleaned.length < 3) return null;
  const code = cleaned.slice(0, 3);
  return code;
}

function resolveUserId(req: Request, body: CurrencyPreferencePayload): string | null {
  const authHeader = req.headers.get("authorization") ?? req.headers.get("Authorization");
  const fromToken = decodeAuthUserId(authHeader ?? null);
  if (fromToken) return fromToken;

  const candidate = body.user_id ?? body.userId ?? body.advisorId;
  if (candidate && typeof candidate === "string" && candidate.trim()) {
    return candidate.trim();
  }
  return null;
}

async function fetchExistingPreference(client: ReturnType<typeof createServiceClient>, userId: string) {
  const { data, error } = await client
    .from("user_preferences")
    .select("default_currency, language, updated_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}

async function persistPreference(
  client: ReturnType<typeof createServiceClient>,
  userId: string,
  default_currency: string,
) {
  const payload = { user_id: userId, default_currency };
  const { data, error } = await client
    .from("user_preferences")
    .upsert(payload, { onConflict: "user_id" })
    .select("user_id, default_currency, language, updated_at")
    .maybeSingle();
  if (error) throw error;

  let profileUpdated = false;
  try {
    const { error: profileError } = await client.from("profiles").update({ currency: default_currency }).eq("id", userId);
    profileUpdated = !profileError;
  } catch {
    profileUpdated = false;
  }

  return { data, profileUpdated };
}

export default async function handleRequest(req: Request): Promise<Response> {
  const origin = req.headers.get("origin") || "*";
  const corsHeaders = Object.fromEntries(createCorsHeaders(origin));

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST" && req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  let body: CurrencyPreferencePayload = {};
  if (req.method === "POST") {
    try {
      body = (await req.json()) as CurrencyPreferencePayload;
    } catch {
      body = {};
    }
  }

  const currencyInput =
    req.method === "GET"
      ? new URL(req.url).searchParams.get("currency")
      : body.currency ?? body.code ?? body.default_currency;
  const currency = normalizeCurrency(currencyInput);
  const userId = resolveUserId(req, body);

  if (!userId) {
    return new Response(
      JSON.stringify({
        persisted: false,
        currency: currency ?? null,
        reason: "missing_user",
      }),
      { status: 202, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }

  try {
    const supabase = createServiceClient();

    if (req.method === "GET") {
      const existing = await fetchExistingPreference(supabase, userId);
      return new Response(
        JSON.stringify({
          persisted: Boolean(existing?.default_currency),
          currency: existing?.default_currency ?? null,
          language: existing?.language ?? null,
          updated_at: existing?.updated_at ?? null,
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    if (!currency) {
      return new Response(
        JSON.stringify({
          error: "Invalid currency code",
          allowed: Array.from(ALLOWED_PERSIST_CODES),
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    if (!ALLOWED_PERSIST_CODES.has(currency)) {
      return new Response(
        JSON.stringify({
          persisted: false,
          currency,
          reason: "unsupported_currency",
          allowed: Array.from(ALLOWED_PERSIST_CODES),
        }),
        { status: 202, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    const { data, profileUpdated } = await persistPreference(supabase, userId, currency);
    return new Response(
      JSON.stringify({
        persisted: true,
        currency: data?.default_currency ?? currency,
        language: data?.language ?? null,
        profileUpdated,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  } catch (error) {
    console.error("[preferences.currency] Failed to persist preference:", error);
    const status = String(error?.message ?? "").includes("Missing Supabase env") ? 503 : 500;
    return new Response(
      JSON.stringify({ error: "Failed to persist currency preference" }),
      { status, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }
}

if (import.meta.main) {
  Deno.serve(handleRequest);
}
