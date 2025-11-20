import type { Context, Envelope } from "../sdk/types.js";

export async function sales_help_explicit(ctx: Context, userText: string): Promise<Envelope> {
  const script = [
    "You could say something like:",
    "",
    "\"From what you've shared, I want to first make sure we're protecting your basics –",
    "things like medical bills and your family's ability to keep the home if something happens to you.",
    "We don't have to decide everything today; we can start with what fits your budget and review regularly.\""
  ].join("\n");

  return {
    message: script
  };
}

