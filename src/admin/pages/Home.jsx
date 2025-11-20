import { adviseUAdminApi } from "@/admin/api/adviseUAdminApi";
import { MiraCommandPanel } from "@/admin/components/mira/MiraCommandPanel.jsx";
import { useToast } from "@/admin/components/ui/toast";
import useMiraPageData from "@/admin/hooks/useMiraPageData.js";
import { trackMiraEvent } from "@/admin/lib/miraTelemetry.js";
import { useLeadDirectory } from "@/admin/state/LeadDirectoryProvider.jsx";
import { miraCommandMachine } from "@/admin/state/machines/miraCommandMachine.js";
import { useMiraInsights } from "@/admin/state/providers/MiraInsightsProvider.jsx";
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
  const { showToast } = useToast();
  const { leads: leadDirectory } = useLeadDirectory();
  const { insights: globalInsights } = useMiraInsights();
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
    async (input) => {
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
      // Immediately open full ChatMira; all approvals and actions happen there
      const from = encodeURIComponent(location.pathname + location.search);
      const q = new URLSearchParams({ from, prompt: trimmed });
      navigate(`${createPageUrl("ChatMira")}?${q.toString()}`);
      return;
    },
    [
      isRunningCommand,
      clearStreamingTimer,
      send,
      persona,
      activeMode,
      router,
      navigate,
      createPageUrl,
      showToast,
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

  // Starter Conversation Buttons
  const starterPrompts = [
    {
      title: "Customer Analysis",
      description: "Show me my top customers by premium value",
      icon: Users,
      color: "bg-blue-50 text-blue-600",
    },
    {
      title: "Sales Performance",
      description: "What are my sales trends for this quarter?",
      icon: TrendingUp,
      color: "bg-purple-50 text-purple-600",
    },
    {
      title: "Pending Tasks",
      description: "Show me my pending tasks and upcoming appointments",
      icon: CheckSquare,
      color: "bg-green-50 text-green-600",
    },
    {
      title: "Recommendations",
      description: "Give me product recommendations for my customer base",
      icon: Sparkles,
      color: "bg-orange-50 text-orange-600",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50/30 px-4 py-12">
      <div className="mx-auto w-full max-w-3xl space-y-8 text-center">
        {/* Header */}
        <div className="space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 shadow-lg shadow-blue-200">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 md:text-4xl">
            Chat with Mira
          </h1>
          <p className="mx-auto max-w-lg text-lg text-slate-600">
            Your AI insurance assistant is here to help with customers, analytics, tasks, and more.
          </p>
        </div>

        {/* Starter Buttons Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {starterPrompts.map((item) => (
            <button
              key={item.title}
              onClick={() => handleCommandRun(item.description)}
              className="group flex flex-col items-start rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all hover:border-blue-200 hover:shadow-md"
            >
              <div className={`mb-3 rounded-lg p-2 ${item.color}`}>
                <item.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-slate-900 group-hover:text-blue-600">
                {item.title}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {item.description}
              </p>
            </button>
          ))}
        </div>

        {/* Chat Input */}
        <div className="mx-auto w-full max-w-2xl pt-4">
          <p className="mb-4 text-sm text-slate-500">
            Try asking questions in natural language. I can help you navigate, analyze data, and complete tasks.
          </p>
          <MiraCommandPanel
            onSubmit={handleCommandRun}
            isRunning={isRunningCommand}
            isStreaming={isStreaming}
            onStopStreaming={stopStreaming}
            placeholder="Ask Mira anything..."
            className="shadow-lg"
          />
        </div>
      </div>
    </div>
  );
}
