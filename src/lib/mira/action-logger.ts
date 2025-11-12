import type { UIAction, MiraContext } from "./types.ts";

interface LogActionInput {
  baseUrl: string;
  action: UIAction;
  success: boolean;
  errorMessage?: string | null;
  context?: MiraContext | null;
  getAuthHeaders?: (() => Promise<Record<string, string>>) | null;
  correlationId?: string | null;
}

const DASH_ENDPOINT = "/mira-log-action";
const SLASH_ENDPOINT = "/mira/log-action";

function buildEndpoint(baseUrl: string): { url: string; preferDash: boolean } {
  const normalizedBase = baseUrl ? baseUrl.replace(/\/+$/, "") : "";
  const preferDash = normalizedBase.includes("/functions/");
  const endpoint = preferDash ? DASH_ENDPOINT : SLASH_ENDPOINT;
  if (!normalizedBase) {
    return { url: endpoint, preferDash };
  }
  return { url: `${normalizedBase}${endpoint}`, preferDash };
}

type ActionSummary = {
  action_type: string;
  target: string | null;
  module: string | null;
  confirm_required: boolean;
  field_keys?: string[];
};

const ENTITY_KEY_MAP: Record<string, string[]> = {
  proposal: ["proposal_id", "proposalId"],
  customer: ["customer_id", "customerId"],
  lead: ["lead_id", "leadId"],
  policy: ["policy_id", "policyId"],
  task: ["task_id", "taskId"],
};

const ENTITY_TYPES = Object.keys(ENTITY_KEY_MAP);

function sanitizeIdentifier(value: unknown, max = 80) {
  if (typeof value === "number") {
    return String(value);
  }
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const safe = trimmed.replace(/[^a-zA-Z0-9-_]/g, "");
  if (!safe) return null;
  return safe.slice(0, max);
}

function extractEntityFromSource(source: unknown) {
  if (!source || typeof source !== "object") return null;
  const typed = source as Record<string, unknown>;
  const explicitType =
    typeof typed.entity_type === "string" && ENTITY_TYPES.includes(typed.entity_type.toLowerCase())
      ? typed.entity_type.toLowerCase()
      : null;
  const explicitId = sanitizeIdentifier(typed.entity_id);
  if (explicitType && explicitId) {
    return { type: explicitType, id: explicitId };
  }
  for (const type of ENTITY_TYPES) {
    const keys = ENTITY_KEY_MAP[type];
    for (const key of keys) {
      const value = sanitizeIdentifier(typed[key]);
      if (value) {
        return { type, id: value };
      }
    }
  }
  return null;
}

function extractEntityFromTarget(target?: string | null) {
  if (!target || typeof target !== "string") return null;
  const [descriptor, query] = target.split("?");
  if (!query) return null;
  const params = new URLSearchParams(query);
  const id = sanitizeIdentifier(params.get("id"));
  if (!id) return null;
  const normalizedDescriptor = descriptor.toLowerCase();
  if (normalizedDescriptor.includes("proposal")) {
    return { type: "proposal", id };
  }
  if (normalizedDescriptor.includes("customer")) {
    return { type: "customer", id };
  }
  if (normalizedDescriptor.includes("policy")) {
    return { type: "policy", id };
  }
  return null;
}

function deriveEntityMetadata(action: UIAction, context?: MiraContext | null) {
  const sources = [
    action && typeof (action as any).payload === "object" ? (action as any).payload : null,
    context?.pageData ?? null,
  ];
  for (const source of sources) {
    const match = extractEntityFromSource(source);
    if (match) {
      return match;
    }
  }
  const targetMatch = extractEntityFromTarget(
    (action as any)?.target ?? (action as any)?.page ?? null,
  );
  if (targetMatch) {
    return targetMatch;
  }
  return { type: null, id: null };
}

function summarizeAction(action: UIAction): ActionSummary {
  const base: ActionSummary = {
    action_type: action?.action ?? "unknown",
    target: (action as any)?.target ?? (action as any)?.page ?? null,
    module: (action as any)?.module ?? null,
    confirm_required: Boolean((action as any)?.confirm_required),
  };

  if ((action?.action === "frontend_prefill" || action?.action === "update_field") && action?.payload) {
    const keys = typeof action.payload === "object" && action.payload !== null ? Object.keys(action.payload) : [];
    base["field_keys"] = keys.slice(0, 8);
  }

  return base;
}

function extractPageDataKeys(context?: MiraContext | null) {
  if (!context?.pageData || typeof context.pageData !== "object") return [];
  return Object.keys(context.pageData).slice(0, 12);
}

export async function logMiraActionEvent(input: LogActionInput): Promise<void> {
  const { baseUrl, action, success, errorMessage, context, getAuthHeaders, correlationId } = input;
  const targetInfo = summarizeAction(action);
  const pageDataKeys = extractPageDataKeys(context);
  const entityInfo = deriveEntityMetadata(action, context);

  const payload = {
    action_type: targetInfo.action_type,
    target: targetInfo.target ?? null,
    module: context?.module ?? targetInfo.module ?? null,
    page: context?.page ?? null,
    confirm_required: targetInfo.confirm_required ?? false,
    success,
    error_message: success ? null : errorMessage ?? null,
    page_data_keys: pageDataKeys,
    correlation_id: correlationId ?? null,
    metadata: {
      fields: targetInfo.field_keys ?? [],
      timestamp: new Date().toISOString(),
      entity_type: entityInfo.type,
      entity_id: entityInfo.id,
      success,
    },
  };

  const { url } = buildEndpoint(baseUrl);
  const headers = {
    "Content-Type": "application/json",
    ...(getAuthHeaders ? await getAuthHeaders().catch(() => ({})) : {}),
  };

  try {
    await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
  } catch (_err) {
    // Swallow errors silently; logging is non-blocking.
  }
}

export default { logMiraActionEvent };
