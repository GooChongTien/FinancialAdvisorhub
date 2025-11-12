
export interface SkillTelemetryPayload {
  agent_name: string;
  skill_name: string;
  journey_type?: string;
  channel?: string;
  requestId?: string;
  tenantId?: string | null;
}

/**
 * Server-side telemetry for skill execution.
 * Falls back to console logging when Supabase env is missing.
 */
export async function logSkillExecution(payload: SkillTelemetryPayload) {
  const eventName = "skill.executed";
  const body = {
    event_name: eventName,
    payload: { ...payload, ts: new Date().toISOString(), source: "edge" },
    created_at: new Date().toISOString(),
  };

  // In Deno (Edge), persist to Supabase using the service client.
  // In Node (tests), fall back to console logging to avoid importing remote ESM URLs.
  try {
    // @ts-ignore check Deno runtime presence
    const isDeno = typeof Deno !== "undefined" && !!Deno?.serve;
    if (isDeno) {
      const mod = await import("../api/supabase.ts");
      const supabase = mod.createServiceClient();
      const { error } = await supabase.from("mira_telemetry_events").insert([body]);
      if (error) throw error;
      return;
    }
  } catch (_e) {
    // ignore and fall back to console
  }

  console.info("[Telemetry]", eventName, body.payload);
}

export default { logSkillExecution };
