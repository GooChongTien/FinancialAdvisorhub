/**
 * Proactive Suggestion Toast
 * Non-intrusive notifications for Mira's proactive suggestions
 */

import { useState, useEffect } from "react";
import { X, Sparkles, Check, ChevronRight } from "lucide-react";
import clsx from "clsx";
import type { ActionSuggestion } from "@/lib/mira/actions/types";

export interface ProactiveSuggestionToastProps {
  suggestion: ActionSuggestion;
  onAccept?: (suggestion: ActionSuggestion) => void;
  onDismiss?: (suggestion: ActionSuggestion) => void;
  autoHideDuration?: number;
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
}

const POSITION_CLASSES = {
  "top-right": "top-4 right-4",
  "top-left": "top-4 left-4",
  "bottom-right": "bottom-4 right-4",
  "bottom-left": "bottom-4 left-4",
};

export function ProactiveSuggestionToast({
  suggestion,
  onAccept,
  onDismiss,
  autoHideDuration,
  position = "bottom-right",
}: ProactiveSuggestionToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  // Animate in on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  // Auto-hide if duration is specified
  useEffect(() => {
    if (autoHideDuration && autoHideDuration > 0) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, autoHideDuration);

      return () => clearTimeout(timer);
    }
  }, [autoHideDuration]);

  const handleAccept = () => {
    setIsExiting(true);
    setTimeout(() => {
      onAccept?.(suggestion);
    }, 200);
  };

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss?.(suggestion);
    }, 200);
  };

  return (
    <div
      className={clsx(
        "fixed z-50 transition-all duration-200",
        POSITION_CLASSES[position],
        isVisible && !isExiting
          ? "translate-x-0 opacity-100"
          : position.includes("right")
          ? "translate-x-8 opacity-0"
          : "-translate-x-8 opacity-0"
      )}
    >
      <div className="w-96 rounded-xl border border-slate-200 bg-white p-4 shadow-lg">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-600">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {suggestion.action.name}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                {suggestion.confidence !== undefined && (
                  <span className="text-xs text-slate-500">
                    {Math.round(suggestion.confidence * 100)}% confident
                  </span>
                )}
                {suggestion.trigger && (
                  <span className="h-1 w-1 rounded-full bg-slate-300" />
                )}
                {suggestion.trigger && (
                  <span className="text-xs capitalize text-slate-500">
                    {suggestion.trigger.replace("_", " ")}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Dismiss suggestion"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Reason */}
        {suggestion.reason && (
          <p className="mt-3 text-sm text-slate-600">{suggestion.reason}</p>
        )}

        {/* Actions */}
        <div className="mt-4 flex items-center gap-2">
          <button
            onClick={handleAccept}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-700"
          >
            <Check className="h-4 w-4" />
            Accept
          </button>
          <button
            onClick={handleDismiss}
            className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Maybe later
          </button>
        </div>

        {/* Pattern indicator */}
        {suggestion.triggerPattern && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-xs text-slate-600">
              Based on:{" "}
              <span className="font-medium">
                {suggestion.triggerPattern.replace(/_/g, " ")}
              </span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
