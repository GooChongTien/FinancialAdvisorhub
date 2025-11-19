import { useCallback, useMemo, useState } from "react";
import type { FC } from "react";
import { AlertTriangle, Info, Lightbulb, Loader2 } from "lucide-react";
import type { ProactiveInsight } from "@/lib/mira/types.ts";
import useUIActionExecutor from "@/lib/mira/useUIActionExecutor.ts";

const PRIORITY_META = {
  critical: {
    icon: AlertTriangle,
    badge: "bg-rose-100 text-rose-700 border border-rose-200",
    text: "Critical",
  },
  important: {
    icon: Lightbulb,
    badge: "bg-amber-100 text-amber-700 border border-amber-200",
    text: "Important",
  },
  info: {
    icon: Info,
    badge: "bg-slate-100 text-slate-600 border border-slate-200",
    text: "Info",
  },
} as const;

function formatRelative(dateString?: string) {
  if (!dateString) return null;
  const value = new Date(dateString);
  if (Number.isNaN(value.getTime())) return null;
  const diffDays = Math.round((Date.now() - value.getTime()) / 86400000);
  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  const weeks = Math.round(diffDays / 7);
  if (weeks < 4) return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
  return value.toLocaleDateString();
}

export interface InsightCardProps {
  insight: ProactiveInsight;
  onDismiss?: (insight: ProactiveInsight) => void;
}

export const InsightCard: FC<InsightCardProps> = ({ insight, onDismiss }) => {
  const executor = useUIActionExecutor();
  const [isExecuting, setIsExecuting] = useState(false);
  const priority = PRIORITY_META[insight.priority] ?? PRIORITY_META.info;
  const timestamp = useMemo(() => formatRelative(insight.updated_at), [insight.updated_at]);
  const canExecute = Array.isArray(insight.ui_actions) && insight.ui_actions.length > 0;

  const handleExecute = useCallback(async () => {
    if (!canExecute) return;
    try {
      setIsExecuting(true);
      await executor.executeActions(insight.ui_actions);
    } catch (error) {
      console.warn("[MiraInsight] action execution failed", error);
    } finally {
      setIsExecuting(false);
    }
  }, [canExecute, executor, insight.ui_actions]);

  const handleDismiss = useCallback(() => {
    if (!insight.dismissible) return;
    onDismiss?.(insight);
  }, [insight, onDismiss]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${priority.badge}`}>
            <priority.icon className="h-3.5 w-3.5" />
            {priority.text}
          </span>
          {insight.tag && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">
              {insight.tag}
            </span>
          )}
        </div>
        {timestamp && (
          <span className="text-[11px] text-slate-400">{timestamp}</span>
        )}
      </div>
      <div className="mt-3 space-y-1">
        <p className="text-sm font-semibold text-slate-900">{insight.title}</p>
        {insight.summary && <p className="text-sm text-slate-600">{insight.summary}</p>}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleExecute}
          disabled={!canExecute || isExecuting}
          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3.5 py-1.5 text-sm font-semibold text-white transition enabled:hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isExecuting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          {insight.ctaLabel || "Open"}
        </button>
        {insight.dismissible !== false && (
          <button
            type="button"
            onClick={handleDismiss}
            className="text-sm font-medium text-slate-500 underline-offset-2 hover:text-slate-700 hover:underline"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
};

export default InsightCard;
