import { useEffect, useState, useCallback } from "react";
import { AlertTriangle, BarChart2, Lightbulb, Loader2, RefreshCcw, X } from "lucide-react";
import { useUIActionExecutor } from "@/lib/mira/useUIActionExecutor";

const iconMap = {
  alert: AlertTriangle,
  metric: BarChart2,
  idea: Lightbulb,
};

const priorityStyles = {
  critical: "border-red-200 bg-red-50/90",
  important: "border-amber-200 bg-amber-50/90",
  info: "border-blue-100 bg-blue-50/50",
};

/**
 * MiraInsightPanel - Fetches and displays proactive insights
 * Auto-refreshes every 5 minutes
 */
export function MiraInsightPanel({ advisorId }) {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const executor = useUIActionExecutor();

  const fetchInsights = useCallback(async () => {
    if (!advisorId) {
      setInsights([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/functions/v1/agent-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode: "insights",
          metadata: { advisorId },
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch insights: ${response.statusText}`);
      }

      const data = await response.json();
      setInsights(data.insights || []);
    } catch (err) {
      console.error("Error fetching insights:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [advisorId]);

  useEffect(() => {
    // Fetch insights on mount
    fetchInsights();

    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchInsights, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [fetchInsights]);

  const handleInsightClick = async (insight) => {
    if (insight.ui_actions && insight.ui_actions.length > 0) {
      await executor.executeActions(insight.ui_actions);
    }
  };

  const dismissInsight = (insightId) => {
    setInsights((prev) => prev.filter((i) => i.id !== insightId));
  };

  if (loading && insights.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-6 text-sm text-slate-500">
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading insights…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        <p>{error}</p>
        <button
          type="button"
          onClick={fetchInsights}
          className="mt-3 flex items-center gap-2 text-xs text-red-600 hover:text-red-800"
        >
          <RefreshCcw className="h-3 w-3" />
          Try Again
        </button>
      </div>
    );
  }

  if (insights.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-6 text-sm text-slate-500">
        <div className="space-y-3">
          <p>No insights yet. Check back soon for updates.</p>
          <button
            type="button"
            onClick={fetchInsights}
            className="flex items-center gap-2 text-xs text-slate-600 hover:text-slate-800"
          >
            <RefreshCcw className="h-3 w-3" />
            Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-slate-700">Insights & Alerts</h3>
        <button
          type="button"
          onClick={fetchInsights}
          className="text-slate-400 hover:text-slate-600 transition"
          title="Refresh insights"
        >
          <RefreshCcw className="h-4 w-4" />
        </button>
      </div>

      {insights.map((insight) => {
        const Icon = iconMap[insight.type] || Lightbulb;
        const style = priorityStyles[insight.priority] || priorityStyles.info;
        const hasActions = insight.ui_actions && insight.ui_actions.length > 0;

        return (
          <div
            key={insight.id}
            className={`relative flex items-start gap-3 rounded-xl border p-4 shadow-sm ${style}`}
          >
            {insight.dismissible && (
              <button
                type="button"
                onClick={() => dismissInsight(insight.id)}
                className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 transition"
                title="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            <span className={`mt-1 rounded-full p-2 ${
              insight.priority === "critical"
                ? "bg-red-100 text-red-600"
                : insight.priority === "important"
                ? "bg-amber-100 text-amber-600"
                : "bg-blue-100 text-blue-600"
            }`}>
              <Icon className="h-4 w-4" />
            </span>

            <div className="flex-1 space-y-1 pr-6">
              <p className="text-sm font-semibold text-slate-900">{insight.title}</p>
              {insight.summary && (
                <p className="text-xs text-slate-600">{insight.summary}</p>
              )}
              {insight.tag && (
                <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                  {insight.tag}
                </span>
              )}

              {hasActions && (
                <button
                  type="button"
                  onClick={() => handleInsightClick(insight)}
                  className="mt-2 text-xs font-medium text-primary-600 hover:text-primary-700 hover:underline"
                >
                  View Details →
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
