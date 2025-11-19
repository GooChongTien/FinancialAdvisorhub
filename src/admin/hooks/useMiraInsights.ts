import { useCallback, useEffect, useRef, useState } from "react";
import { requestAgentJson } from "@/admin/api/agentClient.js";
import { useMiraContext } from "@/admin/state/providers/MiraContextProvider.jsx";
import { trackMiraEvent } from "@/admin/lib/miraTelemetry.js";
import supabase from "@/admin/api/supabaseClient.js";
import type { ProactiveInsight, UIAction, MiraContext } from "@/lib/mira/types.ts";

const DEFAULT_REFRESH_MS = 5 * 60 * 1000;

type HookOptions = {
  refreshInterval?: number;
};

function normalizeActions(candidate: unknown): UIAction[] | undefined {
  if (!Array.isArray(candidate)) return undefined;
  const result = candidate.filter(
    (action): action is UIAction => Boolean(action && typeof action === "object" && typeof action.action === "string"),
  );
  return result.length ? result : undefined;
}

function normalizeInsights(candidate: unknown): ProactiveInsight[] {
  if (!Array.isArray(candidate)) return [];
  return candidate
    .map((entry, index) => {
      if (!entry || typeof entry !== "object") return null;
      const typed = entry as Record<string, unknown>;
      const id = typeof typed.id === "string" && typed.id.trim() ? typed.id : `insight-${index}`;
      const title = typeof typed.title === "string" && typed.title.trim() ? typed.title : "Insight";
      const summary = typeof typed.summary === "string" && typed.summary.trim() ? typed.summary : "";
      const priority =
        typed.priority === "critical" || typed.priority === "important" || typed.priority === "info"
          ? typed.priority
          : "info";
      const module =
        typeof typed.module === "string" && typed.module.trim() ? (typed.module as ProactiveInsight["module"]) : "analytics";
      const normalized: ProactiveInsight = {
        id,
        title,
        summary,
        priority,
        module,
        tag: typeof typed.tag === "string" ? typed.tag : undefined,
        updated_at: typeof typed.updated_at === "string" ? typed.updated_at : undefined,
        ctaLabel: typeof typed.ctaLabel === "string" ? typed.ctaLabel : undefined,
        dismissible: typed.dismissible === undefined ? true : Boolean(typed.dismissible),
        ui_actions: normalizeActions(typed.ui_actions),
      };
      return normalized;
    })
    .filter((entry): entry is ProactiveInsight => entry !== null);
}

export function useMiraInsights(options: HookOptions = {}) {
  const { getContext } = useMiraContext();
  const [insights, setInsights] = useState<ProactiveInsight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [advisorId, setAdvisorId] = useState<string | null>(null);
  const [advisorReady, setAdvisorReady] = useState(false);
  const refreshInterval = options.refreshInterval ?? DEFAULT_REFRESH_MS;

  const abortControllerRef = useRef<AbortController | null>(null);
  const pollTimerRef = useRef<number | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (mounted) {
          setAdvisorId(data.user?.id ?? null);
        }
      } catch (err) {
        console.warn("[useMiraInsights] failed to resolve advisor id", err);
      } finally {
        if (mounted) {
          setAdvisorReady(true);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const fetchInsights = useCallback(async () => {
    if (!advisorReady) return;
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsLoading(true);
    setError(null);
    try {
      const context = typeof getContext === "function" ? getContext() : undefined;
      const payload: Record<string, unknown> = { mode: "insights" };
      if (advisorId) {
        payload.metadata = { advisorId };
      }
      if (context && context.module && context.page) {
        payload.context = context;
      }
      const response = await requestAgentJson(payload, { signal: controller.signal });
      const normalized = normalizeInsights(response?.insights);
      setInsights(normalized);
      setLastUpdatedAt(new Date());
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return;
      }
      const message = err instanceof Error ? err.message : "Unable to load insights";
      setError(message);
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [advisorReady, advisorId, getContext]);

  const refresh = useCallback(() => {
    void fetchInsights();
  }, [fetchInsights]);

  const persistDismissal = useCallback(
    async (insightId: string) => {
      if (!advisorId) return;
      try {
        await supabase
          .from("mira_insight_dismissals")
          .upsert(
            { advisor_id: advisorId, insight_id: insightId },
            { onConflict: "advisor_id,insight_id" },
          );
      } catch (err) {
        console.warn("[useMiraInsights] failed to persist dismissal", err);
      }
    },
    [advisorId],
  );

  const dismiss = useCallback(
    (insight: ProactiveInsight, reason: "user" | "auto" = "user") => {
      setInsights((prev) => prev.filter((item) => item.id !== insight.id));
      void persistDismissal(insight.id);
      void trackMiraEvent("mira.insight.dismissed", { insightId: insight.id, reason });
    },
    [persistDismissal],
  );

  useEffect(() => {
    if (!advisorReady) return;
    void fetchInsights();
    if (refreshInterval > 0) {
      pollTimerRef.current = window.setInterval(() => {
        void fetchInsights();
      }, refreshInterval);
    }
    return () => {
      abortControllerRef.current?.abort();
      if (pollTimerRef.current) {
        window.clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [advisorReady, fetchInsights, refreshInterval]);

  return {
    insights,
    isLoading,
    error,
    refresh,
    dismiss,
    lastUpdatedAt,
  };
}

export default useMiraInsights;
