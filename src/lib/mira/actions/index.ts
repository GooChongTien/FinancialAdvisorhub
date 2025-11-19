/**
 * Mira Action System - Main Export
 * Smart contextual actions for Mira Co-Pilot
 */

// Types
export type * from "./types";

// Action Templates
export * from "./action-templates";

// Action Executor
export { ActionExecutor, ActionExecutionError, actionExecutor } from "./action-executor";

// Action Suggestions
export { ActionSuggestionEngine, actionSuggestionEngine } from "./action-suggestions";

// Action Registry
export { ActionRegistry, actionRegistry } from "./action-registry";

// Keyboard Shortcuts
export {
  KeyboardShortcutManager,
  keyboardShortcutManager,
  COMMON_SHORTCUTS,
} from "./keyboard-shortcuts";
