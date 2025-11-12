/**
 * OpenAI ChatKit session client
 * Handles ChatKit session creation, streaming, and batch responses for Agent workflows
 */

import { loadAgentConfig, type AgentConfig } from "./config.ts";
import { retryWithBackoff } from "./orchestrator.ts";
import { logAgentEvent, logAgentError } from "./logger.ts";
import type { AgentChatRequest, AgentEvent, ChatMessage } from "./types.ts";

interface ChatKitSession {
  id?: string;
  session_id?: string;
  user_id?: string;
  client_secret?: string;
}

interface ChatKitErrorPayload {
  error?: {
    message?: string;
    code?: string | number;
    type?: string;
  };
  message?: string;
}

export class AgentClient {
  private config: AgentConfig;

  constructor(config?: AgentConfig) {
    this.config = config || loadAgentConfig();
  }

  /**
   * Stream chat responses through ChatKit
   */
  async *streamChat(request: AgentChatRequest): AsyncGenerator<AgentEvent> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
    const context = {
      mode: request.mode ?? "stream",
      messageCount: request.messages.length,
      requestId: (request.metadata as Record<string, unknown> | undefined)?.requestId ?? null,
      persona: (request.metadata as Record<string, unknown> | undefined)?.persona ?? null,
    };

    await logAgentEvent("mira.agent.chat.stream.start", context, "debug");

    try {
      const session = await this.createSession(controller.signal);
      const messageContent = this.extractLatestUserMessage(request);
      const streamResponse = await this.invokeChatKit(session, messageContent, true, controller.signal);

      clearTimeout(timeoutId);

      if (!streamResponse.body) {
        throw new Error("Stream response body is empty");
      }

      yield* this.parseStream(streamResponse.body);
      await logAgentEvent("mira.agent.chat.stream.finish", context);
    } catch (error) {
      await logAgentError("mira.agent.chat.stream.error", error, context);

      const message = error instanceof Error ? error.message : "Unknown error";
      yield {
        type: "error",
        data: {
          error: {
            message,
            code: "unknown",
          },
        },
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Non-streaming chat invocation
   */
  async chat(request: AgentChatRequest): Promise<ChatMessage> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
    const context = {
      mode: request.mode ?? "chat",
      messageCount: request.messages.length,
      requestId: (request.metadata as Record<string, unknown> | undefined)?.requestId ?? null,
      persona: (request.metadata as Record<string, unknown> | undefined)?.persona ?? null,
    };

    await logAgentEvent("mira.agent.chat.start", context, "debug");

    try {
      const session = await this.createSession(controller.signal);
      const messageContent = this.extractLatestUserMessage(request);
      const response = await this.invokeChatKit(session, messageContent, false, controller.signal);

      clearTimeout(timeoutId);

      const data = await response.json();
      const output = data.response?.output_text ?? data.message ?? data.content ?? "No response";
      await logAgentEvent("mira.agent.chat.finish", { ...context, contentLength: output?.length ?? 0 });

      return {
        role: "assistant",
        content: output,
      };
    } catch (error) {
      await logAgentError("mira.agent.chat.error", error, context);
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Create a ChatKit session for the workflow
   */
  async createSession(signal: AbortSignal): Promise<ChatKitSession> {
    const url = `${this.config.baseUrl}/chatkit/sessions`;
    const session = await retryWithBackoff(
      async () => {
        const response = await fetch(url, {
          method: "POST",
          headers: this.buildPlatformHeaders(),
          body: JSON.stringify({
            workflow: { id: this.config.workflowId },
            user: crypto.randomUUID(),
            chatkit_configuration: {
              file_upload: { enabled: false },
            },
          }),
          signal,
        });

        if (!response.ok) {
          const errorPayload = await this.parseErrorPayload(response);
          throw new Error(`Failed to create ChatKit session: ${errorPayload.message}`);
        }

        return response.json() as Promise<ChatKitSession>;
      },
      {
        attempts: this.config.maxRetries,
        operation: "agent.chatkit.create_session",
        context: { workflowId: this.config.workflowId },
      },
    );

    if (!session.client_secret) {
      throw new Error("ChatKit session did not return a client_secret");
    }

    await logAgentEvent("mira.agent.chatkit.session.created", {
      workflowId: this.config.workflowId,
      sessionId: session.session_id ?? session.id ?? null,
    });

    return session;
  }

  /**
   * Invoke ChatKit chat endpoint
   */
  private async invokeChatKit(
    session: ChatKitSession,
    message: string,
    stream: boolean,
    signal: AbortSignal,
  ): Promise<Response> {
    // ChatKit chat endpoint is NOT under /v1, strip it if present
    const base = this.config.baseUrl.endsWith('/v1') ? this.config.baseUrl.slice(0, -3) : this.config.baseUrl;
    const chatUrl = `${base}/chatkit/chat`;

    const body = {
      stream,
      message,
      session_id: session.session_id ?? session.id,
    };

    const headers = this.buildClientHeaders(session.client_secret as string, stream);
    const response = await retryWithBackoff(
      async () => {
        const res = await fetch(chatUrl, {
          method: "POST",
          headers,
          body: JSON.stringify(body),
          signal,
        });

        if (!res.ok) {
          const errorPayload = await this.parseErrorPayload(res);
          throw new Error(errorPayload.message);
        }

        return res;
      },
      {
        attempts: this.config.maxRetries,
        operation: stream ? "agent.chatkit.invoke.stream" : "agent.chatkit.invoke.chat",
        context: { workflowId: this.config.workflowId },
      },
    );

    await logAgentEvent("mira.agent.chatkit.invoke.success", {
      workflowId: this.config.workflowId,
      stream,
    });

    return response;
  }

  /**
   * Extract latest user message content
   */
  private extractLatestUserMessage(request: AgentChatRequest): string {
    const lastMessage = [...request.messages].reverse().find((msg) => msg.role === "user");
    if (!lastMessage) {
      throw new Error("Chat request must include at least one user message");
    }

    if (typeof lastMessage.content === "string") {
      return lastMessage.content;
    }

    return JSON.stringify(lastMessage.content);
  }

  /**
   * Parse ChatKit SSE stream and convert to AgentEvent
   */
  private async *parseStream(body: ReadableStream<Uint8Array>): AsyncGenerator<AgentEvent> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          yield { type: "done", data: {} };
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const rawLine of lines) {
          const line = rawLine.trim();
          if (!line || line.startsWith(":")) {
            continue;
          }

          if (!line.startsWith("data: ")) {
            continue;
          }

          const payload = line.slice(6);
          if (payload === "[DONE]") {
            yield { type: "done", data: {} };
            continue;
          }

          try {
            const parsed = JSON.parse(payload);
            const event = this.mapChatKitEvent(parsed);
            if (event) {
              yield event;
            }
          } catch (error) {
            console.warn("[Agent Client] Failed to parse SSE payload:", payload, error);
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Map ChatKit streaming events to AgentEvent
   */
  private mapChatKitEvent(payload: any): AgentEvent | null {
    const type = payload?.type ?? payload?.event;

    switch (type) {
      case "response.delta":
      case "content_block.delta":
      case "message.delta": {
        const delta =
          payload.delta?.output_text ??
          payload.delta?.text ??
          payload.delta?.content?.[0]?.text ??
          payload.text ??
          "";

        return {
          type: "message.delta",
          data: { delta },
        };
      }

      case "response.completed":
      case "response.finish":
      case "message.completed":
      case "content_block.stop": {
        const content =
          payload.response?.output_text ??
          payload.message?.content ??
          payload.content ??
          "";

        return {
          type: "message.completed",
          data: {
            message: {
              role: "assistant",
              content,
            },
            finish_reason: payload.finish_reason ?? "stop",
            message_id: payload.message_id,
          },
        };
      }

      case "error": {
        return {
          type: "error",
          data: {
            error: {
              message: payload.error?.message ?? payload.message ?? "Unknown error",
              code: payload.error?.code,
              type: payload.error?.type,
            },
          },
        };
      }

      default:
        return null;
    }
  }

  /**
   * Convert OpenAI error responses into readable messages
   */
  private async parseErrorPayload(response: Response): Promise<{ message: string }> {
    let payload: ChatKitErrorPayload | null = null;
    try {
      payload = await response.json();
    } catch {
      // ignore JSON parse failure
    }

    const message =
      payload?.error?.message ??
      payload?.message ??
      `HTTP ${response.status}: ${response.statusText}`;

    return { message };
  }

  /**
   * Headers for platform (management) calls
   */
  private buildPlatformHeaders(): HeadersInit {
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${this.config.apiKey}`,
      "OpenAI-Beta": "chatkit_beta=v1",
    };
  }

  /**
   * Headers for client secret chat calls
   */
  private buildClientHeaders(clientSecret: string, streaming: boolean): HeadersInit {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${clientSecret}`,
      "OpenAI-Beta": "chatkit_beta=v1",
    };

    if (streaming) {
      headers.Accept = "text/event-stream";
    }

    return headers;
  }
}

/**
 * Factory helper
 */
export function createAgentClient(config?: AgentConfig): AgentClient {
  return new AgentClient(config);
}



