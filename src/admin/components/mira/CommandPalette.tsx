/**
 * Mira Command Palette (Cmd/Ctrl + K)
 * Global search and action palette for quick access
 */

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  Search,
  Sparkles,
  ArrowRight,
  X,
  Clock,
  TrendingUp,
  Zap,
  Hash,
} from "lucide-react";
import clsx from "clsx";
import { useMiraContext } from "@/admin/state/providers/MiraContextProvider";
import { actionRegistry } from "@/lib/mira/actions";
import { keyboardShortcutManager } from "@/lib/mira/actions/keyboard-shortcuts";
import type { MiraAction } from "@/lib/mira/actions/types";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onActionSelect?: (action: MiraAction) => void;
}

interface CommandItem {
  id: string;
  type: "action" | "navigation" | "recent" | "suggestion";
  title: string;
  description: string;
  icon?: React.ReactNode;
  action: MiraAction;
  shortcut?: string;
  metadata?: {
    category?: string;
    module?: string;
    usageCount?: number;
  };
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  customer: <Hash className="h-4 w-4" />,
  navigation: <ArrowRight className="h-4 w-4" />,
  data: <TrendingUp className="h-4 w-4" />,
  task: <Clock className="h-4 w-4" />,
  broadcast: <Sparkles className="h-4 w-4" />,
  quick: <Zap className="h-4 w-4" />,
};

export function CommandPalette({
  isOpen,
  onClose,
  onActionSelect,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { module } = useMiraContext();

  // Get all available commands/actions
  const allCommands = useMemo<CommandItem[]>(() => {
    const actions = actionRegistry.getAllActions();
    const recentActions = actionRegistry.getRecentActions(5);
    const items: CommandItem[] = [];

    // Add recent actions
    recentActions.forEach((action) => {
      items.push({
        id: `recent-${action.id}`,
        type: "recent",
        title: action.name,
        description: action.description,
        icon: <Clock className="h-4 w-4" />,
        action,
        metadata: {
          category: action.category,
        },
      });
    });

    // Add all actions
    actions.forEach((action) => {
      const shortcut = keyboardShortcutManager.getShortcutForAction(action.id);
      items.push({
        id: action.id,
        type: "action",
        title: action.name,
        description: action.description,
        icon: CATEGORY_ICONS[action.category] || <Sparkles className="h-4 w-4" />,
        action,
        shortcut: shortcut
          ? keyboardShortcutManager.formatShortcut(shortcut)
          : undefined,
        metadata: {
          category: action.category,
        },
      });
    });

    return items;
  }, []);

  // Filter commands based on query
  const filteredCommands = useMemo(() => {
    if (!query.trim()) {
      // Show recent actions when no query
      return allCommands.filter((cmd) => cmd.type === "recent").slice(0, 10);
    }

    const lowerQuery = query.toLowerCase();
    return allCommands
      .filter((cmd) => {
        const searchText = `${cmd.title} ${cmd.description} ${cmd.metadata?.category || ""}`.toLowerCase();
        return searchText.includes(lowerQuery);
      })
      .sort((a, b) => {
        // Prioritize exact matches in title
        const aExact = a.title.toLowerCase().startsWith(lowerQuery);
        const bExact = b.title.toLowerCase().startsWith(lowerQuery);
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;

        // Then prioritize recent actions
        if (a.type === "recent" && b.type !== "recent") return -1;
        if (a.type !== "recent" && b.type === "recent") return 1;

        return 0;
      })
      .slice(0, 10);
  }, [query, allCommands]);

  // Reset selection when filtered commands change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredCommands]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          setSelectedIndex((prev) =>
            prev < filteredCommands.length - 1 ? prev + 1 : prev
          );
          break;
        case "ArrowUp":
          event.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
          break;
        case "Enter":
          event.preventDefault();
          if (filteredCommands[selectedIndex]) {
            handleSelectCommand(filteredCommands[selectedIndex]);
          }
          break;
        case "Escape":
          event.preventDefault();
          onClose();
          break;
      }
    },
    [filteredCommands, selectedIndex, onClose]
  );

  const handleSelectCommand = useCallback(
    (command: CommandItem) => {
      onActionSelect?.(command.action);
      onClose();
    },
    [onActionSelect, onClose]
  );

  // Handle backdrop click
  const handleBackdropClick = useCallback(
    (event: React.MouseEvent) => {
      if (event.target === event.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-[15vh]"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="command-palette-title"
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3">
          <Search className="h-5 w-5 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search actions, navigate, or run commands..."
            className="flex-1 bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400"
            id="command-palette-title"
          />
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close command palette"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto p-2">
          {filteredCommands.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Sparkles className="mb-3 h-8 w-8 text-slate-300" />
              <p className="text-sm font-medium text-slate-600">No commands found</p>
              <p className="mt-1 text-xs text-slate-400">
                Try a different search term or browse recent actions
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredCommands.map((command, index) => (
                <button
                  key={command.id}
                  onClick={() => handleSelectCommand(command)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={clsx(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition",
                    selectedIndex === index
                      ? "bg-primary-50 text-primary-900"
                      : "text-slate-700 hover:bg-slate-50"
                  )}
                >
                  {/* Icon */}
                  <div
                    className={clsx(
                      "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg",
                      selectedIndex === index
                        ? "bg-primary-100 text-primary-600"
                        : "bg-slate-100 text-slate-500"
                    )}
                  >
                    {command.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {command.type === "recent" && (
                        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-700">
                          Recent
                        </span>
                      )}
                      <h3 className="text-sm font-semibold truncate">{command.title}</h3>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500 line-clamp-1">
                      {command.description}
                    </p>
                  </div>

                  {/* Shortcut or Arrow */}
                  {command.shortcut ? (
                    <kbd className="flex-shrink-0 rounded bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600">
                      {command.shortcut}
                    </kbd>
                  ) : (
                    <ArrowRight
                      className={clsx(
                        "h-4 w-4 flex-shrink-0",
                        selectedIndex === index ? "text-primary-400" : "text-slate-300"
                      )}
                    />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 px-4 py-2.5">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <kbd className="rounded bg-slate-100 px-1.5 py-0.5 font-mono">↑</kbd>
                <kbd className="rounded bg-slate-100 px-1.5 py-0.5 font-mono">↓</kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="rounded bg-slate-100 px-1.5 py-0.5 font-mono">↵</kbd>
                Select
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="rounded bg-slate-100 px-1.5 py-0.5 font-mono">Esc</kbd>
                Close
              </span>
            </div>
            {filteredCommands.length > 0 && (
              <span className="text-slate-400">
                {filteredCommands.length} command{filteredCommands.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
