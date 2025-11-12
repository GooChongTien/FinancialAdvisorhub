import type {
  AgentAdapter,
  AgentChatRequest,
  AgentChatResult,
  AgentEvent,
  ChatMessage,
  ToolCall,
} from "../types.ts";
import { readEnv, readEnvNumber } from "../../../utils/env.ts";

interface OpenAiAdapterOptions {
  id?: string;
  apiKey?: string | null;
  baseUrl?: string | null;
  model?: string | null;
  temperature?: number | null;
  maxTokens?: number | null;
  systemPrompt?: string | null;
}

interface OpenAiChatMessage {
  role: string;
  content: string;
}

interface OpenAiToolCall {
  id?: string;
  type?: string;
  function?: {
    name?: string;
    arguments?: string;
  };
}

const DEFAULT_MODEL = "gpt-4o-mini";
const DEFAULT_BASE_URL = "https://api.openai.com/v1";
const DEFAULT_TEMPERATURE = 0.2;
const DEFAULT_MAX_TOKENS = 512;

function normalizeContent(content: ChatMessage["content"]): string {
  if (typeof content === "string") {
    return content;
  }
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

function toOpenAiMessages(request: AgentChatRequest): OpenAiChatMessage[] {
  return request.messages.map((msg) => ({
    role: msg.role,
    content: normalizeContent(msg.content),
  }));
}

function mapToolCalls(toolCalls: OpenAiToolCall[] | undefined): ToolCall[] {
  if (!toolCalls?.length) {
    return [];
  }
  return toolCalls
    .filter((call) => call?.function?.name)
    .map((call) => ({
      id: call.id ?? crypto.randomUUID(),
      type: "function",
      function: {
        name: call.function?.name ?? "unknown",
        arguments: call.function?.arguments ?? "{}",
      },
    }));
}

function buildChatMessage(choiceMessage: { role?: string; content?: any }): ChatMessage {
  const role = choiceMessage?.role === "assistant" ? "assistant" : "assistant";
  let content: string;
  const rawContent = choiceMessage?.content;
  if (typeof rawContent === "string") {
    content = rawContent;
  } else if (Array.isArray(rawContent)) {
    content = rawContent
      .map((part) => (typeof part === "string" ? part : part?.text ?? JSON.stringify(part)))
      .join("");
  } else if (typeof rawContent === "object" && rawContent !== null) {
    content = rawContent?.text ?? JSON.stringify(rawContent);
  } else {
    content = "";
  }
  return { role, content };
}

function getGlobalRandomId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `msg_${Math.random().toString(36).slice(2, 10)}`;
}

class OpenAiAdapter implements AgentAdapter {
  id: string;
  name: string;
  model: string;
  baseUrl: string;
  apiKey: string;
  temperature: number;
  maxTokens: number;
  systemPrompt?: string;

  constructor(options: Required<OpenAiAdapterOptions>) {
    this.id = options.id ?? "openai";
    this.name = "OpenAI";
    this.apiKey = options.apiKey!;
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "");
    this.model = options.model ?? DEFAULT_MODEL;
    this.temperature = typeof options.temperature === "number" ? options.temperature : DEFAULT_TEMPERATURE;
    this.maxTokens = typeof options.maxTokens === "number" ? options.maxTokens : DEFAULT_MAX_TOKENS;
    this.systemPrompt = options.systemPrompt ?? undefined;
  }

  async chat(request: AgentChatRequest): Promise<AgentChatResult> {
    const messages = toOpenAiMessages(request);
    if (this.systemPrompt) {
      messages.unshift({ role: "system", content: this.systemPrompt });
    }
    const temperature = typeof request.temperature === "number" ? request.temperature : this.temperature;
    const maxTokens = typeof request.max_tokens === "number" ? request.max_tokens : this.maxTokens;

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        temperature,
        max_tokens: maxTokens,
        messages,
      }),
    });

    if (!response.ok) {
      const errorBody = await safeJson(response);
      throw new Error(
        `OpenAI request failed (${response.status})${
          errorBody?.error?.message ? `: ${errorBody.error.message}` : ""
        }`
      );
    }

    const data = await response.json();
    const choice = data.choices?.[0];
    const message = buildChatMessage(choice?.message ?? {});
    const toolCalls = mapToolCalls(choice?.message?.tool_calls);

    return {
      message,
      toolCalls,
      raw: data,
      tokensUsed: typeof data?.usage?.total_tokens === "number" ? data.usage.total_tokens : null,
    };
  }

  async *streamChat(request: AgentChatRequest): AsyncGenerator<AgentEvent> {
    const result = await this.chat(request);
    const messageId = getGlobalRandomId();
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
      const response = await fetch(`${this.baseUrl}/models/${this.model}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });
      return response.ok;
    } catch (error) {
      console.warn("[OpenAI Adapter] Health check failed", error);
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

function resolveOpenAiApiKey(explicit?: string | null): string | null {
  if (explicit) return explicit;
  return readEnv("OPENAI_API_KEY");
}

export function createOpenAiAdapter(options: OpenAiAdapterOptions = {}): AgentAdapter | null {
  const apiKey = resolveOpenAiApiKey(options.apiKey);
  if (!apiKey) {
    return null;
  }

  return new OpenAiAdapter({
    id: options.id ?? "openai",
    apiKey,
    baseUrl: options.baseUrl ?? readEnv("OPENAI_BASE_URL") ?? DEFAULT_BASE_URL,
    model: options.model ?? readEnv("OPENAI_MODEL") ?? DEFAULT_MODEL,
    temperature: options.temperature ?? readEnvNumber("OPENAI_TEMPERATURE") ?? DEFAULT_TEMPERATURE,
    maxTokens: options.maxTokens ?? readEnvNumber("OPENAI_MAX_TOKENS") ?? DEFAULT_MAX_TOKENS,
    systemPrompt: options.systemPrompt ?? readEnv("OPENAI_SYSTEM_PROMPT"),
  });
}
