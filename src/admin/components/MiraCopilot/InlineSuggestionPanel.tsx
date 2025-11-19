import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { Loader2, RefreshCcw, Sparkles, ChevronDown } from "lucide-react";
import { useMiraContext } from "@/admin/state/providers/MiraContextProvider.jsx";
import { requestAgentJson } from "@/admin/api/agentClient.js";
import type { SuggestedIntent, MiraContext } from "@/lib/mira/types.ts";
import { ActionCard } from "./ActionCard";

interface InlineSuggestionPanelProps {
  onSuggestionSelect?: (suggestion: SuggestedIntent) => void;
  isBusy?: boolean;
}

function normalizeSuggestions(candidate: unknown): SuggestedIntent[] {
  if (!Array.isArray(candidate)) return [];
  return candidate
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const typed = entry as Record<string, unknown>;
      const intent = typeof typed.intent === "string" ? typed.intent : "";
      const promptText = typeof typed.promptText === "string" ? typed.promptText : "";
      if (!intent || !promptText) return null;
      const suggestion: SuggestedIntent = {
        intent,
        promptText,
        title: typeof typed.title === "string" && typed.title.trim() ? typed.title : intent,
        description: typeof typed.description === "string" ? typed.description : "",
        confidence: typeof typed.confidence === "number" ? typed.confidence : undefined,
        module:
          typeof typed.module === "string" && typed.module.trim().length > 0 ? typed.module : undefined,
      };
      return suggestion;
    })
    .filter((entry): entry is SuggestedIntent => entry !== null);
}

export function InlineSuggestionPanel({ onSuggestionSelect, isBusy }: InlineSuggestionPanelProps) {
  const abortRef = useRef<AbortController | null>(null);
  const { module, page, pageData, getContext } = useMiraContext();
  const [suggestions, setSuggestions] = useState<SuggestedIntent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const fallbackContext = useMemo<MiraContext>(
    () => ({
      module,
      page,
      pageData,
    }),
    [module, page, pageData],
  );

  const resolveContext = useCallback(() => {
    try {
      if (typeof getContext === "function") {
        return getContext();
      }
    } catch {
      // ignore and use fallback
    }
    return fallbackContext;
  }, [getContext, fallbackContext]);

  const loadSuggestions = useCallback(
    async (contextSnapshot: MiraContext) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setIsLoading(true);
      setError(null);
      try {
        const payload = await requestAgentJson(
          {
            mode: "suggest",
            context: contextSnapshot,
          },
          { signal: controller.signal },
        );
        const incoming = normalizeSuggestions(payload?.suggestions);
        setSuggestions(incoming);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        const message = err instanceof Error ? err.message : "Failed to load suggestions";
        setError(message);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    const snapshot = resolveContext();
    void loadSuggestions(snapshot);
    return () => {
      abortRef.current?.abort();
    };
  }, [resolveContext, loadSuggestions]);

  const handleRefresh = useCallback(() => {
    const snapshot = resolveContext();
    void loadSuggestions(snapshot);
  }, [resolveContext, loadSuggestions]);

  const toggleCollapsed = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  return (
    <div className="flex h-full flex-col rounded-lg border border-slate-200 bg-white/95 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">Suggested next steps</p>
          <p className="text-xs text-slate-500">Mira watches your workspace and queues quick wins.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isLoading}
            className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <RefreshCcw className="h-3.5 w-3.5" />
            Refresh
          </button>
          <button
            type="button"
            onClick={toggleCollapsed}
            className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-300"
            aria-expanded={!isCollapsed}
            aria-controls="mira-inline-suggestions"
          >
            <ChevronDown
              className={clsx(
                "h-3.5 w-3.5 transition-transform",
                isCollapsed ? "-rotate-90" : "rotate-90",
              )}
            />
            {isCollapsed ? "Expand" : "Collapse"}
          </button>
        </div>
      </div>

      <div
        id="mira-inline-suggestions"
        className={clsx(
          "mt-4 flex-1 grid transition-[grid-template-rows,opacity] duration-300 ease-out",
          isCollapsed ? "pointer-events-none opacity-0" : "opacity-100",
        )}
        style={{ gridTemplateRows: isCollapsed ? "0fr" : "1fr" }}
        aria-hidden={isCollapsed}
      >
        <div className="min-h-0 space-y-3 overflow-auto">
          {isLoading && suggestions.length === 0 ? (
            <div className="flex flex-col gap-3">
              {[0, 1, 2].map((index) => (
                <div
                  key={index}
                  className="animate-pulse rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-400"
                >
                  Loading suggestion...
                </div>
              ))}
            </div>
          ) : null}

          {!isLoading && suggestions.length === 0 && !error ? (
            <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-center text-sm text-slate-500">
              <Sparkles className="mb-3 h-5 w-5 text-slate-400" />
              <p>No suggestions yet. Try refreshing once you navigate around.</p>
            </div>
          ) : null}

          {error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-3 text-xs text-rose-700">
              <p>{error}</p>
              <button
                type="button"
                onClick={handleRefresh}
                className="mt-2 text-rose-600 underline-offset-2 hover:underline"
              >
                Try again
              </button>
            </div>
          ) : null}

          {suggestions.map((suggestion) => (
            <ActionCard
              key={`${suggestion.intent}-${suggestion.promptText}`}
              suggestion={suggestion}
              disabled={isBusy}
              onSelect={onSuggestionSelect}
            />
          ))}
        </div>
      </div>

      {isCollapsed ? (
        <p className="mt-2 text-[11px] font-medium text-slate-400">
          Suggestions hidden. Expand to review Mira&apos;s ideas.
        </p>
      ) : null}

      {isLoading && suggestions.length > 0 ? (
        <div className="mt-3 inline-flex items-center gap-2 text-[11px] uppercase tracking-wide text-slate-400">
          <Loader2 className="h-3 w-3 animate-spin" />
          Updating suggestions...
        </div>
      ) : null}
    </div>
  );
}
