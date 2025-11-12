import { describe, expect, it, vi, beforeEach } from "vitest";

// Create two fake adapters: first unhealthy, second healthy
const unhealthyAdapter = {
  id: "unhealthy",
  name: "Unhealthy",
  async chat() {
    throw new Error("should not be used");
  },
  async *streamChat() {
    throw new Error("should not be used");
  },
  async getClientSecret() {
    return "bad";
  },
  async health() {
    return false;
  },
};

const healthyAdapter = {
  id: "healthy",
  name: "Healthy",
  async chat(request: any) {
    return { message: { role: "assistant", content: "ok" }, toolCalls: [] };
  },
  async *streamChat() {
    yield { type: "done", data: {} } as any;
  },
  async getClientSecret() {
    return "good";
  },
  async health() {
    return true;
  },
};

vi.mock("../../backend/services/agent/adapter-registry.ts", () => {
  return {
    buildAgentAdapter: () => unhealthyAdapter,
    buildCandidateAdapters: () => [unhealthyAdapter, healthyAdapter],
  };
});

import { createAgentClient } from "../../backend/services/agent/client.ts";

describe("agent client health fallback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("falls back to a healthy adapter when current is unhealthy (health)", async () => {
    const client = createAgentClient();
    const ok = await client.health();
    expect(ok).toBe(true);
    const info = client.getAdapterInfo();
    expect(info?.id).toBe("healthy");
  });

  it("falls back before chat() and returns result from healthy adapter", async () => {
    const client = createAgentClient();
    const result = await client.chat({
      mode: "batch",
      messages: [{ role: "user", content: "hi" }],
    } as any);
    expect(result?.message?.role).toBe("assistant");
    const info = client.getAdapterInfo();
    expect(info?.id).toBe("healthy");
  });

  it("falls back before getClientSecret()", async () => {
    const client = createAgentClient();
    const secret = await client.getClientSecret();
    expect(secret).toBe("good");
    const info = client.getAdapterInfo();
    expect(info?.id).toBe("healthy");
  });
});

