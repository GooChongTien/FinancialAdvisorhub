import { getSupabaseClients, decodeAuthUserId } from "../../backend/api/supabase.ts";
import { handleCors, jsonResponse, errorResponse } from "../../backend/utils/cors.ts";
import { annualizePremium } from "../../backend/services/analytics/periods.ts";

function startOfMonthUTC(source: Date) {
  return new Date(Date.UTC(source.getUTCFullYear(), source.getUTCMonth(), 1));
}

function addMonthsUTC(source: Date, months: number) {
  return new Date(Date.UTC(source.getUTCFullYear(), source.getUTCMonth() + months, 1));
}

function ymKey(source: Date) {
  return ${source.getUTCFullYear()}-;
}

export default async function handler(req: Request) {
  try {
    const preflight = handleCors(req);
    if (preflight) return preflight;

    const body = (req.method === "POST" ? await req.json().catch(() => ({})) : {}) as Partial<{ scope: string }>;
    const scope = (body.scope || "personal").toString();

    const authHeader = req.headers.get("Authorization");
    const { client: supabase } = getSupabaseClients("ANALYTICS", authHeader);
    const advisorId = decodeAuthUserId(authHeader ?? null);

    const end = startOfMonthUTC(new Date());
    const start = addMonthsUTC(end, -11);

    let query = supabase
      .from("policies")
      .select("premium_amount, premium_frequency, policy_start_date, created_at, premium_type, advisor_id")
      .gte("created_at", start.toISOString())
      .lte("created_at", addMonthsUTC(end, 1).toISOString());

    if (advisorId) {
      query = query.eq("advisor_id", advisorId);
    }

    const { data, error } = await query;
    if (error) throw error;
    const policies = (data || []) as Array<Record<string, unknown>>;

    const recurring = policies.filter((row) => (row.premium_type ?? "RP") === "RP");
    const buckets = new Map<string, number>();
    for (let i = 0; i < 12; i++) {
      buckets.set(ymKey(addMonthsUTC(start, i)), 0);
    }

    for (const row of recurring) {
      const raw = (row.policy_start_date as string | null) ?? (row.created_at as string | null);
      if (!raw) continue;
      const key = ymKey(startOfMonthUTC(new Date(raw)));
      if (!buckets.has(key)) continue;
      buckets.set(key, (buckets.get(key) ?? 0) + annualizePremium(row));
    }

    return jsonResponse({
      scope,
      rpHistory: Array.from(buckets.entries()).map(([month, value]) => ({ month, value })),
      pruCreditHistory: [],
      cohort: advisorId ? "advisor" : "all",
      percentiles: { p25: null, p50: null, p75: null },
      lastUpdated: new Date().toISOString(),
    });
  } catch (e) {
    return errorResponse(String((e as Error)?.message || e));
  }
}

// deno-lint-ignore no-explicit-any
const maybeServe: any = (globalThis as any).Deno?.serve;
if (maybeServe) maybeServe(handler);
