import { handleCors, jsonResponse, errorResponse } from "../_shared/utils/cors.ts";
import { createServiceClient } from "../_shared/services/supabase.ts";

interface ActionLogRequest {
  action_type?: string;
  target?: unknown;
  module?: unknown;
  page?: unknown;
  confirm_required?: unknown;
  success?: unknown;
  error_message?: unknown;
  page_data_keys?: unknown;
  correlation_id?: unknown;
  metadata?: Record<string, unknown>;
}

const AGENT_NAME = "ui_action_executor";

function toStringOrNull(value: unknown, max = 200) {
  if (typeof value !== "string") return null;
  return value.slice(0, max);
}

function sanitizeStringArray(input: unknown, max = 12) {
  if (!Array.isArray(input)) return [];
  return input
    .map((item) => (typeof item === "string" ? item : null))
    .filter((item): item is string => Boolean(item))
    .slice(0, max);
}

function extractAdvisorId(req: Request): string | null {
  const header = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice(7);
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const payload = JSON.parse(atob(parts[1]));
    return typeof payload?.sub === "string" ? payload.sub : null;
  } catch (_err) {
    return null;
  }
}

function buildRow(body: ActionLogRequest, advisorId: string | null) {
  const actionType = toStringOrNull(body.action_type, 120) ?? "ui.action";
  const module = toStringOrNull(body.module, 120);
  const page = toStringOrNull(body.page, 160);
  const target = toStringOrNull(body.target, 160);
  const success = Boolean(body.success ?? true);
  const pageKeys = sanitizeStringArray(body.page_data_keys);
  const correlationId = toStringOrNull(body.correlation_id, 160);

  return {
    advisor_id: advisorId,
    tenant_id: null,
    journey_type: module,
    channel: "ui",
    intent: null,
    agent_name: AGENT_NAME,
    skill_name: actionType,
    actions: [
      {
        action_type: actionType,
        target,
        success,
      },
    ],
    metadata: {
      module,
      page,
      target,
      confirm_required: Boolean(body.confirm_required),
      page_data_keys: pageKeys,
      error_message: success ? null : toStringOrNull(body.error_message, 500),
      success,
      correlation_id: correlationId,
      ...(body.metadata ?? {}),
    },
    created_at: new Date().toISOString(),
  };
}

Deno.serve(async (req) => {
  const preflight = handleCors(req);
  if (preflight) return preflight;

  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  try {
    const body = (await req.json()) as ActionLogRequest;
    const advisorId = extractAdvisorId(req);
    const row = buildRow(body, advisorId);
    const supabase = createServiceClient();
    const { error } = await supabase.from("mira_events").insert([row]);
    if (error) throw error;
    return jsonResponse({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to log action";
    return errorResponse(message, 500);
  }
});
