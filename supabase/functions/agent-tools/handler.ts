import { handleCors, jsonResponse, errorResponse } from "../_shared/utils/cors.ts";
import { toolRegistry } from "../_shared/services/tools/registry.ts";

export async function handleAgentTool(req: Request) {
  const pre = handleCors(req);
  if (pre) return pre;
  if (req.method !== "POST") return errorResponse("Method not allowed", 405);
  try {
    const body = await req.json();
    const tool = String(body?.tool || "");
    const args = body?.args ?? {};
    const toolResult = await toolRegistry.executeTool(tool, { req, args });
    if (!toolResult.success) {
      const code = toolResult.error?.code ?? "tool_error";
      const status = code === "tool_not_found" ? 404 : code === "validation_error" ? 400 : 500;
      return errorResponse(toolResult.error?.message ?? "Tool execution failed", status);
    }
    return jsonResponse({ ok: true, result: toolResult.data });
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : "Unknown error", 500);
  }
}
