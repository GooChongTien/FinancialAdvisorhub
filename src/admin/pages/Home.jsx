import React from "react";
import { useMachine } from "@xstate/react";
import { adviseUAdminApi } from "@/admin/api/adviseUAdminApi";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/admin/utils";
import { format, differenceInCalendarDays } from "date-fns";
import {
  Calendar,
  Radio,
  ChevronRight,
  Flame,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/admin/components/ui/card";
import { Button } from "@/admin/components/ui/button";
import { Skeleton } from "@/admin/components/ui/skeleton";
import { Badge } from "@/admin/components/ui/badge";
import { useToast } from "@/admin/components/ui/toast";
import { createAialRouter, Intent, createAialEvent } from "@/lib/aial";
import {
  registerLeadEnrichmentExecutor,
  detectLeadIntentFromPrompt,
  buildLeadIntent,
  extractLeadNameFromPrompt,
} from "@/lib/aial/intent/leadEnrichment.js";
import {
  registerMeetingPrepExecutor,
  detectMeetingIntentFromPrompt,
  buildMeetingIntent,
} from "@/lib/aial/intent/meetingPrep.js";
import {
  registerComplianceAlertExecutor,
  detectComplianceIntentFromPrompt,
  buildComplianceIntent,
} from "@/lib/aial/intent/complianceAlert.js";
import { useLeadDirectory } from "@/admin/state/LeadDirectoryProvider.jsx";
import { MiraCommandPanel } from "@/admin/components/mira/MiraCommandPanel.jsx";
import { useMiraInsights } from "@/admin/state/providers/MiraInsightsProvider.jsx";
import { miraCommandMachine } from "@/admin/state/machines/miraCommandMachine.js";
import { trackMiraEvent } from "@/admin/lib/miraTelemetry.js";
import useMiraPageData from "@/admin/hooks/useMiraPageData.js";

const STATUS_BADGE_STYLES = {
  "Not Initiated": "bg-slate-100 text-slate-700",
  Contacted: "bg-blue-100 text-blue-700",
  Proposal: "bg-yellow-100 text-yellow-700",
};

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

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ["tasks-today"],
    queryFn: () =>
      adviseUAdminApi.entities.Task.filter({
        date: format(new Date(), "yyyy-MM-dd"),
      }),
  });

  const { data: leads = [], isLoading: leadsLoading } = useQuery({
    queryKey: ["hot-leads"],
    queryFn: () => adviseUAdminApi.entities.Lead.list("-last_contacted", 5),
  });

  const { data: broadcasts = [], isLoading: broadcastsLoading } = useQuery({
    queryKey: ["recent-broadcasts"],
    queryFn: () =>
      adviseUAdminApi.entities.Broadcast.list("-published_date", 3),
  });

  const hotLeadsRaw = React.useMemo(() => {
    if (!leads?.length) return [];
    return leads
      .filter((lead) => {
        if (!lead.last_contacted) return false;
        const lastContacted = new Date(lead.last_contacted);
        if (Number.isNaN(lastContacted.getTime())) return false;
        return differenceInCalendarDays(new Date(), lastContacted) <= 7;
      })
      .sort((a, b) => {
        const timeA = new Date(a.last_contacted).getTime();
        const timeB = new Date(b.last_contacted).getTime();
        return timeB - timeA;
      })
      .slice(0, 3);
  }, [leads]);

  const debugParams = React.useMemo(
    () => new URLSearchParams(location.search),
    [location.search],
  );
  const forceEmptyHotLeads = debugParams.get("debugHotLeads") === "empty";
  const hotLeads = forceEmptyHotLeads ? [] : hotLeadsRaw;
  const insightsCount = globalInsights?.length ?? 0;
  const hotLeadCount = hotLeads.length;
  const historyCount = commandHistory?.length ?? 0;

  useMiraPageData(
    () => ({
      view: "home_dashboard",
      activeMode,
      persona,
      isRunningCommand,
      isStreaming,
      hotLeadCount,
      insightsCount,
      historyCount,
    }),
    [activeMode, persona, isRunningCommand, isStreaming, hotLeadCount, insightsCount, historyCount],
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
      leadDirectory,
      tasks,
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

  const pendingAction = commandState.context.pendingAction ?? null;

  const confirmPendingAction = React.useCallback(
    async () => {
      const item = pendingAction;
      if (!item?.intent) {
        send({ type: "CLEAR_PENDING_ACTION" });
        return;
      }
      try {
        const execution = await Intent.executeIntent(item.intent, {
          navigate,
          createPageUrl,
          event: createAialEvent({ intent: item.intent?.type ?? "advisor.action" }),
          leadDirectory,
          tasks,
        });
        send({ type: "EXECUTION_COMPLETED", execution });
        send({ type: "CONFIRM_PENDING_ACTION" });
        showToast({
          type: execution?.status === "completed" ? "success" : execution?.status === "error" ? "error" : "default",
          title: execution?.status === "completed" ? "Action executed" : execution?.status === "error" ? "Action failed" : "Action processed",
          description: execution?.result?.message ?? execution?.error ?? "The requested action has been processed.",
        });
      } catch (error) {
        console.error("[Home] Confirm action failed", error);
        showToast({
          type: "error",
          title: "Action failed",
          description: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
    [pendingAction, navigate, createPageUrl, leadDirectory, tasks, send, showToast],
  );

  const rejectPendingAction = React.useCallback(() => {
    send({ type: "REJECT_PENDING_ACTION" });
  }, [send]);

  // Show Today's Reminders or Hot Leads based on availability
  const showRemindersWidget = tasks.length > 0;

  // Default Dashboard View
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <div className="mx-auto max-w-5xl px-6 py-8 md:py-12">
        <div className="mb-8 space-y-6">
          <div className="text-center">
            <div className="mb-6 flex items-center justify-center">
              <div className="rounded-full bg-gradient-to-br from-pink-400 via-purple-400 to-sky-400 p-4 shadow-lg">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="mb-2 bg-gradient-to-r from-primary-600 via-blue-600 to-purple-600 bg-clip-text text-4xl font-bold text-transparent md:text-5xl">
              {getGreeting()}, {user?.full_name?.split(" ")[0] || "Advisor"}
            </h1>
            <p className="text-lg text-slate-600">
              I'm <span className="font-semibold text-primary-600">Mira</span>,
              ready to help with leads, proposals, and performance insights.
            </p>
          </div>

          <div className="space-y-6">
            <MiraCommandPanel
              onSubmit={handleCommandRun}
              isRunning={isRunningCommand}
              isStreaming={isStreaming}
              onStopStreaming={stopStreaming}
            />
            {commandHistory.length > 0 && (
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 text-xs text-slate-600">
                <p className="mb-2 font-semibold text-slate-800">
                  Recent commands
                </p>
                <ul className="space-y-1">
                  {commandHistory.map((item, index) => (
                    <li
                      key={`${item}-${index}`}
                      className="flex items-start gap-2"
                    >
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary-400" />
                      <button
                        type="button"
                        className="text-left text-slate-600 underline-offset-2 hover:text-primary-600 hover:underline"
                        onClick={() => handleCommandRun(item)}
                        disabled={isRunningCommand || isStreaming}
                      >
                        {item}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {renderedResponse && (
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-700 shadow-inner">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="font-semibold text-slate-900">Mira Summary</p>
                  <div className="flex items-center gap-2">
                    {isStreaming && (
                      <button
                        type="button"
                        onClick={stopStreaming}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
                      >
                        Stop streaming
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleCopyResponse}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={!renderedResponse}
                    >
                      Copy
                    </button>
                  </div>
                </div>
                <pre
                  className="whitespace-pre-wrap text-sm leading-relaxed"
                  aria-live="polite"
                  aria-atomic="true"
                  role="log"
                >
                  {renderedResponse}
                </pre>
                {isStreaming && (
                  <p className="mt-2 text-xs text-slate-500">
                    Streaming response in progress...
                  </p>
                )}
                {!isStreaming && (
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500">
                      Was this helpful?
                    </span>
                    <button
                      type="button"
                      onClick={() => handleFeedback("positive")}
                      className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-primary-200 hover:text-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={Boolean(userFeedback)}
                      aria-pressed={userFeedback === "positive"}
                      aria-label="Mark response helpful"
                    >
                      <span aria-hidden="true">dY`?</span> Helpful
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFeedback("neutral")}
                      className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-primary-200 hover:text-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={Boolean(userFeedback)}
                      aria-pressed={userFeedback === "neutral"}
                      aria-label="Mark response as fine"
                    >
                      <span aria-hidden="true">dY~?</span> It's OK
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFeedback("negative")}
                      className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-primary-200 hover:text-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={Boolean(userFeedback)}
                      aria-pressed={userFeedback === "negative"}
                      aria-label="Mark response unhelpful"
                    >
                      <span aria-hidden="true">dY`Z</span> Needs work
                    </button>
                    {userFeedback && (
                      <span className="text-xs font-medium text-primary-600">
                        Feedback recorded - thanks!
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Dashboard Widgets - 3 Columns */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Widget 1: Today's Reminders OR Hot Leads */}
            {showRemindersWidget ? (
              <Card className="border-slate-200/60 bg-white/80 shadow-md backdrop-blur-sm transition-shadow hover:shadow-lg">
                <CardHeader className="border-b border-slate-100 pb-4">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <div className="rounded-lg bg-primary-50 p-2">
                      <Calendar className="h-4 w-4 text-primary-600" />
                    </div>
                    Today's Reminders
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  {tasksLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {tasks.slice(0, 3).map((task) => (
                        <div
                          key={task.id}
                          className="rounded-lg border border-slate-100 bg-slate-50/50 p-3 transition-colors hover:bg-slate-100"
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-slate-900">
                              {task.title}
                            </p>
                            <span className="text-xs font-medium text-primary-600">
                              {task.time}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-slate-500">
                            {task.type} - {task.linked_lead_name}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-4 w-full justify-center gap-1 text-primary-600 hover:bg-primary-50 hover:text-primary-700"
                    onClick={() => navigate(createPageUrl("ToDo"))}
                  >
                    View All
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-slate-200/60 bg-white/80 shadow-md backdrop-blur-sm transition-shadow hover:shadow-lg">
                <CardHeader className="border-b border-slate-100 pb-4">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <div className="rounded-lg bg-orange-50 p-2">
                      <Flame className="h-4 w-4 text-orange-600" />
                    </div>
                    Hot Leads
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  {leadsLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : hotLeads.length === 0 ? (
                    <div className="py-6 text-center text-slate-400">
                      <Flame className="mx-auto mb-2 h-10 w-10 opacity-30" />
                      <p className="text-sm">No hot leads yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {hotLeads.map((lead) => {
                        const lastContactedLabel = lead.last_contacted
                          ? format(new Date(lead.last_contacted), "MMM d")
                          : "No contact";
                        return (
                          <div
                            key={lead.id}
                            onClick={() =>
                              navigate(
                                createPageUrl(`CustomerDetail?id=${lead.id}`),
                              )
                            }
                            className="cursor-pointer rounded-lg border border-slate-100 bg-slate-50/50 p-3 transition-colors hover:bg-slate-100"
                          >
                            <p className="text-sm font-semibold text-slate-900">
                              {lead.name}
                            </p>
                            <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                              <span>Last: {lastContactedLabel}</span>
                              <Badge variant="secondary" className="text-xs">
                                {lead.status || "New"}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-4 w-full justify-center gap-1 text-primary-600 hover:bg-primary-50 hover:text-primary-700"
                    onClick={() =>
                      navigate(
                        createPageUrl(
                          "Customer?relationship=lead&temperature=warm",
                        ),
                      )
                    }
                  >
                    View All
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Widget 2: Performance Snapshot */}
            <Card className="border-slate-200/60 bg-white/80 shadow-md backdrop-blur-sm transition-shadow hover:shadow-lg">
              <CardHeader className="border-b border-slate-100 pb-4">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <div className="rounded-lg bg-purple-50 p-2">
                    <TrendingUp className="h-4 w-4 text-purple-600" />
                  </div>
                  Performance Snapshot
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {(() => {
                  const now = new Date();
                  const startOfYear = new Date(now.getFullYear(), 0, 1);
                  const leadsYTD = (leads || []).filter(
                    (l) =>
                      l?.created_at && new Date(l.created_at) >= startOfYear,
                  ).length;
                  const targetYTD = 200;
                  const pct = Math.max(
                    0,
                    Math.min(100, Math.round((leadsYTD / targetYTD) * 100)),
                  );
                  return (
                    <>
                      <div className="flex items-center justify-center gap-4 py-2">
                        <div
                          className="relative h-24 w-24 rounded-full"
                          style={{
                            background: `conic-gradient(#8b5cf6 ${pct}%, #e2e8f0 0)`,
                          }}
                        >
                          <div className="absolute inset-2 flex items-center justify-center rounded-full bg-white">
                            <span className="text-xl font-bold text-slate-900">
                              {pct}%
                            </span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs text-slate-500">
                            YTD Progress
                          </div>
                          <div className="text-2xl font-bold text-slate-900">
                            {leadsYTD}
                            <span className="text-base text-slate-400">
                              {" "}
                              / {targetYTD}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500">
                            New Leads
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex items-center gap-2 rounded-full bg-primary-600 px-4 py-2 text-white shadow-sm transition hover:bg-primary-700"
                          onClick={() => navigate(createPageUrl("Analytics"))}
                        >
                          <span className="text-sm font-medium">
                            View Details
                          </span>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Widget 3: Broadcast */}
            <Card className="border-slate-200/60 bg-white/80 shadow-md backdrop-blur-sm transition-shadow hover:shadow-lg">
              <CardHeader className="border-b border-slate-100 pb-4">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <div className="rounded-lg bg-blue-50 p-2">
                    <Radio className="h-4 w-4 text-blue-600" />
                  </div>
                  Broadcast
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {broadcastsLoading ? (
                  <div className="space-y-2">
                    {[1, 2].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : broadcasts.length === 0 ? (
                  <div className="py-6 text-center text-slate-400">
                    <Radio className="mx-auto mb-2 h-10 w-10 opacity-30" />
                    <p className="text-sm">No announcements</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {broadcasts.slice(0, 2).map((broadcast) => (
                      <div
                        key={broadcast.id}
                        className="rounded-lg border border-slate-100 bg-slate-50/50 p-3"
                      >
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <h4 className="text-sm font-semibold text-slate-900">
                            {broadcast.title}
                          </h4>
                          <Badge
                            variant="secondary"
                            className="shrink-0 text-xs"
                          >
                            {broadcast.category}
                          </Badge>
                        </div>
                        <p className="line-clamp-2 text-xs text-slate-600">
                          {broadcast.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-4 w-full justify-center gap-1 text-primary-600 hover:bg-primary-50 hover:text-primary-700"
                  onClick={() => navigate(createPageUrl("Broadcast"))}
                >
                  View All
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
