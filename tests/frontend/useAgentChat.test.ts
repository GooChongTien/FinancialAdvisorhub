// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from "vitest";
import React, { act, useEffect } from "react";
import { createRoot } from "react-dom/client";

let mockStreamImpl: any = null;
const executeActionsMock = vi.fn().mockResolvedValue([]);

vi.mock("@/admin/api/agentClient.js", () => ({
  streamAgentChat: async (...args: any[]) => {
    if (!mockStreamImpl) throw new Error("mockStreamImpl not set");
    return await mockStreamImpl(...args);
  },
  createToolResultMessage: (toolCallId: string, result: string) => ({
    role: "tool",
    tool_call_id: toolCallId,
    content: result,
  }),
  createUserMessage: (content: string) => ({ role: "user", content }),
}));

vi.mock("@/lib/mira/useUIActionExecutor.ts", () => ({
  default: () => ({
    executeActions: executeActionsMock,
  }),
}));

import { useAgentChat } from "@/admin/hooks/useAgentChat.js";

function mountHarness(onReady: (api: any) => void, options: any = {}) {
  const div = document.createElement("div");
  document.body.appendChild(div);
  const root = createRoot(div);

  function Harness() {
    const chat = useAgentChat(options);
    useEffect(() => {
      onReady(chat);
    }, [chat]);
    return null;
  }
  act(() => {
    root.render(React.createElement(Harness));
  });
  return { root, div };
}

async function waitFor(predicate: () => boolean, timeoutMs = 1000, stepMs = 10) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (predicate()) return;
    await new Promise((r) => setTimeout(r, stepMs));
  }
  throw new Error("waitFor timeout");
}

const defaultContextProvider = () => ({
  module: "customer",
  page: "/customers",
  pageData: {},
});

describe("useAgentChat hook", () => {
  beforeEach(() => {
    mockStreamImpl = null;
    document.body.innerHTML = "";
    executeActionsMock.mockClear();
  });

  it("streams assistant deltas and completes", async () => {
    mockStreamImpl = async (_messages: any, { onEvent }: any) => {
      await act(async () => {
        onEvent({ type: "message.delta", data: { delta: "Hello" } });
        onEvent({ type: "message.completed", data: { message: { role: "assistant", content: "Hello" } } });
        onEvent({ type: "done", data: {} });
      });
    };

    let api: any;
    mountHarness((x) => (api = x), { contextProvider: defaultContextProvider });
    await waitFor(() => Boolean(api));
    await act(async () => {
      await api.sendMessage("hi");
    });
    await waitFor(() => api.isStreaming === false);
    await waitFor(() => (api.messages || []).some((m: any) => m.role === "assistant"));
    const assistant = [...api.messages].reverse().find((m: any) => m.role === "assistant");
    expect(assistant?.role).toBe("assistant");
    expect(assistant?.content).toContain("Hello");
  });

  it("handles abort() during streaming", async () => {
    let continueEmit = true;
    mockStreamImpl = async (_messages: any, { onEvent, signal }: any) => {
      const tick = async () => {
        for (let i = 0; i < 5; i++) {
          if (signal?.aborted) return;
          if (!continueEmit) return;
          await act(async () => {
            onEvent({ type: "message.delta", data: { delta: "." } });
          });
          await new Promise((r) => setTimeout(r, 20));
        }
      };
      await tick();
    };

    let api: any;
    mountHarness((x) => (api = x), { contextProvider: defaultContextProvider });
    await waitFor(() => Boolean(api));
    await act(async () => {
      api.sendMessage("testing abort");
    });
    await new Promise((r) => setTimeout(r, 30));
    await act(async () => {
      api.abort();
    });
    await waitFor(() => api.isStreaming === false);
    continueEmit = false;
    expect(api.error).toBeNull();
  });

  it("attaches tool_call to current assistant message", async () => {
    mockStreamImpl = async (_messages: any, { onEvent }: any) => {
      await act(async () => {
        onEvent({
          type: "tool_call.created",
          data: { tool_call: { id: "t1", type: "function", function: { name: "do_something", arguments: "{}" } } },
        });
        onEvent({ type: "message.delta", data: { delta: "Working" } });
        onEvent({ type: "message.completed", data: { message: { role: "assistant", content: "Working" } } });
        onEvent({ type: "done", data: {} });
      });
    };

    let api: any;
    mountHarness((x) => (api = x), { contextProvider: defaultContextProvider });
    await waitFor(() => Boolean(api));
    await act(async () => {
      await api.sendMessage("hi");
    });
    await waitFor(() => api.isStreaming === false);
    await waitFor(() => (api.messages || []).some((m: any) => m.role === "assistant"));
    const assistant = [...api.messages].reverse().find((m: any) => m.role === "assistant");
    expect(assistant?.toolCall?.id).toBe("t1");
  });

  it("stores mira_response metadata and planned actions on assistant messages", async () => {
    const plannedActions = [
      { action: "navigate", module: "customer", page: "/customer" },
      { action: "frontend_prefill", payload: { field: "name", value: "Kim" } },
    ];
    mockStreamImpl = async (_messages: any, { onEvent }: any) => {
      await act(async () => {
        onEvent({ type: "message.delta", data: { delta: "Preparing plan" } });
        onEvent({
          type: "message.completed",
          data: {
            message: { role: "assistant", content: "Preparing plan" },
            metadata: {
              topic: "customer",
              subtopic: "leads",
              intent: "create_lead",
              confidence: 0.91,
              agent: "customer_agent",
              ui_actions: plannedActions,
              mira_response: {
                assistant_reply: "Preparing plan",
                ui_actions: plannedActions,
                metadata: {
                  topic: "customer",
                  subtopic: "leads",
                  intent: "create_lead",
                  confidence: 0.91,
                  agent: "customer_agent",
                },
              },
            },
          },
        });
        onEvent({ type: "done", data: {} });
      });
    };

    let api: any;
    mountHarness((x) => (api = x), { contextProvider: defaultContextProvider });
    await waitFor(() => Boolean(api));
    await act(async () => {
      await api.sendMessage("hi");
    });
    await waitFor(() => api.isStreaming === false);
    await waitFor(() => {
      const latest = [...api.messages].reverse().find((m: any) => m.role === "assistant");
      return Array.isArray(latest?.plannedActions) && latest?.plannedActions?.length === plannedActions.length;
    });
    const assistant = [...api.messages].reverse().find((m: any) => m.role === "assistant");
    expect(assistant?.plannedActions).toEqual(plannedActions);
    expect(assistant?.miraResponse?.ui_actions).toEqual(plannedActions);
    expect(assistant?.metadata?.agent).toBe("customer_agent");
  });

  it("attaches context snapshot to stream calls", async () => {
    const observedContexts: any[] = [];
    mockStreamImpl = async (_messages: any, { onEvent, context }: any) => {
      observedContexts.push(context);
      await act(async () => {
        onEvent({ type: "message.delta", data: { delta: "ok" } });
        onEvent({ type: "message.completed", data: { message: { role: "assistant", content: "ok" } } });
        onEvent({ type: "done", data: {} });
      });
    };

    let api: any;
    mountHarness((x) => (api = x), {
      contextProvider: () => ({
        module: "analytics",
        page: "/analytics",
        pageData: { range: "90d" },
      }),
    });
    await waitFor(() => Boolean(api));
    await act(async () => {
      await api.sendMessage("hi");
    });
    await waitFor(() => api.isStreaming === false);
    expect(observedContexts[0]).toEqual({
      module: "analytics",
      page: "/analytics",
      pageData: { range: "90d" },
    });
  });

  it("auto executes planned actions when provided", async () => {
    const plannedActions = [{ action: "navigate", page: "/customers" }];
    mockStreamImpl = async (_messages: any, { onEvent }: any) => {
      await act(async () => {
        onEvent({ type: "message.delta", data: { delta: "ok" } });
        onEvent({
          type: "message.completed",
          data: {
            message: { role: "assistant", content: "ok" },
            metadata: {
              ui_actions: plannedActions,
              mira_response: {
                ui_actions: plannedActions,
                metadata: {},
              },
            },
          },
        });
        onEvent({ type: "done", data: {} });
      });
    };

    let api: any;
    mountHarness((x) => (api = x), { contextProvider: defaultContextProvider });
    await waitFor(() => Boolean(api));
    await act(async () => {
      await api.sendMessage("run");
    });
    await waitFor(() => executeActionsMock.mock.calls.length > 0);
    expect(executeActionsMock).toHaveBeenCalledWith(
      plannedActions,
      expect.objectContaining({
        correlationId: expect.any(String),
      }),
    );
  });

  it("reuses conversation_id provided by the backend on subsequent sends", async () => {
    const observedMetadata: any[] = [];
    let call = 0;
    mockStreamImpl = async (_messages: any, { onEvent, metadata }: any) => {
      observedMetadata.push(metadata);
      await act(async () => {
        onEvent({ type: "message.delta", data: { delta: "ack" } });
        onEvent({
          type: "message.completed",
          data: {
            message: { role: "assistant", content: "ack" },
            metadata: call === 0 ? { conversation_id: "conv-abc" } : {},
          },
        });
        onEvent({ type: "done", data: {} });
      });
      call += 1;
    };

    let api: any;
    mountHarness((x) => (api = x), { contextProvider: defaultContextProvider });
    await waitFor(() => Boolean(api));
    await act(async () => {
      await api.sendMessage("hello");
    });
    await waitFor(() => api.conversationId === "conv-abc");
    await act(async () => {
      await api.sendMessage("again");
    });
    await waitFor(() => observedMetadata.length === 2);
    expect(observedMetadata[1]).toMatchObject({
      conversation_id: "conv-abc",
      conversationId: "conv-abc",
    });
  });

  it("attaches conversation metadata when sending tool results", async () => {
    const observedMetadata: any[] = [];
    let call = 0;
    mockStreamImpl = async (_messages: any, { onEvent, metadata }: any) => {
      observedMetadata.push(metadata);
      await act(async () => {
        onEvent({
          type: "message.completed",
          data: {
            message: { role: "assistant", content: "ok" },
            metadata: call === 0 ? { conversation_id: "conv-tool" } : {},
          },
        });
        onEvent({ type: "done", data: {} });
      });
      call += 1;
    };

    let api: any;
    mountHarness((x) => (api = x), { contextProvider: defaultContextProvider });
    await waitFor(() => Boolean(api));
    await act(async () => {
      await api.sendMessage("warmup");
    });
    await waitFor(() => api.conversationId === "conv-tool");
    await act(async () => {
      await api.sendToolResult("tool-call-1", "{}");
    });
    await waitFor(() => observedMetadata.length === 2);
    expect(observedMetadata[1]).toMatchObject({
      conversation_id: "conv-tool",
      conversationId: "conv-tool",
    });
  });
});
