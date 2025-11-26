/**
 * Mira Chat Page (native agent)
 * Uses our own /agent-chat endpoint via useAgentChat.
 */

import { IntentDebugPanel } from "@/admin/components/mira/IntentDebugPanel.jsx";
import { MiraInteractionModes } from "@/admin/components/mira/MiraInteractionModes.jsx";
import { ChatInput } from "@/admin/components/ui/chat-input.jsx";
import { ChatMessage as ChatBubble } from "@/admin/components/ui/chat-message.jsx";
import { ClarificationPrompt } from "@/admin/components/ui/clarification-prompt.jsx";
import InlineConfirmationCard from "@/admin/components/ui/inline-confirmation-card.jsx";
import { Skeleton } from "@/admin/components/ui/skeleton.jsx";
import { useAgentChatStore } from "@/admin/state/providers/AgentChatProvider.jsx";
import { useMiraMode } from "@/admin/state/useMiraMode";
import { createPageUrl } from "@/admin/utils";
import clsx from "clsx";
import { FileText, Sparkles, TrendingUp, Users } from "lucide-react";
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";

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
  const { t } = useTranslation();
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
      openCommand(conversationId);
      void sendMessage(prompt);
    }
  }, [location.search, sendMessage, openCommand, conversationId]);

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
    <div className="flex flex-col h-full bg-white">
      {/* Minimal Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
        <h1 className="text-xl font-semibold text-neutral-900 tracking-tight">{t("chat.chatMira.title")}</h1>
        <button
          type="button"
          className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
          onClick={goBack}
        >
          {t("chat.chatMira.backToDashboard")}
        </button>
      </div>

      <div className={clsx("flex-1 p-6 grid grid-cols-1 gap-6 max-w-7xl mx-auto w-full", isDesktop && "xl:grid-cols-3")}>
        {/* Main chat column */}
        <div className={mainColumnClass}>
          <div className="flex h-full flex-col bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
            <div className="border-b border-neutral-100 p-3 bg-white">
              <MiraInteractionModes
                mode={viewMode}
                onModeChange={handleModeChange}
                availableModes={availableModes}
              />
            </div>
            <div className="flex-1 overflow-auto bg-white">
              {messages.length === 0 && !isStreaming && (
                <ChatEmptyState onPromptSelect={(prompt) => sendMessage(prompt)} />
              )}
              <div className="max-w-3xl mx-auto w-full">
                {messages.map((m) => (
                  <ChatBubble key={m.id} message={m} streaming={Boolean(m.streaming)} />
                ))}
              </div>
              {autoActionState && (
                <div className="px-4 py-2 max-w-3xl mx-auto w-full">
                  <PlannedActionsBanner state={autoActionState} onUndo={undoAutoActions} />
                </div>
              )}
              {pendingAction && (
                <div className="px-4 mb-4 max-w-3xl mx-auto w-full">
                  <InlineConfirmationCard
                    title={pendingAction.message || t("chat.chatMira.allowAction")}
                    description={pendingAction.tool ? t("chat.chatMira.requested", { tool: pendingAction.tool }) : undefined}
                    onAllowOnce={confirmPending}
                    onDontAllow={rejectPending}
                    onAlwaysAllow={() => trustSkillInSession(pendingAction.tool)}
                  />
                </div>
              )}
              {clarificationPrompt && (
                <div className="px-4 mb-4 max-w-3xl mx-auto w-full">
                  <ClarificationPrompt
                    prompt={clarificationPrompt}
                    onConfirm={confirmClarification}
                    onCancel={dismissClarification}
                  />
                </div>
              )}
              {error && (
                <div className="mx-4 mb-4 p-4 bg-red-50 rounded-xl border border-red-200 shadow-sm max-w-3xl mx-auto w-full">
                  <div className="text-sm text-red-800 font-medium">
                    {String(error.message || error)}
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 bg-white border-t border-neutral-100">
              <div className="max-w-3xl mx-auto w-full">
                <ChatInput onSend={({ message }) => sendMessage(message)} disabled={isStreaming} />
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
  const { t } = useTranslation();
  if (!state) return null;
  const actions = Array.isArray(state.actions) ? state.actions : [];
  let statusLabel = t("chat.chatMira.plannedActions.running");
  if (state.status === "executed") statusLabel = t("chat.chatMira.plannedActions.completed");
  if (state.status === "error") statusLabel = t("chat.chatMira.plannedActions.failed", { error: state.error || t("chat.chatMira.plannedActions.unknownError") });

  return (
    <div className="rounded-lg border border-sky-200 bg-sky-50/70 p-3 text-xs text-slate-700">
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-slate-800">{t("chat.chatMira.plannedActions.title")}</span>
        <button
          type="button"
          onClick={onUndo}
          className="text-slate-500 underline-offset-2 hover:underline"
        >
          {t("chat.chatMira.plannedActions.undo")}
        </button>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {actions.map((action, index) => (
          <span
            key={`${state.id}-${index}`}
            className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-800"
          >
            {String(action.action || t("chat.chatMira.plannedActions.defaultAction")).replace(/_/g, " ")}
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
  const { t } = useTranslation();
  const starterPrompts = [
    {
      icon: Users,
      title: t("chat.chatMira.emptyState.prompts.customerAnalysis.title"),
      prompt: t("chat.chatMira.emptyState.prompts.customerAnalysis.prompt"),
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: TrendingUp,
      title: t("chat.chatMira.emptyState.prompts.salesPerformance.title"),
      prompt: t("chat.chatMira.emptyState.prompts.salesPerformance.prompt"),
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: FileText,
      title: t("chat.chatMira.emptyState.prompts.pendingTasks.title"),
      prompt: t("chat.chatMira.emptyState.prompts.pendingTasks.prompt"),
      color: "from-green-500 to-emerald-500",
    },
    {
      icon: Sparkles,
      title: t("chat.chatMira.emptyState.prompts.recommendations.title"),
      prompt: t("chat.chatMira.emptyState.prompts.recommendations.prompt"),
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
          <h2 className="text-2xl font-bold text-neutral-900">{t("chat.chatMira.emptyState.title")}</h2>
          <p className="text-neutral-600 text-base max-w-md mx-auto">
            {t("chat.chatMira.emptyState.subtitle")}
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
            {t("chat.chatMira.emptyState.tips")}
          </p>
        </div>
      </div>
    </div>
  );
}
