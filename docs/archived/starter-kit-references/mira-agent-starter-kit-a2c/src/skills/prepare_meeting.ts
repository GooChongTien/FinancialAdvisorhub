import type { Context, Envelope, Navigate } from "../sdk/types.js";

export async function prepare_meeting(ctx: Context, userText: string): Promise<Envelope> {
  const agenda = [
    "1) Confirm any changes in family, income, or major debts since your last review.",
    "2) Review current protection vs key liabilities (e.g. mortgage) and dependants' needs.",
    "3) Check that medical/health cover is adequate.",
    "4) Ask if any new goals emerged (education, retirement, business)."
  ].join("\n");

  const actions: Navigate[] = [
    { type: "navigate", route: "/customers/" + (ctx.customer?.id ?? "") },
    { type: "navigate", route: "/fna" }
  ];

  return {
    message: `Here's a simple agenda you can follow:\n\n${agenda}\n\nI'll open the client and FNA screens so you can review details.`,
    actions
  };
}

