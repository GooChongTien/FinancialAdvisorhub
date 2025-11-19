import { beforeEach, describe, expect, it, vi } from "vitest";
import { performance } from "node:perf_hooks";
import {
  intentRouter,
  IntentRouterService,
} from "../../supabase/functions/_shared/services/router/intent-router.ts";
import { resetIntentCache } from "../../supabase/functions/_shared/services/router/intent-cache.ts";
import { decideSkillFromClassification } from "../../supabase/functions/_shared/services/router/skill-decider.ts";
import { detectTopicSwitch, generateTransitionMessage } from "../../supabase/functions/_shared/services/router/topic-tracker.ts";
import { getAgentRegistry } from "../../supabase/functions/_shared/services/agents/registry.ts";
import type { MiraContext } from "../../supabase/functions/_shared/services/types.ts";
import type { AgentChatRequest } from "../../supabase/functions/_shared/services/agent/types.ts";

describe("Intent router integration", () => {
  beforeEach(() => {
    resetIntentCache();
  });

  it("classifies analytics requests and routes through the agent registry", async () => {
    const context: MiraContext = { module: "analytics", page: "/analytics", pageData: {} };
    const request: AgentChatRequest = {
      messages: [{ role: "user", content: "Show my year-to-date performance with charts" }],
    };

    const classification = await intentRouter.classifyIntent(request.messages[0].content as string, context);
    expect(classification.topic).toBe("analytics");
    expect(classification.candidateAgents?.[0]?.agentId).toBe("AnalyticsAgent");

    const agentScore = intentRouter.selectAgent(classification);
    const skillDecision = decideSkillFromClassification({
      classification,
      agentSelection: agentScore,
      request,
    });

    expect(skillDecision.next_agent).toBe("mira_ops_task_agent");
    expect(skillDecision.next_skill).toBe("ops__analytics_explain");

    const registry = getAgentRegistry();
    const analyticsAgent = registry.getAgentByModule("analytics");
    expect(analyticsAgent).not.toBeNull();

    const response = await analyticsAgent!.execute(classification.intent, context, request.messages[0].content);
    expect(response.ui_actions.length).toBeGreaterThan(0);
    expect(response.metadata.agent).toBe("AnalyticsAgent");
  });

  it("detects topic switches when advisors jump from customers to broadcasts", async () => {
    const context: MiraContext = { module: "broadcast", page: "/broadcast", pageData: {} };
    const classification = await intentRouter.classifyIntent(
      "Create a broadcast campaign for inactive leads with a Q4 promotion",
      context,
      { previousTopic: "customer" },
    );

    expect(classification.topic).toBe("broadcast");

    const transition = detectTopicSwitch("customer", classification.topic, 0.92);
    expect(transition.shouldSwitch).toBe(true);

    const transitionCopy = generateTransitionMessage(transition.fromTopic ?? "customer", transition.toTopic);
    expect(transitionCopy.toLowerCase()).toContain("switch");
  });

  it("falls back to context modules when scoring fails", async () => {
    const failingRouter = new IntentRouterService();
    (failingRouter as any).scoreAllIntents = vi.fn().mockReturnValue([]);

    const context: MiraContext = { module: "todo", page: "/todo", pageData: {} };
    const classification = await failingRouter.classifyIntent("???", context);
    const selectedAgent = failingRouter.selectAgent(classification);

    expect(classification.intent).toBe("ops__agent_passthrough");
    expect(classification.topic).toBe("todo");
    expect(selectedAgent.agentId).toBe("ToDoAgent");
  });

  it("handles 50 concurrent classifications under 500ms", async () => {
    const context: MiraContext = { module: "customer", page: "/customer", pageData: {} };
    const payloads = Array.from({ length: 50 }).map((_, index) => `Create a new lead number ${index}`);

    const start = performance.now();
    await Promise.all(payloads.map((message) => intentRouter.classifyIntent(message, context)));
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(500);
  });
});
