import { createServiceClient } from "./supabase.ts";

export interface SkillTelemetryPayload {
  agent_name: string;
  skill_name: string;
  journey_type?: string;
  channel?: string;
  requestId?: string;
  tenantId?: string | null;
  advisor_id?: string | null;
  intent?: string | null;
  actions?: Array<Record<string, unknown>>;
  knowledge_atoms?: Array<Record<string, unknown>>;
}

export async function logSkillExecution(payload: SkillTelemetryPayload) {
  // Gate telemetry with env flag; default off while analytics is redefined
  const enabled = (Deno.env.get('MIRA_TELEMETRY_ENABLED') || '').toLowerCase() === 'true';
  if (!enabled) {
    console.info('[Telemetry disabled] skill.executed', {
      agent_name: payload.agent_name,
      skill_name: payload.skill_name,
      journey_type: payload.journey_type,
      channel: payload.channel,
    });
    return;
  }
  const row = {
    advisor_id: payload.advisor_id ?? null,
    tenant_id: payload.tenantId ?? null,
    journey_type: payload.journey_type ?? null,
    channel: payload.channel ?? null,
    intent: payload.intent ?? null,
    agent_name: payload.agent_name,
    skill_name: payload.skill_name,
    actions: Array.isArray(payload.actions) ? payload.actions : null,
    knowledge_atoms: Array.isArray(payload.knowledge_atoms) ? payload.knowledge_atoms : null,
    metadata: { requestId: payload.requestId ?? null, source: "edge" },
    created_at: new Date().toISOString(),
  } as const;

  try {
    const supabase = createServiceClient();
    // Prefer planned Phase 5 table name
    const { error } = await supabase.from("mira_events").insert([row]);
    if (error) throw error;
  } catch (_e) {
    // Fallback to console for non-blocking telemetry
    console.info("[Telemetry] skill.executed", row);
  }
}

export default { logSkillExecution };
