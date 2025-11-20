import type { Context, Envelope, Navigate } from "../sdk/types.js";

export async function system_help(ctx: Context, userText: string): Promise<Envelope> {
  const lower = userText.toLowerCase();
  let route = ctx.session.route;
  if (lower.includes("risk profile") || lower.includes("fna")) route = "/fna";
  if (lower.includes("quote")) route = "/quote";
  if (lower.includes("task")) route = "/tasks";
  const action: Navigate = { type: "navigate", route };
  return {
    message: `I'll open the relevant screen for you in SmartPOS (${route}).`,
    actions: [action]
  };
}

