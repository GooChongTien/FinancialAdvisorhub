import { getSupabaseClients, decodeAuthUserId } from "../../backend/api/supabase.ts";
import { handleCors, jsonResponse, errorResponse } from "../../backend/utils/cors.ts";
import { getPeriodRange, annualizePremium, Period } from "../../backend/services/analytics/periods.ts";

import { resolveAdvisorIds, AdvisorScope } from "../../backend/services/analytics/advisors.ts";

type Scope = AdvisorScope;

type LeadPipelineRow = {
  lead_id: string;
  stage: string | null;
  advisor_id: string | null;
  updated_at: string | null;
};

type PremiumRow = {
  premium_amount: number | null;
  premium_frequency: string | null;
  advisor_id: string | null;
  status: string | null;
  created_at: string | null;
};

function summarizePipeline(rows: LeadPipelineRow[]) {
  const counts: Record<string, number> = {};
  for (const row of rows) {
    const stage = (row.stage || "Unknown").toString();
    counts[stage] = (counts[stage] ?? 0) + 1;
  }
  return counts;
}

export default async function handler(req: Request) {
  try {
    const preflight = handleCors(req);
    if (preflight) return preflight;

    const body = (req.method === "POST" ? await req.json().catch(() => ({})) : {}) as Partial<{ scope: Scope; period: Period }>;
    const scope: Scope = (body.scope || "personal") as Scope;
    const period: Period = (body.period || "mtd") as Period;

    const authHeader = req.headers.get("Authorization");
    const { client: supabase } = getSupabaseClients("ANALYTICS", authHeader);
    const advisorId = decodeAuthUserId(authHeader ?? null);

    const { curStart, curEnd, prevStart, prevEnd } = getPeriodRange(period);
    const advisorIds = await resolveAdvisorIds(supabase, scope, advisorId);

    const commonFilters = (builder: any, start: Date, end: Date) => {
      let query = builder.gte("created_at", start.toISOString()).lte("created_at", end.toISOString());
      if (advisorIds.length > 0) {
        query = query.in("advisor_id", advisorIds);
      }
      return query;
    };

    const [leadsCur, leadsPrev] = await Promise.all([
      commonFilters(supabase.from("leads"), curStart, curEnd).select("stage, advisor_id, updated_at"),
      commonFilters(supabase.from("leads"), prevStart, prevEnd).select("stage, advisor_id, updated_at"),
    ]);
    if (leadsCur.error) throw leadsCur.error;
    if (leadsPrev.error) throw leadsPrev.error;

    const [proposalsCur, proposalsPrev] = await Promise.all([
      commonFilters(supabase.from("proposals"), curStart, curEnd).select("stage, advisor_id, updated_at"),
      commonFilters(supabase.from("proposals"), prevStart, prevEnd).select("stage, advisor_id, updated_at"),
    ]);
    if (proposalsCur.error) throw proposalsCur.error;
    if (proposalsPrev.error) throw proposalsPrev.error;

    const [premiumCur, premiumPrev] = await Promise.all([
      commonFilters(supabase.from("policies"), curStart, curEnd).select("premium_amount, premium_frequency, advisor_id, status, created_at"),
      commonFilters(supabase.from("policies"), prevStart, prevEnd).select("premium_amount, premium_frequency, advisor_id, status, created_at"),
    ]);
    if (premiumCur.error) throw premiumCur.error;
    if (premiumPrev.error) throw premiumPrev.error;

    const leadsCurrent = summarizePipeline((leadsCur.data || []) as LeadPipelineRow[]);
    const leadsPrevious = summarizePipeline((leadsPrev.data || []) as LeadPipelineRow[]);
    const proposalsCurrent = summarizePipeline((proposalsCur.data || []) as LeadPipelineRow[]);
    const proposalsPrevious = summarizePipeline((proposalsPrev.data || []) as LeadPipelineRow[]);

    const premiumCurrentTotal = ((premiumCur.data || []) as PremiumRow[])
      .filter((row) => row.status === "Issued")
      .reduce((sum, row) => sum + annualizePremium(row), 0);
    const premiumPreviousTotal = ((premiumPrev.data || []) as PremiumRow[])
      .filter((row) => row.status === "Issued")
      .reduce((sum, row) => sum + annualizePremium(row), 0);

    return jsonResponse({
      scope,
      period,
      leads: { current: leadsCurrent, previous: leadsPrevious },
      proposals: { current: proposalsCurrent, previous: proposalsPrevious },
      premium: { current: premiumCurrentTotal, previous: premiumPreviousTotal },
      advisorIds,
      lastUpdated: new Date().toISOString(),
    });
  } catch (e) {
    return errorResponse(String((e as Error)?.message || e));
  }
}

// deno-lint-ignore no-explicit-any
const maybeServe: any = (globalThis as any).Deno?.serve;
if (maybeServe) maybeServe(handler);

