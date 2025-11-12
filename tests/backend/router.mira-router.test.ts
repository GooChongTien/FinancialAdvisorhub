import { describe, it, expect } from "vitest";
import { routeMira } from "../../backend/services/router/mira-router.ts";
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

describe("mira_router routeMira", () => {
  it("routes knowledge lookup via kb: syntax", () => {
    const req = buildReq("kb: retirement planning tips");
    const d = routeMira(req);
    expect(d.next_agent).toBe("mira_knowledge_brain_agent");
    expect(d.next_skill).toBe("kb__knowledge_lookup");
  });

  it("routes knowledge lookup via natural phrase", () => {
    const req = buildReq("Can you do a knowledge lookup: whole life?");
    const d = routeMira(req);
    expect(d.next_skill).toBe("kb__knowledge_lookup");
  });

  it("routes to FNA for needs analysis intent", () => {
    const req = buildReq("I need a needs analysis for a family of 4");
    const d = routeMira(req);
    expect(d.next_agent).toBe("mira_fna_advisor_agent");
    expect(d.next_skill).toBe("fna__generate_recommendation");
  });

  it("defaults to ops passthrough for tasks", () => {
    const req = buildReq("Create a task for follow-up call tomorrow");
    const d = routeMira(req);
    expect(d.next_agent).toBe("mira_ops_task_agent");
    expect(d.next_skill).toBe("ops__agent_passthrough");
  });

  it("allows metadata nextSkill override", () => {
    const req = buildReq("random text", { nextSkill: "kb__knowledge_lookup" });
    const d = routeMira(req);
    expect(d.next_agent).toBe("mira_knowledge_brain_agent");
    expect(d.next_skill).toBe("kb__knowledge_lookup");
  });
});

