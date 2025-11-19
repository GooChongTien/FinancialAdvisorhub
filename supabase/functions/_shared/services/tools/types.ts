import type { ZodTypeAny } from "https://esm.sh/zod@3.25.76";

export interface ToolResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface ToolContext {
  req: Request;
  args: unknown;
}

export type ToolFunction<T = unknown> = (
  ctx: ToolContext,
  args: unknown,
) => Promise<ToolResult<T>>;

export interface RegisteredTool {
  name: string;
  schema?: ZodTypeAny;
  handler: ToolFunction;
}
