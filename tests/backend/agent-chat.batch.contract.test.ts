import { describe, expect, it, vi, beforeEach } from "vitest";

// Spyable mocks
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

import handleRequest from "../../backend/api/agent-chat.ts";

function buildRequest(body: unknown) {
  return new Request("https://example.com/api/agent-chat", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

describe("/agent-chat batch mode contract", () => {
  beforeEach(() => {
    chatSpy.mockReset().mockResolvedValue({
      message: { role: "assistant", content: "hello from batch" },
      toolCalls: [],
      tokensUsed: 123,
    });
  });

  it("returns JSON { message } for mode:\"batch\"", async () => {
    const req = buildRequest({
      mode: "batch",
      messages: [
        { role: "system", content: "test" },
        { role: "user", content: "hi" },
      ],
    });

    const res = await handleRequest(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty("message");
    expect(json.message?.role).toBe("assistant");
    expect(json.message?.content).toContain("hello from batch");
    expect(chatSpy).toHaveBeenCalledTimes(1);
  });

  it("rejects invalid batch payloads missing messages", async () => {
    const bad = buildRequest({ mode: "batch" });
    const res = await handleRequest(bad);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(String(json.error)).toContain("messages");
  });
});

