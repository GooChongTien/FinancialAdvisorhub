import { describe, it, expect } from "vitest";
import { intentRouter } from "../../supabase/functions/_shared/services/router/intent-router.ts";
import type { MiraContext } from "../../supabase/functions/_shared/services/types.ts";

const defaultContext: MiraContext = {
  module: "customer",
  page: "/customer",
  pageData: {},
};

describe("IntentRouterService", () => {
  it("classifies analytics performance queries", async () => {
    const context: MiraContext = { module: "analytics", page: "/analytics" };
    const result = await intentRouter.classifyIntent("Show my YTD performance numbers", context);
    expect(result.topic).toBe("analytics");
    expect(result.intent).toBeDefined();
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.candidateAgents?.length).toBeGreaterThan(0);
    expect(result.confidenceTier).toBeDefined();
  });

  it("falls back for empty prompts", async () => {
    const result = await intentRouter.classifyIntent("", defaultContext);
    expect(result.intent).toBe("ops__agent_passthrough");
    expect(result.confidence).toBe(0);
  });

  it("selects agent from candidate list", async () => {
    const classification = await intentRouter.classifyIntent("Create a new lead named Sarah", defaultContext);
    const agent = intentRouter.selectAgent(classification);
    expect(agent.agentId).toBeDefined();
    expect(agent.score).toBeGreaterThanOrEqual(0);
  });
});
