/**
 * Deno Edge Function: /api/preferences/language
 * Persists a user's language preference to Supabase while allowing safe, best-effort calls
 * from the client (falls back to no-op when user context is missing).
 */

import { createCorsHeaders } from "../../utils/cors.ts";
import { createServiceClient, decodeAuthUserId } from "../supabase.ts";

const SUPPORTED_LANGUAGES = new Set(["en", "zh", "ms", "ta", "hi"]);

type LanguagePreferencePayload = {
  language?: string;
  code?: string;
  locale?: string;
  user_id?: string;
  userId?: string;
  advisorId?: string;
};

function normalizeLanguage(input: unknown): string | null {
  if (!input || typeof input !== "string") return null;
  const trimmed = input.trim();
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase();

  const mappedNames: Record<string, string> = {
    english: "en",
    en: "en",
    chinese: "zh",
    zh: "zh",
    mandarin: "zh",
    malay: "ms",
    ms: "ms",
    bahasa: "ms",
    tamil: "ta",
    ta: "ta",
    hindi: "hi",
    hi: "hi",
  };

  if (mappedNames[lower]) {
    return mappedNames[lower];
  }

  const splitBase = lower.split(/[-_]/)[0];
  if (SUPPORTED_LANGUAGES.has(splitBase)) {
    return splitBase;
  }

  return SUPPORTED_LANGUAGES.has(lower) ? lower : null;
}

function resolveUserId(req: Request, body: LanguagePreferencePayload): string | null {
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
    .select("language, default_currency, updated_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}

async function persistPreference(
  client: ReturnType<typeof createServiceClient>,
  userId: string,
  language: string,
) {
  const payload = { user_id: userId, language };
  const { data, error } = await client
    .from("user_preferences")
    .upsert(payload, { onConflict: "user_id" })
    .select("user_id, language, default_currency, updated_at")
    .maybeSingle();
  if (error) throw error;

  // Keep profiles.language in sync when column exists; ignore failures to avoid blocking client UX.
  let profileUpdated = false;
  try {
    const { error: profileError } = await client.from("profiles").update({ language }).eq("id", userId);
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

  let body: LanguagePreferencePayload = {};
  if (req.method === "POST") {
    try {
      body = (await req.json()) as LanguagePreferencePayload;
    } catch {
      body = {};
    }
  }

  const languageInput =
    req.method === "GET"
      ? new URL(req.url).searchParams.get("language")
      : body.language ?? body.code ?? body.locale;
  const language = normalizeLanguage(languageInput);
  const userId = resolveUserId(req, body);

  // Safe, non-blocking response when the caller has not provided identity.
  if (!userId) {
    return new Response(
      JSON.stringify({
        persisted: false,
        language: language ?? null,
        reason: "missing_user",
      }),
      {
        status: 202,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      },
    );
  }

  try {
    const supabase = createServiceClient();

    if (req.method === "GET") {
      const existing = await fetchExistingPreference(supabase, userId);
      return new Response(
        JSON.stringify({
          persisted: Boolean(existing?.language),
          language: existing?.language ?? null,
          default_currency: existing?.default_currency ?? null,
          updated_at: existing?.updated_at ?? null,
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    if (!language) {
      return new Response(
        JSON.stringify({
          error: "Invalid language code",
          allowed: Array.from(SUPPORTED_LANGUAGES),
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    const { data, profileUpdated } = await persistPreference(supabase, userId, language);

    return new Response(
      JSON.stringify({
        persisted: true,
        language: data?.language ?? language,
        default_currency: data?.default_currency ?? null,
        profileUpdated,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  } catch (error) {
    console.error("[preferences.language] Failed to persist preference:", error);
    const status = String(error?.message ?? "").includes("Missing Supabase env") ? 503 : 500;
    return new Response(
      JSON.stringify({ error: "Failed to persist language preference" }),
      { status, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }
}

if (import.meta.main) {
  Deno.serve(handleRequest);
}
