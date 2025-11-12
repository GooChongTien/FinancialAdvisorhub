/**
 * Structured logging and telemetry helper for agent orchestration.
 * Persists to mira_telemetry_events when service role credentials are available.
 */

type LogLevel = "debug" | "info" | "warn" | "error";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY =
  Deno.env.get("AGENT_SERVICE_ROLE_KEY") ??
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
  "";

const TELEMETRY_ENDPOINT = SUPABASE_URL
  ? `${SUPABASE_URL.replace(/\/$/, "")}/rest/v1/mira_telemetry_events`
  : "";

interface LogPayload {
  event: string;
  level?: LogLevel;
  context?: Record<string, unknown>;
}

async function persistTelemetry(event: string, payload: Record<string, unknown>) {
  if (!TELEMETRY_ENDPOINT || !SERVICE_ROLE_KEY) {
    return;
  }

  try {
    const response = await fetch(TELEMETRY_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify([
        {
          event_name: event,
          payload,
          created_at: new Date().toISOString(),
        },
      ]),
    });

    if (!response.ok) {
      const detail = await response.text();
      console.warn("[AgentLogger] Telemetry insert failed", response.status, detail);
    }
  } catch (error) {
    console.warn("[AgentLogger] Telemetry insert error", error);
  }
}

export async function logAgentEvent(
  event: string,
  context: Record<string, unknown> = {},
  level: LogLevel = "info",
) {
  const entry = {
    component: "agent-orchestrator",
    event,
    level,
    timestamp: new Date().toISOString(),
    ...context,
  };

  // Console log for observability within Edge runtime
  const message = JSON.stringify(entry);
  switch (level) {
    case "debug":
      console.debug(message);
      break;
    case "warn":
      console.warn(message);
      break;
    case "error":
      console.error(message);
      break;
    default:
      console.log(message);
      break;
  }

  // Persist to telemetry table when credentials are available
  await persistTelemetry(event, context);
}

export function logAgentError(event: string, error: unknown, context: Record<string, unknown> = {}) {
  const detail =
    error instanceof Error
      ? { message: error.message, stack: error.stack }
      : { message: String(error) };
  return logAgentEvent(event, { ...context, error: detail }, "error");
}

