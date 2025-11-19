import { RefreshCcw, Sparkles } from "lucide-react";
import { InsightCard } from "./InsightCard";
import { useMiraInsights } from "@/admin/hooks/useMiraInsights.ts";

function formatTimestamp(value: Date | null) {
  if (!value) return "Just now";
  return value.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function InsightSidebar() {
  const { insights, isLoading, error, refresh, dismiss, lastUpdatedAt } = useMiraInsights();
  const hasContent = insights.length > 0;

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">Workspace insights</p>
          <p className="text-xs text-slate-500">Auto-refreshes every few minutes.</p>
        </div>
        <button
          type="button"
          onClick={refresh}
          disabled={isLoading}
          className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-70"
        >
          <RefreshCcw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="text-[11px] uppercase tracking-wide text-slate-400">
        Last updated {formatTimestamp(lastUpdatedAt)}
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-sm text-rose-700">
          {error}
          <button
            type="button"
            onClick={refresh}
            className="ml-2 text-rose-600 underline-offset-2 hover:underline"
          >
            Try again
          </button>
        </div>
      ) : null}

      {!error && !hasContent && !isLoading ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-6 text-center text-sm text-slate-500">
          <Sparkles className="mb-2 h-5 w-5 text-slate-400" />
          <p>All caught up. Mira will surface alerts when it spots drift.</p>
        </div>
      ) : null}

      <div className="flex-1 space-y-3 overflow-auto pr-1">
        {insights.map((insight) => (
          <InsightCard key={insight.id} insight={insight} onDismiss={dismiss} />
        ))}
        {isLoading && hasContent ? (
          <div className="text-center text-xs text-slate-400">Updating insights�?�</div>
        ) : null}
      </div>
    </div>
  );
}

export default InsightSidebar;
