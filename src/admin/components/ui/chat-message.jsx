/**
 * Chat message bubble component
 * Displays user, assistant, and tool messages with appropriate styling
 */

import { clsx } from "clsx";
import { Bot, User, Wrench, AlertCircle, Target, Navigation, Filter, Search, Edit, Play, FileText, BarChart3, TrendingUp, Eye, Lightbulb } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { adviseUAdminApi } from "@/admin/api/adviseUAdminApi";
import { MarkdownContent } from "@/admin/components/ui/markdown-content.jsx";

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
  return keys.length > 2 ? `${preview}...` : preview;
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

function getActionIcon(action) {
  if (!action) return Navigation;
  switch (action.action) {
    case "navigate":
      return Navigation;
    case "set_filter":
    case "apply_filter":
      return Filter;
    case "search_action":
      return Search;
    case "open_edit_mode":
    case "update_field":
    case "frontend_prefill":
      return Edit;
    case "execute":
    case "submit_action":
      return Play;
    case "generate_report":
      return FileText;
    case "view_analytics":
    case "view_analysis":
      return BarChart3;
    case "view_chart":
    case "view_comparison":
      return TrendingUp;
    case "view_details":
    case "view_status":
      return Eye;
    case "get_recommendation":
      return Lightbulb;
    default:
      return Target;
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

function getConfidenceVariant(confidence) {
  if (typeof confidence !== "number" || Number.isNaN(confidence)) return null;
  if (confidence >= 0.8) {
    return {
      border: "border-emerald-200",
      bg: "bg-emerald-50",
      text: "text-emerald-800",
      label: "High confidence",
    };
  }
  if (confidence >= 0.5) {
    return {
      border: "border-amber-200",
      bg: "bg-amber-50",
      text: "text-amber-800",
      label: "Medium confidence",
    };
  }
  return {
    border: "border-rose-200",
    bg: "bg-rose-50",
    text: "text-rose-800",
    label: "Low confidence",
  };
}

function normalizeTopicLabel(topic) {
  if (!topic) return "";
  return toTitle(String(topic).replace(/[_-]+/g, " "));
}

function getInitials(name) {
  if (!name) return "U";
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Chat message component
 * @param {Object} props
 * @param {Object} props.message - Message object
 * @param {boolean} [props.streaming] - Whether message is still streaming
 */
export function ChatMessage({ message, streaming = false }) {
  const { data: user } = useQuery({
    queryKey: ["current-user"],
    queryFn: () => adviseUAdminApi.auth.me(),
    staleTime: Infinity,
  });

  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";
  const isTool = message.role === "tool";
  const isError = message.error || message.content?.includes("[Error");
  const plannedActions = Array.isArray(message?.plannedActions) ? message.plannedActions : [];
  const showPlanned = isAssistant && plannedActions.length > 0;
  const metadataBadge = isAssistant ? <IntentMetadataBadge metadata={message?.metadata} /> : null;

  const userInitials = getInitials(user?.full_name);

  // User messages: right-aligned, compact style
  if (isUser) {
    return (
      <div className="group flex justify-end mb-4 px-4 animate-fade-in">
        <div className="max-w-[85%] md:max-w-[70%]">
          <div className="flex items-end gap-2 justify-end">
            <div className="bg-gradient-to-br from-primary-600 to-primary-700 text-white rounded-2xl rounded-br-md px-4 py-2.5 shadow-sm">
              <div className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
                {message.content || <span className="italic opacity-70">No content</span>}
              </div>
            </div>
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-md">
              <span className="text-white text-xs font-bold">{userInitials}</span>
            </div>
          </div>
          {message.timestamp && (
            <div className="text-[11px] text-neutral-500 mt-1 text-right px-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {formatTime(message.timestamp)}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Assistant messages: left-aligned, spacious style like ChatGPT/Claude
  if (isAssistant) {
    return (
      <div className="group flex justify-start mb-6 px-4 animate-fade-in">
        <div className="max-w-[85%] md:max-w-[70%]">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-neutral-700 via-neutral-800 to-neutral-900 flex items-center justify-center shadow-md ring-2 ring-neutral-200">
              <span className="text-white text-xs font-bold">M</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-semibold text-neutral-900">Mira</span>
                {metadataBadge}
                {streaming && (
                  <span className="text-[11px] text-primary-600 flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 bg-primary-600 rounded-full animate-pulse" />
                    Typing...
                  </span>
                )}
              </div>
              <div className="bg-neutral-50 border border-neutral-200 rounded-2xl rounded-tl-md px-4 py-3 shadow-sm">
                <div className="text-[15px] leading-relaxed text-neutral-900">
                  {message.content ? (
                    <MarkdownContent content={message.content} />
                  ) : (
                    <span className="text-neutral-400 italic">No content</span>
                  )}
                  {streaming && (
                    <span className="inline-block w-0.5 h-5 ml-1 bg-neutral-400 animate-pulse" />
                  )}
                </div>

                {/* Tool call info */}
                {message.toolCall && (
                  <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs">
                    <div className="font-semibold text-amber-900 mb-1.5 flex items-center gap-1.5">
                      <Wrench className="w-3.5 h-3.5" />
                      Tool Call: {message.toolCall.function?.name || "Unknown"}
                    </div>
                    {message.toolCall.function?.arguments && (
                      <pre className="text-amber-800 text-[11px] whitespace-pre-wrap overflow-x-auto font-mono bg-amber-100/50 p-2 rounded">
                        {message.toolCall.function.arguments}
                      </pre>
                    )}
                  </div>
                )}

                {showPlanned && (
                  <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50/50 p-3 text-xs">
                    <div className="text-[10px] font-bold uppercase tracking-wide text-blue-700 mb-2.5 flex items-center gap-1.5">
                      <Target className="w-3 h-3" />
                      Planned actions
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {plannedActions.map((action, index) => {
                        const key = action?.id || `${message.id}-planned-${index}`;
                        const label = formatActionLabel(action);
                        const detail = describeAction(action);
                        const IconComponent = getActionIcon(action);
                        return (
                          <button
                            key={key}
                            className="group rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-3 py-2 text-[11px] font-semibold text-white shadow-md hover:shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all active:scale-95 flex items-center gap-1.5"
                            title={detail || label}
                          >
                            <IconComponent className="w-3.5 h-3.5" />
                            <span>{label}</span>
                            {detail && (
                              <span className="text-blue-100 font-normal ml-0.5">· {detail}</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Error indicator */}
                {isError && (
                  <div className="mt-3 p-3 bg-red-50 rounded-xl border border-red-200 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <span className="text-red-800 font-medium">An error occurred</span>
                  </div>
                )}
              </div>
              {message.timestamp && (
                <div className="text-[11px] text-neutral-500 mt-1.5 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {formatTime(message.timestamp)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Tool messages: centered, distinct style
  if (isTool) {
    return (
      <div className="flex justify-center mb-4 px-4 animate-fade-in">
        <div className="max-w-[90%] md:max-w-[75%]">
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 shadow-sm">
            <div className="flex items-start gap-2">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-sm">
                <Wrench className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-amber-900 mb-1">Tool Result</div>
                <div className="text-sm text-amber-800 whitespace-pre-wrap break-words">
                  {message.content || <span className="text-amber-600 italic">No content</span>}
                </div>
                {message.timestamp && (
                  <div className="text-[11px] text-amber-600 mt-1">
                    {formatTime(message.timestamp)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default ChatMessage;

function IntentMetadataBadge({ metadata }) {
  if (!metadata) return null;
  const confidence = typeof metadata?.confidence === "number" ? metadata.confidence : null;
  if (confidence === null) return null;

  const variant = getConfidenceVariant(confidence);
  if (!variant) return null;

  const agent = metadata?.agent || metadata?.handler || "";
  const intent = metadata?.intent || "";
  const topic = normalizeTopicLabel(metadata?.topic || metadata?.module);
  const percent = Math.round(confidence * 100);
  const label = topic ? `${topic} · ${percent}% confident` : `${percent}% confident`;

  const tooltipLines = [
    topic ? `Topic: ${topic}` : null,
    agent ? `Agent: ${agent}` : null,
    intent ? `Intent: ${intent}` : null,
    typeof metadata?.confidenceTier === "string"
      ? `Confidence tier: ${metadata.confidenceTier}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide",
        variant.border,
        variant.bg,
        variant.text,
      )}
      title={tooltipLines || "Intent metadata"}
      aria-label={tooltipLines || "Intent metadata"}
    >
      <Target className="h-3 w-3 opacity-75" />
      <span>{label}</span>
    </span>
  );
}
