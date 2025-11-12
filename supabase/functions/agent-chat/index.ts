/**
 * Deno Edge Function: POST /functions/v1/agent-chat
 * Native agent handler (no OpenAI AgentBuilder). Supports:
 * - mode: "health" → { status: "ok" }
 * - mode: "aial"   → summarized content via OpenAI chat completions
 * - mode: "stream" → SSE with message.delta/message.completed/done
 * - mode: "batch"  → JSON { message }
 */

import { createCorsHeaders } from "../_shared/utils/cors.ts";
import { logAgentEvent, logAgentError } from "../_shared/services/agent/logger.ts";
import type { AgentChatRequest, AgentEvent } from "../_shared/services/agent/types.ts";
import { createErrorSSE, createSSEHeaders } from "../_shared/services/agent/stream-adapter.ts";
import { intentRouter, buildRouterPrompts } from "../_shared/services/router/intent-router.ts";
import { decideSkillFromClassification } from "../_shared/services/router/skill-decider.ts";
import { logIntentClassification } from "../_shared/services/router/intent-logger.ts";
import {
  detectTopicSwitch,
  updateTopicHistory,
  shouldPromptForSwitch,
  generateTransitionMessage,
} from "../_shared/services/router/topic-tracker.ts";
import { buildClarificationMessage, needsClarification } from "../_shared/services/router/clarification.ts";
import type { MiraContext, MiraResponse, MiraModule } from "../_shared/services/types.ts";
import { logSkillExecution } from "../_shared/services/telemetry.ts";
import * as skills from "../_shared/services/skills/index.ts";
import { ensureConversationRecord } from "../_shared/services/conversations.ts";

interface AialMetadata {
  requestId: string;
  source: string;
  timestamp: number;
  tenantId?: string;
  channel?: string;
}

interface AialEvent {
  id: string;
  intent?: string;
  payload: Record<string, unknown>;
  metadata: AialMetadata;
}

interface ProviderResponse {
  content: string;
  tokensUsed: number | null;
  latencyMs: number | null;
  intentCandidates?: Array<{ id: string; score: number }>;
  suggestions?: string[];
}

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") ?? "";
const OPENAI_MODEL = Deno.env.get("OPENAI_MODEL") ?? "gpt-4o-mini";
const OPENAI_BASE_URL = (Deno.env.get("OPENAI_BASE_URL") ?? "https://api.openai.com/v1").replace(/\/$/, "");
const OPENAI_TEMPERATURE = Number.parseFloat(Deno.env.get("OPENAI_TEMPERATURE") ?? "0.2") || 0.2;
const OPENAI_MAX_TOKENS = Number.parseInt(Deno.env.get("OPENAI_MAX_TOKENS") ?? "512", 10) || 512;

function normalizeAialEvent(input: any): AialEvent {
  if (!input || typeof input !== "object") {
    throw new Error("AIAL event payload must be an object");
  }

  const id = typeof input.id === "string" && input.id.trim() !== "" ? input.id : crypto.randomUUID();
  const payload = typeof input.payload === "object" && input.payload !== null ? input.payload as Record<string, unknown> : {};
  const metadata = typeof input.metadata === "object" && input.metadata !== null ? input.metadata as Partial<AialMetadata> : {};

  return {
    id,
    intent: typeof input.intent === "string" ? input.intent : undefined,
    payload,
    metadata: {
      requestId: typeof metadata.requestId === "string" && metadata.requestId ? metadata.requestId : crypto.randomUUID(),
      source: typeof metadata.source === "string" && metadata.source ? metadata.source : "edge",
      timestamp: typeof metadata.timestamp === "number" && Number.isFinite(metadata.timestamp) ? metadata.timestamp : Date.now(),
      tenantId: typeof metadata.tenantId === "string" ? metadata.tenantId : undefined,
      channel: typeof metadata.channel === "string" ? metadata.channel : undefined,
    },
  };
}

function buildMessages(event: AialEvent) {
  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [];
  const payload = event.payload ?? {};
  const systemPrompt = typeof payload.systemPrompt === "string" ? payload.systemPrompt : undefined;

  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }

  const payloadMessages = Array.isArray((payload as any).messages) ? (payload as any).messages : [];
  if (payloadMessages.length > 0) {
    for (const msg of payloadMessages) {
      if (!msg || typeof msg !== "object") continue;
      const role = typeof msg.role === "string" ? msg.role : "user";
      let content = msg.content;
      if (typeof content === "object") {
        try {
          content = JSON.stringify(content);
        } catch {
          content = String(content);
        }
      }
      if (typeof content !== "string") {
        content = String(content ?? "");
      }
      messages.push({ role, content });
    }
    return messages;
  }

  const prompt =
    typeof (payload as any).prompt === "string"
      ? (payload as any).prompt
      : typeof (payload as any).text === "string"
        ? (payload as any).text
        : null;

  if (prompt) {
    messages.push({ role: "user", content: prompt });
  } else {
    messages.push({
      role: "user",
      content: `Generate an advisor-ready response for intent "${event.intent ?? "freeform.message"}". Payload:\n${JSON.stringify(payload, null, 2)}`,
    });
  }

  return messages;
}

function extractIntentCandidates(choice: any) {
  if (!choice?.message?.tool_calls) return undefined;
  const intents: Array<{ id: string; score: number }> = [];
  for (const toolCall of choice.message.tool_calls) {
    const name = toolCall?.function?.name;
    if (!name) continue;
    let score: number | undefined;
    try {
      const parsed = JSON.parse(toolCall.function.arguments ?? "{}");
      if (typeof parsed.confidence === "number") {
        score = parsed.confidence;
      }
    } catch {
      // ignore
    }
    intents.push({ id: name, score: typeof score === "number" ? score : 0.5 });
  }
  return intents.length > 0 ? intents : undefined;
}

async function openAiChat(messages: Array<{ role: string; content: string }>) {
  if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY missing");
  const url = `${OPENAI_BASE_URL}/chat/completions`;
  const startedAt = Date.now();
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: OPENAI_TEMPERATURE,
      max_tokens: OPENAI_MAX_TOKENS,
      messages,
    }),
  });
  if (!response.ok) {
    let detail = "";
    try {
      const payload = await response.json();
      detail = payload?.error?.message ? `: ${payload.error.message}` : "";
    } catch {}
    throw new Error(`OpenAI request failed (${response.status} ${response.statusText})${detail}`);
  }
  const data = await response.json();
  const latencyMs = Date.now() - startedAt;
  const content = data?.choices?.[0]?.message?.content ?? "";
  const tokensUsed = typeof data?.usage?.total_tokens === "number" ? data.usage.total_tokens : null;
  return { content, tokensUsed, latencyMs, raw: data };
}

async function handleAialProxy(body: any, origin: string): Promise<Response> {
  const corsHeaders = Object.fromEntries(createCorsHeaders(origin));

  try {
    const event = normalizeAialEvent(body.event ?? body);
    const messages = buildMessages(event);
    const data = await openAiChat(messages);
    const result: ProviderResponse = {
      content: data.content,
      tokensUsed: data.tokensUsed,
      latencyMs: data.latencyMs,
      intentCandidates: undefined,
      suggestions: undefined,
    };
    await logAgentEvent("mira.agent.aial.success", {
      requestId: event.metadata.requestId,
      latencyMs: result.latencyMs,
      tokensUsed: result.tokensUsed,
    });
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    await logAgentError("mira.agent.aial.error", error);
    const message = error instanceof Error ? error.message : "Provider execution failed";
    const status = message.includes("OPENAI_API_KEY") ? 503 : 502;
    return new Response(
      JSON.stringify({ error: { message, code: "aial_provider_error" } }),
      { status, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }
}

async function handleHealthCheck(origin: string): Promise<Response> {
  const corsHeaders = Object.fromEntries(createCorsHeaders(origin));

  return new Response(JSON.stringify({ status: OPENAI_API_KEY ? "ok" : "degraded" }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

function validateRequest(body: any): { valid: boolean; error?: string } {
  if (!body || typeof body !== "object") {
    return { valid: false, error: "Request body must be a JSON object" };
  }
  if (!Array.isArray(body.messages)) {
    return { valid: false, error: "messages must be an array" };
  }
  if (body.messages.length === 0) {
    return { valid: false, error: "messages array cannot be empty" };
  }
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

const VALID_MODULES = new Set([
  "customer",
  "new_business",
  "product",
  "analytics",
  "todo",
  "broadcast",
  "visualizer",
]);

function sanitizeContext(raw: any): MiraContext | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const module =
    typeof raw.module === "string" && VALID_MODULES.has(raw.module)
      ? (raw.module as MiraContext["module"])
      : undefined;
  const page = typeof raw.page === "string" ? raw.page : undefined;
  const pageData =
    raw.pageData && typeof raw.pageData === "object" ? (raw.pageData as Record<string, unknown>) : undefined;
  if (!module || !page) return undefined;
  return { module, page, pageData };
}

function deriveContextFromMetadata(metadata: Record<string, unknown> | undefined): MiraContext {
  const moduleCandidate =
    (metadata?.module as string) ??
    (metadata?.topic as string) ??
    (metadata?.journey_type as string) ??
    "customer";
  const module = VALID_MODULES.has(moduleCandidate) ? (moduleCandidate as MiraContext["module"]) : "customer";
  const page = typeof metadata?.page === "string" ? (metadata!.page as string) : "/";
  const pageData =
    metadata && typeof (metadata as any).pageData === "object" ? ((metadata as any).pageData as Record<string, unknown>) : undefined;
  return { module, page, pageData };
}

function lastUserMessageFromRequest(req: AgentChatRequest): string {
  const msgs = Array.isArray(req.messages) ? req.messages : [];
  for (let i = msgs.length - 1; i >= 0; i--) {
    const msg = msgs[i];
    if (msg?.role === "user") {
      if (typeof msg.content === "string") return msg.content;
      try {
        return JSON.stringify(msg.content);
      } catch {
        return String(msg.content);
      }
    }
  }
  return "";
}

function sanitizeRequest(body: any): AgentChatRequest {
  const maxMessages = 100;
  const maxContentLength = 50000; // 50KB per message
  const messages = body.messages.slice(0, maxMessages).map((msg: any) => {
    let content = msg.content;
    if (typeof content === "string" && content.length > maxContentLength) {
      content = content.slice(0, maxContentLength) + "... [truncated]";
    }
    return { role: msg.role, content, name: msg.name, tool_call_id: msg.tool_call_id };
  });
  return {
    messages,
    mode: body.mode === "batch" ? "batch" : "stream",
    metadata: body.metadata || {},
    context: sanitizeContext(body.context),
    temperature: typeof body.temperature === "number" ? body.temperature : undefined,
    max_tokens: typeof body.max_tokens === "number" ? body.max_tokens : undefined,
  };
}

function resolveQueueKey(metadata: Record<string, unknown> | undefined, fallback: Record<string, unknown> | undefined): string {
  const candidates = [
    metadata?.requestId,
    metadata?.leadId,
    metadata?.advisorId,
    metadata?.tenantId,
    fallback?.requestId,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate;
    }
  }
  return "agent-queue";
}

function extractConversationId(metadata: Record<string, unknown> | undefined): string | undefined {
  if (!metadata) return undefined;
  const idCandidates = [
    metadata.conversationId,
    metadata.conversation_id,
    metadata.threadId,
    metadata.thread_id,
  ];
  for (const candidate of idCandidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate;
    }
  }
  return undefined;
}

function extractAdvisorId(metadata: Record<string, unknown> | undefined): string | undefined {
  if (!metadata) return undefined;
  if (typeof metadata.advisorId === "string" && metadata.advisorId.trim().length > 0) {
    return metadata.advisorId;
  }
  const advisor = metadata.advisor;
  if (advisor && typeof advisor === "object") {
    const nestedId = (advisor as Record<string, unknown>).id;
    if (typeof nestedId === "string" && nestedId.trim().length > 0) {
      return nestedId;
    }
  }
  return undefined;
}

function extractAdvisorEmail(metadata: Record<string, unknown> | undefined): string | undefined {
  if (!metadata) return undefined;
  if (typeof metadata.advisorEmail === "string" && metadata.advisorEmail.trim().length > 0) {
    return metadata.advisorEmail;
  }
  const advisor = metadata.advisor;
  if (advisor && typeof advisor === "object") {
    const email = (advisor as Record<string, unknown>).email;
    if (typeof email === "string" && email.trim().length > 0) {
      return email;
    }
  }
  return undefined;
}

function extractTenantId(metadata: Record<string, unknown> | undefined): string | undefined {
  if (!metadata) return undefined;
  const candidates = [metadata.tenantId, metadata.tenant_id];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate;
    }
  }
  return undefined;
}

function extractChannel(metadata: Record<string, unknown> | undefined): string | undefined {
  if (!metadata) return undefined;
  if (typeof metadata.channel === "string" && metadata.channel.trim().length > 0) {
    return metadata.channel;
  }
  return undefined;
}

function resolveConversationStatus(metadata: Record<string, unknown> | undefined): string | undefined {
  if (!metadata) return undefined;
  const candidates = [metadata.conversation_status, metadata.status];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate;
    }
  }
  return undefined;
}

function resolveConversationMode(
  metadata: Record<string, unknown> | undefined,
  fallback: string | undefined,
): string | undefined {
  if (metadata && typeof metadata.mode === "string" && metadata.mode.trim().length > 0) {
    return metadata.mode;
  }
  return fallback;
}

function respondWithClarification(
  mode: "stream" | "batch",
  message: string,
  metadata: Record<string, unknown>,
  origin: string,
) {
  const enhancedMetadata = { ...metadata, needs_clarification: true };
  if (mode === "stream") {
    const encoder = new TextEncoder();
    const messageId = crypto.randomUUID();
    const chunks = [
      `event: message.delta\ndata: ${JSON.stringify({ delta: message, message_id: messageId })}\n\n`,
      `event: message.completed\ndata: ${JSON.stringify({
        message: { role: "assistant", content: message },
        metadata: enhancedMetadata,
        message_id: messageId,
        finish_reason: "stop",
      })}\n\n`,
      `event: done\ndata: ${JSON.stringify({ message_id: messageId })}\n\n`,
    ];
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        try {
          for (const part of chunks) controller.enqueue(encoder.encode(part));
        } finally {
          controller.close();
        }
      },
    });
    const headers = new Headers(createCorsHeaders(origin));
    headers.set("Content-Type", "text/event-stream");
    headers.set("Cache-Control", "no-cache");
    headers.set("Connection", "keep-alive");
    return new Response(stream, { status: 200, headers });
  }

  return new Response(JSON.stringify({ message: { role: "assistant", content: message }, metadata: enhancedMetadata }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...Object.fromEntries(createCorsHeaders(origin)) },
  });
}

function buildAgentMetadata(base: Record<string, unknown>, agentResponse: MiraResponse) {
  return {
    ...base,
    module_agent: agentResponse.metadata.agent,
    mira_response: agentResponse,
    ui_actions: agentResponse.ui_actions,
  };
}

function respondWithAgentResult(
  mode: "stream" | "batch",
  agentResponse: MiraResponse,
  baseMetadata: Record<string, unknown>,
  origin: string,
) {
  const enhancedMetadata = buildAgentMetadata(baseMetadata, agentResponse);
  const assistantContent = agentResponse.assistant_reply;

  if (mode === "stream") {
    const encoder = new TextEncoder();
    const messageId = crypto.randomUUID();
    const chunks = [
      `event: message.delta\ndata: ${JSON.stringify({ delta: assistantContent, message_id: messageId })}\n\n`,
      `event: message.completed\ndata: ${JSON.stringify({
        message: { role: "assistant", content: assistantContent },
        metadata: enhancedMetadata,
        message_id: messageId,
        finish_reason: "stop",
      })}\n\n`,
      `event: done\ndata: ${JSON.stringify({ message_id: messageId })}\n\n`,
    ];
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        try {
          for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
        } finally {
          controller.close();
        }
      },
    });
    const headers = new Headers(createCorsHeaders(origin));
    headers.set("Content-Type", "text/event-stream");
    headers.set("Cache-Control", "no-cache");
    headers.set("Connection", "keep-alive");
    return new Response(stream, { status: 200, headers });
  }

  return new Response(
    JSON.stringify({
      message: { role: "assistant", content: assistantContent },
      metadata: enhancedMetadata,
      ui_actions: agentResponse.ui_actions,
      mira_response: agentResponse,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json", ...Object.fromEntries(createCorsHeaders(origin)) },
    },
  );
}

async function handleSuggestMode(body: any, origin: string): Promise<Response> {
  const corsHeaders = Object.fromEntries(createCorsHeaders(origin));

  try {
    const context = sanitizeContext(body.context);
    if (!context) {
      return new Response(JSON.stringify({ error: "Context required for suggest mode", suggestions: [] }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Import agent registry
    const { agentRegistry } = await import("../_shared/services/agents/registry.ts");
    const agent = agentRegistry.getAgentByModule(context.module);

    if (!agent) {
      return new Response(JSON.stringify({ suggestions: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const suggestions = await agent.generateSuggestions(context);

    await logAgentEvent("mira.agent.suggest.success", {
      module: context.module,
      page: context.page,
      suggestionsCount: suggestions.length,
    });

    return new Response(JSON.stringify({ suggestions }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    await logAgentError("mira.agent.suggest.error", error);
    const message = error instanceof Error ? error.message : "Failed to generate suggestions";
    return new Response(JSON.stringify({ error: message, suggestions: [] }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
}

async function handleInsightsMode(body: any, origin: string): Promise<Response> {
  const corsHeaders = Object.fromEntries(createCorsHeaders(origin));

  try {
    const advisorId = extractAdvisorId(body.metadata) || extractAdvisorId(body.context);
    if (!advisorId) {
      return new Response(JSON.stringify({ error: "Advisor ID required for insights mode", insights: [] }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const context = sanitizeContext(body.context);

    // Import agent registry
    const { agentRegistry } = await import("../_shared/services/agents/registry.ts");

    // Gather insights from all agents
    const allAgents = agentRegistry.getAllAgents();
    const insightPromises = allAgents.map(agent =>
      agent.generateInsights(advisorId, context).catch(() => [])
    );

    const insightArrays = await Promise.all(insightPromises);
    const insights = insightArrays.flat();

    // Sort by priority (critical > important > info)
    const priorityOrder = { critical: 3, important: 2, info: 1 };
    insights.sort((a, b) => {
      const aPriority = priorityOrder[a.priority] || 0;
      const bPriority = priorityOrder[b.priority] || 0;
      return bPriority - aPriority;
    });

    await logAgentEvent("mira.agent.insights.success", {
      advisorId,
      insightsCount: insights.length,
      criticalCount: insights.filter(i => i.priority === "critical").length,
    });

    return new Response(JSON.stringify({ insights }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    await logAgentError("mira.agent.insights.error", error);
    const message = error instanceof Error ? error.message : "Failed to generate insights";
    return new Response(JSON.stringify({ error: message, insights: [] }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
}

async function handleRequest(req: Request): Promise<Response> {
  const origin = req.headers.get("origin") || "";

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: createCorsHeaders(origin) });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...Object.fromEntries(createCorsHeaders(origin)) },
    });
  }

  let requestContext: Record<string, unknown> = {};

  try {
    const body = await req.json();
    requestContext = {
      mode: body?.mode ?? "stream",
      source: body?.metadata?.source ?? "web",
    };

    if (body?.mode === "aial") {
      return await handleAialProxy(body, origin);
    }

    if (body?.mode === "health") {
      return await handleHealthCheck(origin);
    }

    if (body?.mode === "suggest") {
      return await handleSuggestMode(body, origin);
    }

    if (body?.mode === "insights") {
      return await handleInsightsMode(body, origin);
    }
    // get_client_secret is no longer supported (native agent)

    const validation = validateRequest(body);
    if (!validation.valid) {
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...Object.fromEntries(createCorsHeaders(origin)) },
      });
    }

    const chatRequest = sanitizeRequest(body);
    const metadata = (chatRequest.metadata ?? {}) as Record<string, unknown>;
    const queueKey = resolveQueueKey(metadata, body as Record<string, unknown>);
    const miraContext: MiraContext = chatRequest.context ?? deriveContextFromMetadata(metadata);
    const userMessage = lastUserMessageFromRequest(chatRequest);
    const prompts = buildRouterPrompts(userMessage, miraContext);

    let conversationId = extractConversationId(metadata);
    try {
      const conversationRecord = await ensureConversationRecord({
        conversationId,
        advisorId: extractAdvisorId(metadata) ?? null,
        advisorEmail: extractAdvisorEmail(metadata) ?? null,
        tenantId: extractTenantId(metadata) ?? null,
        channel: extractChannel(metadata) ?? null,
        status: resolveConversationStatus(metadata) ?? undefined,
        mode: resolveConversationMode(metadata, chatRequest.mode),
        context: miraContext,
        metadata,
      });
      conversationId = conversationRecord.id;
    } catch (error) {
      console.error("[agent-chat] ensureConversationRecord failed", error);
      if (!conversationId) {
        conversationId = crypto.randomUUID();
      }
    }
    if (conversationId) {
      metadata.conversation_id = conversationId;
      (metadata as Record<string, unknown>).conversationId = conversationId;
      requestContext = { ...requestContext, conversationId };
    }

    let classification;
    try {
      classification = await intentRouter.classifyIntent(userMessage, miraContext, {
        previousTopic: typeof metadata?.topic === "string" ? (metadata.topic as string) : undefined,
      });
    } catch (error) {
      await logAgentError("mira.agent.intent.error", error);
      classification = {
        topic: miraContext.module,
        subtopic: "general",
        intent: "ops__agent_passthrough",
        confidence: 0,
        candidateAgents: [],
        shouldSwitchTopic: false,
      };
    }
    const agentSelection = intentRouter.selectAgent(classification);
    const baseClassificationMetadata = {
      topic: classification.topic,
      subtopic: classification.subtopic,
      intent: classification.intent,
      confidence: Number(classification.confidence.toFixed(3)),
      candidateAgents: classification.candidateAgents,
      shouldSwitchTopic: classification.shouldSwitchTopic ?? false,
      confidenceTier: classification.confidenceTier ?? "low",
      conversationId,
    };
    if (conversationId) {
      (baseClassificationMetadata as Record<string, unknown>).conversation_id = conversationId;
    }
    (chatRequest.metadata as Record<string, unknown>).intent = classification.intent;
    (chatRequest.metadata as Record<string, unknown>).topic = classification.topic;
    (chatRequest.metadata as Record<string, unknown>).confidence = baseClassificationMetadata.confidence;
    const baseContext = {
      queueKey,
      mode: chatRequest.mode,
      messageCount: chatRequest.messages.length,
      persona: typeof metadata.persona === "string" ? (metadata.persona as string) : undefined,
      intent: baseClassificationMetadata.intent,
      topic: baseClassificationMetadata.topic,
    };
    requestContext = { ...requestContext, ...baseContext };

    await logAgentEvent("mira.agent.request.received", requestContext);
    await logAgentEvent("mira.agent.intent.classified", baseClassificationMetadata);
    await logAgentEvent("mira.agent.router.prompt", {
      systemLength: prompts.system.length,
      classificationLength: prompts.classification.length,
      topic: baseClassificationMetadata.topic,
    });

    const topicHistory = updateTopicHistory(
      Array.isArray(metadata.topic_history) ? (metadata.topic_history as string[]) : [],
      classification.topic,
    );
    metadata.topic_history = topicHistory;
    const previousTopic = topicHistory.length > 1 ? topicHistory[topicHistory.length - 2] : null;
    const transition = detectTopicSwitch(previousTopic, classification.topic, classification.confidence);
    const shouldConfirmTopic = shouldPromptForSwitch(transition);

    const decision = decideSkillFromClassification({
      classification,
      agentSelection,
      request: chatRequest,
      userMessage,
    });
    const classificationMetadata = { ...baseClassificationMetadata, agent: decision.next_agent };
    const clarificationNeeded = needsClarification(baseClassificationMetadata.confidenceTier) || shouldConfirmTopic;
    if (clarificationNeeded) {
      const clarificationMessage = buildClarificationMessage({
        intent: classification.intent,
        confidenceTier: baseClassificationMetadata.confidenceTier,
        transitionMessage:
          shouldConfirmTopic && transition.fromTopic
            ? generateTransitionMessage(transition.fromTopic, transition.toTopic)
            : undefined,
      });
      const intentLogResult = await logIntentClassification({
        conversationId,
        topic: classification.topic,
        subtopic: classification.subtopic,
        intent: classification.intent,
        confidence: classification.confidence,
        confidenceTier: classification.confidenceTier ?? "low",
        selectedAgent: decision.next_agent,
        selectedSkill: decision.next_skill,
        userMessage,
        metadata: {
          candidateAgents: classification.candidateAgents,
          shouldSwitchTopic: classification.shouldSwitchTopic ?? false,
          decisionReason: decision.reason,
          context: miraContext,
          promptLengths: { system: prompts.system.length, classification: prompts.classification.length },
          clarificationRequested: true,
        },
      });
      await logAgentEvent("mira.agent.intent.clarification_requested", {
        topic: classification.topic,
        intent: classification.intent,
        confidence: baseClassificationMetadata.confidence,
        reason: shouldConfirmTopic ? "topic_switch" : "low_confidence",
      });
      (baseClassificationMetadata as Record<string, unknown>).intentLogStatus = intentLogResult.status;
      if (intentLogResult.error) {
        (baseClassificationMetadata as Record<string, unknown>).intentLogError = intentLogResult.error;
      }
      return respondWithClarification(chatRequest.mode ?? "stream", clarificationMessage, baseClassificationMetadata, origin);
    }
    const intentLogResult = await logIntentClassification({
      conversationId,
      topic: classification.topic,
      subtopic: classification.subtopic,
      intent: classification.intent,
      confidence: classification.confidence,
      confidenceTier: classification.confidenceTier ?? "low",
      selectedAgent: decision.next_agent,
      selectedSkill: decision.next_skill,
      userMessage,
      metadata: {
        candidateAgents: classification.candidateAgents,
        shouldSwitchTopic: classification.shouldSwitchTopic ?? false,
        decisionReason: decision.reason,
        context: miraContext,
        promptLengths: { system: prompts.system.length, classification: prompts.classification.length },
      },
    });
    (classificationMetadata as Record<string, unknown>).intentLogStatus = intentLogResult.status;
    if (intentLogResult.error) {
      (classificationMetadata as Record<string, unknown>).intentLogError = intentLogResult.error;
    }
    await logAgentEvent("mira.agent.router.decision", {
      next_agent: decision.next_agent,
      next_skill: decision.next_skill,
      classified_agent: agentSelection.agentId,
      classified_intent: classification.intent,
      decision_reason: decision.reason,
    });
    classificationMetadata.agent = agentSelection.agentId;

    const journeyType = String((chatRequest.metadata as any)?.journey_type ?? (chatRequest.metadata as any)?.journeyType ?? "");
    const channel = String((chatRequest.metadata as any)?.channel ?? "");
    const tenantId = typeof (chatRequest.metadata as any)?.tenantId === "string" ? (chatRequest.metadata as any).tenantId : undefined;
    const advisorId =
      typeof (chatRequest.metadata as any)?.advisor?.id === "string" ? (chatRequest.metadata as any).advisor.id : null;
    const moduleForAgent = VALID_MODULES.has(classification.topic as MiraModule)
      ? (classification.topic as MiraModule)
      : miraContext.module;

    if (skills.hasModuleAgent(agentSelection.agentId, moduleForAgent)) {
      try {
        const agentResponse = await skills.executeModuleAgent({
          agentId: agentSelection.agentId,
          intent: classification.intent,
          context: { ...miraContext, module: moduleForAgent },
          userMessage,
        });

        void logSkillExecution({
          agent_name: agentSelection.agentId,
          skill_name: classification.intent,
          journey_type: journeyType || undefined,
          channel: channel || undefined,
          tenantId: tenantId ?? null,
          advisor_id: advisorId,
          intent: classification.intent,
          actions: Array.isArray(agentResponse.ui_actions) ? (agentResponse.ui_actions as any[]) : undefined,
        });

        return respondWithAgentResult(chatRequest.mode ?? "stream", agentResponse, classificationMetadata, origin);
      } catch (error) {
        await logAgentError("mira.agent.module.error", error, {
          agent: agentSelection.agentId,
          intent: classification.intent,
        });
      }
    }

    // Lazily load skills registry; only handle known skills, else fall back to LLM
    const isPassthrough = decision.next_skill === "ops__agent_passthrough";
    let handledBySkill = false;
    if (!isPassthrough) {
      try {
        if (skills.hasSkill(decision.next_skill)) {
          handledBySkill = true;
          if (chatRequest.mode === "stream") {
            const { content, actions } = await skills.executeSkill(decision.next_skill, { request: chatRequest });
            void logSkillExecution({
              agent_name: decision.next_agent,
              skill_name: decision.next_skill,
              journey_type: journeyType || undefined,
              channel: channel || undefined,
              tenantId: tenantId ?? null,
              advisor_id: advisorId,
              intent: typeof (chatRequest.metadata as any)?.intent === 'string' ? (chatRequest.metadata as any).intent : null,
              actions: Array.isArray(actions) ? actions as any[] : undefined,
            });

            const encoder = new TextEncoder();
            const messageId = crypto.randomUUID();
            const chunks: string[] = [];
            // Stream the assistant message text first
            chunks.push(`event: message.delta\ndata: ${JSON.stringify({ delta: content, message_id: messageId })}\n\n`);

            // If the skill suggested actions, surface a single tool call for confirmation
            function mapActionToTool(a: any): { name: string; args: Record<string, unknown> } | null {
              if (!a || typeof a !== 'object') return null;
              switch (a.type) {
                case 'navigate':
                  return { name: 'ops__navigate', args: { route: a.route, section: a.section, anchor: a.anchor } };
                case 'prefill_form':
                  return { name: 'fna__prefill_form', args: { form: a.form, fields: a.fields } };
                case 'update_field':
                  return { name: 'fna__update_field', args: { path: a.path, value: a.value } };
                case 'create_task':
                  return { name: 'ops__create_task', args: { customerId: a.customerId, title: a.title, due: a.due } };
                case 'log_note':
                  return { name: 'ops__log_note', args: { customerId: a.customerId, text: a.text } };
                default:
                  return null;
              }
            }

            // Prefer create_task > update_field > prefill_form > navigate > log_note
            function pickAction(acts: any[] | undefined) {
              if (!Array.isArray(acts) || acts.length === 0) return null;
              const priority = ['create_task', 'update_field', 'prefill_form', 'navigate', 'log_note'];
              for (const p of priority) {
                const cand = acts.find((a) => a && typeof a === 'object' && a.type === p);
                if (cand && mapActionToTool(cand)) return cand;
              }
              return acts.find((a) => !!mapActionToTool(a)) || null;
            }

            const picked = pickAction(actions as any[] | undefined);
            if (picked) {
              const tc = mapActionToTool(picked)!;
              const toolCallId = crypto.randomUUID();
              const toolCall = {
                id: toolCallId,
                type: 'function',
                function: { name: tc.name, arguments: JSON.stringify(tc.args ?? {}) },
              };
              await logAgentEvent("mira.agent.tool_call.created", { name: tc.name, messageId: messageId });
              chunks.push(`event: tool_call.created\ndata: ${JSON.stringify({ tool_call: toolCall, message_id: messageId })}\n\n`);
            }

            // Complete the message and close the stream
            chunks.push(`event: message.completed\ndata: ${JSON.stringify({ message: { role: 'assistant', content }, metadata: classificationMetadata, message_id: messageId, finish_reason: 'stop' })}\n\n`);
            chunks.push(`event: done\ndata: ${JSON.stringify({ message_id: messageId })}\n\n`);
            const stream = new ReadableStream<Uint8Array>({
              start(controller) {
                try {
                  for (const part of chunks) controller.enqueue(encoder.encode(part));
                } finally {
                  controller.close();
                }
              },
            });
            const headers = new Headers(createCorsHeaders(origin));
            headers.set("Content-Type", "text/event-stream");
            headers.set("Cache-Control", "no-cache");
            headers.set("Connection", "keep-alive");
            return new Response(stream, { status: 200, headers });
          } else {
            const { content, actions } = await skills.executeSkill(decision.next_skill, { request: chatRequest });
            void logSkillExecution({
              agent_name: decision.next_agent,
              skill_name: decision.next_skill,
              journey_type: journeyType || undefined,
              channel: channel || undefined,
              tenantId: tenantId ?? null,
              advisor_id: advisorId,
              intent: typeof (chatRequest.metadata as any)?.intent === 'string' ? (chatRequest.metadata as any).intent : null,
              actions: Array.isArray(actions) ? actions as any[] : undefined,
            });
            await logAgentEvent("mira.agent.chat.response", { ...requestContext, contentLength: content?.length ?? 0, adapterId: "local-skill" });
            return new Response(JSON.stringify({ message: { role: "assistant", content }, metadata: classificationMetadata }), {
              status: 200,
              headers: { "Content-Type": "application/json", ...Object.fromEntries(createCorsHeaders(origin)) },
            });
          }
        }
      } catch (_e) {
        // If skills import fails, fall back to LLM path
      }
    }

    // Fallback to LLM path if not handled by skills
    if (chatRequest.mode === "stream") {
      const { content } = await openAiChat(chatRequest.messages as any);
      const encoder = new TextEncoder();
      const messageId = crypto.randomUUID();
      const chunks = [
        `event: message.delta\ndata: ${JSON.stringify({ delta: content, message_id: messageId })}\n\n`,
        `event: message.completed\ndata: ${JSON.stringify({ message: { role: 'assistant', content }, metadata: classificationMetadata, message_id: messageId, finish_reason: 'stop' })}\n\n`,
        `event: done\ndata: ${JSON.stringify({ message_id: messageId })}\n\n`,
      ];
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          try {
            for (const part of chunks) controller.enqueue(encoder.encode(part));
          } finally {
            controller.close();
          }
        },
      });
      const headers = new Headers(createCorsHeaders(origin));
      headers.set("Content-Type", "text/event-stream");
      headers.set("Cache-Control", "no-cache");
      headers.set("Connection", "keep-alive");
      return new Response(stream, { status: 200, headers });
    } else {
      const { content } = await openAiChat(chatRequest.messages as any);
      await logAgentEvent("mira.agent.chat.response", { ...requestContext, contentLength: content?.length ?? 0 });
      return new Response(JSON.stringify({ message: { role: "assistant", content }, metadata: classificationMetadata }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...Object.fromEntries(createCorsHeaders(origin)) },
      });
    }
  } catch (error) {
    await logAgentError("mira.agent.request.error", error, requestContext);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    const statusCode = errorMessage.includes("Missing required env") ? 503 : 500;

    if (req.headers.get("accept")?.includes("text/event-stream")) {
      const encoder = new TextEncoder();
      const errorSSE = createErrorSSE(errorMessage, "internal_error");
      return new Response(encoder.encode(errorSSE), { status: 200, headers: createSSEHeaders(origin) });
    }

    return new Response(
      JSON.stringify({ error: { message: errorMessage, code: "internal_error" } }),
      { status: statusCode, headers: { "Content-Type": "application/json", ...Object.fromEntries(createCorsHeaders(origin)) } }
    );
  }
}

if (import.meta.main) {
  Deno.serve(handleRequest);
}

export default handleRequest;


