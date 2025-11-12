import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getSupabaseClients } from "../../backend/api/supabase.ts";
import { handleCors, jsonResponse, errorResponse } from "../../backend/utils/cors.ts";
import { getRollingRange, RollingPeriod, annualizePremium } from "../../backend/services/analytics/periods.ts";

async function countBetween(client: SupabaseClient, table: string, start: Date, end: Date) {
  const { data, error } = await client
    .from(table)
    .select("id, created_at")
    .gte("created_at", start.toISOString())
    .lte("created_at", end.toISOString());
  if (error) throw error;
  return (data || []).length;
}

async function premiumBetween(client: SupabaseClient, start: Date, end: Date) {
  const { data, error } = await client
    .from("policies")
    .select("premium_amount, premium_frequency, created_at")
    .gte("created_at", start.toISOString())
    .lte("created_at", end.toISOString());
  if (error) throw error;
  return ((data || []) as Array<{ premium_amount: number | null; premium_frequency: string | null }>).
    reduce((sum, row) => sum + annualizePremium(row), 0);
}

export default async function handler(req: Request) {
  try {
    const preflight = handleCors(req);
    if (preflight) return preflight;

    let period: RollingPeriod = "month";
    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      const value = String(body?.period || "month").toLowerCase();
      if (value === "week" || value === "month") period = value;
    } else if (req.method === "GET") {
      const q = new URL(req.url).searchParams.get("period");
      const value = String(q || "month").toLowerCase();
      if (value === "week" || value === "month") period = value;
    }

    const { admin } = getSupabaseClients("ANALYTICS");
    const { curStart, curEnd, prevStart, prevEnd } = getRollingRange(period);

    const [leadsCurrent, leadsPrevious, proposalsCurrent, proposalsPrevious, premiumCurrent, premiumPrevious] = await Promise.all([
      countBetween(admin, "leads", curStart, curEnd),
      countBetween(admin, "leads", prevStart, prevEnd),
      countBetween(admin, "proposals", curStart, curEnd),
      countBetween(admin, "proposals", prevStart, prevEnd),
      premiumBetween(admin, curStart, curEnd),
      premiumBetween(admin, prevStart, prevEnd),
    ]);

    return jsonResponse({
      period,
      leads: { current: leadsCurrent, previous: leadsPrevious },
      proposals: { current: proposalsCurrent, previous: proposalsPrevious },
      premium: { current: premiumCurrent, previous: premiumPrevious },
      lastUpdated: new Date().toISOString(),
    });
  } catch (e) {
    return errorResponse(String((e as Error)?.message || e));
  }
}

// deno-lint-ignore no-explicit-any
const maybeServe: any = (globalThis as any).Deno?.serve;
if (maybeServe) maybeServe(handler);
