/**
 * Mira Chat Page (native agent)
 * Uses our own /agent-chat endpoint via useAgentChat.
 */

import { useCallback, useEffect, useMemo, useRef, useState, lazy, Suspense } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PageHeader } from "@/admin/components/ui/page-header.jsx";
import { ChatInput } from "@/admin/components/ui/chat-input.jsx";
import { ChatMessage as ChatBubble } from "@/admin/components/ui/chat-message.jsx";
import { createPageUrl } from "@/admin/utils";
import { useAgentChatStore } from "@/admin/state/providers/AgentChatProvider.jsx";
import InlineConfirmationCard from "@/admin/components/ui/inline-confirmation-card.jsx";
import { ClarificationPrompt } from "@/admin/components/ui/clarification-prompt.jsx";
import { MiraInteractionModes } from "@/admin/components/mira/MiraInteractionModes.jsx";
import { IntentDebugPanel } from "@/admin/components/mira/IntentDebugPanel.jsx";
import { useMiraMode } from "@/admin/state/useMiraMode";
import { Skeleton } from "@/admin/components/ui/skeleton.jsx";
import { Sparkles, TrendingUp, Users, FileText } from "lucide-react";
import clsx from "clsx";

// Lazy load Copilot and Insight components for better initial load performance
const InlineSuggestionPanel = lazy(() =>
  import("@/admin/components/MiraCopilot/InlineSuggestionPanel.tsx").then((module) => ({
    default: module.InlineSuggestionPanel,
  }))
);
const InsightSidebar = lazy(() =>
  import("@/admin/components/MiraInsight/InsightSidebar.tsx").then((module) => ({
    default: module.InsightSidebar,
  }))
);

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
    conversationId,
    debugData,
  } = useAgentChatStore();
  const autoSentRef = useRef(false);

  // Check if debug mode is enabled via ?debug=true
  const isDebugMode = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("debug") === "true";
  }, [location.search]);

  const userOverrideRef = useRef(false);
  const prevAutoActionRef = useRef(autoActionState);

  const viewportCategory = useViewportCategory();
  const isDesktop = viewportCategory === "desktop";
  const isTablet = viewportCategory === "tablet";
  const availableModes = useMemo(() => {
    if (viewportCategory === "mobile") return ["command"];
    if (viewportCategory === "tablet") return ["command", "copilot"];
    return ["command", "copilot", "insight"];
  }, [viewportCategory]);

  const { mode, openCommand, openCopilot, openInsight, close, attachConversation } = useMiraMode();
  const viewMode = mode === "hidden" ? "command" : mode;

  useEffect(() => {
    attachConversation(conversationId ?? null);
  }, [conversationId, attachConversation]);

  useEffect(() => {
    function handleKeydown(event) {
      const key = event.key?.toLowerCase?.() ?? event.key;
      if ((event.metaKey || event.ctrlKey) && key === "k") {
        event.preventDefault();
        userOverrideRef.current = true;
        openCommand(conversationId);
      } else if (key === "escape") {
        event.preventDefault();
        close();
      }
    }
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [openCommand, close, conversationId]);

  useEffect(() => {
    if (viewMode === "hidden") return;
    if (availableModes.includes(viewMode)) return;
    if (viewportCategory === "mobile") {
      openCommand(conversationId);
    } else if (viewportCategory === "tablet" && availableModes.includes("copilot")) {
      openCopilot(conversationId);
    } else {
      openCommand(conversationId);
    }
  }, [availableModes, viewportCategory, viewMode, openCommand, openCopilot, conversationId]);

  const handleModeChange = useCallback(
    (nextMode) => {
      if (!nextMode || nextMode === viewMode) return;
      if (!availableModes.includes(nextMode)) return;
      userOverrideRef.current = true;
      if (nextMode === "command") {
        openCommand(conversationId);
      } else if (nextMode === "copilot") {
        openCopilot(conversationId);
      } else if (nextMode === "insight") {
        openInsight();
      }
    },
    [viewMode, openCommand, openCopilot, openInsight, conversationId, availableModes],
  );

  // Heuristic: auto-switch to Co-pilot when a tool action is pending or present
  const hasToolIntent = Boolean(pendingAction) || messages.some((m) => !!m.toolCall);
  useEffect(() => {
    if (userOverrideRef.current) return; // respect manual selection
    if (hasToolIntent && viewMode !== "copilot") openCopilot(conversationId);
  }, [hasToolIntent, viewMode, openCopilot, conversationId]);

  useEffect(() => {
    const prevStatus = prevAutoActionRef.current?.status;
    if (
      autoActionState?.status === "executed" &&
      prevStatus !== "executed" &&
      !userOverrideRef.current &&
      availableModes.includes("copilot")
    ) {
      openCopilot(conversationId);
    }
    prevAutoActionRef.current = autoActionState;
  }, [autoActionState, availableModes, openCopilot, conversationId]);

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

  const handleSuggestionSelect = useCallback(
    (suggestion) => {
      if (!suggestion?.promptText) return;
      userOverrideRef.current = true;
      openCommand(conversationId);
      void sendMessage(suggestion.promptText);
    },
    [sendMessage, openCommand, conversationId],
  );

  const mainColumnClass = clsx(
    "col-span-1 transition-all duration-300",
    isDesktop && (viewMode === "command" ? "xl:col-span-3" : "xl:col-span-2"),
  );
  const showDesktopPanel = isDesktop && viewMode !== "command";
  const showTabletCopilotPanel = viewportCategory === "tablet" && viewMode === "copilot";

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-neutral-50 to-white">
      <PageHeader title="Mira Chat" description="Chat with your AI insurance assistant" />
      <div className={clsx("flex-1 m-4 grid grid-cols-1 gap-4", isDesktop && "xl:grid-cols-3")}>
        {/* Main chat column */}
        <div className={mainColumnClass}>
          <div className="flex h-full flex-col bg-white rounded-2xl shadow-md border border-neutral-200 overflow-hidden">
            <div className="border-b border-neutral-200 p-4 bg-gradient-to-r from-white to-neutral-50">
              <MiraInteractionModes
                mode={viewMode}
                onModeChange={handleModeChange}
                availableModes={availableModes}
              />
            </div>
            <div className="flex-1 overflow-auto">
              {messages.length === 0 && !isStreaming && (
                <ChatEmptyState onPromptSelect={(prompt) => sendMessage(prompt)} />
              )}
              {messages.map((m) => (
                <ChatBubble key={m.id} message={m} streaming={Boolean(m.streaming)} />
              ))}
              {autoActionState && (
                <PlannedActionsBanner state={autoActionState} onUndo={undoAutoActions} />
              )}
              {pendingAction && (
                <div className="px-4 mb-4">
                  <InlineConfirmationCard
                    title={pendingAction.message || "Allow Mira to perform this action?"}
                    description={pendingAction.tool ? `Requested: ${pendingAction.tool}` : undefined}
                    onAllowOnce={confirmPending}
                    onDontAllow={rejectPending}
                    onAlwaysAllow={() => trustSkillInSession(pendingAction.tool)}
                  />
                </div>
              )}
              {clarificationPrompt && (
                <div className="px-4 mb-4">
                  <ClarificationPrompt
                    prompt={clarificationPrompt}
                    onConfirm={confirmClarification}
                    onCancel={dismissClarification}
                  />
                </div>
              )}
              {error && (
                <div className="mx-4 mb-4 p-4 bg-red-50 rounded-xl border border-red-200 shadow-sm">
                  <div className="text-sm text-red-800 font-medium">
                    {String(error.message || error)}
                  </div>
                </div>
              )}
            </div>
            <div className="border-t border-neutral-200 p-4 bg-white">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 hover:border-neutral-400 transition-all"
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
        {showDesktopPanel && (
          <div className="col-span-1 transition-all duration-300">
            <div className="h-full rounded-lg border border-slate-200 bg-white/90 p-4">
              <Suspense
                fallback={
                  <div className="space-y-4" role="status" aria-label="Loading panel">
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-16 w-5/6" />
                    <span className="sr-only">Loading {viewMode === "copilot" ? "Co-pilot" : "Insights"} panel</span>
                  </div>
                }
              >
                {viewMode === "copilot" ? (
                  <InlineSuggestionPanel isBusy={isStreaming} onSuggestionSelect={handleSuggestionSelect} />
                ) : (
                  <InsightSidebar />
                )}
              </Suspense>
            </div>
          </div>
        )}
      </div>

      {showTabletCopilotPanel && (
        <div className="m-4 rounded-lg border border-slate-200 bg-white/90 p-4 lg:hidden">
          <Suspense
            fallback={
              <div className="space-y-4" role="status" aria-label="Loading Co-pilot">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-24 w-full" />
                <span className="sr-only">Loading Co-pilot panel</span>
              </div>
            }
          >
            <InlineSuggestionPanel isBusy={isStreaming} onSuggestionSelect={handleSuggestionSelect} />
          </Suspense>
        </div>
      )}

      {/* Debug Panel - Only visible when ?debug=true */}
      <IntentDebugPanel
        classification={debugData?.classification}
        cacheStats={debugData?.cacheStats}
        executionLogs={debugData?.executionLogs || []}
        isVisible={isDebugMode}
      />
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

const DESKTOP_BREAKPOINT = 1280;
const TABLET_BREAKPOINT = 768;

function getViewportCategory(width = 0) {
  if (width >= DESKTOP_BREAKPOINT) return "desktop";
  if (width >= TABLET_BREAKPOINT) return "tablet";
  return "mobile";
}

function useViewportCategory() {
  const [category, setCategory] = useState(() => {
    if (typeof window === "undefined") return "desktop";
    return getViewportCategory(window.innerWidth);
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => setCategory(getViewportCategory(window.innerWidth));
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return category;
}

function ChatEmptyState({ onPromptSelect }) {
  const starterPrompts = [
    {
      icon: Users,
      title: "Customer Analysis",
      prompt: "Show me my top customers by premium value",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: TrendingUp,
      title: "Sales Performance",
      prompt: "What are my sales trends for this quarter?",
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: FileText,
      title: "Pending Tasks",
      prompt: "Show me my pending tasks and upcoming appointments",
      color: "from-green-500 to-emerald-500",
    },
    {
      icon: Sparkles,
      title: "Recommendations",
      prompt: "Give me product recommendations for my customer base",
      color: "from-orange-500 to-amber-500",
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-12">
      <div className="max-w-3xl w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 shadow-lg">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-neutral-900">Chat with Mira</h2>
          <p className="text-neutral-600 text-base max-w-md mx-auto">
            Your AI insurance assistant is here to help with customers, analytics, tasks, and more.
          </p>
        </div>

        {/* Starter Prompts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {starterPrompts.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={index}
                onClick={() => onPromptSelect(item.prompt)}
                className="group relative overflow-hidden rounded-2xl border-2 border-neutral-200 bg-white p-4 text-left transition-all hover:border-primary-500 hover:shadow-lg active:scale-[0.98]"
              >
                <div className="flex items-start gap-3">
                  <div className={clsx(
                    "flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-md",
                    item.color
                  )}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-neutral-900 mb-1">{item.title}</div>
                    <div className="text-xs text-neutral-600 line-clamp-2">{item.prompt}</div>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-primary-500/0 via-primary-500/5 to-primary-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            );
          })}
        </div>

        {/* Tips */}
        <div className="text-center">
          <p className="text-xs text-neutral-500">
            Try asking questions in natural language. I can help you navigate, analyze data, and complete tasks.
          </p>
        </div>
      </div>
    </div>
  );
}
