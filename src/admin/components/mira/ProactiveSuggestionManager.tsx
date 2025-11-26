/**
 * Proactive Suggestion Manager
 *
 * Monitors user behavior and displays proactive suggestions
 * using the ProactiveEngine and ProactiveSuggestionToast
 */

import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { proactiveEngine, type ProactiveSuggestion } from '@/lib/mira/proactive-engine';
import { Sparkles, X } from 'lucide-react';
import clsx from 'clsx';
import { createPageUrl } from '@/admin/utils';

const CATEGORY_COLORS = {
  navigation: 'from-blue-500 to-cyan-500',
  data_entry: 'from-purple-500 to-pink-500',
  insight: 'from-orange-500 to-amber-500',
  shortcut: 'from-green-500 to-emerald-500',
};

const CATEGORY_ICONS: Record<string, string> = {
  navigation: '🧭',
  data_entry: '📝',
  insight: '💡',
  shortcut: '⚡',
};

export function ProactiveSuggestionManager() {
  const [suggestion, setSuggestion] = useState<ProactiveSuggestion | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check for suggestions every 5 seconds
    const interval = setInterval(() => {
      if (!proactiveEngine.shouldShowSuggestion()) {
        return;
      }

      const detected = proactiveEngine.detectPatterns();
      if (detected) {
        setSuggestion(detected);
        setIsVisible(true);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleAccept = () => {
    if (!suggestion) return;

    // Track acceptance
    proactiveEngine.acceptSuggestion(suggestion.id);

    // Navigate to chat with pre-filled prompt
    const from = encodeURIComponent(location.pathname + location.search);
    navigate(`${createPageUrl('ChatMira')}?from=${from}&prompt=${encodeURIComponent(suggestion.promptText)}`);

    // Hide suggestion
    setIsVisible(false);
    setTimeout(() => setSuggestion(null), 300);
  };

  const handleDismiss = () => {
    if (!suggestion) return;

    // Track dismissal
    proactiveEngine.dismissSuggestion(suggestion.id);

    // Hide suggestion
    setIsVisible(false);
    setTimeout(() => setSuggestion(null), 300);
  };

  if (!suggestion) {
    return null;
  }

  const categoryColor = CATEGORY_COLORS[suggestion.category] || CATEGORY_COLORS.insight;
  const categoryIcon = suggestion.icon || CATEGORY_ICONS[suggestion.category] || '💡';

  return (
    <div
      className={clsx(
        'fixed bottom-6 right-6 z-50 transition-all duration-300',
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      )}
    >
      <div className="w-96 rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        {/* Header with gradient */}
        <div className={clsx('bg-gradient-to-r p-4', categoryColor)}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="text-2xl">{categoryIcon}</div>
              <div>
                <p className="text-sm font-semibold text-white">
                  Mira has a suggestion
                </p>
                <p className="text-xs text-white/80 mt-0.5">
                  {Math.round(suggestion.relevanceScore * 100)}% relevant
                </p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="rounded-lg p-1 text-white/80 transition hover:bg-white/20 hover:text-white"
              aria-label="Dismiss suggestion"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-sm text-slate-900 font-medium mb-3">
            {suggestion.message}
          </p>

          {/* Suggested prompt preview */}
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 mb-4">
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-slate-700 italic">
                "{suggestion.promptText}"
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleAccept}
              className="flex-1 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 active:scale-95"
            >
              Ask Mira
            </button>
            <button
              onClick={handleDismiss}
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-95"
            >
              Not now
            </button>
          </div>

          {/* Trigger reason (debug info, small text) */}
          <p className="mt-3 text-xs text-slate-400 text-center">
            {suggestion.triggerReason}
          </p>
        </div>
      </div>
    </div>
  );
}
