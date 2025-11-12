import supabase from "@/admin/api/supabaseClient.js";

const TELEMETRY_TABLE = "mira_telemetry_events";
let hasWarned = false;

function isTelemetryEnabled() {
  return Boolean(import.meta.env.VITE_MIRA_TELEMETRY_WRITE_KEY);
}

function normalizePayload(payload) {
  if (!payload || typeof payload !== "object") {
    return {};
  }
  try {
    return JSON.parse(JSON.stringify(payload));
  } catch {
    return {};
  }
}

export async function trackMiraEvent(eventName, payload = {}) {
  if (!eventName) return;
  const body = {
    event_name: eventName,
    payload: normalizePayload(payload),
    created_at: new Date().toISOString(),
  };

  if (!isTelemetryEnabled()) {
    if (!hasWarned) {
      console.info(
        "[MiraTelemetry] VITE_MIRA_TELEMETRY_WRITE_KEY missing; events logged to console only.",
      );
      hasWarned = true;
    }
    console.debug("[MiraTelemetry]", eventName, body.payload);
    return;
  }

  try {
    const { error } = await supabase.from(TELEMETRY_TABLE).insert([body]);
    if (error) {
      throw error;
    }
  } catch (error) {
    if (!hasWarned) {
      console.warn(
        "[MiraTelemetry] Failed to persist telemetry. Falling back to console logging.",
        error instanceof Error ? error.message : error,
      );
      hasWarned = true;
    }
    console.debug("[MiraTelemetry:fallback]", eventName, body.payload);
  }
}
