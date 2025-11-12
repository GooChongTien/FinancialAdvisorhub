import { beforeEach, describe, expect, it, vi } from "vitest";

const createAgentClientSpy = vi.fn(() => ({
  chat: vi.fn(),
  streamChat: vi.fn(),
  getClientSecret: vi.fn().mockResolvedValue("adapter-secret"),
  health: vi.fn().mockResolvedValue(true),
  getAdapterInfo: vi.fn().mockReturnValue({ id: "spy-adapter", name: "SpyAdapter" }),
}));

const getClientSecretSpy = vi.fn();
const getClientSecretFromAdapterSpy = vi.fn();
const dispatchAialEventSpy = vi.fn();

vi.mock("../../backend/services/agent/client.ts", () => ({
  createAgentClient: (...args: unknown[]) => createAgentClientSpy(...args),
}));

vi.mock("../../backend/services/agent/secrets.ts", () => ({
  getClientSecret: (...args: unknown[]) => getClientSecretSpy(...args),
  getClientSecretFromAdapter: (...args: unknown[]) => getClientSecretFromAdapterSpy(...args),
}));

vi.mock("../../backend/services/aial/dispatcher.ts", () => ({
  dispatchAialEvent: (...args: unknown[]) => dispatchAialEventSpy(...args),
}));

import handleRequest from "../../backend/api/agent-chat.ts";

beforeEach(() => {
  createAgentClientSpy.mockClear();
  getClientSecretSpy.mockReset().mockResolvedValue({
    secret: "env-secret",
    updatedAt: "2024-11-10T00:00:00.000Z",
    source: "env",
  });
  getClientSecretFromAdapterSpy.mockReset();
  dispatchAialEventSpy.mockReset().mockResolvedValue({
    eventId: "evt_aial",
    intent: "aial.intent",
    message: { role: "assistant", content: "ok" },
    toolCalls: [],
  });
});

function buildRequest(body: unknown) {
  return new Request("https://example.com/api/agent-chat", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

describe("/agent-chat special modes", () => {
  it("returns ok for mode health", async () => {
    const res = await handleRequest(buildRequest({ mode: "health" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe("ok");
    expect(json.timestamp).toBeTruthy();
    expect(createAgentClientSpy).not.toHaveBeenCalled();
  });

  it("returns client secret when env secret exists", async () => {
    const res = await handleRequest(buildRequest({ mode: "get_client_secret" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.secret).toBe("env-secret");
    expect(json.source).toBe("env");
    expect(getClientSecretSpy).toHaveBeenCalledTimes(1);
    expect(getClientSecretFromAdapterSpy).not.toHaveBeenCalled();
    expect(createAgentClientSpy).toHaveBeenCalledTimes(1);
  });

  it("falls back to adapter secret when env secret missing", async () => {
    // Env path throws
    getClientSecretSpy.mockReset().mockRejectedValue(new Error("missing env secret"));
    // Adapter wrapper will call the client's getClientSecret; return a payload
    getClientSecretFromAdapterSpy.mockReset().mockImplementation(async (getter: any) => {
      const secret = await getter();
      return { secret, updatedAt: "2024-11-10T00:00:00.000Z", source: "adapter" };
    });

    const res = await handleRequest(buildRequest({ mode: "get_client_secret" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.secret).toBe("adapter-secret");
    expect(json.source).toBe("adapter");
    expect(getClientSecretFromAdapterSpy).toHaveBeenCalledTimes(1);
  });
  it("dispatches AIAL events without requiring messages array", async () => {
    const body = {
      mode: "aial",
      event: {
        id: "evt123",
        intent: "compliance.check",
        metadata: { tenantId: "tenantA", channel: "home" },
      },
    };
    const res = await handleRequest(buildRequest(body));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(dispatchAialEventSpy).toHaveBeenCalledWith(body.event);
    expect(json.result.intent).toBe("aial.intent");
  });
});
