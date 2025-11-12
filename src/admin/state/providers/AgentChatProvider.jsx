import { createContext, useContext, useMemo, useState, useCallback, useEffect } from "react";
import supabase from "@/admin/api/supabaseClient.js";
import { useAgentChat } from "@/admin/hooks/useAgentChat.js";
import { useMiraContext } from "@/admin/state/providers/MiraContextProvider.jsx";

const AgentChatContext = createContext(null);

export function AgentChatProvider({ children }) {
  const [pendingAction, setPendingAction] = useState(null);
  const [trustedSkillsSession, setTrustedSkillsSession] = useState([]);
  const [clarificationPrompt, setClarificationPrompt] = useState(null);
  const { getContext } = useMiraContext();

  // Heuristic: which tool calls require confirmation
  const isSensitiveTool = useCallback((toolName) => {
    if (!toolName) return false;
    const n = String(toolName).toLowerCase();
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
    const baseUrl = import.meta.env.VITE_AGENT_API_URL || "/api";
    const headers = { "Content-Type": "application/json" };
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;
      if (anon) headers.apikey = anon;
      if (token) headers.Authorization = `Bearer ${token}`;
    } catch {}
    const res = await fetch(`${baseUrl}/agent-tools`, {
      method: "POST",
      headers,
      body: JSON.stringify({ tool, args }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error || `Tool ${tool} failed`);
    }
    const data = await res.json();
    return data?.result ?? {};
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
        if (tool && isSensitiveTool(tool) && !isTrusted(tool)) {
          requestConfirmation({
            id: event?.data?.tool_call?.id ?? `confirm-${Date.now()}`,
            intent: { type: `tool.${tool}` },
            tool,
            toolCall: event?.data?.tool_call,
            message: `Allow Mira to run “${tool}”?`,
          });
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
    };
  }, [chat, pendingAction, trustedSkillsSession, requestConfirmation, clearPending, rejectPending, trustSkillInSession, executeTool, clarificationPrompt, confirmClarification, dismissClarification]);

  return <AgentChatContext.Provider value={value}>{children}</AgentChatContext.Provider>;
}

export function useAgentChatStore() {
  const ctx = useContext(AgentChatContext);
  if (!ctx) {
    throw new Error("useAgentChatStore must be used within an AgentChatProvider");
  }
  return ctx;
}
