import { describe, it, expect, vi } from "vitest";
import type { MiraContext } from "../../supabase/functions/_shared/services/types.ts";

vi.mock("../../backend/api/supabase.ts", () => ({
  createServiceClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          limit: () => ({
            maybeSingle: () => Promise.resolve({ data: null, error: null }),
          }),
        }),
      }),
    }),
  }),
}));

async function loadSkills() {
  return import("../../backend/services/skills/index.ts");
}

describe("Module agent execution via skills entrypoint", () => {
  it("executes analytics agent for view_ytd_progress intent", async () => {
    const { executeModuleAgent, hasModuleAgent } = await loadSkills();
    const context: MiraContext = { module: "analytics", page: "/analytics", pageData: {} };
    expect(hasModuleAgent("AnalyticsAgent", "analytics")).toBe(true);
    const response = await executeModuleAgent({
      agentId: "AnalyticsAgent",
      intent: "view_ytd_progress",
      context,
      userMessage: "Show my YTD performance",
    });
    expect(response.assistant_reply.toLowerCase()).toContain("ytd");
    expect(response.ui_actions[0]?.action).toBe("navigate");
  });

  it("falls back to module lookup when agentId is omitted", async () => {
    const { executeModuleAgent } = await loadSkills();
    const context: MiraContext = {
      module: "broadcast",
      page: "/broadcast",
      pageData: { campaignId: "B-1" },
    };
    const response = await executeModuleAgent({
      intent: "view_campaign_stats",
      context,
      userMessage: "Show the stats for the Q4 nurture campaign",
    });
    expect(response.metadata.agent).toBe("BroadcastAgent");
    expect(response.ui_actions.some((action) => action.action === "navigate")).toBe(true);
  });
});
