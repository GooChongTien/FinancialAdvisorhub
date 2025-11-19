import { useEffect, useCallback } from "react";
import type { RefObject } from "react";

export interface MiraKeyboardShortcutHandlers {
  onOpenCommand?: () => void;
  onClose?: () => void;
  onOpenCopilot?: () => void;
  onOpenInsights?: () => void;
  onToggleMode?: () => void;
}

/**
 * Hook to handle Mira keyboard shortcuts
 *
 * Shortcuts:
 * - Ctrl+K / Cmd+K: Open command mode
 * - Escape: Close current mode
 * - Ctrl+Shift+C: Open copilot mode
 * - Ctrl+Shift+I: Open insights mode
 * - Ctrl+Shift+M: Toggle between modes
 *
 * @param handlers - Object containing shortcut handlers
 * @param enabled - Whether shortcuts are enabled (default: true)
 */
export function useMiraKeyboardShortcuts(
  handlers: MiraKeyboardShortcutHandlers,
  enabled: boolean = true,
) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Ignore if user is typing in an input, textarea, or contenteditable
      const target = event.target as HTMLElement;
      const isEditing =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      // Ctrl+K / Cmd+K: Open command mode (but not while editing)
      if ((event.ctrlKey || event.metaKey) && event.key === "k" && !isEditing) {
        event.preventDefault();
        handlers.onOpenCommand?.();
        return;
      }

      // Escape: Close current mode (works even while editing)
      if (event.key === "Escape") {
        handlers.onClose?.();
        return;
      }

      // Ctrl+Shift+C: Open copilot mode
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === "C" && !isEditing) {
        event.preventDefault();
        handlers.onOpenCopilot?.();
        return;
      }

      // Ctrl+Shift+I: Open insights mode
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === "I" && !isEditing) {
        event.preventDefault();
        handlers.onOpenInsights?.();
        return;
      }

      // Ctrl+Shift+M: Toggle mode
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === "M" && !isEditing) {
        event.preventDefault();
        handlers.onToggleMode?.();
        return;
      }
    },
    [handlers, enabled],
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown, enabled]);
}

/**
 * Hook for managing focus trap in dialogs/modals
 * Keeps focus within a container element
 *
 * @param containerRef - Ref to the container element
 * @param enabled - Whether focus trap is enabled
 */
export function useFocusTrap(containerRef: RefObject<HTMLElement>, enabled: boolean = true) {
  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus first element when trap is enabled
    firstElement?.focus();

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;

      if (event.shiftKey) {
        // Shift + Tab: move backwards
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab: move forwards
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener("keydown", handleTabKey);
    return () => container.removeEventListener("keydown", handleTabKey);
  }, [containerRef, enabled]);
}

/**
 * Hook to restore focus to a previous element when component unmounts
 *
 * @param enabled - Whether to restore focus (default: true)
 */
export function useRestoreFocus(enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;

    const previousActiveElement = document.activeElement as HTMLElement;

    return () => {
      // Restore focus on unmount
      if (previousActiveElement && typeof previousActiveElement.focus === "function") {
        // Small delay to ensure the element is still in the DOM
        setTimeout(() => {
          previousActiveElement.focus();
        }, 0);
      }
    };
  }, [enabled]);
}

export default useMiraKeyboardShortcuts;
