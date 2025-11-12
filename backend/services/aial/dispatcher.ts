import { createAgentClient } from "../agent/client.ts";
import type { AgentChatRequest, ChatMessage } from "../agent/types.ts";
import { fetchTenantModelConfig } from "../config/model-config.ts";

export interface AialEventPayload {
  id: string;
  intent: string;
  payload?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

const SYSTEM_PROMPT = [
  "You are Mira's Advisor Impact Automation Layer (AIAL).",
  "Given a JSON payload describing advisor context, produce a short recommended action summary.",
  "Respond in plain English with at most three bullet points.",
].join(" ");

function buildMessages(event: AialEventPayload): ChatMessage[] {
  return [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: JSON.stringify({
        intent: event.intent,
        payload: event.payload ?? {},
        metadata: event.metadata ?? {},
      }),
    },
  ];
}

function resolveTenantId(event: AialEventPayload): string | null {
  const metadata = event.metadata ?? {};
  const candidates = [
    metadata.tenantId,
    metadata.tenant_id,
    metadata.tenant,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }
  return null;
}

export async function dispatchAialEvent(event: AialEventPayload) {
  if (!event || typeof event !== "object") {
    throw new Error("event is required");
  }

  if (!event.intent) {
    throw new Error("event.intent is required");
  }

  const tenantId = resolveTenantId(event);
  const tenantConfig = tenantId ? await fetchTenantModelConfig(tenantId).catch(() => null) : null;
  const client = createAgentClient({ tenantConfig });
  const request: AgentChatRequest = {
    mode: "batch",
    messages: buildMessages(event),
    metadata: {
      eventId: event.id,
      intent: event.intent,
      source: event.metadata?.source ?? "aial",
      ...(tenantId ? { tenantId } : {}),
      ...(event.metadata?.channel ? { channel: event.metadata.channel } : {}),
    },
  };

  const result = await client.chat(request);

  return {
    eventId: event.id,
    intent: event.intent,
    message: result.message,
    toolCalls: result.toolCalls,
    metadata: request.metadata,
  };
}
