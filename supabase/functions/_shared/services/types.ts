export type MiraModule =
  | "customer"
  | "new_business"
  | "product"
  | "analytics"
  | "todo"
  | "broadcast"
  | "visualizer"
  | "fna"
  | "knowledge"
  | "operations"
  | "compliance";

export interface MiraContext {
  module: MiraModule;
  page: string;
  pageData?: Record<string, unknown>;
  behavioral_context?: BehavioralContext;
  behavioral_metadata?: BehavioralMetadata;
}

// Behavioral context from frontend tracking
export interface BehavioralContext {
  currentPage?: string;
  currentModule?: string;
  pageData?: Record<string, unknown>;
  navigationHistory?: Array<{
    timestamp: string | Date;
    fromPage: string;
    toPage: string;
    module: string;
    trigger: string;
    timeSpent: number;
  }>;
  recentActions?: Array<{
    timestamp: string | Date;
    actionType: string;
    elementId?: string;
    elementType?: string;
    elementLabel?: string;
    value?: unknown;
    context?: Record<string, unknown>;
  }>;
  sessionId?: string;
  sessionStartTime?: string | Date;
  currentPageStartTime?: string | Date;
  userIntent?: string;
  detectedPatterns?: string[];
  confidenceLevel?: number;
}

export interface BehavioralMetadata {
  originalActionsCount?: number;
  sentActionsCount?: number;
  originalNavigationCount?: number;
  sentNavigationCount?: number;
  estimatedBytes?: number;
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
}

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

export interface BaseUIAction {
  id?: string;
  description?: string;
  target?: string;
  params?:
    | Record<string, string | number | boolean | null>
    | Array<string | number | boolean | null>;
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
  payload: Record<string, unknown>;
}

export interface ExecuteAction extends BaseUIAction {
  action: "execute" | "submit_action";
  api_call: {
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
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

export interface IntentClassification {
  topic: MiraModule | string;
  subtopic: string;
  intent: string;
  confidence: number;
  candidateAgents: CandidateAgentScore[];
  shouldSwitchTopic?: boolean;
  confidenceTier?: "high" | "medium" | "low";
}

export interface IntentRouter {
  classifyIntent(message: string, context: MiraContext): Promise<IntentClassification>;
  selectAgent(classification: IntentClassification): CandidateAgentScore;
}

export interface ToolExecutionContext {
  advisorId?: string;
  tenantId?: string;
  conversationId?: string;
  context: MiraContext;
  metadata?: Record<string, unknown>;
}

export interface SchemaValidator<TData = unknown> {
  parse(input: unknown): TData;
  safeParse(input: unknown): { success: true; data: TData } | { success: false; error: unknown };
}

export type ToolHandler<TInput = unknown, TResult = unknown> = (
  input: TInput,
  ctx: ToolExecutionContext,
) => Promise<TResult>;

export interface AgentTool<TInput = unknown, TResult = unknown> {
  name: string;
  description: string;
  schema?: SchemaValidator<TInput>;
  handler: ToolHandler<TInput, TResult>;
}

export interface SkillAgent {
  id: string;
  module: MiraModule;
  systemPrompt: string;
  tools: AgentTool[];
  execute(intent: string, context: MiraContext, userMessage: string): Promise<MiraResponse>;
  generateSuggestions?(context: MiraContext): Promise<SuggestedIntent[]>;
}
