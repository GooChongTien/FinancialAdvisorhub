// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import React from "react";
import { createRoot } from "react-dom/client";
import { ChatMessage } from "@/admin/components/ui/chat-message.jsx";

describe("ChatMessage component", () => {
  let container;
  let root;

  afterEach(() => {
    if (root) {
      try {
        root.unmount();
      } catch {}
      root = null;
    }
    if (container?.parentNode) {
      container.parentNode.removeChild(container);
    }
    container = null;
  });

  function renderMessage(message, props = {}) {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    root.render(<ChatMessage message={message} {...props} />);
    return container;
  }

  it("renders planned actions and debug pill for assistant messages", () => {
    const message = {
      id: "assistant-1",
      role: "assistant",
      content: "I'll take care of that",
      timestamp: new Date().toISOString(),
      metadata: {
        agent: "customer_agent",
        intent: "create_lead",
        topic: "customer",
      },
      plannedActions: [
        { id: "a1", action: "navigate", page: "/customer" },
        {
          id: "a2",
          action: "frontend_prefill",
          payload: { name: "Kim Tan", contact_number: "12345678" },
        },
      ],
    };

    const node = renderMessage(message);
    const html = node.innerHTML;
    expect(html).toContain("Planned actions");
    expect(html).toContain("customer_agent · create_lead");
    expect(html).toContain("Navigate");
    expect(html).toContain("/customer");
    expect(html).toContain("Prefill");
  });
});
