/**
 * Tool Registry - Centralized tool management with validation and error handling
 * Provides type-safe tool execution with Zod schema validation
 */

import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

export interface ToolResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface Tool {
  name: string;
  description: string;
  schema: z.ZodSchema;
  handler: (params: unknown, context?: ToolContext) => Promise<unknown>;
  module?: string;
  requiresAuth?: boolean;
}

export interface ToolContext {
  advisorId?: string;
  tenantId?: string;
  supabase?: unknown;
  metadata?: Record<string, unknown>;
}

export class ToolRegistry {
  private tools: Map<string, Tool> = new Map();
  private static instance: ToolRegistry;

  private constructor() {}

  static getInstance(): ToolRegistry {
    if (!ToolRegistry.instance) {
      ToolRegistry.instance = new ToolRegistry();
    }
    return ToolRegistry.instance;
  }

  /**
   * Register a tool with validation schema
   */
  registerTool(tool: Tool): void {
    if (this.tools.has(tool.name)) {
      console.warn(`[ToolRegistry] Tool ${tool.name} already registered, overwriting`);
    }
    this.tools.set(tool.name, tool);
    console.log(`[ToolRegistry] Registered tool: ${tool.name}`);
  }

  /**
   * Execute a tool with validation and error handling
   */
  async executeTool<T = unknown>(
    name: string,
    params: unknown,
    context?: ToolContext,
  ): Promise<ToolResult<T>> {
    const tool = this.tools.get(name);

    if (!tool) {
      return {
        success: false,
        error: {
          code: "TOOL_NOT_FOUND",
          message: `Tool "${name}" not found in registry`,
          details: { availableTools: Array.from(this.tools.keys()) },
        },
      };
    }

    // Validate parameters with Zod
    try {
      const validatedParams = tool.schema.parse(params);

      // Check auth requirements
      if (tool.requiresAuth && !context?.advisorId) {
        return {
          success: false,
          error: {
            code: "AUTH_REQUIRED",
            message: `Tool "${name}" requires authentication`,
          },
        };
      }

      // Execute tool handler
      const result = await tool.handler(validatedParams, context);

      return {
        success: true,
        data: result as T,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid parameters",
            details: error.errors,
          },
        };
      }

      return {
        success: false,
        error: {
          code: "EXECUTION_ERROR",
          message: error instanceof Error ? error.message : "Tool execution failed",
          details: error,
        },
      };
    }
  }

  /**
   * Get tool by name
   */
  getTool(name: string): Tool | null {
    return this.tools.get(name) || null;
  }

  /**
   * Get all registered tools
   */
  getAllTools(): Tool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get tools for a specific module
   */
  getToolsByModule(module: string): Tool[] {
    return Array.from(this.tools.values()).filter((tool) => tool.module === module);
  }

  /**
   * Clear all registered tools (for testing)
   */
  clear(): void {
    this.tools.clear();
  }
}

/**
 * Helper to create standardized success results
 */
export function createSuccessResult<T>(data: T): ToolResult<T> {
  return { success: true, data };
}

/**
 * Helper to create standardized error results
 */
export function createErrorResult(
  code: string,
  message: string,
  details?: unknown,
): ToolResult<never> {
  return {
    success: false,
    error: { code, message, details },
  };
}
