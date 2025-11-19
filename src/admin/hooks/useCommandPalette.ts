/**
 * Hook to manage Command Palette state and keyboard shortcuts
 */

import { useState, useEffect, useCallback } from "react";
import { keyboardShortcutManager } from "@/lib/mira/actions/keyboard-shortcuts";

export interface UseCommandPaletteOptions {
  enableShortcut?: boolean;
  shortcut?: string;
}

export function useCommandPalette(options: UseCommandPaletteOptions = {}) {
  const { enableShortcut = true, shortcut = "ctrl+k" } = options;
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  // Register keyboard shortcut
  useEffect(() => {
    if (!enableShortcut) return;

    const handleShortcut = (event: KeyboardEvent) => {
      event.preventDefault();
      toggle();
    };

    // Register global shortcut
    keyboardShortcutManager.registerGlobalShortcut(shortcut, handleShortcut);

    return () => {
      keyboardShortcutManager.unregisterShortcut(shortcut);
    };
  }, [enableShortcut, shortcut, toggle]);

  // Handle ESC key globally to close palette
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, close]);

  return {
    isOpen,
    open,
    close,
    toggle,
  };
}
