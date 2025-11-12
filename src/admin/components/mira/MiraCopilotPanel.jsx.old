import { Button } from "@/admin/components/ui/button";
import { ArrowRightCircle, RefreshCcw } from "lucide-react";

export function MiraCopilotPanel({ intent, execution, onRetry }) {
  const result = execution?.result ?? null;

  if (!intent) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-6 text-sm text-slate-500">
        Run a command or select a recommendation to see guided actions here.
      </div>
    );
  }

  if (execution?.status === "error") {
    return (
      <div className="space-y-4 rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        <p>{execution.error ?? "Something went wrong executing this action."}</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="gap-2"
        >
          <RefreshCcw className="h-4 w-4" />
          Try Again
        </Button>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-6 text-sm text-slate-500">
        Preparing recommendations…
      </div>
    );
  }

  if (result.status === "not_found") {
    return (
      <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50/70 p-6 text-sm text-amber-700">
        <p>{result.message ?? "No matching items found."}</p>
        {typeof result.matchConfidence === "number" && (
          <p className="text-xs text-amber-600">
            Match confidence {Math.round(result.matchConfidence * 100)}%
          </p>
        )}
      </div>
    );
  }

  if (result.status === "navigated") {
    return (
      <div className="space-y-4 rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-sm text-emerald-800">
        <div>
          <p className="font-semibold text-emerald-900">
            {result.lead?.name ?? "Lead"} — {result.proposal?.stage ?? "Unknown stage"}
          </p>
          <p className="mt-1 text-xs text-emerald-700">
            Mira opened the proposal detail page in a new view.
            {typeof result.matchConfidence === "number"
              ? ` Confidence ${Math.round(result.matchConfidence * 100)}%.`
              : ""}
          </p>
        </div>
        {result.navigationUrl ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => {
              window.open(result.navigationUrl, "_blank");
            }}
          >
            <ArrowRightCircle className="h-4 w-4" />
            Open again
          </Button>
        ) : null}
      </div>
    );
  }

  if (result.status === "prepared") {
    return (
      <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-sm text-emerald-800">
        <div>
          <p className="font-semibold text-emerald-900">
            {result.nextMeeting?.title ?? "Upcoming meeting"}
          </p>
          <p className="text-xs">
            {result.nextMeeting?.date ?? "Soon"}
            {result.nextMeeting?.time ? ` at ${result.nextMeeting.time}` : ""}
          </p>
          {result.nextMeeting?.linkedLeadName && (
            <p className="text-xs text-emerald-700">
              With {result.nextMeeting.linkedLeadName}
            </p>
          )}
        </div>
        {result.recommendations?.length ? (
          <ul className="space-y-1 text-xs text-emerald-700">
            {result.recommendations.map((item) => (
              <li key={item.id}>{item.description ?? item.title}</li>
            ))}
          </ul>
        ) : null}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={onRetry}
        >
          <RefreshCcw className="h-4 w-4" />
          Refresh prep
        </Button>
      </div>
    );
  }

  if (result.status === "alert") {
    return (
      <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50/80 p-6 text-sm text-amber-800">
        <p className="font-semibold text-amber-900">
          {result.alerts?.length ?? 0} compliance alerts detected
        </p>
        <ul className="space-y-1 text-xs text-amber-700">
          {result.alerts?.slice(0, 4).map((alert) => (
            <li key={alert.id}>
              {alert.name} — {alert.status ?? "Pending"}{" "}
              {typeof alert.confidence === "number"
                ? `(confidence ${Math.round(alert.confidence * 100)}%)`
                : ""}
            </li>
          ))}
        </ul>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => {
            if (result.navigationUrl) {
              window.open(result.navigationUrl, "_blank");
            }
          }}
        >
          <ArrowRightCircle className="h-4 w-4" />
          Review compliance queue
        </Button>
      </div>
    );
  }

  if (result.status === "clear") {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-6 text-sm text-slate-500">
        Compliance queue looks clear right now.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-6 text-sm text-slate-500">
      Awaiting next action…
    </div>
  );
}
