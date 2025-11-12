import { describe, it, expect } from "vitest";
import { getAgentRegistry } from "../../supabase/functions/_shared/services/agents/registry.ts";
import type { MiraContext } from "../../supabase/functions/_shared/services/types.ts";

describe("AgentRegistry", () => {
  it("loads all seven module agents", () => {
    const registry = getAgentRegistry();
    const agents = registry.getAllAgents();
    expect(agents).toHaveLength(7);
  });

  it("CustomerAgent handles create_lead intent with ui_actions", async () => {
    const registry = getAgentRegistry();
    const agent = registry.getAgentByModule("customer");
    expect(agent).not.toBeNull();
    const context: MiraContext = {
      module: "customer",
      page: "/customer",
      pageData: { leadName: "Jamie Tan", contactNumber: "98887777" },
    };
    const response = await agent!.execute("create_lead", context, "Create a lead for Jamie Tan");
    expect(response.assistant_reply).toContain("lead");
    expect(response.ui_actions.length).toBeGreaterThan(0);
    expect(response.metadata.intent).toBe("create_lead");
  });
});
