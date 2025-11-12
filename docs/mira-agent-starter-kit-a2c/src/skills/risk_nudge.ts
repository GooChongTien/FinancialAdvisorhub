import type { Context, Envelope } from "../sdk/types.js";

export async function risk_nudge(ctx: Context, userText: string): Promise<Envelope> {
  return {
    message: "This is a placeholder for risk nudges (e.g. heavy premium vs income, missing fact-find). In production, this skill would surface gentle reminders based on your firm's compliance rules."
  };
}

