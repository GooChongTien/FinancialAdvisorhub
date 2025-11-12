import type { MiraContext, MiraResponse, UIAction } from "../types.ts";

interface BuildResponseOptions {
  subtopic?: string;
  confidence?: number;
  candidateAgents?: MiraResponse["metadata"]["candidateAgents"];
}

export function buildAgentResponse(
  agentId: string,
  intent: string,
  context: MiraContext,
  assistantReply: string,
  uiActions: UIAction[],
  options: BuildResponseOptions = {},
): MiraResponse {
  const { subtopic = "general", confidence = 0.9, candidateAgents } = options;
  return {
    assistant_reply: assistantReply,
    ui_actions: uiActions,
    metadata: {
      topic: context.module,
      subtopic,
      intent,
      confidence,
      agent: agentId,
      candidateAgents,
    },
    trace: {
      generated_at: new Date().toISOString(),
      module: context.module,
      page: context.page,
    },
  };
}
