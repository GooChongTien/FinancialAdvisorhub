import { afterEach, describe, expect, it, vi } from "vitest";
import React, { useEffect, useState } from "react";
import { cleanup, render, waitFor } from "@testing-library/react";

const useAgentChatMock = vi.fn();

vi.mock("@/admin/hooks/useAgentChat.js", () => ({
  useAgentChat: (args) => useAgentChatMock(args),
}));

vi.mock("@/admin/state/providers/MiraContextProvider.jsx", () => ({
  useMiraContext: () => ({
    getContext: () => ({}),
  }),
}));

import {
  AgentChatProvider,
  useAgentChatStore,
} from "@/admin/state/providers/AgentChatProvider.jsx";

let latestStore = null;

function StoreProbe() {
  const store = useAgentChatStore();
  latestStore = store;
  return (
    <div>
      {store.clarificationPrompt && (
        <div data-testid="clarification-text">
          {store.clarificationPrompt.assistantText}
        </div>
      )}
    </div>
  );
}

function createChatMock(messages) {
  return {
    messages,
    sendMessage: vi.fn(),
    sendToolResult: vi.fn(),
    undoAutoActions: vi.fn(),
    abort: vi.fn(),
    clearMessages: vi.fn(),
    autoActionState: null,
    error: null,
    isStreaming: false,
  };
}

function renderProvider(initialMessages = []) {
  const baseChat = createChatMock(initialMessages);
  useAgentChatMock.mockReturnValue(baseChat);

  function Harness({ msgs }) {
    const [localMessages, setLocalMessages] = useState(msgs);
    useEffect(() => setLocalMessages(msgs), [msgs]);
    baseChat.messages = localMessages;
    return (
      <AgentChatProvider>
        <StoreProbe />
      </AgentChatProvider>
    );
  }

  const utils = render(<Harness msgs={initialMessages} />);

  return {
    rerenderMessages: (messages) => utils.rerender(<Harness msgs={messages} />),
    getStore: () => latestStore,
    sendMessageMock: baseChat.sendMessage,
    unmount: () => utils.unmount(),
  };
}

describe("AgentChatProvider clarification prompt logic", () => {
  afterEach(() => {
    cleanup();
    latestStore = null;
    useAgentChatMock.mockReset();
  });

  it("derives clarification prompt from assistant metadata", () => {
    const harness = renderProvider([]);
    const userMessage = { id: "user-1", role: "user", content: "Need help" };
    const assistantMessage = {
      id: "assistant-clarify",
      role: "assistant",
      content: "Can you confirm?",
      metadata: {
        needs_clarification: true,
        intent: "create_lead",
        topic: "customer",
        topic_history: ["customer"],
      },
    };
    harness.rerenderMessages([userMessage, assistantMessage]);
    const store = harness.getStore();
    expect(store?.clarificationPrompt?.messageId).toBe("assistant-clarify");
    expect(store?.clarificationPrompt?.assistantText).toBe("Can you confirm?");
    expect(store?.clarificationPrompt?.originalUser).toBe("Need help");
  });

  it("dismissClarification clears prompt", async () => {
    const harness = renderProvider([]);
    harness.rerenderMessages([
      { id: "user-1", role: "user", content: "Hello" },
      {
        id: "assistant-clarify",
        role: "assistant",
        content: "Confirm?",
        metadata: { needs_clarification: true },
      },
    ]);
    let store = harness.getStore();
    expect(store?.clarificationPrompt).not.toBeNull();
    store.dismissClarification();
    await waitFor(() => {
      expect(harness.getStore()?.clarificationPrompt).toBeNull();
    });
  });

  it("confirmClarification resends the previous user message with metadata", async () => {
    const harness = renderProvider([]);
    harness.rerenderMessages([
      { id: "user-1", role: "user", content: "Open tasks" },
      {
        id: "assistant-clarify",
        role: "assistant",
        content: "Should I open To-Do?",
        metadata: {
          needs_clarification: true,
          intent: "view_tasks",
          topic: "todo",
          topic_history: ["todo"],
        },
      },
    ]);
    let store = harness.getStore();
    await store.confirmClarification();
    expect(harness.sendMessageMock).toHaveBeenCalledWith(
      "Open tasks",
      expect.objectContaining({
        clarification_confirmed: true,
        intent: "view_tasks",
        topic: "todo",
        topic_history: ["todo"],
      }),
    );
    await waitFor(() => {
      expect(harness.getStore()?.clarificationPrompt).toBeNull();
    });
  });
});
