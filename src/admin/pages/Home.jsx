import { adviseUAdminApi } from "@/admin/api/adviseUAdminApi";
import { MiraCommandPanel } from "@/admin/components/mira/MiraCommandPanel.jsx";
import { useToast } from "@/admin/components/ui/toast";
import useMiraPageData from "@/admin/hooks/useMiraPageData.js";
import { trackMiraEvent } from "@/admin/lib/miraTelemetry.js";
import { useLeadDirectory } from "@/admin/state/LeadDirectoryProvider.jsx";
import { miraCommandMachine } from "@/admin/state/machines/miraCommandMachine.js";
import { useMiraInsights } from "@/admin/state/providers/MiraInsightsProvider.jsx";
import { useMiraMode } from "@/admin/state/useMiraMode";
import { useAgentChatStore } from "@/admin/state/providers/AgentChatProvider.jsx";
import { createPageUrl } from "@/admin/utils";
import { createAialEvent, createAialRouter } from "@/lib/aial";
import {
  buildComplianceIntent,
  detectComplianceIntentFromPrompt,
  registerComplianceAlertExecutor,
} from "@/lib/aial/intent/complianceAlert.js";
import {
  buildLeadIntent,
  detectLeadIntentFromPrompt,
  extractLeadNameFromPrompt,
  registerLeadEnrichmentExecutor,
} from "@/lib/aial/intent/leadEnrichment.js";
import {
  buildMeetingIntent,
  detectMeetingIntentFromPrompt,
  registerMeetingPrepExecutor,
} from "@/lib/aial/intent/meetingPrep.js";
import {
  detectIntentFromPrompt,
  buildNavigationUrl,
  shouldNavigate,
  getStarterPrompts,
} from "@/lib/aial/intent/intentRouting.js";
import { useQuery } from "@tanstack/react-query";
import { useMachine } from "@xstate/react";
import {
  CheckSquare,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

function resolveIntentFromPrompt(prompt, leadName) {
  if (detectComplianceIntentFromPrompt(prompt)) {
    return {
      name: "compliance.alert",
      fallback: () => buildComplianceIntent(prompt),
    };
  }
  if (detectMeetingIntentFromPrompt(prompt)) {
    return {
      name: "meeting.prep",
      fallback: () => buildMeetingIntent(prompt),
    };
  }
  if (detectLeadIntentFromPrompt(prompt)) {
    return {
      name: "lead.enrichment",
      fallback: () =>
        buildLeadIntent(prompt) ?? buildLeadIntent(`${leadName ?? ""}`),
    };
  }
  return {
    name: "advisor.action.summary",
    fallback: null,
  };
}

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { leads: leadDirectory } = useLeadDirectory();
  const { insights: globalInsights } = useMiraInsights();
  const { openSplit } = useMiraMode();
  const { sendMessage } = useAgentChatStore();
  const [commandState, send] = useMachine(miraCommandMachine);
  const activeMode = commandState.context.mode;
  const persona = commandState.context.persona;
  const assistantResponse = commandState.context.response;
  const intentResult = commandState.context.intent;
  const executionResult = commandState.context.execution;
  const commandHistory = commandState.context.history;
  const lastPrompt = commandState.context.lastPrompt;
  const userFeedback = commandState.context.feedback;
  const isRunningCommand = commandState.matches("running");
  const isStreaming = commandState.matches("streaming");
  const [streamedResponse, setStreamedResponse] = React.useState("");
  const streamingTimerRef = React.useRef(null);
  const router = React.useMemo(
    () => createAialRouter(),
    [],
  );

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["current-user"],
    queryFn: () => adviseUAdminApi.auth.me(),
  });

  const historyCount = commandHistory?.length ?? 0;

  useMiraPageData(
    () => ({
      view: "home_dashboard",
      activeMode,
      persona,
      isRunningCommand,
      isStreaming,
      hotLeadCount: 0,
      insightsCount: 0,
      historyCount,
    }),
    [activeMode, persona, isRunningCommand, isStreaming, historyCount],
  );

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  React.useEffect(() => {
    const cleanups = [
      registerLeadEnrichmentExecutor(),
      registerMeetingPrepExecutor({
        fetchTasks: () => adviseUAdminApi.entities.Task.list("-date", 20),
      }),
      registerComplianceAlertExecutor(),
    ];
    return () => {
      cleanups.forEach((dispose) => dispose?.());
    };
  }, []);

  const clearStreamingTimer = React.useCallback(() => {
    if (streamingTimerRef.current) {
      clearInterval(streamingTimerRef.current);
      streamingTimerRef.current = null;
    }
  }, []);
  const stopStreaming = React.useCallback(() => {
    clearStreamingTimer();
    if (assistantResponse?.content) {
      setStreamedResponse(assistantResponse.content);
    }
    send({ type: "STOP_STREAM" });
    void trackMiraEvent("mira.stream_stopped", {
      persona,
      mode: activeMode,
      prompt: lastPrompt,
      source: "home-dashboard",
    });
  }, [
    assistantResponse,
    clearStreamingTimer,
    send,
    persona,
    activeMode,
    lastPrompt,
  ]);

  const renderedResponse = streamedResponse || assistantResponse?.content || "";

  React.useEffect(() => {
    clearStreamingTimer();
    if (!assistantResponse?.content) {
      setStreamedResponse("");
      return;
    }
    const tokens = assistantResponse.content.split(/(\s+)/);
    let index = 0;
    setStreamedResponse("");
    const timerId = setInterval(() => {
      index += 1;
      setStreamedResponse(tokens.slice(0, index).join(""));
      if (index >= tokens.length) {
        clearStreamingTimer();
        send({ type: "STREAM_COMPLETE" });
      }
    }, 35);
    streamingTimerRef.current = timerId;
    return () => {
      clearInterval(timerId);
      if (streamingTimerRef.current === timerId) {
        streamingTimerRef.current = null;
      }
    };
  }, [assistantResponse, clearStreamingTimer, send]);

  const handleCommandRun = React.useCallback(
    async (input, options = {}) => {
      const trimmed = input.trim();
      if (!trimmed || isRunningCommand) return;

      const startedAt = performance.now();
      clearStreamingTimer();
      setStreamedResponse("");
      send({ type: "SET_MODE", mode: "command" });
      send({ type: "SUBMIT", prompt: trimmed, timestamp: Date.now() });

      const leadName = extractLeadNameFromPrompt(trimmed);
      const resolved = resolveIntentFromPrompt(trimmed, leadName);
      const intentName = resolved.name;
      const eventPayload = createAialEvent({
        intent: intentName,
        payload: { prompt: trimmed, leadName, persona },
      });

      void trackMiraEvent("mira.command_submitted", {
        persona,
        mode: activeMode,
        promptLength: trimmed.length,
        hasLeadReference: Boolean(leadName),
        intentGuess: intentName,
        source: "home-dashboard",
      });

      // Determine if we should navigate based on starter prompt configuration
      const shouldNavigateDirectly = options.navigateToRoute;

      if (shouldNavigateDirectly) {
        // Open split view first, then navigate, then send message after rendering
        openSplit();
        navigate(shouldNavigateDirectly);

        // Use requestAnimationFrame to ensure navigation and render complete
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            sendMessage(trimmed);
          });
        });

        void trackMiraEvent("mira.smart_navigation", {
          persona,
          mode: activeMode,
          intentGuess: intentName,
          targetRoute: shouldNavigateDirectly,
          source: "home-dashboard-starter",
        });
      } else {
        // Detect intent from prompt and navigate if applicable
        const detectedIntent = detectIntentFromPrompt(trimmed);
        const navigationUrl = buildNavigationUrl(detectedIntent);

        if (navigationUrl) {
          openSplit();
          navigate(navigationUrl);

          // Use requestAnimationFrame to ensure navigation and render complete
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              sendMessage(trimmed);
            });
          });

          void trackMiraEvent("mira.smart_navigation", {
            persona,
            mode: activeMode,
            detectedIntent,
            targetRoute: navigationUrl,
            source: "home-dashboard-auto",
          });
        } else {
          // Default behavior: just open split view and send immediately
          openSplit();
          sendMessage(trimmed);
        }
      }

      return;
    },
    [
      isRunningCommand,
      clearStreamingTimer,
      send,
      persona,
      activeMode,
      router,
      openSplit,
      sendMessage,
      showToast,
      navigate,
    ],
  );

  const handleCopyResponse = React.useCallback(async () => {
    const text = streamedResponse || assistantResponse?.content || "";
    if (!text) return;
    if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
      showToast({
        type: "warning",
        title: "Copy unavailable",
        description: "Clipboard access is not supported in this browser.",
      });
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      showToast({
        type: "success",
        title: "Response copied",
        description: "Mira's answer is now on your clipboard.",
      });
    } catch (error) {
      console.error("[Home] Copy response failed", error);
      showToast({
        type: "error",
        title: "Copy failed",
        description:
          error instanceof Error
            ? error.message
            : "Unable to copy the response right now.",
      });
    }
  }, [assistantResponse, showToast, streamedResponse]);

  const handleFeedback = React.useCallback(
    (rating) => {
      if (!rating || userFeedback) return;
      send({ type: "SET_FEEDBACK", feedback: rating });
      void trackMiraEvent("mira.command_feedback", {
        persona,
        mode: activeMode,
        prompt: lastPrompt,
        rating,
        source: "home-dashboard",
      });
      showToast({
        type: "success",
        title: "Thanks for the feedback",
        description: "We'll use it to fine-tune Mira's responses.",
      });
    },
    [userFeedback, send, persona, activeMode, lastPrompt, showToast],
  );

  const handleRetry = React.useCallback(() => {
    if (lastPrompt) {
      handleCommandRun(lastPrompt);
    }
  }, [handleCommandRun, lastPrompt]);

  // Starter Conversation Buttons with routing
  const starterPromptsConfig = React.useMemo(() => getStarterPrompts(), []);

  const starterPrompts = React.useMemo(() => [
    {
      ...starterPromptsConfig[0],
      icon: Users,
      color: "bg-blue-50 text-blue-600",
    },
    {
      ...starterPromptsConfig[1],
      icon: TrendingUp,
      color: "bg-purple-50 text-purple-600",
    },
    {
      ...starterPromptsConfig[2],
      icon: CheckSquare,
      color: "bg-green-50 text-green-600",
    },
    {
      ...starterPromptsConfig[3],
      icon: Sparkles,
      color: "bg-orange-50 text-orange-600",
    },
  ], [starterPromptsConfig]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50/30 px-4 py-12">
      <div className="mx-auto w-full max-w-3xl space-y-8 text-center">
        {/* Header */}
        <div className="space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 shadow-lg shadow-blue-200">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 md:text-4xl">
            {t("home.title")}
          </h1>
          <p className="mx-auto max-w-lg text-lg text-slate-600">
            {t("home.subtitle")}
          </p>
        </div>

        {/* Starter Buttons Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {starterPrompts.map((item) => (
            <button
              key={item.key}
              onClick={() => {
                const prompt = item.prompt || t(`home.prompts.${item.key}.prompt`);
                const targetRoute = item.route ? createPageUrl(item.route) : null;
                handleCommandRun(prompt, { navigateToRoute: targetRoute });
              }}
              className="group flex flex-col items-start rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all hover:border-blue-200 hover:shadow-md"
            >
              <div className={`mb-3 rounded-lg p-2 ${item.color}`}>
                <item.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-slate-900 group-hover:text-blue-600">
                {t(`home.prompts.${item.key}.title`)}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {t(`home.prompts.${item.key}.description`)}
              </p>
            </button>
          ))}
        </div>

        {/* Chat Input */}
        <div className="mx-auto w-full max-w-2xl pt-4">
          <p className="mb-4 text-sm text-slate-500">
            {t("home.hint")}
          </p>
          <MiraCommandPanel
            onSubmit={handleCommandRun}
            isRunning={isRunningCommand}
            isStreaming={isStreaming}
            onStopStreaming={stopStreaming}
            placeholder={t("home.placeholder")}
            className="shadow-lg"
          />
        </div>
      </div>
    </div>
  );
}
