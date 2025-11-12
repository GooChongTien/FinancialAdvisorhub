/**
 * Deno Edge Function: POST /api/agent/chat
 * Proxies chat requests to OpenAI Agent with streaming SSE support
 */

import { createCorsHeaders } from "../utils/cors.ts";
import { createAgentClient } from "../services/agent/client.ts";
import { createSSEStream, createSSEHeaders, createErrorSSE } from "../services/agent/stream-adapter.ts";
import { dispatchAialEvent } from "../services/aial/dispatcher.ts";
import { routeMira } from "../services/router/mira-router.ts";
import { logSkillExecution } from "../services/telemetry.ts";
import { getClientSecret, getClientSecretFromAdapter } from "../services/agent/secrets.ts";
import { fetchTenantModelConfig } from "../services/config/model-config.ts";
import { createRequestLogger, type RequestLogger } from "../utils/logger.ts";
import type { AgentChatRequest, AgentEvent, AgentRequestMode } from "../services/agent/types.ts";

const STREAMING_MODES: AgentRequestMode[] = ["stream", "batch"];
const SPECIAL_MODES = new Set(["health", "get_client_secret", "aial"]);

function isStreamingMode(mode: string): mode is AgentRequestMode {
  return STREAMING_MODES.includes(mode as AgentRequestMode);
}

/**
 * Validate chat request (stream/batch)
 */
export function validateRequest(body: any): { valid: boolean; error?: string } {
  if (!body || typeof body !== "object") {
    return { valid: false, error: "Request body must be a JSON object" };
  }

  if (!Array.isArray(body.messages)) {
    return { valid: false, error: "messages must be an array" };
  }

  if (body.messages.length === 0) {
    return { valid: false, error: "messages array cannot be empty" };
  }

  // Validate each message
  for (const msg of body.messages) {
    if (!msg.role || !["user", "assistant", "tool", "system"].includes(msg.role)) {
      return { valid: false, error: `Invalid message role: ${msg.role}` };
    }

    if (msg.content === undefined) {
      return { valid: false, error: "Each message must have content" };
    }
  }

  return { valid: true };
}

/**
 * Sanitize and size-limit request
 */
export function sanitizeRequest(body: any, tenantId?: string): AgentChatRequest {
  const maxMessages = 100;
  const maxContentLength = 50000; // 50KB per message

  const messages = body.messages.slice(0, maxMessages).map((msg: any) => {
    let content = msg.content;

    // Truncate large content
    if (typeof content === "string" && content.length > maxContentLength) {
      content = content.slice(0, maxContentLength) + "... [truncated]";
    }

    return {
      role: msg.role,
      content,
      name: msg.name,
      tool_call_id: msg.tool_call_id,
    };
  });

  const metadata = typeof body.metadata === "object" && body.metadata !== null ? { ...body.metadata } : {};
  if (tenantId && typeof metadata.tenantId !== "string") {
    metadata.tenantId = tenantId;
  }

  return {
    messages,
    mode: body.mode === "batch" ? "batch" : "stream",
    metadata,
    temperature: typeof body.temperature === "number" ? body.temperature : undefined,
    max_tokens: typeof body.max_tokens === "number" ? body.max_tokens : undefined,
  };
}

function resolveTenantId(body: any): string | null {
  const candidates = [
    body?.tenantId,
    body?.tenant_id,
    body?.metadata?.tenantId,
    body?.metadata?.tenant_id,
    body?.advisor?.tenantId,
    body?.context?.tenantId,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }
  return null;
}

function makeJsonResponse(data: unknown, origin: string, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...Object.fromEntries(createCorsHeaders(origin)),
    },
  });
}

async function handleHealth(origin: string) {
  // Lightweight health: avoid initializing adapters to keep this always-fast
  return makeJsonResponse(
    {
      status: "ok",
      timestamp: new Date().toISOString(),
    },
    origin
  );
}

async function handleGetClientSecret(origin: string, logger?: RequestLogger) {
  logger?.info("mode.get_client_secret.start");
  const client = createAgentClient();

  try {
    const payload = await getClientSecret();
    logger?.info("mode.get_client_secret.env_hit");
    return makeJsonResponse(payload, origin);
  } catch (envError) {
    try {
      const payload = await getClientSecretFromAdapter(() => client.getClientSecret());
      logger?.info("mode.get_client_secret.adapter_hit");
      return makeJsonResponse(payload, origin);
    } catch (adapterError) {
      logger?.error("mode.get_client_secret.failed", {
        error: (adapterError as Error)?.message ?? "adapter_error",
      });
      console.error("[Agent Chat] Failed to load client secret", envError, adapterError);
      return makeJsonResponse({ error: "Unable to load client secret" }, origin, 503);
    }
  }
}

async function handleAialMode(body: any, origin: string, logger?: RequestLogger) {
  if (!body?.event) {
    return makeJsonResponse({ error: "event payload is required for mode 'aial'" }, origin, 400);
  }

  try {
    logger?.info("mode.aial.dispatch", { eventId: body.event?.id });
    const result = await dispatchAialEvent(body.event);
    logger?.info("mode.aial.success", { eventId: body.event?.id });
    return makeJsonResponse({ result }, origin);
  } catch (error) {
    logger?.error("mode.aial.failed", {
      eventId: body.event?.id,
      error: (error as Error).message ?? "unknown",
    });
    console.error("[Agent Chat] AIAL routing failed", error);
    return makeJsonResponse({ error: (error as Error).message ?? "Unable to process event" }, origin, 500);
  }
}

function instrumentStreamEvents(
  eventGenerator: AsyncGenerator<AgentEvent>,
  options: { logger?: RequestLogger | null; adapterId?: string | null; adapterName?: string | null }
): AsyncGenerator<AgentEvent> {
  const { logger, adapterId, adapterName } = options;
  const startedAt = Date.now();
  let completed = false;
  return (async function* () {
    try {
      for await (const event of eventGenerator) {
        if (event.type === "done") {
          completed = true;
          logger?.info("chat.streaming.completed", {
            adapterId: adapterId ?? "unknown",
            adapterName,
            latencyMs: Date.now() - startedAt,
          });
        }
        yield event;
      }
      if (!completed) {
        logger?.info("chat.streaming.completed", {
          adapterId: adapterId ?? "unknown",
          adapterName,
          latencyMs: Date.now() - startedAt,
        });
      }
    } catch (error) {
      logger?.error("chat.streaming.failed", {
        adapterId: adapterId ?? "unknown",
        adapterName,
        latencyMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : "unknown",
      });
      throw error;
    }
  })();
}

/**
 * Main handler
 */
async function handleRequest(req: Request): Promise<Response> {
  const origin = req.headers.get("origin") || "";
  let requestLogger: RequestLogger | null = null;

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: createCorsHeaders(origin),
    });
  }

  // Only allow POST
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    // Parse request body
    const body = await req.json();
    const mode = typeof body.mode === "string" ? body.mode : undefined;
    const tenantId = resolveTenantId(body);
    const tenantConfig = tenantId ? await fetchTenantModelConfig(tenantId).catch(() => null) : null;
    const requestId =
      typeof body.requestId === "string" && body.requestId.trim().length > 0 ? body.requestId.trim() : crypto.randomUUID();
    requestLogger = createRequestLogger({ requestId, tenantId, mode });
    requestLogger.info("request.received", { mode, tenantId, hasTenantConfig: Boolean(tenantConfig) });

    if (!mode) {
      return makeJsonResponse({ error: "mode is required" }, origin, 400);
    }

    if (mode === "health") {
      requestLogger.info("mode.health");
      return handleHealth(origin);
    }

    if (mode === "get_client_secret") {
      return handleGetClientSecret(origin, requestLogger);
    }

    if (mode === "aial") {
      return handleAialMode(body, origin, requestLogger);
    }

    if (!isStreamingMode(mode)) {
      return makeJsonResponse({ error: `Unsupported mode: ${mode}` }, origin, 400);
    }

    // Validate request
    const validation = validateRequest(body);
    if (!validation.valid) {
      return makeJsonResponse({ error: validation.error }, origin, 400);
    }

    // Sanitize request
    const chatRequest = sanitizeRequest(body, tenantId ?? undefined);
    requestLogger.info("chat.validated");

    // Router decision (pure; no side-effects)
    const decision = routeMira(chatRequest);
    requestLogger.info("router.decision", { next_agent: decision.next_agent, next_skill: decision.next_skill });

    const tenantIdForTelemetry = tenantId ?? null;
    const journeyType = String(chatRequest.metadata?.journey_type ?? chatRequest.metadata?.journeyType ?? "");
    const channel = String(chatRequest.metadata?.channel ?? "");

    // Handle known server-side skills locally; otherwise fall through to Agent client
    const isPassthrough = decision.next_skill === "ops__agent_passthrough";
    if (!isPassthrough) {
      // Lazy-load skills registry only when needed to keep Node tests from importing remote ESM modules
      const skills = await import("../services/skills/index.ts");
      const isKnownSkill = skills.hasSkill(decision.next_skill);
      if (isKnownSkill) {
      if (chatRequest.mode === "stream") {
        requestLogger.info("chat.streaming.start", { adapterId: "local-skill", adapterName: decision.next_skill });
        const startedAt = Date.now();
        const { content } = await skills.executeSkill(decision.next_skill, { request: chatRequest, requestId, tenantId: tenantIdForTelemetry });

        // Telemetry (fire-and-forget)
        void logSkillExecution({
          agent_name: decision.next_agent,
          skill_name: decision.next_skill,
          journey_type: journeyType || undefined,
          channel: channel || undefined,
          requestId,
          tenantId: tenantIdForTelemetry,
        });

        async function* singleMessageStream() {
          yield { type: "message.delta", data: { delta: content, message_id: requestId } } as AgentEvent;
          yield {
            type: "message.completed",
            data: { message: { role: "assistant", content }, message_id: requestId, finish_reason: "stop" },
          } as AgentEvent;
          yield { type: "done", data: { message_id: requestId } } as AgentEvent;
        }

        const instrumented = instrumentStreamEvents(singleMessageStream(), {
          logger: requestLogger,
          adapterId: "local-skill",
          adapterName: decision.next_skill,
        });
        const stream = createSSEStream(instrumented);
        requestLogger.info("chat.streaming.completed", { adapterId: "local-skill", adapterName: decision.next_skill, latencyMs: Date.now() - startedAt });
        return new Response(stream, { status: 200, headers: createSSEHeaders(origin) });
      } else {
        const startedAt = Date.now();
        const { content } = await skills.executeSkill(decision.next_skill, { request: chatRequest, requestId, tenantId: tenantIdForTelemetry });

        // Telemetry (fire-and-forget)
        void logSkillExecution({
          agent_name: decision.next_agent,
          skill_name: decision.next_skill,
          journey_type: journeyType || undefined,
          channel: channel || undefined,
          requestId,
          tenantId: tenantIdForTelemetry,
        });

        requestLogger.info("chat.batch.completed", { latencyMs: Date.now() - startedAt, adapterId: "local-skill", tokensUsed: null });
        return new Response(
          JSON.stringify({
            message: { role: "assistant", content },
            toolCalls: [],
            tokensUsed: null,
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              ...Object.fromEntries(createCorsHeaders(origin)),
            },
          }
        );
      }
      }
    }

    // Create Agent client
    const client = createAgentClient({
      maxRetries: tenantConfig?.maxRetries ?? undefined,
      timeoutMs: tenantConfig?.timeoutMs ?? undefined,
    });
    const adapterInfo = client.getAdapterInfo();
    requestLogger.info("chat.adapter_selected", {
      adapterId: adapterInfo?.id ?? "unknown",
      adapterName: adapterInfo?.name,
    });

    // Handle streaming vs batch mode
    if (chatRequest.mode === "stream") {
      requestLogger.info("chat.streaming.start", { adapterId: adapterInfo?.id ?? "unknown" });
      const eventGenerator = client.streamChat(chatRequest, { requestId });
      const instrumentedGenerator = instrumentStreamEvents(eventGenerator, {
        logger: requestLogger,
        adapterId: adapterInfo?.id,
        adapterName: adapterInfo?.name,
      });
      const stream = createSSEStream(instrumentedGenerator);

      return new Response(stream, {
        status: 200,
        headers: createSSEHeaders(origin),
      });
    } else {
      const startedAt = Date.now();
      const result = await client.chat(chatRequest, { requestId });
      const latencyMs = Date.now() - startedAt;
      requestLogger.info("chat.batch.completed", {
        latencyMs,
        adapterId: adapterInfo?.id ?? "unknown",
        tokensUsed: result.tokensUsed ?? null,
      });
      return makeJsonResponse(
        {
          message: result.message,
          toolCalls: result.toolCalls ?? [],
          tokensUsed: result.tokensUsed ?? null,
        },
        origin
      );
    }
  } catch (error) {
    requestLogger?.error("request.failed", {
      error: error instanceof Error ? error.message : "unknown",
    });
    console.error("[Agent Chat] Error:", error);

    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    const statusCode = errorMessage.includes("Missing required env") ? 503 : 500;

    // For streaming errors, return SSE error event
    if (req.headers.get("accept")?.includes("text/event-stream")) {
      const encoder = new TextEncoder();
      const errorSSE = createErrorSSE(errorMessage, "internal_error");

      return new Response(encoder.encode(errorSSE), {
        status: 200, // Keep 200 for SSE compatibility
        headers: createSSEHeaders(origin),
      });
    }

    // For batch errors, return JSON
    return new Response(
      JSON.stringify({
        error: {
          message: errorMessage,
          code: "internal_error",
        },
      }),
      {
        status: statusCode,
        headers: {
          "Content-Type": "application/json",
          ...Object.fromEntries(createCorsHeaders(origin)),
        },
      }
    );
  }
}

// Deno.serve for local testing
if (import.meta.main) {
  Deno.serve(handleRequest);
}

// Export for Supabase Edge Functions
export default handleRequest;
