import { describe, it, expect, vi, beforeEach } from "vitest";

// Spyable mocks for Agent client; ensure it is NOT called for routed skills
const chatSpy = vi.fn();

vi.mock("../../backend/services/agent/client.ts", () => ({
  createAgentClient: () => ({
    chat: (...args: unknown[]) => chatSpy(...args),
    streamChat: vi.fn(),
    getClientSecret: vi.fn(),
    health: vi.fn().mockResolvedValue(true),
    getAdapterInfo: vi.fn().mockReturnValue({ id: "test-adapter", name: "TestAdapter" }),
  }),
}));

// Mock knowledge lookup so kb__knowledge_lookup execution is deterministic
const lookupSpy = vi.fn();

vi.mock("../../backend/services/knowledge/lookup.ts", () => ({
  knowledgeLookup: (...args: unknown[]) => lookupSpy(...args),
}));

import handleRequest from "../../backend/api/agent-chat.ts";

function buildRequest(body: unknown) {
  return new Request("https://example.com/api/agent-chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("/agent-chat routes and executes kb__knowledge_lookup locally (batch)", () => {
  beforeEach(() => {
    chatSpy.mockReset();
    lookupSpy.mockReset().mockResolvedValue({
      items: [
        { atom_id: "KA-001", title: "Retirement Basics", topic: "RET", summary: "Covers CPF, compounding, and timelines." },
      ],
    });
  });

  it("returns local skill result and does not call Agent client", async () => {
    const req = buildRequest({
      mode: "batch",
      messages: [
        { role: "system", content: "test" },
        { role: "user", content: "kb: retirement planning tips" },
      ],
    });

    const res = await handleRequest(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty("message");
    expect(String(json.message?.content)).toContain("Here’s what I found");
    expect(String(json.message?.content)).toContain("Retirement Basics");
    expect(chatSpy).not.toHaveBeenCalled();
  });
});

