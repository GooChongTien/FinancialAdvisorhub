import type { TenantModelConfig } from "../config/model-config.ts";

/**
 * TypeScript types for OpenAI Agent messages, events, and responses
 * Based on OpenAI Agent Builder API specification
 */

// Message roles
export type MessageRole = "user" | "assistant" | "tool" | "system";

// Base message structure
export interface ChatMessage {
  role: MessageRole;
  content: string | object;
  name?: string;
  tool_call_id?: string;
}

// Tool call structure
export interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string; // JSON string
  };
}

// Tool result for round-trip
export interface ToolResult {
  tool_call_id: string;
  role: "tool";
  content: string;
}

export type AgentRequestMode = "stream" | "batch" | "suggest" | "insights";

// Chat request from frontend
export interface AgentChatRequest {
  messages: ChatMessage[];
  mode: AgentRequestMode;
  metadata?: Record<string, unknown>;
  temperature?: number;
  max_tokens?: number;
}

export interface AgentChatResult {
  message: ChatMessage;
  toolCalls: ToolCall[];
  raw?: unknown;
  tokensUsed?: number | null;
}

// Agent event types (streaming)
export type AgentEventType =
  | "message.delta"
  | "message.completed"
  | "tool_call.created"
  | "tool_call.delta"
  | "tool_call.completed"
  | "error"
  | "done";

// Agent event structure
export interface AgentEvent {
  type: AgentEventType;
  data: AgentEventData;
}

// Event data variants
export type AgentEventData =
  | MessageDeltaData
  | MessageCompletedData
  | ToolCallCreatedData
  | ToolCallDeltaData
  | ToolCallCompletedData
  | ErrorData
  | DoneData;

// Message delta (streaming chunk)
export interface MessageDeltaData {
  delta: string;
  message_id?: string;
}

// Message completed
export interface MessageCompletedData {
  message: ChatMessage;
  message_id: string;
  finish_reason: "stop" | "length" | "tool_calls" | "content_filter";
}

// Tool call created
export interface ToolCallCreatedData {
  tool_call: ToolCall;
}

// Tool call delta (streaming)
export interface ToolCallDeltaData {
  tool_call_id: string;
  delta: {
    arguments?: string;
  };
}

// Tool call completed
export interface ToolCallCompletedData {
  tool_call: ToolCall;
}

// Error event
export interface ErrorData {
  error: {
    message: string;
    code?: string;
    type?: string;
  };
}

// Done event (stream end)
export interface DoneData {
  message_id?: string;
}

// OpenAI API error response
export interface OpenAIError {
  error: {
    message: string;
    type: string;
    code?: string;
    param?: string;
  };
}

// SSE event format
export interface SSEEvent {
  event: string;
  data: string;
  id?: string;
}

export interface AgentLogger {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

export interface AgentAdapter {
  id: string;
  name?: string;
  chat(request: AgentChatRequest, context?: AdapterRequestContext): Promise<AgentChatResult>;
  streamChat(request: AgentChatRequest, context?: AdapterRequestContext): AsyncGenerator<AgentEvent>;
  getClientSecret?(): Promise<string>;
  health?(): Promise<boolean>;
}

export interface AdapterRequestContext {
  requestId?: string;
  signal?: AbortSignal;
}

export interface AgentClient {
  chat(request: AgentChatRequest, context?: AdapterRequestContext): Promise<AgentChatResult>;
  streamChat(request: AgentChatRequest, context?: AdapterRequestContext): AsyncGenerator<AgentEvent>;
  getClientSecret(): Promise<string>;
  health(): Promise<boolean>;
  getAdapterInfo(): { id: string; name?: string } | null;
}

export interface AgentClientOptions {
  adapter?: AgentAdapter;
  logger?: Partial<AgentLogger>;
  maxRetries?: number;
  timeoutMs?: number;
  tenantConfig?: TenantModelConfig | null;
}
