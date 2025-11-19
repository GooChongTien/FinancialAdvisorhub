import { createContext, useContext, useMemo, useState, useCallback, useEffect } from "react";
import supabase from "@/admin/api/supabaseClient.js";
import { useAgentChat } from "@/admin/hooks/useAgentChat.js";
import { useMiraContext } from "@/admin/state/providers/MiraContextProvider.jsx";

const AgentChatContext = createContext(null);

export function AgentChatProvider({ children }) {
  const [pendingAction, setPendingAction] = useState(null);
  const [trustedSkillsSession, setTrustedSkillsSession] = useState([]);
  const [clarificationPrompt, setClarificationPrompt] = useState(null);
  const [debugData, setDebugData] = useState({
    classification: null,
    cacheStats: null,
    executionLogs: []
  });
  const { getContext } = useMiraContext();

  // Heuristic: which tool calls require confirmation
  const isSensitiveTool = useCallback((toolName) => {
    if (!toolName) return false;
    const n = String(toolName).toLowerCase();
    if (n.startsWith("todo__") || n.startsWith("broadcast__") || n.startsWith("visualizer__")) return false;
    return (
      n.includes("navigate") ||
      n.includes("update") ||
      n.includes("task") ||
      n.includes("delete") ||
      n.includes("submit") ||
      n.includes("log")
    );
  }, []);

  const isTrusted = useCallback(
    (toolName) => {
      if (!toolName) return false;
      const n = String(toolName).toLowerCase();
      return trustedSkillsSession.includes(n);
    },
    [trustedSkillsSession],
  );

  const requestConfirmation = useCallback((action) => {
    setPendingAction(action || null);
  }, []);
  const clearPending = useCallback(() => setPendingAction(null), []);
  const confirmPending = useCallback(() => setPendingAction(null), []);
  const executeTool = useCallback(async (tool, args) => {
    const startTime = Date.now();
    const baseUrl = import.meta.env.VITE_AGENT_API_URL || "/api";
    const headers = { "Content-Type": "application/json" };

    // Track execution start
    setDebugData((prev) => ({
      ...prev,
      executionLogs: [
        ...prev.executionLogs.slice(-9), // Keep last 10 logs
        {
          timestamp: startTime,
          action: tool,
          status: "pending",
          args
        }
      ]
    }));

    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;
      if (anon) headers.apikey = anon;
      if (token) headers.Authorization = `Bearer ${token}`;
    } catch {}

    try {
      const res = await fetch(`${baseUrl}/agent-tools`, {
        method: "POST",
        headers,
        body: JSON.stringify({ tool, args }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const errorMsg = err?.error || `Tool ${tool} failed`;

        // Track execution failure
        setDebugData((prev) => ({
          ...prev,
          executionLogs: prev.executionLogs.map((log) =>
            log.timestamp === startTime && log.action === tool
              ? { ...log, status: "error", error: errorMsg, duration: Date.now() - startTime }
              : log
          )
        }));

        throw new Error(errorMsg);
      }

      const data = await res.json();

      // Track execution success
      setDebugData((prev) => ({
        ...prev,
        executionLogs: prev.executionLogs.map((log) =>
          log.timestamp === startTime && log.action === tool
            ? { ...log, status: "success", duration: Date.now() - startTime }
            : log
        )
      }));

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("mira:tool-executed", {
            detail: { tool, args },
          }),
        );
      }
      return data?.result ?? {};
    } catch (error) {
      // Ensure error is tracked
      setDebugData((prev) => ({
        ...prev,
        executionLogs: prev.executionLogs.map((log) =>
          log.timestamp === startTime && log.action === tool
            ? { ...log, status: "error", error: error.message, duration: Date.now() - startTime }
            : log
        )
      }));
      throw error;
    }
  }, []);
  const rejectPending = useCallback(() => setPendingAction(null), []);
  const trustSkillInSession = useCallback((toolName) => {
    if (!toolName) return;
    const n = String(toolName).toLowerCase();
    setTrustedSkillsSession((prev) => (prev.includes(n) ? prev : [...prev, n]));
    setPendingAction(null);
  }, []);

  const chat = useAgentChat({
    onEvent: (event) => {
      if (event?.type === "tool_call.created") {
        const tool = event?.data?.tool_call?.function?.name ?? null;
        const toolCall = event?.data?.tool_call;
        if (tool && toolCall) {
          if (isSensitiveTool(tool) && !isTrusted(tool)) {
            requestConfirmation({
              id: toolCall.id ?? `confirm-${Date.now()}`,
              intent: { type: `tool.${tool}` },
              tool,
              toolCall,
              message: `Allow Mira to run “${tool}”?`,
            });
          } else {
            if (process.env.NODE_ENV === "test") {
              console.log("[AgentChatProvider] auto-executing tool", tool);
            }
            void (async () => {
              let args = {};
              try {
                args = JSON.parse(toolCall.function?.arguments || "{}");
              } catch {}
              try {
                const result = await executeTool(tool, args);
                await chat.sendToolResult(toolCall.id, JSON.stringify(result ?? {}));
              } catch (err) {
                console.warn("[AgentChatProvider] tool execution failed", err);
              }
            })();
          }
        }
      }
    },
    contextProvider: getContext,
  });

  useEffect(() => {
    if (!chat.messages || chat.messages.length === 0) {
      setClarificationPrompt(null);
      return;
    }
    const latestAssistant = [...chat.messages]
      .slice()
      .reverse()
      .find((msg) => msg.role === "assistant" && msg.metadata?.needs_clarification);

    if (!latestAssistant) {
      setClarificationPrompt(null);
      return;
    }

    setClarificationPrompt((prev) => {
      if (prev?.messageId === latestAssistant.id) return prev;
      const assistantIndex = chat.messages.findIndex((msg) => msg.id === latestAssistant.id);
      const precedingUser = assistantIndex > -1
        ? [...chat.messages.slice(0, assistantIndex)].reverse().find((msg) => msg.role === "user")
        : null;

      return {
        messageId: latestAssistant.id,
        assistantText: latestAssistant.content,
        metadata: latestAssistant.metadata || {},
        originalUser: precedingUser?.content || "",
      };
    });
  }, [chat.messages]);

  // Track debug data from assistant message metadata
  useEffect(() => {
    if (!chat.messages || chat.messages.length === 0) return;

    const latestAssistant = [...chat.messages]
      .slice()
      .reverse()
      .find((msg) => msg.role === "assistant" && msg.metadata);

    if (latestAssistant?.metadata) {
      const metadata = latestAssistant.metadata;

      // Extract classification info
      if (metadata.topic || metadata.intent || typeof metadata.confidence !== "undefined") {
        setDebugData((prev) => ({
          ...prev,
          classification: {
            topic: metadata.topic,
            subtopic: metadata.subtopic,
            intent: metadata.intent,
            confidence: metadata.confidence,
            confidenceTier: metadata.confidence_tier,
            shouldSwitchTopic: metadata.should_switch_topic,
            candidateAgents: metadata.candidate_agents || []
          }
        }));
      }
    }
  }, [chat.messages]);

  const dismissClarification = useCallback(() => {
    setClarificationPrompt(null);
  }, []);

  const confirmClarification = useCallback(async () => {
    if (!clarificationPrompt?.originalUser) {
      setClarificationPrompt(null);
      return;
    }
    const nextMetadata = {
      clarification_confirmed: true,
      intent: clarificationPrompt.metadata?.intent,
      topic: clarificationPrompt.metadata?.topic,
      topic_history: clarificationPrompt.metadata?.topic_history ?? [],
    };
    setClarificationPrompt(null);
    try {
      await chat.sendMessage(clarificationPrompt.originalUser, nextMetadata);
    } catch (error) {
      console.warn("[AgentChatProvider] clarification confirm failed", error);
    }
  }, [clarificationPrompt, chat]);

  const value = useMemo(() => {
    return {
      ...chat,
      // Intercept sending a new user message: ignore any outstanding confirmation
      sendMessage: async (text, metadata) => {
        try { clearPending(); } catch (_) {}
        return chat.sendMessage(text, metadata);
      },
      pendingAction,
      trustedSkillsSession,
      requestConfirmation,
      clearPending,
      confirmPending: async () => {
        const pa = pendingAction;
        setPendingAction(null);
        try {
          if (pa?.tool && pa?.toolCall) {
            let args = {};
            try { args = JSON.parse(pa.toolCall.function?.arguments || '{}'); } catch {}
            const result = await executeTool(pa.tool, args);
            const payload = JSON.stringify(result ?? {});
            await chat.sendToolResult(pa.toolCall.id, payload);
          }
        } catch (e) {
            console.warn('[AgentChatProvider] tool execution failed', e);
        }
      },
      rejectPending,
      trustSkillInSession,
      clarificationPrompt,
      confirmClarification,
      dismissClarification,
      debugData,
    };
  }, [chat, pendingAction, trustedSkillsSession, requestConfirmation, clearPending, rejectPending, trustSkillInSession, executeTool, clarificationPrompt, confirmClarification, dismissClarification, debugData]);

  return <AgentChatContext.Provider value={value}>{children}</AgentChatContext.Provider>;
}

export function useAgentChatStore() {
  const ctx = useContext(AgentChatContext);
  if (!ctx) {
    throw new Error("useAgentChatStore must be used within an AgentChatProvider");
  }
  return ctx;
}
