import type {
  AgentAdapter,
  AgentChatRequest,
  AgentChatResult,
  AgentEvent,
  ChatMessage,
} from "../types.ts";
import { readEnv, readEnvNumber } from "../../../utils/env.ts";

interface AnthropicAdapterOptions {
  id?: string;
  apiKey?: string | null;
  model?: string | null;
  baseUrl?: string | null;
  temperature?: number | null;
  maxTokens?: number | null;
  systemPrompt?: string | null;
  version?: string | null;
}

const DEFAULT_MODEL = "claude-3-5-sonnet-20241022";
const DEFAULT_BASE_URL = "https://api.anthropic.com/v1";
const DEFAULT_TEMPERATURE = 0.2;
const DEFAULT_MAX_TOKENS = 512;
const DEFAULT_VERSION = "2023-06-01";

function normalizeContent(content: ChatMessage["content"]): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part === "string" ? part : JSON.stringify(part)))
      .join("\n");
  }
  if (typeof content === "object" && content !== null) {
    return JSON.stringify(content);
  }
  return String(content ?? "");
}

function toAnthropicMessages(request: AgentChatRequest) {
  const messages = [];
  for (const message of request.messages) {
    if (message.role === "system") {
      continue;
    }
    const role = message.role === "assistant" ? "assistant" : "user";
    messages.push({
      role,
      content: [
        {
          type: "text",
          text: normalizeContent(message.content),
        },
      ],
    });
  }
  return messages;
}

function extractSystemPrompt(request: AgentChatRequest, fallback?: string | null) {
  const systemMessages = request.messages.filter((msg) => msg.role === "system");
  if (systemMessages.length > 0) {
    return systemMessages.map((msg) => normalizeContent(msg.content)).join("\n\n");
  }
  return fallback ?? undefined;
}

function buildChatMessage(response: any): ChatMessage {
  const content = Array.isArray(response?.content)
    ? response.content
        .filter((part) => part?.type === "text" && typeof part.text === "string")
        .map((part) => part.text)
        .join("")
    : typeof response?.content === "string"
      ? response.content
      : "";
  return {
    role: "assistant",
    content,
  };
}

function randomId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `msg_${Math.random().toString(36).slice(2, 10)}`;
}

class AnthropicAdapter implements AgentAdapter {
  id: string;
  name: string;
  apiKey: string;
  model: string;
  baseUrl: string;
  temperature: number;
  maxTokens: number;
  version: string;
  systemPrompt?: string;

  constructor(options: Required<AnthropicAdapterOptions>) {
    this.id = options.id ?? "anthropic";
    this.name = "Anthropic";
    this.apiKey = options.apiKey!;
    this.model = options.model ?? DEFAULT_MODEL;
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "");
    this.temperature = typeof options.temperature === "number" ? options.temperature : DEFAULT_TEMPERATURE;
    this.maxTokens = typeof options.maxTokens === "number" ? options.maxTokens : DEFAULT_MAX_TOKENS;
    this.version = options.version ?? DEFAULT_VERSION;
    this.systemPrompt = options.systemPrompt ?? undefined;
  }

  async chat(request: AgentChatRequest): Promise<AgentChatResult> {
    const temperature = typeof request.temperature === "number" ? request.temperature : this.temperature;
    const maxTokens = typeof request.max_tokens === "number" ? request.max_tokens : this.maxTokens;
    const system = extractSystemPrompt(request, this.systemPrompt);
    const response = await fetch(`${this.baseUrl}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": this.version,
      },
      body: JSON.stringify({
        model: this.model,
        temperature,
        max_tokens: maxTokens,
        messages: toAnthropicMessages(request),
        ...(system ? { system } : {}),
      }),
    });

    if (!response.ok) {
      const errorPayload = await safeJson(response);
      throw new Error(
        `Anthropic request failed (${response.status})${
          errorPayload?.error?.message ? `: ${errorPayload.error.message}` : ""
        }`
      );
    }

    const data = await response.json();
    const message = buildChatMessage(data);
    return {
      message,
      toolCalls: [],
      raw: data,
      tokensUsed: typeof data?.usage?.output_tokens === "number" ? data.usage.output_tokens : undefined,
    };
  }

  async *streamChat(request: AgentChatRequest): AsyncGenerator<AgentEvent> {
    const result = await this.chat(request);
    const messageId = randomId();
    const content = typeof result.message.content === "string" ? result.message.content : JSON.stringify(result.message.content);

    yield {
      type: "message.delta",
      data: {
        delta: content,
        message_id: messageId,
      },
    };

    yield {
      type: "message.completed",
      data: {
        message: result.message,
        message_id: messageId,
        finish_reason: "stop",
      },
    };

    yield {
      type: "done",
      data: {
        message_id: messageId,
      },
    };
  }

  async health(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        method: "GET",
        headers: {
          "x-api-key": this.apiKey,
          "anthropic-version": this.version,
        },
      });
      return response.ok;
    } catch (error) {
      console.warn("[Anthropic Adapter] Health check failed", error);
      return false;
    }
  }
}

async function safeJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export function createAnthropicAdapter(options: AnthropicAdapterOptions = {}): AgentAdapter | null {
  const apiKey = options.apiKey ?? readEnv("ANTHROPIC_API_KEY");
  if (!apiKey) {
    return null;
  }

  return new AnthropicAdapter({
    id: options.id ?? "anthropic",
    apiKey,
    baseUrl: options.baseUrl ?? readEnv("ANTHROPIC_BASE_URL") ?? DEFAULT_BASE_URL,
    model: options.model ?? readEnv("ANTHROPIC_MODEL") ?? DEFAULT_MODEL,
    temperature: options.temperature ?? readEnvNumber("ANTHROPIC_TEMPERATURE") ?? DEFAULT_TEMPERATURE,
    maxTokens: options.maxTokens ?? readEnvNumber("ANTHROPIC_MAX_TOKENS") ?? DEFAULT_MAX_TOKENS,
    systemPrompt: options.systemPrompt ?? readEnv("ANTHROPIC_SYSTEM_PROMPT"),
    version: options.version ?? readEnv("ANTHROPIC_VERSION") ?? DEFAULT_VERSION,
  });
}
