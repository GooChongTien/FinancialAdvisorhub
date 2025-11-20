import type { ZodTypeAny } from "zod";

export type MiraModule =
  | "customer"
  | "new_business"
  | "product"
  | "analytics"
  | "todo"
  | "broadcast"
  | "visualizer";

export interface MiraContext {
  module: MiraModule;
  page: string;
  pageData?: Record<string, unknown>;
}

export interface CandidateAgentScore {
  agentId: string;
  score: number;
  reason?: string;
}

export interface IntentMetadata {
  topic: MiraModule | string;
  subtopic: string;
  intent: string;
  confidence: number;
  agent: string;
  candidateAgents?: CandidateAgentScore[];
  conversationId?: string;
  [key: string]: unknown;
}

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type UIActionType =
  | "navigate"
  | "open_dialog"
  | "open_tool"
  | "open_edit_mode"
  | "set_filter"
  | "apply_filter"
  | "search_action"
  | "frontend_prefill"
  | "update_field"
  | "update_status"
  | "submit_action"
  | "execute"
  | "generate_report"
  | "view_analysis"
  | "view_analytics"
  | "view_chart"
  | "view_comparison"
  | "view_details"
  | "view_status"
  | "get_recommendation";

type UIActionParams =
  | Record<string, string | number | boolean | null>
  | Array<string | number | boolean | null>;

interface BaseUIAction {
  id?: string;
  description?: string;
  target?: string;
  params?: UIActionParams;
  confirm_required?: boolean;
}

export interface NavigateAction extends BaseUIAction {
  action: "navigate";
  module?: MiraModule | string;
  page?: string;
  popup?: string;
}

export interface DialogAction extends BaseUIAction {
  action: "open_dialog" | "open_tool" | "open_edit_mode";
  payload?: Record<string, unknown>;
}

export interface FilterAction extends BaseUIAction {
  action: "set_filter" | "apply_filter" | "search_action";
  payload?: Record<string, unknown>;
}

export interface PrefillAction extends BaseUIAction {
  action: "frontend_prefill" | "update_field";
  target?: string;
  payload: Record<string, unknown>;
}

export interface ExecuteAction extends BaseUIAction {
  action: "execute" | "submit_action";
  api_call: {
    method: HttpMethod;
    endpoint: string;
    payload?: Record<string, unknown>;
    headers?: Record<string, string>;
  };
}

export interface StatusAction extends BaseUIAction {
  action: "update_status";
  payload?: Record<string, unknown>;
}

export interface AnalyticsAction extends BaseUIAction {
  action:
    | "generate_report"
    | "view_analysis"
    | "view_analytics"
    | "view_chart"
    | "view_comparison"
    | "view_details"
    | "view_status"
    | "get_recommendation";
  payload?: Record<string, unknown>;
}

export type UIAction =
  | NavigateAction
  | DialogAction
  | FilterAction
  | PrefillAction
  | ExecuteAction
  | StatusAction
  | AnalyticsAction;

export interface MiraResponse {
  assistant_reply: string;
  ui_actions: UIAction[];
  metadata: IntentMetadata;
  trace?: Record<string, unknown>;
}

export interface SuggestedIntent {
  intent: string;
  title: string;
  description: string;
  promptText: string;
  module?: MiraModule | string;
  confidence?: number;
}

export type InsightPriority = "critical" | "important" | "info";

export interface ProactiveInsight {
  id: string;
  title: string;
  summary: string;
  priority: InsightPriority;
  module: MiraModule | string;
  tag?: string;
  updated_at?: string;
  ctaLabel?: string;
  dismissible?: boolean;
  ui_actions?: UIAction[];
}

export interface UIActionResult {
  action: UIAction;
  success: boolean;
  error?: string;
}

export interface AgentToolSchema {
  name: string;
  description: string;
  input: ZodTypeAny;
  output?: ZodTypeAny;
}

export interface SkillAgentConfig {
  agentId: string;
  module: MiraModule;
  displayName?: string;
  description?: string;
  systemPrompt: string;
  tools: AgentToolSchema[];
  parameters?: Record<string, unknown>;
  active?: boolean;
}

// ===== Behavioral Tracking Types =====

export type UserActionType =
  | "click"
  | "form_input"
  | "scroll"
  | "hover"
  | "search"
  | "navigation"
  | "mira_interaction"
  | "form_submit"
  | "page_load";

export interface UserAction {
  timestamp: Date;
  actionType: UserActionType;
  elementId?: string;
  elementType?: string;
  elementLabel?: string;
  value?: unknown;
  context: Record<string, unknown>;
}

export interface NavigationEvent {
  timestamp: Date;
  fromPage: string;
  toPage: string;
  module: string;
  trigger: "click" | "mira" | "direct" | "back" | "forward";
  timeSpent: number;
}

export interface BehavioralContext {
  // Current state
  currentPage: string;
  currentModule: string;
  pageData: Record<string, unknown>;

  // Navigation history
  navigationHistory: NavigationEvent[];

  // User actions
  recentActions: UserAction[];

  // Session data
  sessionId: string;
  sessionStartTime: Date;
  currentPageStartTime: Date;

  // Derived insights
  userIntent?: string;
  suggestedActions?: SuggestedIntent[];
  confidenceLevel?: number;
  detectedPatterns?: string[];
}

export interface PrivacySettings {
  trackingEnabled: boolean;
  trackClickEvents: boolean;
  trackFormInputs: boolean;
  trackNavigationTime: boolean;
  shareWithMira: boolean;
  dataRetentionDays: number;
}

export interface BehavioralPattern {
  patternType: string;
  confidence: number;
  indicators: string[];
  suggestedAction?: string;
}

export interface ProactiveSuggestion {
  id: string;
  trigger: "immediate" | "after_delay" | "on_idle";
  message: string;
  actions: UIAction[];
  relevanceScore: number;
  expiresAt?: Date;
}
