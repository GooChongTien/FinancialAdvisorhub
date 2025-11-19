import React from "react";
import { Loader2, CheckCircle2, XCircle, Navigation, FileEdit, Play } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Displays progress for UI action execution
 * Shows loading, success, or error states for navigate, prefill, and execute actions
 */
export function ActionProgressIndicator({ action, status = "pending", error }) {
  if (!action) return null;

  const getActionIcon = () => {
    switch (action.action) {
      case "navigate":
        return <Navigation className="h-4 w-4" />;
      case "frontend_prefill":
      case "update_field":
        return <FileEdit className="h-4 w-4" />;
      case "execute":
      case "submit_action":
        return <Play className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "loading":
      case "executing":
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case "success":
      case "completed":
        return <CheckCircle2 className="h-4 w-4" />;
      case "error":
      case "failed":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Loader2 className="h-4 w-4 animate-spin" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "success":
      case "completed":
        return "border-green-200 bg-green-50 text-green-800";
      case "error":
      case "failed":
        return "border-red-200 bg-red-50 text-red-800";
      default:
        return "border-blue-200 bg-blue-50 text-blue-800";
    }
  };

  const getActionLabel = () => {
    const labels = {
      navigate: "Navigating",
      frontend_prefill: "Prefilling form",
      update_field: "Updating fields",
      execute: "Executing",
      submit_action: "Submitting",
    };
    return labels[action.action] || "Processing";
  };

  const getStatusLabel = () => {
    switch (status) {
      case "success":
      case "completed":
        return "Completed";
      case "error":
      case "failed":
        return "Failed";
      case "loading":
      case "executing":
        return "In progress";
      default:
        return "Pending";
    }
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm",
        getStatusColor()
      )}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="flex items-center gap-1.5">
        {getActionIcon()}
        <span className="font-medium">{getActionLabel()}</span>
      </div>
      {action.description && (
        <span className="text-xs opacity-75">· {action.description}</span>
      )}
      <div className="ml-auto flex items-center gap-1.5">
        {getStatusIcon()}
        <span className="text-xs font-semibold">{getStatusLabel()}</span>
      </div>
      {error && status === "error" && (
        <div className="mt-1 text-xs opacity-90">{error}</div>
      )}
    </div>
  );
}

/**
 * Displays a list of action execution progress
 */
export function ActionProgressList({ actions, statuses = {}, errors = {} }) {
  if (!actions || actions.length === 0) return null;

  return (
    <div className="space-y-2" role="region" aria-label="Action progress">
      {actions.map((action, index) => {
        const actionId = action.id || `action-${index}`;
        const status = statuses[actionId] || "pending";
        const error = errors[actionId];

        return (
          <ActionProgressIndicator
            key={actionId}
            action={action}
            status={status}
            error={error}
          />
        );
      })}
    </div>
  );
}

export default ActionProgressIndicator;
