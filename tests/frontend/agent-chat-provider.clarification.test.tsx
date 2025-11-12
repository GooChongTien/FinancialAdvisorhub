// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import React, { act, useRef, useState } from "react";
import { createRoot } from "react-dom/client";

// Signal act support for React 18 warnings.
// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

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

function mountAgentChatProvider(initialMessages = []) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  const latestStoreRef = { current: null };
  const sendMessageMock = vi.fn();
  const baseChat = {
    messages: initialMessages,
    sendMessage: sendMessageMock,
    sendToolResult: vi.fn(),
    undoAutoActions: vi.fn(),
    abort: vi.fn(),
    clearMessages: vi.fn(),
    autoActionState: null,
    error: null,
    isStreaming: false,
  };

  function Observer() {
    const store = useAgentChatStore();
    latestStoreRef.current = store;
    return null;
  }

  function Harness() {
    const [messages, setMessages] = useState(initialMessages);
    const setMessagesRef = useRef(setMessages);
    setMessagesRef.current = setMessages;
    baseChat.messages = messages;
    useAgentChatMock.mockReturnValue(baseChat);
    return (
      <AgentChatProvider>
        <Observer />
        <MessageController setMessagesRef={setMessagesRef} />
      </AgentChatProvider>
    );
  }

  function MessageController({ setMessagesRef }) {
    // Expose imperative setter for tests
    baseChat.__setMessages = (updater) => {
      act(() => {
        setMessagesRef.current((prev) =>
          typeof updater === "function" ? updater(prev) : updater,
        );
      });
    };
    return null;
  }

  act(() => {
    root.render(<Harness />);
  });

  return {
    cleanup: () => {
      act(() => root.unmount());
      container.remove();
    },
    setMessages: (updater) => baseChat.__setMessages?.(updater),
    getStore: () => latestStoreRef.current,
    sendMessageMock,
  };
}

describe("AgentChatProvider clarification prompt logic", () => {
  let cleanup = () => {};

  afterEach(() => {
    cleanup();
    cleanup = () => {};
    useAgentChatMock.mockReset();
  });

  it("derives clarification prompt from assistant metadata", () => {
    const harness = mountAgentChatProvider([]);
    cleanup = harness.cleanup;
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
    harness.setMessages([userMessage, assistantMessage]);
    const store = harness.getStore();
    expect(store?.clarificationPrompt).toMatchObject({
      messageId: "assistant-clarify",
      assistantText: "Can you confirm?",
      originalUser: "Need help",
    });
  });

  it("dismissClarification clears prompt", () => {
    const harness = mountAgentChatProvider([]);
    cleanup = harness.cleanup;
    harness.setMessages([
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
    act(() => {
      store.dismissClarification();
    });
    store = harness.getStore();
    expect(store?.clarificationPrompt).toBeNull();
  });

  it("confirmClarification resends the previous user message with metadata", async () => {
    const harness = mountAgentChatProvider([]);
    cleanup = harness.cleanup;
    harness.setMessages([
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
    await act(async () => {
      await store.confirmClarification();
    });
    expect(harness.sendMessageMock).toHaveBeenCalledWith(
      "Open tasks",
      expect.objectContaining({
        clarification_confirmed: true,
        intent: "view_tasks",
        topic: "todo",
        topic_history: ["todo"],
      }),
    );
    store = harness.getStore();
    expect(store?.clarificationPrompt).toBeNull();
  });
});
