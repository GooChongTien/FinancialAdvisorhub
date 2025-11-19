import { z } from "https://esm.sh/zod@3.25.76";
import type { RegisteredTool, ToolContext, ToolResult } from "./types.ts";

export class ToolRegistry {
  private tools = new Map<string, RegisteredTool>();

  registerTool(name: string, handler: RegisteredTool["handler"], schema?: RegisteredTool["schema"]) {
    if (!name || typeof name !== "string") {
      throw new Error("Tool name must be a non-empty string");
    }
    this.tools.set(name, { name, handler, schema });
  }

  getTool(name: string) {
    return this.tools.get(name) ?? null;
  }

  getAllTools() {
    return Array.from(this.tools.values());
  }

  async executeTool(name: string, ctx: ToolContext): Promise<ToolResult> {
    const entry = this.tools.get(name);
    if (!entry) {
      return {
        success: false,
        error: {
          code: "tool_not_found",
          message: `No tool registered under "${name}"`,
        },
      };
    }
    let validatedArgs = ctx.args;
    if (entry.schema) {
      try {
        validatedArgs = entry.schema.parse(ctx.args);
      } catch (err) {
        const issues = err instanceof z.ZodError ? err.issues : undefined;
        return {
          success: false,
          error: {
            code: "validation_error",
            message: "Tool arguments failed schema validation",
            details: issues ?? err,
          },
        };
      }
    }
    try {
      return await entry.handler(ctx, validatedArgs);
    } catch (err) {
      return {
        success: false,
        error: {
          code: "tool_failure",
          message: err instanceof Error ? err.message : "Tool handler threw an error",
          details: err,
        },
      };
    }
  }
}

export const toolRegistry = new ToolRegistry();
