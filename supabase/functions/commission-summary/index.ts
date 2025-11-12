import { getSupabaseClients, decodeAuthUserId } from "../../backend/api/supabase.ts";
import { handleCors, jsonResponse, errorResponse } from "../../backend/utils/cors.ts";
import { getPeriodRange, annualizePremium, Period } from "../../backend/services/analytics/periods.ts";
import { resolveAdvisorIds, AdvisorScope } from "../../backend/services/analytics/advisors.ts";

type PayoutRow = { type: string | null; amount: number | null };

export default async function handler(req: Request) {
  try {
    const preflight = handleCors(req);
    if (preflight) return preflight;

    const body = (req.method === "POST" ? await req.json().catch(() => ({})) : {}) as Partial<{ scope: AdvisorScope; period: Period }>;
    const scope: AdvisorScope = (body.scope || "personal") as AdvisorScope;
    const period: Period = (body.period || "mtd") as Period;

    const authHeader = req.headers.get("Authorization");
    const { client: supabase } = getSupabaseClients("ANALYTICS", authHeader);
    const advisorId = decodeAuthUserId(authHeader ?? null);
    const advisorIds = await resolveAdvisorIds(supabase, scope, advisorId);

    const { curStart, curEnd } = getPeriodRange(period);

    const policyQuery = supabase
      .from("policies")
      .select("premium_amount, premium_frequency, policy_start_date, status, advisor_id, premium_type, created_at")
      .gte("created_at", curStart.toISOString())
      .lte("created_at", curEnd.toISOString());
    const policiesRes = advisorIds.length
      ? await policyQuery.in("advisor_id", advisorIds)
      : await policyQuery;
    if (policiesRes.error) throw policiesRes.error;

    const policies = (policiesRes.data || []) as Array<Record<string, unknown>>;
    const isRP = (row: Record<string, unknown>) => (row.premium_type ?? "RP") === "RP";
    const status = (row: Record<string, unknown>) => String(row.status || "").toLowerCase();
    const startDate = (row: Record<string, unknown>) => (row.policy_start_date as string | null) ?? (row.created_at as string | null);

    const inceptedEFYC = policies
      .filter((row) => isRP(row) && status(row) === "active")
      .reduce((sum, row) => sum + annualizePremium(row), 0);

    const unearnedEFYC = policies
      .filter((row) => isRP(row) && (status(row) !== "active" || (startDate(row) && new Date(startDate(row)!).getTime() > Date.now())))
      .reduce((sum, row) => sum + annualizePremium(row), 0);

    const pendersEFYC = policies
      .filter((row) => isRP(row) && status(row).includes("pend"))
      .reduce((sum, row) => sum + annualizePremium(row), 0);

    let firstYearBonus = 0;
    let quarterlyBonus = 0;
    let businessAllowance = 0;
    let cashIncentives = 0;

    try {
      const payoutQuery = supabase
        .from("commission_payouts")
        .select("type, amount, advisor_id, posted_at")
        .gte("posted_at", curStart.toISOString())
        .lte("posted_at", curEnd.toISOString());
      const payoutsRes = advisorIds.length
        ? await payoutQuery.in("advisor_id", advisorIds)
        : await payoutQuery;
      if (!payoutsRes.error && payoutsRes.data) {
        for (const row of payoutsRes.data as PayoutRow[]) {
          const kind = String(row.type || "").toLowerCase();
          const value = Number(row.amount || 0);
          if (kind.includes("first")) firstYearBonus += value;
          else if (kind.includes("quarter")) quarterlyBonus += value;
          else if (kind.includes("allow")) businessAllowance += value;
          else if (kind.includes("cash")) cashIncentives += value;
        }
      }
    } catch (_err) {
      // Table may be absent in early environments; ignore.
    }

    return jsonResponse({
      scope,
      period,
      inceptedEFYC,
      firstYearBonus,
      quarterlyBonus,
      businessAllowance,
      cashIncentives,
      unearnedEFYC,
      pendersEFYC,
      lastUpdated: new Date().toISOString(),
    });
  } catch (e) {
    return errorResponse(String((e as Error)?.message || e));
  }
}

// deno-lint-ignore no-explicit-any
const maybeServe: any = (globalThis as any).Deno?.serve;
if (maybeServe) maybeServe(handler);
