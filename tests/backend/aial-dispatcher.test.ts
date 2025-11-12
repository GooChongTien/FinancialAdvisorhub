import { beforeEach, describe, expect, it, vi } from "vitest";

const chatSpy = vi.fn();
const createAgentClientSpy = vi.fn(() => ({
  chat: chatSpy,
  streamChat: vi.fn(),
  getClientSecret: vi.fn(),
  health: vi.fn(),
}));

vi.mock("../../backend/services/agent/client.ts", () => ({
  createAgentClient: (...args: unknown[]) => createAgentClientSpy(...args),
}));

const fetchTenantModelConfigSpy = vi.fn();

vi.mock("../../backend/services/config/model-config.ts", () => ({
  fetchTenantModelConfig: (...args: unknown[]) => fetchTenantModelConfigSpy(...args),
}));

import { dispatchAialEvent } from "../../backend/services/aial/dispatcher.ts";

beforeEach(() => {
  chatSpy.mockResolvedValue({
    message: { role: "assistant", content: "ok" },
    toolCalls: [],
  });
  createAgentClientSpy.mockClear();
  fetchTenantModelConfigSpy.mockReset();
});

describe("dispatchAialEvent", () => {
  it("loads tenant config and propagates tenant metadata", async () => {
    const config = {
      tenantId: "tenant_123",
      provider: "mock",
      model: "n/a",
      priority: 0,
      metadata: {},
    };
    fetchTenantModelConfigSpy.mockResolvedValue(config);

    const event = {
      id: "evt_1",
      intent: "test.intent",
      payload: { foo: "bar" },
      metadata: { tenantId: "tenant_123" },
    };

    const result = await dispatchAialEvent(event);

    expect(fetchTenantModelConfigSpy).toHaveBeenCalledWith("tenant_123");
    expect(createAgentClientSpy).toHaveBeenCalledWith({ tenantConfig: config });
    expect(chatSpy).toHaveBeenCalledTimes(1);
    const requestArg = chatSpy.mock.calls[0]?.[0];
    expect(requestArg?.metadata?.tenantId).toBe("tenant_123");
    expect(result.intent).toBe("test.intent");
    expect(result.metadata?.tenantId).toBe("tenant_123");
  });

  it("falls back when tenant metadata missing", async () => {
    fetchTenantModelConfigSpy.mockResolvedValue(null);
    const event = {
      id: "evt_2",
      intent: "freeform.message",
      payload: { text: "hello" },
    };

    await dispatchAialEvent(event);

    expect(fetchTenantModelConfigSpy).not.toHaveBeenCalled();
    expect(createAgentClientSpy).toHaveBeenCalledWith({ tenantConfig: null });
    const requestArg = chatSpy.mock.calls.at(-1)?.[0];
    expect(requestArg?.metadata?.tenantId).toBeUndefined();
  });
});
