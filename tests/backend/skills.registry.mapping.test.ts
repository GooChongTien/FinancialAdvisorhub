import { describe, it, expect, vi } from "vitest";

// Prevent remote ESM import in Node tests
vi.mock("../../backend/api/supabase.ts", () => ({
  createServiceClient: () => ({ from: vi.fn() }),
}));
import { hasSkill, getAgentForSkill, executeSkill } from "../../backend/services/skills/index.ts";
import type { AgentChatRequest } from "../../backend/services/agent/types.ts";

function buildReq(content: string, metadata?: Record<string, unknown>): AgentChatRequest {
  return {
    mode: "batch",
    messages: [
      { role: "system", content: "test" },
      { role: "user", content },
    ],
    metadata,
  };
}

describe("skills registry mapping", () => {
  it("has namespaced skills for kb/fna/ops", () => {
    expect(hasSkill("kb__risk_nudge")).toBe(true);
    expect(hasSkill("fna__capture_update_data")).toBe(true);
    expect(hasSkill("ops__prepare_meeting")).toBe(true);
  });

  it("returns correct agent names for skills", () => {
    expect(getAgentForSkill("kb__risk_nudge")).toBe("mira_knowledge_brain_agent");
    expect(getAgentForSkill("kb__sales_help_explicit")).toBe("mira_knowledge_brain_agent");
    expect(getAgentForSkill("fna__capture_update_data")).toBe("mira_fna_advisor_agent");
    expect(getAgentForSkill("fna__case_overview")).toBe("mira_fna_advisor_agent");
    expect(getAgentForSkill("ops__system_help")).toBe("mira_ops_task_agent");
    expect(getAgentForSkill("ops__post_meeting_wrap")).toBe("mira_ops_task_agent");
  });

  it("executes a wrapped kb skill (risk_nudge)", async () => {
    const req = buildReq("give me a risk nudge", { journey_type: "A2C" });
    const res = await executeSkill("kb__risk_nudge", { request: req, requestId: "t-3" });
    expect(typeof res.content).toBe("string");
    expect(res.content.toLowerCase()).toContain("risk nudge");
  });
});
