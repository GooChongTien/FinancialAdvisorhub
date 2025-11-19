/**
 * React hook for Agent chat interactions
 * Provides: sendMessage, sendToolResult, onChunk, onDone, onError, abort
 */

import { useState, useCallback, useRef } from "react";
import { streamAgentChat, createToolResultMessage } from "@/admin/api/agentClient.js";
import { enforceGuardrails } from "@/lib/mira/guardrails.js";
import { trackMiraEvent } from "@/admin/lib/miraTelemetry.js";
import useUIActionExecutor from "@/lib/mira/useUIActionExecutor.ts";
import { sanitizeContextPayload } from "@/lib/mira/contextSerialization.ts";

const payloadEncoder = typeof TextEncoder !== "undefined" ? new TextEncoder() : null;

/**
 * @typedef {import("@/lib/mira/types.ts").IntentMetadata} IntentMetadata
 * @typedef {import("@/lib/mira/types.ts").MiraResponse} MiraResponse
 * @typedef {import("@/lib/mira/types.ts").UIAction} UIAction
 */

function normalizeActionList(candidate) {
  return Array.isArray(candidate) ? candidate : undefined;
}

function extractAgentArtifacts(payload = {}) {
  const metadata = payload?.metadata ?? null;
  const miraResponse = payload?.mira_response ?? metadata?.mira_response ?? null;
  const plannedActions =
    normalizeActionList(payload?.ui_actions) ||
    normalizeActionList(metadata?.ui_actions) ||
    normalizeActionList(miraResponse?.ui_actions) ||
    [];

  return {
    metadata,
    miraResponse,
    plannedActions,
  };
}

function validatePlannedActions(candidate) {
  if (!Array.isArray(candidate)) return [];
  return candidate.filter(
    (action) => action && typeof action === "object" && typeof action.action === "string",
  );
}

/**
 * Chat message for UI display
 * @typedef {Object} DisplayMessage
 * @property {string} id
 * @property {'user' | 'assistant' | 'tool' | 'system'} role
 * @property {string} content
 * @property {boolean} [streaming]
 * @property {any} [toolCall]
 * @property {string} [timestamp]
 * @property {IntentMetadata | null} [metadata]
 * @property {MiraResponse | null} [miraResponse]
 * @property {UIAction[]} [plannedActions]
 */

/**
 * Hook state
 * @typedef {Object} AgentChatState
 * @property {DisplayMessage[]} messages
 * @property {boolean} isStreaming
 * @property {Error | null} error
 * @property {(content: string) => Promise<void>} sendMessage
 * @property {(toolCallId: string, result: string) => Promise<void>} sendToolResult
 * @property {() => void} abort
 * @property {() => void} clearMessages
 */

/**
 * Use Agent chat hook
 * @returns {AgentChatState}
 */
export function useAgentChat(options = {}) {
  const { onEvent: onEventExternal, contextProvider } = options || {};
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  const [autoActionState, setAutoActionState] = useState(null);
  const [conversationId, setConversationId] = useState(null);

  const abortControllerRef = useRef(null);
  const currentMessageRef = useRef(null);
  const processedAutoMessagesRef = useRef(new Set());
  const actionExecutor = useUIActionExecutor();
  const telemetryRef = useRef({ start: null, metrics: null });

  const updateConversationFromMetadata = useCallback((metadata) => {
    if (!metadata || typeof metadata !== "object") return;
    const nextId = metadata.conversation_id || metadata.conversationId;
    if (typeof nextId === "string" && nextId.trim().length > 0) {
      setConversationId((prev) => (prev === nextId ? prev : nextId));
    }
  }, []);

  const buildRequestMetadata = useCallback(
    (incoming = {}) => {
      const source = incoming && typeof incoming === "object" ? incoming : {};
      const explicitId = source.conversation_id || source.conversationId;
      const resolvedId = explicitId || conversationId;
      if (!resolvedId) return source;
      if (source.conversation_id === resolvedId && source.conversationId === resolvedId) {
        return source;
      }
      return {
        ...source,
        conversation_id: resolvedId,
        conversationId: resolvedId,
      };
    },
    [conversationId],
  );

  const flushTelemetry = useCallback((status, extra = {}) => {
    const snapshot = telemetryRef.current;
    if (!snapshot?.start) return;
    telemetryRef.current = { start: null, metrics: null };
    const durationMs = Date.now() - snapshot.start;
    const metrics = snapshot.metrics || {};
    void trackMiraEvent?.("mira.chat.telemetry", {
      status,
      durationMs,
      payloadBytes: metrics.payloadBytes ?? 0,
      contextBytes: metrics.contextBytes ?? 0,
      mode: metrics.mode ?? "stream",
      trimmedFields: metrics.trimmedFields ?? [],
      ...extra,
    });
  }, []);

  const registerAutoMessage = useCallback((messageId) => {
    if (!messageId) return false;
    const store = processedAutoMessagesRef.current;
    if (store.has(messageId)) return false;
    store.add(messageId);
    if (store.size > 40) {
      const oldest = store.values().next().value;
      if (oldest) store.delete(oldest);
    }
    return true;
  }, []);

  const queueAutoActions = useCallback(
    (messageId, actions) => {
      const validated = validatePlannedActions(actions);
      if (!validated.length || !registerAutoMessage(messageId)) return;
      const entryId = `${messageId}-${Date.now()}`;
      setAutoActionState({
        id: entryId,
        actions: validated,
        status: "running",
      });
      Promise.resolve(actionExecutor.executeActions(validated, { correlationId: entryId }))
        .then(() => {
          setAutoActionState((prev) =>
            prev && prev.id === entryId
              ? {
                  ...prev,
                  status: "executed",
                }
              : prev,
          );
        })
        .catch((err) => {
          const message = err instanceof Error ? err.message : String(err);
          setAutoActionState((prev) =>
            prev && prev.id === entryId
              ? {
                  ...prev,
                  status: "error",
                  error: message,
                }
              : prev,
          );
        });
    },
    [actionExecutor, registerAutoMessage],
  );

  /**
   * Send user message to Agent
   */
  const sendMessage = useCallback(async (content, requestMetadata = {}) => {
    if (isStreaming) {
      console.warn("[useAgentChat] Already streaming, ignoring new message");
      return;
    }

    // Guardrails: sanitize content, optionally block
    const guard = enforceGuardrails(String(content ?? ""));
    if (guard.blocked) {
      const err = new Error("Message blocked for safety");
      setError(err);
      setIsStreaming(false);
      try {
        await trackMiraEvent?.("guardrail.blocked", { reason: guard.reason, score: guard.score });
      } catch (_) {}
      return;
    }

    // Add user message to UI
    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setError(null);
    setIsStreaming(true);

    // Create assistant message placeholder
    const assistantMessageId = `assistant-${Date.now()}`;
    const assistantMessage = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      streaming: true,
      timestamp: new Date().toISOString(),
      metadata: null,
      miraResponse: null,
      plannedActions: [],
    };

    setMessages((prev) => [...prev, assistantMessage]);
    currentMessageRef.current = assistantMessageId;

    // Build message history for API
    const apiMessages = [...messages, userMessage].map((msg) => ({
      role: msg.role,
      // Only sanitize the new input for downstream; preserve UI display
      content: msg.id === userMessage.id ? guard.sanitizedText : msg.content,
      tool_call_id: msg.tool_call_id,
    }));

    // Create abort controller
    abortControllerRef.current = new AbortController();

    try {
      const contextSnapshot = typeof contextProvider === "function" ? contextProvider() : undefined;
      const { context: safeContext, metrics: contextMetrics } = sanitizeContextPayload(contextSnapshot);
      const metadataPayload = buildRequestMetadata(requestMetadata);
      const payloadBytes =
        payloadEncoder && apiMessages.length > 0
          ? payloadEncoder.encode(JSON.stringify(apiMessages)).length
          : 0;

      telemetryRef.current = {
        start: Date.now(),
        metrics: {
          payloadBytes,
          contextBytes: contextMetrics.sanitizedBytes,
          trimmedFields: contextMetrics.trimmedFields,
          mode: "stream",
        },
      };

      void trackMiraEvent?.("mira.context.serialized", {
        module: safeContext?.module ?? null,
        page: safeContext?.page ?? null,
        originalBytes: contextMetrics.originalBytes,
        sanitizedBytes: contextMetrics.sanitizedBytes,
        trimmedFields: contextMetrics.trimmedFields,
      });

      await streamAgentChat(apiMessages, {
        signal: abortControllerRef.current.signal,
        metadata: metadataPayload,
        context: safeContext,

        onEvent: (event) => {
          try {
            onEventExternal?.(event);
          } catch (_) {}
          switch (event.type) {
            case "message.delta":
              // Append delta to current assistant message
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessageId
                    ? { ...msg, content: msg.content + (event.data.delta || "") }
                    : msg
                )
              );
              break;

            case "message.completed": {
              const finalContent = event.data?.message?.content;
              const { metadata, miraResponse, plannedActions } = extractAgentArtifacts(event.data);
              updateConversationFromMetadata(metadata);
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessageId
                    ? {
                        ...msg,
                        content: finalContent ?? msg.content,
                        streaming: false,
                        metadata: metadata ?? msg.metadata,
                        miraResponse: miraResponse ?? msg.miraResponse,
                        plannedActions,
                      }
                    : msg
                )
              );
              setIsStreaming(false);
              try {
                queueAutoActions(assistantMessageId, plannedActions);
              } catch (_) {}
              flushTelemetry("completed", {
                intent: metadata?.intent,
                confidence: metadata?.confidence,
                confidenceTier: metadata?.confidence_tier,
              });
              break;
            }

            case "tool_call.created":
              // Add tool call to message
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessageId
                    ? { ...msg, toolCall: event.data.tool_call }
                    : msg
                )
              );
              break;

            case "error":
              setError(new Error(event.data.error?.message || "Agent error"));
              setIsStreaming(false);
              flushTelemetry("error", { reason: event.data?.error?.code || "agent_error" });

              // Mark message as error
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessageId
                    ? { ...msg, streaming: false, content: msg.content || "[Error occurred]" }
                    : msg
                )
              );
              break;

            case "done":
              setIsStreaming(false);
              flushTelemetry("done");
              break;

            default:
              console.log("[useAgentChat] Unknown event:", event);
          }
        },

        onError: (err) => {
          console.error("[useAgentChat] Stream error:", err);
          setError(err);
          setIsStreaming(false);
          flushTelemetry("network_error", { reason: err?.message ?? "stream_error" });

          // Mark message as error
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, streaming: false, content: msg.content || "[Connection error]" }
                : msg
            )
          );
        },
      });
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("[useAgentChat] Send error:", err);
        setError(err);
        setIsStreaming(false);
        flushTelemetry("exception", { reason: err?.message ?? err });
      } else {
        flushTelemetry("aborted");
      }
    } finally {
      abortControllerRef.current = null;
      currentMessageRef.current = null;
    }
  }, [
    messages,
    isStreaming,
    buildRequestMetadata,
    contextProvider,
    onEventExternal,
    updateConversationFromMetadata,
    flushTelemetry,
    queueAutoActions,
  ]);

  /**
   * Send tool result back to Agent
   */
  const sendToolResult = useCallback(async (toolCallId, result) => {
    const toolMessage = createToolResultMessage(toolCallId, result);

    // Add tool result to UI
    const toolDisplayMessage = {
      id: `tool-${Date.now()}`,
      role: "tool",
      content: result,
      tool_call_id: toolCallId,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, toolDisplayMessage]);

    // Continue conversation with tool result
    const apiMessages = [...messages, toolDisplayMessage].map((msg) => ({
      role: msg.role,
      content: msg.content,
      tool_call_id: msg.tool_call_id,
    }));

    // Trigger new streaming response
    setIsStreaming(true);

    const assistantMessageId = `assistant-${Date.now()}`;
    const assistantMessage = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      streaming: true,
      timestamp: new Date().toISOString(),
      metadata: null,
      miraResponse: null,
      plannedActions: [],
    };

    setMessages((prev) => [...prev, assistantMessage]);
    currentMessageRef.current = assistantMessageId;

    abortControllerRef.current = new AbortController();

    try {
      const contextSnapshot = typeof contextProvider === "function" ? contextProvider() : undefined;
      const { context: safeContext, metrics: contextMetrics } = sanitizeContextPayload(contextSnapshot);
      const metadataPayload = buildRequestMetadata({});
      const payloadBytes =
        payloadEncoder && apiMessages.length > 0
          ? payloadEncoder.encode(JSON.stringify(apiMessages)).length
          : 0;

      telemetryRef.current = {
        start: Date.now(),
        metrics: {
          payloadBytes,
          contextBytes: contextMetrics.sanitizedBytes,
          trimmedFields: contextMetrics.trimmedFields,
          mode: "stream",
        },
      };

      void trackMiraEvent?.("mira.context.serialized", {
        module: safeContext?.module ?? null,
        page: safeContext?.page ?? null,
        originalBytes: contextMetrics.originalBytes,
        sanitizedBytes: contextMetrics.sanitizedBytes,
        trimmedFields: contextMetrics.trimmedFields,
      });

      await streamAgentChat(apiMessages, {
        signal: abortControllerRef.current.signal,
        metadata: metadataPayload,
        context: safeContext,

        onEvent: (event) => {
          try {
            onEventExternal?.(event);
          } catch (_) {}
          switch (event.type) {
            case "message.delta":
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessageId
                    ? { ...msg, content: msg.content + (event.data.delta || "") }
                    : msg
                )
              );
              break;

            case "message.completed": {
              const finalContent = event.data?.message?.content;
              const { metadata, miraResponse, plannedActions } = extractAgentArtifacts(event.data);
              updateConversationFromMetadata(metadata);
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessageId
                    ? {
                        ...msg,
                        content: finalContent ?? msg.content,
                        streaming: false,
                        metadata: metadata ?? msg.metadata,
                        miraResponse: miraResponse ?? msg.miraResponse,
                        plannedActions,
                      }
                    : msg
                )
              );
              setIsStreaming(false);
              try {
                queueAutoActions(assistantMessageId, plannedActions);
              } catch (_) {}
              flushTelemetry("completed", {
                intent: metadata?.intent,
                confidence: metadata?.confidence,
                confidenceTier: metadata?.confidence_tier,
              });
              break;
            }

            case "error":
              setError(new Error(event.data.error?.message || "Agent error"));
              setIsStreaming(false);
              flushTelemetry("error", { reason: event.data?.error?.code || "agent_error" });
              break;

            case "done":
              setIsStreaming(false);
              flushTelemetry("done");
              break;
          }
        },

        onError: (err) => {
          setError(err);
          setIsStreaming(false);
          flushTelemetry("network_error", { reason: err?.message ?? "stream_error" });
        },
      });
    } catch (err) {
      if (err.name !== "AbortError") {
        setError(err);
        setIsStreaming(false);
        flushTelemetry("exception", { reason: err?.message ?? err });
      } else {
        flushTelemetry("aborted");
      }
    } finally {
      abortControllerRef.current = null;
      currentMessageRef.current = null;
    }
  }, [
    messages,
    buildRequestMetadata,
    contextProvider,
    onEventExternal,
    updateConversationFromMetadata,
    queueAutoActions,
    flushTelemetry,
  ]);

  /**
   * Abort current streaming request
   */
  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
      flushTelemetry("aborted");
    }
  }, [flushTelemetry]);

  /**
   * Clear all messages
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    setIsStreaming(false);
  }, []);

  const undoAutoActions = useCallback(() => {
    if (!autoActionState) return;
    setAutoActionState(null);
    try {
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("mira:auto-actions:undo", {
            detail: { id: autoActionState.id, correlationId: autoActionState.id },
          }),
        );
      }
    } catch {
      // noop
    }
  }, [autoActionState]);

  return {
    messages,
    isStreaming,
    error,
    sendMessage,
    sendToolResult,
    abort,
    clearMessages,
    autoActionState,
    undoAutoActions,
    conversationId,
  };
}

export default useAgentChat;
