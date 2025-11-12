import { describe, it, expect } from "vitest";
import { decideSkillFromClassification } from "../../supabase/functions/_shared/services/router/skill-decider.ts";
import type { AgentChatRequest } from "../../supabase/functions/_shared/services/agent/types.ts";
import type { IntentClassification } from "../../supabase/functions/_shared/services/types.ts";

const mockRequest = (message: string, metadata: Record<string, unknown> = {}): AgentChatRequest => ({
  messages: [{ role: "user", content: message }],
  metadata,
  mode: "stream",
});

const mockClassification = (overrides: Partial<IntentClassification> = {}): IntentClassification => ({
  topic: "analytics",
  subtopic: "personal_performance",
  intent: "view_ytd_progress",
  confidence: 0.82,
  candidateAgents: [{ agentId: "AnalyticsAgent", score: 0.82 }],
  shouldSwitchTopic: false,
  confidenceTier: "high",
  ...overrides,
});

describe("decideSkillFromClassification", () => {
  it("honors metadata nextSkill hint", () => {
    const request = mockRequest("anything", { nextSkill: "kb__knowledge_lookup" });
    const classification = mockClassification();
    const decision = decideSkillFromClassification({
      classification,
      agentSelection: classification.candidateAgents[0],
      request,
    });
    expect(decision.next_skill).toBe("kb__knowledge_lookup");
    expect(decision.next_agent).toBe("mira_knowledge_brain_agent");
  });

  it("routes knowledge queries to knowledge agent", () => {
    const request = mockRequest("Can you do a knowledge lookup for retirement planning?");
    const classification = mockClassification();
    const decision = decideSkillFromClassification({
      classification,
      agentSelection: classification.candidateAgents[0],
      request,
    });
    expect(decision.next_skill).toBe("kb__knowledge_lookup");
    expect(decision.next_agent).toBe("mira_knowledge_brain_agent");
  });

  it("falls back to topic default when no heuristics match", () => {
    const request = mockRequest("Tell me more about analytics pipeline.");
    const classification = mockClassification();
    const decision = decideSkillFromClassification({
      classification,
      agentSelection: classification.candidateAgents[0],
      request,
    });
    expect(decision.next_skill).toBe("ops__analytics_explain");
    expect(decision.next_agent).toBe("mira_ops_task_agent");
  });
});
