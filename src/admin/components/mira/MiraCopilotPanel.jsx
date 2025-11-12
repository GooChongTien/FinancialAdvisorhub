import { useEffect, useState } from "react";
import { Button } from "@/admin/components/ui/button";
import { RefreshCcw, Sparkles, Loader2 } from "lucide-react";
import { useMiraContext } from "@/admin/state/providers/MiraContextProvider";
import { useAgentChatStore } from "@/admin/state/providers/AgentChatProvider";

/**
 * MiraCopilotPanel - Fetches and displays context-aware suggestions
 * for the current module/page
 */
export function MiraCopilotPanel() {
  const { getContext } = useMiraContext();
  const { sendMessage } = useAgentChatStore();
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      setError(null);
      const context = getContext();

      const response = await fetch("/functions/v1/agent-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode: "suggest",
          context,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch suggestions: ${response.statusText}`);
      }

      const data = await response.json();
      setSuggestions(data.suggestions || []);
    } catch (err) {
      console.error("Error fetching suggestions:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch suggestions when component mounts or context changes
    fetchSuggestions();
  }, [getContext().module, getContext().page]);

  const handleSuggestionClick = async (suggestion) => {
    // Send the suggestion's prompt text as a message
    await sendMessage(suggestion.promptText);
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-6 text-sm text-slate-500">
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading suggestions…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        <p>{error}</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={fetchSuggestions}
          className="mt-3 gap-2"
        >
          <RefreshCcw className="h-4 w-4" />
          Try Again
        </Button>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-6 text-sm text-slate-500">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            <span>No suggestions available right now</span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={fetchSuggestions}
            className="gap-2"
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">Suggested Actions</h3>
        <button
          type="button"
          onClick={fetchSuggestions}
          className="text-slate-400 hover:text-slate-600 transition"
          title="Refresh suggestions"
        >
          <RefreshCcw className="h-4 w-4" />
        </button>
      </div>

      {suggestions.map((suggestion) => (
        <ActionCard
          key={suggestion.id}
          suggestion={suggestion}
          onClick={() => handleSuggestionClick(suggestion)}
        />
      ))}
    </div>
  );
}

function ActionCard({ suggestion, onClick }) {
  const priorityColors = {
    high: "border-primary-200 bg-primary-50/50 hover:bg-primary-100/50",
    medium: "border-slate-200 bg-white hover:bg-slate-50",
    low: "border-slate-100 bg-slate-50/50 hover:bg-slate-100/50",
  };

  const colorClass = priorityColors[suggestion.priority] || priorityColors.medium;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-lg border p-3 transition-colors ${colorClass}`}
    >
      <div className="flex items-start gap-3">
        <span className="mt-1 rounded-full bg-primary-100 p-2 text-primary-600">
          <Sparkles className="h-4 w-4" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900">{suggestion.title}</p>
          {suggestion.subtitle && (
            <p className="text-xs text-slate-600 mt-0.5">{suggestion.subtitle}</p>
          )}
        </div>
      </div>
    </button>
  );
}
