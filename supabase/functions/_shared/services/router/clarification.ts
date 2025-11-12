import { intentLabel } from "./intent-label.ts";

export function needsClarification(confidenceTier?: string): boolean {
  const tier = (confidenceTier ?? "").toLowerCase();
  if (!tier) return true;
  return tier === "medium" || tier === "low";
}

interface ClarificationOptions {
  intent: string;
  confidenceTier?: string;
  transitionMessage?: string;
}

export function buildClarificationMessage(options: ClarificationOptions): string {
  if (options.transitionMessage) {
    return options.transitionMessage;
  }

  if ((options.confidenceTier ?? "").toLowerCase() === "medium") {
    const label = intentLabel(options.intent);
    return `Just to confirm — would you like me to ${label}?`;
  }

  return "I want to make sure I get this right — could you tell me a bit more about what you’d like to do?";
}
