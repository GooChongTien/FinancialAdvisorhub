import type { Context, Envelope, Navigate } from "../sdk/types.js";

export async function case_overview(ctx: Context, userText: string): Promise<Envelope> {
  const summary = [
    `Client: ${ctx.customer?.name ?? "N/A"}`,
    "Age: 35 (example)",
    "Family: married, 1 child (example)",
    "Liabilities: mortgage 600k (example)",
    "Existing cover: life 150k, CI 50k (example)",
    "Main gaps: life cover vs mortgage & income replacement, CI shortfall."
  ].join("\n");

  const navigate: Navigate = { type: "navigate", route: "/fna" };

  return {
    message: `Here is a quick snapshot based on available data (example data hard-coded in starter kit):\n\n${summary}\n\nYou might want to review the FNA and policy list before the conversation.`,
    actions: [navigate]
  };
}

