/**
 * Mira UI Components - Main Export
 * All Mira-related UI components in one place
 */

// Command Palette
export { CommandPalette } from "./CommandPalette";
export { useCommandPalette } from "../../hooks/useCommandPalette";

// Proactive Suggestions
export { ProactiveSuggestionToast } from "./ProactiveSuggestionToast";

// Contextual Help
export { ContextualHelp, ContextualHelpIcon } from "./ContextualHelp";

// Existing components (re-export for convenience)
export { InlineSuggestionPanel } from "../MiraCopilot/InlineSuggestionPanel";
export { ActionCard } from "../MiraCopilot/ActionCard";
export { MiraCommandPanel } from "./MiraCommandPanel";
export { ActionProgressIndicator } from "./ActionProgressIndicator";
