/**
 * Agent API client for frontend
 * Handles streaming SSE communication with backend agent-chat endpoint
 */

import supabase from "@/admin/api/supabaseClient.js";

/**
 * Agent event types
 * @typedef {'message.delta' | 'message.completed' | 'tool_call.created' | 'tool_call.delta' | 'tool_call.completed' | 'error' | 'done'} AgentEventType
 */

/**
 * Agent event
 * @typedef {Object} AgentEvent
 * @property {AgentEventType} type
 * @property {any} data
 */

/**
 * Chat message
 * @typedef {Object} ChatMessage
 * @property {'user' | 'assistant' | 'tool' | 'system'} role
 * @property {string | object} content
 * @property {string} [name]
 * @property {string} [tool_call_id]
 */

/**
 * Agent client configuration
 */
const DEFAULT_CONFIG = {
  baseUrl: import.meta.env.VITE_AGENT_API_URL || "/api",
  timeout: 30000,
  maxRetries: 3,
};

/**
 * Build headers for Supabase Edge Function requests
 * Includes Supabase session token when available
 */
async function buildAuthHeaders(options = {}) {
  const { acceptSSE = false } = options;

  const headers = {
    "Content-Type": "application/json",
  };

  if (acceptSSE) {
    headers.Accept = "text/event-stream";
  }

  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (anonKey) {
    headers.apikey = anonKey;
  }

  try {
    const { data } = await supabase.auth.getSession();
    const accessToken = data.session?.access_token;

    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    } else if (anonKey) {
      headers.Authorization = `Bearer ${anonKey}`;
    }
  } catch {
    if (anonKey && !headers.Authorization) {
      headers.Authorization = `Bearer ${anonKey}`;
    }
  }

  return headers;
}

/**
 * Parse SSE stream from EventSource
 * @param {ReadableStream} stream
 * @param {(event: AgentEvent) => void} onEvent
 * @param {(error: Error) => void} onError
 * @returns {Promise<void>}
 */
async function parseSSEStream(stream, onEvent, onError) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        onEvent({ type: "done", data: {} });
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      let currentEvent = null;
      let currentData = "";

      for (const line of lines) {
        const trimmed = line.trim();

        if (!trimmed) {
          // Empty line signals end of event
          if (currentEvent && currentData) {
            try {
              const parsed = JSON.parse(currentData);
              onEvent({ type: currentEvent, data: parsed });
            } catch (e) {
              console.warn("[Agent Client] Failed to parse SSE data:", currentData, e);
            }
          }
          currentEvent = null;
          currentData = "";
          continue;
        }

        if (trimmed.startsWith("event: ")) {
          currentEvent = trimmed.slice(7);
        } else if (trimmed.startsWith("data: ")) {
          currentData = trimmed.slice(6);
        }
      }
    }
  } catch (error) {
    onError(error);
  } finally {
    reader.releaseLock();
  }
}

/**
 * Stream chat messages to Agent
 * @param {ChatMessage[]} messages
 * @param {Object} options
 * @param {(event: AgentEvent) => void} options.onEvent
 * @param {(error: Error) => void} options.onError
 * @param {AbortSignal} [options.signal]
 * @returns {Promise<void>}
 */
export async function streamAgentChat(messages, { onEvent, onError, signal, metadata, context } = {}) {
  const config = DEFAULT_CONFIG;
  const url = `${config.baseUrl}/agent-chat`;

  try {
    const headers = await buildAuthHeaders({ acceptSSE: true });

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        messages,
        mode: "stream",
        metadata,
        context,
      }),
      signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: { message: `HTTP ${response.status}` },
      }));
      throw new Error(errorData.error?.message || "Agent request failed");
    }

    if (!response.body) {
      throw new Error("No response body");
    }

    await parseSSEStream(response.body, onEvent, onError);
  } catch (error) {
    if (error.name !== "AbortError") {
      onError(error);
    }
  }
}

/**
 * Send chat message (batch mode, non-streaming)
 * Returns assistant message plus metadata + UI actions.
 * @param {ChatMessage[]} messages
 * @param {AbortSignal} [signal]
 * @returns {Promise<{ message: ChatMessage; metadata?: any; ui_actions?: any[]; mira_response?: any }>}
 */
export async function sendAgentChat(messages, options) {
  const config = DEFAULT_CONFIG;
  const url = `${config.baseUrl}/agent-chat`;

  let signal;
  let context;
  if (options && typeof options === "object" && ("signal" in options || "context" in options)) {
    signal = options.signal;
    context = options.context;
  } else {
    signal = options;
  }

  const headers = await buildAuthHeaders();

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      messages,
      mode: "batch",
      context,
    }),
    signal,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      error: { message: `HTTP ${response.status}` },
    }));
    throw new Error(errorData.error?.message || "Agent request failed");
  }

  const data = await response.json();
  const uiActions =
    (Array.isArray(data.ui_actions) && data.ui_actions) ||
    (Array.isArray(data.metadata?.ui_actions) && data.metadata.ui_actions) ||
    (Array.isArray(data.mira_response?.ui_actions) && data.mira_response.ui_actions) ||
    [];

  return {
    message: data.message,
    metadata: data.metadata,
    mira_response: data.mira_response,
    ui_actions: uiActions,
  };
}

/**
 * Helper for JSON agent-chat requests (non-streaming)
 * @param {object} payload
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<any>}
 */
export async function requestAgentJson(payload, options = {}) {
  const config = DEFAULT_CONFIG;
  const url = `${config.baseUrl}/agent-chat`;
  const headers = await buildAuthHeaders();

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
    signal: options.signal,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      error: { message: `HTTP ${response.status}` },
    }));
    throw new Error(errorData.error?.message || "Agent request failed");
  }

  return response.json();
}

/**
 * Build tool result message
 * @param {string} toolCallId
 * @param {string} result
 * @returns {ChatMessage}
 */
export function createToolResultMessage(toolCallId, result) {
  return {
    role: "tool",
    tool_call_id: toolCallId,
    content: result,
  };
}

/**
 * Create user message
 * @param {string} content
 * @returns {ChatMessage}
 */
export function createUserMessage(content) {
  return {
    role: "user",
    content,
  };
}

export default {
  streamAgentChat,
  sendAgentChat,
  createToolResultMessage,
  createUserMessage,
  requestAgentJson,
};



