/**
 * Mira Action Executor
 * Validates and executes actions with permission checks, error handling, and undo support
 */

import type {
  MiraAction,
  ActionRequest,
  ActionResult,
  ActionContext,
  ActionHistoryEntry,
  ActionParameter,
  ActionValidation,
} from "./types";

/**
 * Action execution error
 */
export class ActionExecutionError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "ActionExecutionError";
  }
}

/**
 * Action Executor
 * Handles validation, permission checking, and execution of Mira actions
 */
export class ActionExecutor {
  private static instance: ActionExecutor;
  private executionHistory: ActionHistoryEntry[] = [];
  private maxHistorySize = 100;
  private actionHandlers: Map<string, (params: Record<string, unknown>, context: ActionContext) => Promise<ActionResult>> = new Map();

  private constructor() {
    this.registerDefaultHandlers();
  }

  static getInstance(): ActionExecutor {
    if (!ActionExecutor.instance) {
      ActionExecutor.instance = new ActionExecutor();
    }
    return ActionExecutor.instance;
  }

  /**
   * Register an action handler
   */
  registerHandler(
    actionId: string,
    handler: (params: Record<string, unknown>, context: ActionContext) => Promise<ActionResult>
  ): void {
    this.actionHandlers.set(actionId, handler);
  }

  /**
   * Execute an action
   */
  async execute(request: ActionRequest): Promise<ActionResult> {
    const startTime = Date.now();

    try {
      // 1. Validate request
      if (request.validateOnly) {
        return await this.validateAction(request);
      }

      // 2. Check permissions
      this.checkPermissions(request.action, request.context);

      // 3. Validate parameters
      this.validateParameters(request.action, request.parameters);

      // 4. Check confirmation requirement
      if (request.action.requiresConfirmation && !request.skipConfirmation) {
        return {
          success: false,
          error: "Action requires user confirmation",
          executionTime: Date.now() - startTime,
          undoable: false,
          metadata: {
            requiresConfirmation: true,
          },
        };
      }

      // 5. Execute the action
      const handler = this.actionHandlers.get(request.action.id.split("_")[0]); // Get base action ID
      if (!handler) {
        throw new ActionExecutionError(
          `No handler registered for action: ${request.action.id}`,
          "NO_HANDLER"
        );
      }

      const result = await handler(request.parameters, request.context);

      // 6. Record in history
      if (result.success) {
        this.recordExecution(request, result);
      }

      // 7. Return result
      return {
        ...result,
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      console.error("[ActionExecutor] Execution failed:", error);

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        executionTime: Date.now() - startTime,
        undoable: false,
        metadata: {
          error: error instanceof ActionExecutionError ? error.details : undefined,
        },
      };
    }
  }

  /**
   * Validate action without executing
   */
  private async validateAction(request: ActionRequest): Promise<ActionResult> {
    const startTime = Date.now();

    try {
      this.checkPermissions(request.action, request.context);
      this.validateParameters(request.action, request.parameters);

      return {
        success: true,
        data: { valid: true },
        executionTime: Date.now() - startTime,
        undoable: false,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Validation failed",
        executionTime: Date.now() - startTime,
        undoable: false,
      };
    }
  }

  /**
   * Check user permissions
   */
  private checkPermissions(action: MiraAction, context: ActionContext): void {
    if (!context.permissions.includes(action.requiredPermission)) {
      throw new ActionExecutionError(
        `Insufficient permissions. Required: ${action.requiredPermission}`,
        "PERMISSION_DENIED",
        {
          required: action.requiredPermission,
          available: context.permissions,
        }
      );
    }
  }

  /**
   * Validate action parameters
   */
  private validateParameters(action: MiraAction, parameters: Record<string, unknown>): void {
    if (!action.parameters) return;

    for (const param of action.parameters) {
      const value = parameters[param.name];

      // Check required parameters
      if (param.required && (value === undefined || value === null)) {
        throw new ActionExecutionError(
          `Required parameter missing: ${param.name}`,
          "MISSING_PARAMETER",
          { parameter: param.name }
        );
      }

      // Validate parameter type
      if (value !== undefined && value !== null) {
        this.validateParameterType(param, value);
        this.validateParameterConstraints(param, value);
      }
    }

    // Custom validation rules
    if (action.validation) {
      for (const validation of action.validation) {
        this.applyValidationRule(validation, parameters);
      }
    }
  }

  /**
   * Validate parameter type
   */
  private validateParameterType(param: ActionParameter, value: unknown): void {
    const actualType = Array.isArray(value) ? "array" : typeof value;

    if (param.type === "date" && !(value instanceof Date)) {
      throw new ActionExecutionError(
        `Parameter ${param.name} must be a Date`,
        "INVALID_TYPE",
        { parameter: param.name, expected: "Date", actual: typeof value }
      );
    }

    if (param.type !== "date" && param.type !== actualType && actualType !== "object") {
      throw new ActionExecutionError(
        `Parameter ${param.name} has invalid type`,
        "INVALID_TYPE",
        { parameter: param.name, expected: param.type, actual: actualType }
      );
    }
  }

  /**
   * Validate parameter constraints
   */
  private validateParameterConstraints(param: ActionParameter, value: unknown): void {
    if (!param.constraints) return;

    // Enum validation
    if (param.constraints.enum && !param.constraints.enum.includes(value)) {
      throw new ActionExecutionError(
        `Parameter ${param.name} must be one of: ${param.constraints.enum.join(", ")}`,
        "INVALID_VALUE",
        {
          parameter: param.name,
          allowed: param.constraints.enum,
          actual: value,
        }
      );
    }

    // Range validation for numbers
    if (typeof value === "number") {
      if (param.constraints.min !== undefined && value < param.constraints.min) {
        throw new ActionExecutionError(
          `Parameter ${param.name} must be >= ${param.constraints.min}`,
          "VALUE_TOO_LOW",
          { parameter: param.name, min: param.constraints.min, actual: value }
        );
      }

      if (param.constraints.max !== undefined && value > param.constraints.max) {
        throw new ActionExecutionError(
          `Parameter ${param.name} must be <= ${param.constraints.max}`,
          "VALUE_TOO_HIGH",
          { parameter: param.name, max: param.constraints.max, actual: value }
        );
      }
    }

    // Pattern validation for strings
    if (typeof value === "string" && param.constraints.pattern) {
      const regex = new RegExp(param.constraints.pattern);
      if (!regex.test(value)) {
        throw new ActionExecutionError(
          `Parameter ${param.name} does not match required pattern`,
          "INVALID_FORMAT",
          { parameter: param.name, pattern: param.constraints.pattern }
        );
      }
    }

    // Custom validation
    if (param.constraints.custom && !param.constraints.custom(value)) {
      throw new ActionExecutionError(
        `Parameter ${param.name} failed custom validation`,
        "CUSTOM_VALIDATION_FAILED",
        { parameter: param.name }
      );
    }
  }

  /**
   * Apply validation rule
   */
  private applyValidationRule(validation: ActionValidation, parameters: Record<string, unknown>): void {
    const value = parameters[validation.field];

    switch (validation.type) {
      case "required":
        if (value === undefined || value === null) {
          throw new ActionExecutionError(
            validation.message,
            "VALIDATION_FAILED",
            { field: validation.field, type: "required" }
          );
        }
        break;

      case "custom":
        if (validation.validate && !validation.validate(value)) {
          throw new ActionExecutionError(
            validation.message,
            "VALIDATION_FAILED",
            { field: validation.field, type: "custom" }
          );
        }
        break;

      default:
        // Other validation types can be added here
        break;
    }
  }

  /**
   * Record action execution in history
   */
  private recordExecution(request: ActionRequest, result: ActionResult): void {
    const entry: ActionHistoryEntry = {
      id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      action: request.action,
      parameters: request.parameters,
      context: request.context,
      result,
      timestamp: new Date(),
      undone: false,
    };

    this.executionHistory.unshift(entry);

    // Limit history size
    if (this.executionHistory.length > this.maxHistorySize) {
      this.executionHistory = this.executionHistory.slice(0, this.maxHistorySize);
    }
  }

  /**
   * Get execution history
   */
  getHistory(limit?: number): ActionHistoryEntry[] {
    return limit ? this.executionHistory.slice(0, limit) : [...this.executionHistory];
  }

  /**
   * Get last executed action
   */
  getLastAction(): ActionHistoryEntry | null {
    return this.executionHistory[0] || null;
  }

  /**
   * Undo last action
   */
  async undoLast(): Promise<ActionResult> {
    const lastAction = this.getLastAction();

    if (!lastAction) {
      return {
        success: false,
        error: "No action to undo",
        executionTime: 0,
        undoable: false,
      };
    }

    if (lastAction.undone) {
      return {
        success: false,
        error: "Action already undone",
        executionTime: 0,
        undoable: false,
      };
    }

    if (!lastAction.result.undoable || !lastAction.result.undo) {
      return {
        success: false,
        error: "Action cannot be undone",
        executionTime: 0,
        undoable: false,
      };
    }

    try {
      const result = await lastAction.result.undo();
      lastAction.undone = true;
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Undo failed",
        executionTime: 0,
        undoable: false,
      };
    }
  }

  /**
   * Clear execution history
   */
  clearHistory(): void {
    this.executionHistory = [];
  }

  /**
   * Register default action handlers
   */
  private registerDefaultHandlers(): void {
    // Navigation handler
    this.registerHandler("navigate", async (params, context) => {
      const page = params.page as string;

      // In a real implementation, this would use react-router
      console.log(`[ActionExecutor] Navigating to: ${page}`);

      return {
        success: true,
        data: { navigatedTo: page },
        executionTime: 0,
        undoable: false,
      };
    });

    // Customer actions
    this.registerHandler("create", async (params, context) => {
      // Placeholder for create action
      console.log("[ActionExecutor] Create action:", params);

      return {
        success: true,
        data: { created: true },
        executionTime: 0,
        undoable: true,
        undo: async () => ({
          success: true,
          data: { undone: true },
          executionTime: 0,
          undoable: false,
        }),
      };
    });

    // View actions
    this.registerHandler("view", async (params, context) => {
      console.log("[ActionExecutor] View action:", params);

      return {
        success: true,
        data: { viewed: true },
        executionTime: 0,
        undoable: false,
      };
    });

    // Update actions
    this.registerHandler("update", async (params, context) => {
      console.log("[ActionExecutor] Update action:", params);

      return {
        success: true,
        data: { updated: true },
        executionTime: 0,
        undoable: true,
        undo: async () => ({
          success: true,
          data: { undone: true },
          executionTime: 0,
          undoable: false,
        }),
      };
    });

    // Apply actions (filters, etc.)
    this.registerHandler("apply", async (params, context) => {
      console.log("[ActionExecutor] Apply action:", params);

      return {
        success: true,
        data: { applied: true },
        executionTime: 0,
        undoable: true,
        undo: async () => ({
          success: true,
          data: { undone: true },
          executionTime: 0,
          undoable: false,
        }),
      };
    });

    // Export actions
    this.registerHandler("export", async (params, context) => {
      console.log("[ActionExecutor] Export action:", params);

      return {
        success: true,
        data: { exported: true, format: params.format },
        executionTime: 0,
        undoable: false,
      };
    });

    // Complete actions (tasks)
    this.registerHandler("complete", async (params, context) => {
      console.log("[ActionExecutor] Complete action:", params);

      return {
        success: true,
        data: { completed: true },
        executionTime: 0,
        undoable: true,
        undo: async () => ({
          success: true,
          data: { undone: true },
          executionTime: 0,
          undoable: false,
        }),
      };
    });

    // Submit actions (proposals)
    this.registerHandler("submit", async (params, context) => {
      console.log("[ActionExecutor] Submit action:", params);

      return {
        success: true,
        data: { submitted: true },
        executionTime: 0,
        undoable: false,
      };
    });
  }
}

// Export singleton instance
export const actionExecutor = ActionExecutor.getInstance();
