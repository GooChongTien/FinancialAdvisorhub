/**
 * Mira Chat Page (native agent)
 * Uses our own /agent-chat endpoint via useAgentChat.
 */

import { useEffect, useRef, useCallback, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PageHeader } from "@/admin/components/ui/page-header.jsx";
import { ChatInput } from "@/admin/components/ui/chat-input.jsx";
import { ChatMessage as ChatBubble } from "@/admin/components/ui/chat-message.jsx";
import { createPageUrl } from "@/admin/utils";
import { useAgentChatStore } from "@/admin/state/providers/AgentChatProvider.jsx";
import InlineConfirmationCard from "@/admin/components/ui/inline-confirmation-card.jsx";
import { ClarificationPrompt } from "@/admin/components/ui/clarification-prompt.jsx";
import { MiraInteractionModes } from "@/admin/components/mira/MiraInteractionModes.jsx";
import { MiraCopilotPanel } from "@/admin/components/mira/MiraCopilotPanel.jsx";
import { MiraInsightPanel } from "@/admin/components/mira/MiraInsightPanel.jsx";

function robustDecode(value) {
  if (!value) return value;
  let out = value;
  for (let i = 0; i < 3; i++) {
    try {
      const decoded = decodeURIComponent(out);
      if (decoded === out) break;
      out = decoded;
    } catch {
      break;
    }
  }
  return out;
}

export default function ChatMira() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    messages,
    isStreaming,
    error,
    sendMessage,
    pendingAction,
    confirmPending,
    rejectPending,
    trustSkillInSession,
    clarificationPrompt,
    confirmClarification,
    dismissClarification,
    autoActionState,
    undoAutoActions,
  } = useAgentChatStore();
  const autoSentRef = useRef(false);

  // Adaptive interaction mode (Phase 6): command | copilot | insight
  const MODE_KEY = "mira:mode";
  const userOverrideRef = useRef(false);
  const [mode, setMode] = useState(() => {
    try {
      if (typeof window !== "undefined") {
        return window.localStorage.getItem(MODE_KEY) || "command";
      }
    } catch {}
    return "command";
  });
  const setModePersist = useCallback((m) => {
    try { if (typeof window !== "undefined") window.localStorage.setItem(MODE_KEY, m); } catch {}
    userOverrideRef.current = true;
    setMode(m);
  }, []);

  // Heuristic: auto-switch to Co-pilot when a tool action is pending or present
  const hasToolIntent = Boolean(pendingAction) || messages.some((m) => !!m.toolCall);
  useEffect(() => {
    if (userOverrideRef.current) return; // respect manual selection
    if (hasToolIntent && mode !== "copilot") setMode("copilot");
  }, [hasToolIntent, mode]);

  // Auto-send prompt via ?prompt=...
  useEffect(() => {
    if (autoSentRef.current) return;
    const params = new URLSearchParams(location.search);
    const raw = params.get("prompt");
    const prompt = robustDecode(raw || "");
    if (prompt && prompt.trim()) {
      autoSentRef.current = true;
      void sendMessage(prompt);
    }
  }, [location.search, sendMessage]);

  const goBack = useCallback(() => {
    const params = new URLSearchParams(location.search);
    const from = robustDecode(params.get("from"));
    if (from && typeof from === "string" && from.trim()) {
      navigate(from, { replace: true });
    } else {
      navigate(createPageUrl("Home"), { replace: true });
    }
  }, [location.search, navigate]);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <PageHeader title="Mira Chat" description="Chat with your AI insurance assistant" />
      <div className="flex-1 m-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Main chat column */}
        <div className={"col-span-1 " + (mode === "command" ? "lg:col-span-3" : "lg:col-span-2") + " transition-all duration-300"}>
          <div className="flex h-full flex-col bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 p-3">
              <MiraInteractionModes mode={mode} onModeChange={setModePersist} />
            </div>
            <div className="flex-1 overflow-auto p-4 space-y-2">
              {messages.length === 0 && (
                <div className="text-slate-500 text-sm">Start a conversation by typing below.</div>
              )}
              {messages.map((m) => (
                <ChatBubble key={m.id} message={m} streaming={Boolean(m.streaming)} />
              ))}
              {autoActionState && (
                <PlannedActionsBanner state={autoActionState} onUndo={undoAutoActions} />
              )}
              {pendingAction && (
                <InlineConfirmationCard
                  title={pendingAction.message || "Allow Mira to perform this action?"}
                  description={pendingAction.tool ? `Requested: ${pendingAction.tool}` : undefined}
                  onAllowOnce={confirmPending}
                  onDontAllow={rejectPending}
                  onAlwaysAllow={() => trustSkillInSession(pendingAction.tool)}
                />
              )}
              {clarificationPrompt && (
                <ClarificationPrompt
                  prompt={clarificationPrompt}
                  onConfirm={confirmClarification}
                  onCancel={dismissClarification}
                />
              )}
              {error && (
                <div className="mt-2 p-2 bg-red-100 rounded border border-red-300 text-xs text-red-800">
                  {String(error.message || error)}
                </div>
              )}
            </div>
            <div className="border-t border-slate-100 p-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="rounded border px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
                  onClick={goBack}
                >
                  Back
                </button>
                <div className="flex-1">
                  <ChatInput onSend={({ message }) => sendMessage(message)} disabled={isStreaming} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Side panel for Co-pilot or Insights */}
        {mode !== "command" && (
          <div className="col-span-1 transition-all duration-300">
            <div className="h-full rounded-lg border border-slate-200 bg-white/90 p-4">
              {mode === "copilot" ? (
                <MiraCopilotPanel intent={null} execution={null} onRetry={() => { /* placeholder */ }} />
              ) : (
                <MiraInsightPanel insights={[]} />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PlannedActionsBanner({ state, onUndo }) {
  if (!state) return null;
  const actions = Array.isArray(state.actions) ? state.actions : [];
  let statusLabel = "Running auto-actions…";
  if (state.status === "executed") statusLabel = "Actions completed automatically";
  if (state.status === "error") statusLabel = `Failed: ${state.error || "Unknown error"}`;

  return (
    <div className="rounded-lg border border-sky-200 bg-sky-50/70 p-3 text-xs text-slate-700">
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-slate-800">Planned actions</span>
        <button
          type="button"
          onClick={onUndo}
          className="text-slate-500 underline-offset-2 hover:underline"
        >
          Undo
        </button>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {actions.map((action, index) => (
          <span
            key={`${state.id}-${index}`}
            className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-800"
          >
            {String(action.action || "action").replace(/_/g, " ")}
          </span>
        ))}
      </div>
      <div className="mt-2 text-[11px] text-slate-500">{statusLabel}</div>
    </div>
  );
}
