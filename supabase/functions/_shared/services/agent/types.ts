/**
 * TypeScript types for OpenAI Agent messages, events, and responses
 * Based on OpenAI Agent Builder API specification
 */

import type { MiraContext } from "../types.ts";

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

// Chat request from frontend
export interface AgentChatRequest {
  messages: ChatMessage[];
  mode?: "stream" | "batch" | "suggest" | "insights";
  metadata?: Record<string, unknown>;
  context?: MiraContext;
  temperature?: number;
  max_tokens?: number;
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
