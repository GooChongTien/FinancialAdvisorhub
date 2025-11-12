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
  confidence?: number;
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
