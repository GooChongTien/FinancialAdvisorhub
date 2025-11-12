// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi, afterEach } from "vitest";

vi.mock("@/admin/api/supabaseClient.js", () => ({
  default: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
    },
  },
}));

import { sendAgentChat } from "@/admin/api/agentClient.js";

describe("agentClient sendAgentChat", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("prioritizes top-level ui_actions arrays", async () => {
    const actions = [{ action: "navigate", page: "/customer" }];
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        message: { role: "assistant", content: "Done" },
        ui_actions: actions,
      }),
    });

    const result = await sendAgentChat([]);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(result.ui_actions).toEqual(actions);
    expect(result.message.content).toBe("Done");
  });

  it("falls back to metadata or mira_response actions", async () => {
    const nestedActions = [{ action: "frontend_prefill", payload: { name: "Kim" } }];
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        message: { role: "assistant", content: "Ready" },
        metadata: {},
        mira_response: {
          assistant_reply: "Ready",
          ui_actions: nestedActions,
          metadata: { agent: "customer_agent", intent: "create_lead" },
        },
      }),
    });

    const result = await sendAgentChat([]);
    expect(result.ui_actions).toEqual(nestedActions);
    expect(result.mira_response?.assistant_reply).toBe("Ready");
  });
});
