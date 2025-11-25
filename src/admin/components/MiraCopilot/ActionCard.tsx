import { memo } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import type { SuggestedIntent } from "@/lib/mira/types.ts";

const MODULE_COLORS: Record<string, { badge: string; text: string }> = {
  customer: { badge: "bg-sky-100 text-sky-700", text: "Customer 360" },
  new_business: { badge: "bg-emerald-100 text-emerald-700", text: "New Business" },
  product: { badge: "bg-indigo-100 text-indigo-700", text: "Products" },
  analytics: { badge: "bg-amber-100 text-amber-700", text: "Analytics" },
  todo: { badge: "bg-rose-100 text-rose-700", text: "Tasks" },
  broadcast: { badge: "bg-purple-100 text-purple-700", text: "Broadcasts" },
  news: { badge: "bg-purple-100 text-purple-700", text: "News" },
  visualizer: { badge: "bg-cyan-100 text-cyan-700", text: "Visualizer" },
};

function formatIntent(intent: string) {
  if (!intent) return "Suggested action";
  return intent.replace(/[_-]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export interface ActionCardProps {
  suggestion: SuggestedIntent;
  disabled?: boolean;
  onSelect?: (suggestion: SuggestedIntent) => void;
}

export const ActionCard = memo(function ActionCard({ suggestion, disabled, onSelect }: ActionCardProps) {
  const moduleKey = (suggestion.module ?? "").toLowerCase();
  const moduleMeta = MODULE_COLORS[moduleKey] ?? null;
  const confidenceLabel =
    typeof suggestion.confidence === "number"
      ? `${Math.round(Math.max(0, Math.min(1, suggestion.confidence)) * 100)}% match`
      : null;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onSelect?.(suggestion)}
      className="w-full rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-70"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            {moduleMeta ? (
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${moduleMeta.badge}`}>
                {moduleMeta.text}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                <Sparkles className="h-3 w-3" />
                Suggested
              </span>
            )}
            {confidenceLabel && (
              <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{confidenceLabel}</span>
            )}
          </div>
          <h3 className="mt-2 text-sm font-semibold text-slate-900">
            {suggestion.title?.trim() || formatIntent(suggestion.intent)}
          </h3>
          <p className="mt-1 text-xs text-slate-600 line-clamp-2">
            {suggestion.description || "Let Mira take care of the busywork for you."}
          </p>
        </div>
        <ArrowRight className="h-4 w-4 text-slate-400" />
      </div>
    </button>
  );
});
