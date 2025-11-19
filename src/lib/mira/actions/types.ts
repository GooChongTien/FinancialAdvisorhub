/**
 * Mira Action System - Type Definitions
 * Defines types for smart contextual actions that Mira can suggest and execute
 */

/**
 * Action category for organizing actions by domain
 */
export type ActionCategory =
  | "customer"
  | "proposal"
  | "analytics"
  | "todo"
  | "broadcast"
  | "product"
  | "navigation"
  | "data"
  | "system";

/**
 * Action priority for determining execution order and UI presentation
 */
export type ActionPriority = "critical" | "high" | "medium" | "low";

/**
 * Action execution status
 */
export type ActionStatus =
  | "pending"
  | "validating"
  | "executing"
  | "completed"
  | "failed"
  | "cancelled"
  | "requires_confirmation";

/**
 * Permission level required to execute an action
 */
export type PermissionLevel = "read" | "write" | "admin" | "system";

/**
 * Base action interface that all actions must implement
 */
export interface MiraAction {
  /** Unique identifier for the action */
  id: string;

  /** Human-readable name */
  name: string;

  /** Detailed description of what the action does */
  description: string;

  /** Category for organization */
  category: ActionCategory;

  /** Priority level */
  priority: ActionPriority;

  /** Permission required to execute */
  requiredPermission: PermissionLevel;

  /** Whether action requires user confirmation before execution */
  requiresConfirmation: boolean;

  /** Whether action can be undone */
  undoable: boolean;

  /** Keyboard shortcut (optional) */
  keyboard_shortcut?: string;

  /** Icon name for UI display */
  icon?: string;

  /** Parameters that can be provided to the action */
  parameters?: ActionParameter[];

  /** Validation rules for parameters */
  validation?: ActionValidation[];

  /** Context requirements (what data must be available) */
  contextRequirements?: string[];

  /** Estimated execution time in milliseconds */
  estimatedDuration?: number;

  /** Tags for filtering and search */
  tags?: string[];

  /** Metadata for additional context */
  metadata?: Record<string, unknown>;
}

/**
 * Action parameter definition
 */
export interface ActionParameter {
  /** Parameter name */
  name: string;

  /** Parameter type */
  type: "string" | "number" | "boolean" | "object" | "array" | "date";

  /** Whether parameter is required */
  required: boolean;

  /** Default value if not provided */
  defaultValue?: unknown;

  /** Description of the parameter */
  description?: string;

  /** Validation constraints */
  constraints?: {
    min?: number;
    max?: number;
    pattern?: string;
    enum?: unknown[];
    custom?: (value: unknown) => boolean;
  };
}

/**
 * Action validation rule
 */
export interface ActionValidation {
  /** Field to validate */
  field: string;

  /** Validation type */
  type: "required" | "format" | "range" | "custom";

  /** Error message if validation fails */
  message: string;

  /** Validation function for custom validation */
  validate?: (value: unknown, context?: ActionContext) => boolean;
}

/**
 * Action execution context
 */
export interface ActionContext {
  /** User ID executing the action */
  userId: string;

  /** Current page/module */
  currentPage: string;

  /** Current module */
  currentModule: string;

  /** Page-specific data */
  pageData?: Record<string, unknown>;

  /** User session information */
  session: {
    sessionId: string;
    startTime: Date;
  };

  /** User permissions */
  permissions: PermissionLevel[];

  /** Additional context data */
  data?: Record<string, unknown>;
}

/**
 * Action execution result
 */
export interface ActionResult {
  /** Whether action succeeded */
  success: boolean;

  /** Result data */
  data?: unknown;

  /** Error message if failed */
  error?: string;

  /** Warning messages */
  warnings?: string[];

  /** Execution time in milliseconds */
  executionTime: number;

  /** Whether action can be undone */
  undoable: boolean;

  /** Undo function if applicable */
  undo?: () => Promise<ActionResult>;

  /** Metadata about execution */
  metadata?: Record<string, unknown>;
}

/**
 * Action execution request
 */
export interface ActionRequest {
  /** Action to execute */
  action: MiraAction;

  /** Parameters for execution */
  parameters: Record<string, unknown>;

  /** Execution context */
  context: ActionContext;

  /** Whether to skip confirmation */
  skipConfirmation?: boolean;

  /** Whether to validate only (dry run) */
  validateOnly?: boolean;
}

/**
 * Action suggestion from Mira
 */
export interface ActionSuggestion {
  /** Suggested action */
  action: MiraAction;

  /** Confidence score (0-1) */
  confidence: number;

  /** Reason for suggestion */
  reason: string;

  /** Pre-filled parameters */
  suggestedParameters?: Record<string, unknown>;

  /** When to trigger the suggestion */
  trigger: "immediate" | "after_delay" | "on_idle" | "on_pattern";

  /** Delay in milliseconds if trigger is after_delay */
  delay?: number;

  /** Relevance score based on current context */
  relevanceScore: number;

  /** Pattern that triggered this suggestion */
  triggerPattern?: string;
}

/**
 * Action history entry
 */
export interface ActionHistoryEntry {
  /** Unique ID for this execution */
  id: string;

  /** Action that was executed */
  action: MiraAction;

  /** Parameters used */
  parameters: Record<string, unknown>;

  /** Execution context */
  context: ActionContext;

  /** Result of execution */
  result: ActionResult;

  /** Timestamp of execution */
  timestamp: Date;

  /** Whether action was undone */
  undone: boolean;

  /** User feedback (if provided) */
  feedback?: {
    helpful: boolean;
    comment?: string;
  };
}

/**
 * Action template for creating common actions
 */
export interface ActionTemplate {
  /** Template ID */
  id: string;

  /** Template name */
  name: string;

  /** Template description */
  description: string;

  /** Category */
  category: ActionCategory;

  /** Base action configuration */
  baseAction: Partial<MiraAction>;

  /** Parameter templates */
  parameterTemplates: ActionParameter[];

  /** Pre-defined action variants */
  variants?: Array<{
    name: string;
    parameters: Record<string, unknown>;
  }>;
}

/**
 * Action registry configuration
 */
export interface ActionRegistryConfig {
  /** Whether to enable action caching */
  enableCaching: boolean;

  /** Cache TTL in milliseconds */
  cacheTTL: number;

  /** Maximum number of cached actions */
  maxCacheSize: number;

  /** Whether to track action usage */
  trackUsage: boolean;

  /** Whether to enable action suggestions */
  enableSuggestions: boolean;
}

/**
 * UI action interface for frontend components
 */
export interface UIAction {
  /** Action ID */
  id: string;

  /** Display label */
  label: string;

  /** Icon name */
  icon?: string;

  /** Keyboard shortcut display */
  shortcut?: string;

  /** Whether action is disabled */
  disabled: boolean;

  /** Tooltip text */
  tooltip?: string;

  /** Action handler */
  handler: (parameters?: Record<string, unknown>) => Promise<void>;

  /** Loading state */
  loading?: boolean;

  /** Error state */
  error?: string;
}
