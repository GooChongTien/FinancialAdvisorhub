import { getSupabaseClients, decodeAuthUserId } from "../../backend/api/supabase.ts";
import { handleCors, jsonResponse, errorResponse } from "../../backend/utils/cors.ts";

function thisYearUTC() { return new Date().getUTCFullYear(); }

export default async function handler(req: Request) {
  try {
    const preflight = handleCors(req);
    if (preflight) return preflight;
    const body = (req.method === "POST" ? await req.json().catch(() => ({})) : {}) as Partial<{ scope: string }>;
    const scope = (body.scope || "personal").toString();
    const authHeader = req.headers.get("Authorization");
    const { client: supabase } = getSupabaseClients("ANALYTICS", authHeader);
    const advisorId = decodeAuthUserId(authHeader ?? null);

    let annualGoalRP: number | null = null;
    let annualGoalSP: number | null = null;
    let configured = false;
    try {
      const { data, error } = await supabase
        .from('advisor_goals')
        .select('goal_rp, goal_sp')
        .eq('advisor_id', advisorId)
        .eq('year', thisYearUTC())
        .maybeSingle();
      if (!error && data) {
        annualGoalRP = data.goal_rp !== null && data.goal_rp !== undefined ? Number(data.goal_rp) : null;
        annualGoalSP = data.goal_sp !== null && data.goal_sp !== undefined ? Number(data.goal_sp) : null;
        configured = true;
      }
    } catch {}

    const payload = { scope, annualGoalRP, annualGoalSP, configured, lastUpdated: new Date().toISOString() };
    return jsonResponse(payload);
  } catch (e) {
    return errorResponse(String((e as Error)?.message || e));
  }
}

// deno-lint-ignore no-explicit-any
const maybeServe: any = (globalThis as any).Deno?.serve;
if (maybeServe) maybeServe(handler);







