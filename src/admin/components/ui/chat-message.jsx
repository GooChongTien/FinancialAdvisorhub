/**
 * Chat message bubble component
 * Displays user, assistant, and tool messages with appropriate styling
 */

import { clsx } from "clsx";
import { Bot, User, Wrench, AlertCircle } from "lucide-react";

const ACTION_LABELS = {
  navigate: "Navigate",
  open_dialog: "Open dialog",
  open_tool: "Open tool",
  open_edit_mode: "Edit mode",
  set_filter: "Set filter",
  apply_filter: "Apply filter",
  search_action: "Search",
  frontend_prefill: "Prefill",
  update_field: "Update field",
  update_status: "Update status",
  submit_action: "Execute",
  execute: "Execute",
  generate_report: "Report",
  view_analysis: "View analysis",
  view_analytics: "View analytics",
  view_chart: "View chart",
  view_comparison: "Compare",
  view_details: "View details",
  view_status: "View status",
  get_recommendation: "Recommend",
};

function toTitle(text) {
  if (!text) return "";
  return text
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatActionLabel(action) {
  if (!action) return "Action";
  const key = typeof action.action === "string" ? action.action : "";
  if (key && ACTION_LABELS[key]) return ACTION_LABELS[key];
  if (!key) return "Action";
  return toTitle(key.replace(/_/g, " "));
}

function describeNavigateAction(action) {
  return action.page || action.target || action.module || action.description || "destination";
}

function describePrefillAction(action) {
  if (!action?.payload || typeof action.payload !== "object") return "";
  const keys = Object.keys(action.payload);
  if (!keys.length) return "";
  const preview = keys.slice(0, 2).join(", ");
  return keys.length > 2 ? `${preview}…` : preview;
}

function describeExecuteAction(action) {
  if (action?.api_call?.endpoint) return action.api_call.endpoint;
  if (action?.target) return action.target;
  if (action?.description) return action.description;
  return "backend call";
}

function describeAction(action) {
  if (!action) return "";
  switch (action.action) {
    case "navigate":
      return describeNavigateAction(action);
    case "frontend_prefill":
    case "update_field":
      return describePrefillAction(action);
    case "execute":
    case "submit_action":
      return describeExecuteAction(action);
    case "set_filter":
    case "apply_filter":
    case "search_action":
      return action.description || action.target || "filters";
    case "update_status":
      return action.description || action.target || "status";
    default:
      return action.description || action.target || "";
  }
}

/**
 * Format timestamp for display
 * @param {string} timestamp
 * @returns {string}
 */
function formatTime(timestamp) {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/**
 * Chat message component
 * @param {Object} props
 * @param {Object} props.message - Message object
 * @param {boolean} [props.streaming] - Whether message is still streaming
 */
export function ChatMessage({ message, streaming = false }) {
  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";
  const isTool = message.role === "tool";
  const isError = message.error || message.content?.includes("[Error");
  const plannedActions = Array.isArray(message?.plannedActions) ? message.plannedActions : [];
  const showPlanned = isAssistant && plannedActions.length > 0;
  const showDebugPill = isAssistant && (message?.metadata?.agent || message?.metadata?.intent);
  const debugAgent = message?.metadata?.agent || "module_agent";
  const debugIntent = message?.metadata?.intent || message?.metadata?.topic || "intent";

  return (
    <div
      className={clsx(
        "flex gap-3 p-4 rounded-lg transition-colors",
        isUser && "bg-blue-50 ml-8",
        isAssistant && "bg-gray-50 mr-8",
        isTool && "bg-amber-50 mx-8 border border-amber-200"
      )}
    >
      {/* Avatar */}
      <div
        className={clsx(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
          isUser && "bg-blue-500 text-white",
          isAssistant && "bg-gray-700 text-white",
          isTool && "bg-amber-500 text-white"
        )}
      >
        {isUser && <User className="w-4 h-4" />}
        {isAssistant && <Bot className="w-4 h-4" />}
        {isTool && <Wrench className="w-4 h-4" />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-gray-900">
            {isUser && "You"}
            {isAssistant && "Mira"}
            {isTool && "Tool Result"}
          </span>
          {message.timestamp && (
            <span className="text-xs text-gray-500">
              {formatTime(message.timestamp)}
            </span>
          )}
          {streaming && (
            <span className="text-xs text-blue-600 flex items-center gap-1">
              <span className="inline-block w-1 h-1 bg-blue-600 rounded-full animate-pulse" />
              Typing...
            </span>
          )}
          {showDebugPill && (
            <span className="text-xs font-medium text-slate-600 bg-slate-100 border border-slate-200 rounded-full px-2 py-0.5">
              {debugAgent} <span className="text-slate-400">·</span> {debugIntent}
            </span>
          )}
        </div>

        {/* Message content */}
        <div className="text-sm text-gray-800 whitespace-pre-wrap break-words">
          {message.content || <span className="text-gray-400 italic">No content</span>}
          {streaming && (
            <span className="inline-block w-2 h-4 ml-1 bg-gray-400 animate-pulse" />
          )}
        </div>

        {/* Tool call info */}
        {message.toolCall && (
          <div className="mt-2 p-2 bg-amber-100 rounded border border-amber-300 text-xs">
            <div className="font-medium text-amber-900 mb-1 flex items-center gap-1">
              <Wrench className="w-3 h-3" />
              Tool Call: {message.toolCall.function?.name || "Unknown"}
            </div>
            {message.toolCall.function?.arguments && (
              <pre className="text-amber-800 whitespace-pre-wrap overflow-x-auto">
                {message.toolCall.function.arguments}
              </pre>
            )}
          </div>
        )}

        {showPlanned && (
          <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50/60 p-3 text-xs text-slate-700">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Planned actions
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {plannedActions.map((action, index) => {
                const key = action?.id || `${message.id}-planned-${index}`;
                const label = formatActionLabel(action);
                const detail = describeAction(action);
                return (
                  <div
                    key={key}
                    className="rounded-full border border-slate-300 bg-white px-3 py-1 text-[11px] font-medium text-slate-800 shadow-sm"
                  >
                    {label}
                    {detail && <span className="text-slate-500"> · {detail}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Error indicator */}
        {isError && (
          <div className="mt-2 p-2 bg-red-100 rounded border border-red-300 text-xs flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-red-600" />
            <span className="text-red-800">An error occurred</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default ChatMessage;
