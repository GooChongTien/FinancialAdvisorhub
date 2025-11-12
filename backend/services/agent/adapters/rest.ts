import type {
  AgentAdapter,
  AgentChatRequest,
  AgentChatResult,
  AgentEvent,
  ChatMessage,
  ToolCall,
} from "../types.ts";
import { readEnv } from "../../../utils/env.ts";

interface RestAdapterOptions {
  id?: string;
  baseUrl?: string | null;
  apiKey?: string | null;
  healthPath?: string | null;
  chatPath?: string | null;
  secretPath?: string | null;
}

const DEFAULT_CHAT_PATH = "/agent/chat";
const DEFAULT_HEALTH_PATH = "/agent/health";
const DEFAULT_SECRET_PATH = "/agent/client-secret";

function sanitizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/$/, "");
}

function normalizeToolCalls(toolCalls: ToolCall[] | null | undefined): ToolCall[] {
  if (!toolCalls?.length) return [];
  return toolCalls;
}

class RestAdapter implements AgentAdapter {
  id: string;
  name: string;
  baseUrl: string;
  apiKey?: string;
  chatPath: string;
  healthPath: string;
  secretPath: string;

  constructor(options: Required<RestAdapterOptions>) {
    this.id = options.id ?? "rest";
    this.name = "CustomREST";
    this.baseUrl = sanitizeBaseUrl(options.baseUrl ?? "");
    this.apiKey = options.apiKey ?? undefined;
    this.chatPath = options.chatPath ?? DEFAULT_CHAT_PATH;
    this.healthPath = options.healthPath ?? DEFAULT_HEALTH_PATH;
    this.secretPath = options.secretPath ?? DEFAULT_SECRET_PATH;
  }

  private buildHeaders() {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }
    return headers;
  }

  async chat(request: AgentChatRequest): Promise<AgentChatResult> {
    const response = await fetch(`${this.baseUrl}${this.chatPath}`, {
      method: "POST",
      headers: this.buildHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`REST adapter returned ${response.status}: ${body.slice(0, 200)}`);
    }

    const data = await response.json();
    const message: ChatMessage = data.message ?? {
      role: "assistant",
      content: "",
    };
    const toolCalls = normalizeToolCalls(data.toolCalls);
    return {
      message,
      toolCalls,
      raw: data,
      tokensUsed: typeof data.tokensUsed === "number" ? data.tokensUsed : undefined,
    };
  }

  async *streamChat(request: AgentChatRequest): AsyncGenerator<AgentEvent> {
    const result = await this.chat(request);
    yield {
      type: "message.delta",
      data: {
        delta: typeof result.message.content === "string" ? result.message.content : JSON.stringify(result.message.content),
        message_id: undefined,
      },
    };
    yield {
      type: "done",
      data: {},
    };
  }

  async getClientSecret(): Promise<string> {
    const response = await fetch(`${this.baseUrl}${this.secretPath}`, {
      method: "GET",
      headers: this.buildHeaders(),
    });
    if (!response.ok) {
      throw new Error(`REST adapter secret endpoint returned ${response.status}`);
    }
    const json = await response.json();
    if (!json?.secret) {
      throw new Error("Secret payload missing `secret` field");
    }
    return json.secret;
  }

  async health(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}${this.healthPath}`, {
        method: "GET",
        headers: this.buildHeaders(),
      });
      return response.ok;
    } catch (error) {
      console.warn("[REST Adapter] Health check failed", error);
      return false;
    }
  }
}

export function createRestAdapter(options: RestAdapterOptions = {}): AgentAdapter | null {
  const baseUrl = options.baseUrl ?? readEnv("AGENT_REST_BASE_URL");
  if (!baseUrl) {
    return null;
  }
  return new RestAdapter({
    id: options.id ?? "rest",
    baseUrl,
    apiKey: options.apiKey ?? readEnv("AGENT_REST_API_KEY"),
    chatPath: options.chatPath ?? readEnv("AGENT_REST_CHAT_PATH") ?? DEFAULT_CHAT_PATH,
    healthPath: options.healthPath ?? readEnv("AGENT_REST_HEALTH_PATH") ?? DEFAULT_HEALTH_PATH,
    secretPath: options.secretPath ?? readEnv("AGENT_REST_SECRET_PATH") ?? DEFAULT_SECRET_PATH,
  });
}
