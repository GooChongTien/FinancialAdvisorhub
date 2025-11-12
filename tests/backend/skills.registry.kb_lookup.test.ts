import { describe, it, expect, vi, beforeEach } from "vitest";
import { executeSkill } from "../../backend/services/skills/index.ts";
import type { AgentChatRequest } from "../../backend/services/agent/types.ts";

const lookupSpy = vi.fn();

vi.mock("../../backend/services/knowledge/lookup.ts", () => ({
  knowledgeLookup: (...args: unknown[]) => lookupSpy(...args),
}));

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

describe("executeSkill kb__knowledge_lookup (registry)", () => {
  beforeEach(() => {
    lookupSpy.mockReset().mockResolvedValue({
      items: [
        { atom_id: "KA-001", title: "Retirement Basics", topic: "RET", summary: "Covers CPF, compounding, and timelines." },
        { atom_id: "KA-002", title: "Retirement Risks", topic: "RET", summary: "Longevity, inflation, sequence risk." },
      ],
    });
  });

  it("uses natural language phrase after 'knowledge lookup' as scenario and returns summarized text", async () => {
    const request: AgentChatRequest = buildReq("Can you do a knowledge lookup: premium 25% of income?");
    const res = await executeSkill("kb__knowledge_lookup", { request, requestId: "t-lookup-1" });

    expect(lookupSpy).toHaveBeenCalledTimes(1);
    const args = lookupSpy.mock.calls[0]?.[0];
    expect(args).toMatchObject({ scenario: "premium 25% of income?", limit: 3 });
    expect(typeof res.content).toBe("string");
    expect(res.content).toContain("Here’s what I found");
    expect(res.content).toContain("Retirement Basics");
  });

  it("falls back to using full message as scenario when no explicit phrase present", async () => {
    const request = buildReq("Please find anything about retirement income planning risks");
    await executeSkill("kb__knowledge_lookup", { request, requestId: "t-2" });
    const args = lookupSpy.mock.calls[0]?.[0];
    expect(args).toMatchObject({ scenario: "Please find anything about retirement income planning risks", limit: 3 });
  });
});
