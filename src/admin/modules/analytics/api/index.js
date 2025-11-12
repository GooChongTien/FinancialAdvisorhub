// Analytics service scaffolds
// Placeholder API clients for goal-service, production-service,
// commission-service, and benchmark-service. Replace implementations
// with real HTTP calls or Supabase functions as they become available.
import { supabase } from "@/admin/api/supabaseClient";

export async function fetchGoals({ scope = "personal" } = {}) {
  const res = await supabase.functions.invoke("goals-summary", { body: { scope } });
  if (res.error) {
    console.warn("goals-summary error", res.error);
    return { scope, annualGoalRP: null, annualGoalSP: null, configured: false };
  }
  return res.data;
}

export async function fetchProductionSummary({ scope = "personal", period = "mtd" } = {}) {
  const res = await supabase.functions.invoke("production-summary", { body: { scope, period } });
  if (res.error) {
    console.warn("production-summary error", res.error);
    // Safe fallback so UI renders even if function is not deployed yet
    return {
      scope,
      period,
      rp: { target: 0, incepted: 0, pending: 0, completedPct: 0, prevIncepted: 0 },
      sp: { target: 0, incepted: 0, pending: 0, completedPct: 0, prevIncepted: 0 },
      newClients: 0,
      prevNewClients: 0,
      conversionRate: 0,
      prevConversionRate: 0,
      avgDealSize: 0,
      prevAvgDealSize: 0,
      monthly: Array.from({ length: 12 }).map((_, i) => ({ month: new Date(2000, i, 1).toLocaleString("en", { month: "short" }), rp: 0, sp: 0, total: 0 })),
      funnel: [
        { stage: "Lead", count: 0 },
        { stage: "Contacted", count: 0 },
        { stage: "Fact Find", count: 0 },
        { stage: "FNA", count: 0 },
        { stage: "Quotation", count: 0 },
        { stage: "Application", count: 0 },
        { stage: "Issued", count: 0 },
      ],
      productMix: [],
      productPerformance: [],
      teamVsIndividual: [],
      lastUpdated: new Date().toISOString(),
    };
  }
  return res.data;
}

export async function fetchCommissionSummary({ scope = "personal", period = "mtd" } = {}) {
  const res = await supabase.functions.invoke("commission-summary", { body: { scope, period } });
  if (res.error) {
    console.warn("commission-summary error", res.error);
    return { scope, period, inceptedEFYC: 0, firstYearBonus: 0, quarterlyBonus: 0, businessAllowance: 0, cashIncentives: 0, unearnedEFYC: 0, pendersEFYC: 0 };
  }
  return res.data;
}

export async function fetchBenchmarkSummary({ scope = "personal" } = {}) {
  const res = await supabase.functions.invoke("benchmark-summary", { body: { scope } });
  if (res.error) {
    console.warn("benchmark-summary error", res.error);
    return { scope, rpHistory: [], pruCreditHistory: [], cohort: null, percentiles: { p25: null, p50: null, p75: null } };
  }
  return res.data;
}

// AI Insight feedback logging scaffold
export async function logInsightFeedback({ insightId, vote, metadata = {} }) {
  // vote: 'up' | 'down'
  try {
    const user = (await supabase.auth.getUser()).data.user;
    const payload = {
      insight_id: insightId || null,
      user_id: user ? user.id : null,
      vote,
      metadata,
    };
    const { error } = await supabase.from("ai_insight_feedback").insert(payload);
    if (error) {
      // Fallback to console logging if table is unavailable
      console.warn("AI feedback insert failed; logging locally", { payload, error });
      return { ok: false, error };
    }
    return { ok: true };
  } catch (e) {
    console.warn("AI feedback logging error", e);
    return { ok: false, error: e };
  }
}
