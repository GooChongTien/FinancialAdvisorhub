/**
 * Mira Keyboard Shortcut Manager
 * Handles keyboard shortcuts for actions
 */

import type { MiraAction, ActionContext } from "./types";
import { actionRegistry } from "./action-registry";
import { actionExecutor } from "./action-executor";

/**
 * Keyboard event handler
 */
type ShortcutHandler = (event: KeyboardEvent) => void | Promise<void>;

/**
 * Shortcut configuration
 */
interface ShortcutConfig {
  action: MiraAction;
  handler?: ShortcutHandler;
  enabled: boolean;
  description?: string;
}

/**
 * Keyboard Shortcut Manager
 * Manages keyboard shortcuts and their execution
 */
export class KeyboardShortcutManager {
  private static instance: KeyboardShortcutManager;
  private shortcuts: Map<string, ShortcutConfig> = new Map();
  private globalShortcuts: Map<string, ShortcutHandler> = new Map();
  private enabled: boolean = true;
  private isListening: boolean = false;

  private constructor() {
    this.registerDefaultShortcuts();
  }

  static getInstance(): KeyboardShortcutManager {
    if (!KeyboardShortcutManager.instance) {
      KeyboardShortcutManager.instance = new KeyboardShortcutManager();
    }
    return KeyboardShortcutManager.instance;
  }

  /**
   * Start listening for keyboard shortcuts
   */
  startListening(context: ActionContext): void {
    if (this.isListening) return;

    document.addEventListener("keydown", (event) => this.handleKeyDown(event, context));
    this.isListening = true;

    console.debug("[KeyboardShortcuts] Started listening");
  }

  /**
   * Stop listening for keyboard shortcuts
   */
  stopListening(): void {
    if (!this.isListening) return;

    document.removeEventListener("keydown", (event) =>
      this.handleKeyDown(event, {} as ActionContext)
    );
    this.isListening = false;

    console.debug("[KeyboardShortcuts] Stopped listening");
  }

  /**
   * Handle keydown event
   */
  private async handleKeyDown(event: KeyboardEvent, context: ActionContext): Promise<void> {
    if (!this.enabled) return;

    // Don't trigger shortcuts when typing in input fields
    const target = event.target as HTMLElement;
    if (
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.isContentEditable
    ) {
      return;
    }

    const shortcut = this.buildShortcutString(event);

    // Check for global shortcuts first
    const globalHandler = this.globalShortcuts.get(shortcut);
    if (globalHandler) {
      event.preventDefault();
      await globalHandler(event);
      return;
    }

    // Check for action shortcuts
    const shortcutConfig = this.shortcuts.get(shortcut);
    if (shortcutConfig && shortcutConfig.enabled) {
      event.preventDefault();

      if (shortcutConfig.handler) {
        await shortcutConfig.handler(event);
      } else {
        // Execute the associated action
        await this.executeShortcutAction(shortcutConfig.action, context);
      }
    }
  }

  /**
   * Build shortcut string from keyboard event
   */
  private buildShortcutString(event: KeyboardEvent): string {
    const parts: string[] = [];

    if (event.ctrlKey || event.metaKey) parts.push("ctrl");
    if (event.shiftKey) parts.push("shift");
    if (event.altKey) parts.push("alt");

    // Add the key (normalized to lowercase)
    const key = event.key.toLowerCase();
    if (key !== "control" && key !== "shift" && key !== "alt" && key !== "meta") {
      parts.push(key);
    }

    return parts.join("+");
  }

  /**
   * Register default shortcuts from action registry
   */
  private registerDefaultShortcuts(): void {
    const actionsWithShortcuts = actionRegistry
      .getAllActions()
      .filter((action) => action.keyboard_shortcut);

    for (const action of actionsWithShortcuts) {
      this.registerShortcut(action);
    }

    console.debug(
      `[KeyboardShortcuts] Registered ${actionsWithShortcuts.length} default shortcuts`
    );
  }

  /**
   * Register a shortcut for an action
   */
  registerShortcut(action: MiraAction, handler?: ShortcutHandler): void {
    if (!action.keyboard_shortcut) {
      console.warn(`[KeyboardShortcuts] Action ${action.id} has no shortcut defined`);
      return;
    }

    const normalizedShortcut = this.normalizeShortcut(action.keyboard_shortcut);

    this.shortcuts.set(normalizedShortcut, {
      action,
      handler,
      enabled: true,
      description: action.description,
    });

    console.debug(`[KeyboardShortcuts] Registered: ${normalizedShortcut} → ${action.name}`);
  }

  /**
   * Register a global shortcut (not tied to an action)
   */
  registerGlobalShortcut(shortcut: string, handler: ShortcutHandler): void {
    const normalizedShortcut = this.normalizeShortcut(shortcut);
    this.globalShortcuts.set(normalizedShortcut, handler);

    console.debug(`[KeyboardShortcuts] Registered global: ${normalizedShortcut}`);
  }

  /**
   * Unregister a shortcut
   */
  unregisterShortcut(shortcut: string): boolean {
    const normalizedShortcut = this.normalizeShortcut(shortcut);
    const removed = this.shortcuts.delete(normalizedShortcut) ||
      this.globalShortcuts.delete(normalizedShortcut);

    if (removed) {
      console.debug(`[KeyboardShortcuts] Unregistered: ${normalizedShortcut}`);
    }

    return removed;
  }

  /**
   * Enable/disable a specific shortcut
   */
  setShortcutEnabled(shortcut: string, enabled: boolean): void {
    const normalizedShortcut = this.normalizeShortcut(shortcut);
    const config = this.shortcuts.get(normalizedShortcut);

    if (config) {
      config.enabled = enabled;
      console.debug(
        `[KeyboardShortcuts] ${enabled ? "Enabled" : "Disabled"}: ${normalizedShortcut}`
      );
    }
  }

  /**
   * Enable/disable all shortcuts
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    console.debug(`[KeyboardShortcuts] ${enabled ? "Enabled" : "Disabled"} all shortcuts`);
  }

  /**
   * Get all registered shortcuts
   */
  getAllShortcuts(): Map<string, ShortcutConfig> {
    return new Map(this.shortcuts);
  }

  /**
   * Get global shortcuts
   */
  getGlobalShortcuts(): Map<string, ShortcutHandler> {
    return new Map(this.globalShortcuts);
  }

  /**
   * Execute action associated with shortcut
   */
  private async executeShortcutAction(
    action: MiraAction,
    context: ActionContext
  ): Promise<void> {
    try {
      console.debug(`[KeyboardShortcuts] Executing action: ${action.name}`);

      const result = await actionExecutor.execute({
        action,
        parameters: {}, // Shortcuts typically use default parameters
        context,
        skipConfirmation: false, // Still require confirmation for important actions
      });

      if (!result.success) {
        console.error(
          `[KeyboardShortcuts] Action failed: ${action.name}`,
          result.error
        );
      }
    } catch (error) {
      console.error(`[KeyboardShortcuts] Error executing action: ${action.name}`, error);
    }
  }

  /**
   * Normalize shortcut string
   */
  private normalizeShortcut(shortcut: string): string {
    return shortcut
      .toLowerCase()
      .split("+")
      .map((part) => part.trim())
      .sort((a, b) => {
        // Sort modifiers in consistent order: ctrl, shift, alt, key
        const order = { ctrl: 0, shift: 1, alt: 2 };
        const aOrder = order[a as keyof typeof order] ?? 999;
        const bOrder = order[b as keyof typeof order] ?? 999;
        return aOrder - bOrder;
      })
      .join("+");
  }

  /**
   * Get shortcut for action
   */
  getShortcutForAction(actionId: string): string | undefined {
    for (const [shortcut, config] of this.shortcuts.entries()) {
      if (config.action.id === actionId) {
        return shortcut;
      }
    }
    return undefined;
  }

  /**
   * Format shortcut for display
   */
  formatShortcut(shortcut: string): string {
    const parts = shortcut.split("+");
    const formatted: string[] = [];

    for (const part of parts) {
      switch (part) {
        case "ctrl":
          formatted.push(navigator.platform.includes("Mac") ? "⌘" : "Ctrl");
          break;
        case "shift":
          formatted.push("⇧");
          break;
        case "alt":
          formatted.push(navigator.platform.includes("Mac") ? "⌥" : "Alt");
          break;
        default:
          formatted.push(part.toUpperCase());
          break;
      }
    }

    return formatted.join(" + ");
  }

  /**
   * Get shortcut help text
   */
  getShortcutHelp(): Array<{ shortcut: string; description: string; formatted: string }> {
    const help: Array<{ shortcut: string; description: string; formatted: string }> = [];

    for (const [shortcut, config] of this.shortcuts.entries()) {
      if (config.enabled) {
        help.push({
          shortcut,
          description: config.description || config.action.name,
          formatted: this.formatShortcut(shortcut),
        });
      }
    }

    return help.sort((a, b) => a.description.localeCompare(b.description));
  }

  /**
   * Check if shortcut is available
   */
  isShortcutAvailable(shortcut: string): boolean {
    const normalizedShortcut = this.normalizeShortcut(shortcut);
    return (
      !this.shortcuts.has(normalizedShortcut) &&
      !this.globalShortcuts.has(normalizedShortcut)
    );
  }
}

// Export singleton instance
export const keyboardShortcutManager = KeyboardShortcutManager.getInstance();

/**
 * Common keyboard shortcuts
 */
export const COMMON_SHORTCUTS = {
  // Global navigation
  GO_TO_DASHBOARD: "ctrl+shift+h",
  GO_TO_CUSTOMERS: "ctrl+shift+c",
  GO_TO_ANALYTICS: "ctrl+shift+a",
  GO_TO_TODO: "ctrl+shift+t",

  // Actions
  CREATE_LEAD: "ctrl+shift+l",
  CREATE_PROPOSAL: "ctrl+shift+p",
  EXPORT_DATA: "ctrl+shift+e",

  // Commands
  OPEN_COMMAND_PALETTE: "ctrl+k",
  OPEN_MIRA_CHAT: "ctrl+m",
  UNDO: "ctrl+z",
  REDO: "ctrl+shift+z",

  // Search
  GLOBAL_SEARCH: "ctrl+/",
  QUICK_FIND: "ctrl+f",
} as const;
