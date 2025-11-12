import { createServiceClient } from "../supabase.ts";

export interface IntentLogPayload {
  conversationId?: string | null;
  intentId?: string | null;
  topic: string;
  subtopic: string;
  intent: string;
  confidence: number;
  confidenceTier?: "high" | "medium" | "low";
  selectedAgent: string;
  selectedSkill: string;
  userMessage: string;
  metadata?: Record<string, unknown>;
}

export type IntentLogStatus = "recorded" | "disabled" | "error";
export interface IntentLogResult {
  status: IntentLogStatus;
  error?: string;
}

function isLoggingEnabled(): boolean {
  try {
    if (typeof Deno === "undefined" || !Deno.env) return false;
    const flag = Deno.env.get("MIRA_INTENT_LOG_ENABLED") ?? "";
    return flag.trim().toLowerCase() === "true";
  } catch {
    return false;
  }
}

function safeTruncate(input: string, limit = 2000) {
  if (!input) return "";
  return input.length > limit ? `${input.slice(0, limit)}…` : input;
}

export async function logIntentClassification(payload: IntentLogPayload): Promise<IntentLogResult> {
  const enabled = isLoggingEnabled();
  const row = {
    conversation_id: payload.conversationId ?? null,
    intent_id: payload.intentId ?? null,
    topic: payload.topic,
    subtopic: payload.subtopic,
    intent_name: payload.intent,
    confidence: Number(payload.confidence.toFixed(3)),
    selected_agent: payload.selectedAgent,
    selected_skill: payload.selectedSkill,
    user_message: safeTruncate(payload.userMessage ?? ""),
    metadata: payload.metadata ?? {},
    confidence_tier: payload.confidenceTier ?? null,
  };

  if (!enabled) {
    console.info("[IntentLog disabled]", {
      topic: row.topic,
      intent: row.intent_name,
      confidence: row.confidence,
    });
    return { status: "disabled" };
  }

  try {
    const supabase = createServiceClient();
    const { error } = await supabase.from("mira_intent_logs").insert([row]);
    if (error) throw error;
    return { status: "recorded" };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === "string"
          ? error
          : (() => {
              try {
                return JSON.stringify(error);
              } catch {
                return "unknown_error";
              }
            })();
    console.error("[IntentLog] insert failed", error);
    return { status: "error", error: message };
  }
}
