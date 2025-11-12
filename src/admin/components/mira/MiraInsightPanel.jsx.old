import { AlertTriangle, BarChart2, Lightbulb } from "lucide-react";

const iconMap = {
  alert: AlertTriangle,
  metric: BarChart2,
  idea: Lightbulb,
};

export function MiraInsightPanel({ insights = [] }) {
  if (!insights.length) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-6 text-sm text-slate-500">
        No insights yet. Ask Mira for a summary to populate this feed.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {insights.map((item, index) => {
        const Icon = iconMap[item.type ?? "idea"] ?? Lightbulb;
        return (
          <div
            key={item.id ?? index}
            className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white/90 p-4 shadow-sm"
          >
            <span className="mt-1 rounded-full bg-primary-50 p-2 text-primary-600">
              <Icon className="h-4 w-4" />
            </span>
            <div className="flex-1 space-y-1">
              <p className="text-sm font-semibold text-slate-900">
                {item.title ?? "Insight"}
              </p>
              {item.description ? (
                <p className="text-xs text-slate-600">{item.description}</p>
              ) : null}
              {item.tag ? (
                <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                  {item.tag}
                </span>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
