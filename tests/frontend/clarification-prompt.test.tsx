// @vitest-environment jsdom
import { describe, expect, it, vi, afterEach } from "vitest";
import React, { act } from "react";
import { createRoot } from "react-dom/client";

import { ClarificationPrompt } from "@/admin/components/ui/clarification-prompt.jsx";
import { intentLabel } from "@/lib/mira/intentLabels.ts";

// React expects this flag for act() support in jsdom.
// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function renderPrompt(props: Parameters<typeof ClarificationPrompt>[0]) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(React.createElement(ClarificationPrompt, props));
  });
  return {
    container,
    rerender: (nextProps: Parameters<typeof ClarificationPrompt>[0]) => {
      act(() => {
        root.render(React.createElement(ClarificationPrompt, nextProps));
      });
    },
    cleanup: () => {
      act(() => root.unmount());
      container.remove();
    },
  };
}

describe("ClarificationPrompt", () => {
  let cleanup = () => {};

  afterEach(() => {
    cleanup();
    cleanup = () => {};
  });

  it("renders nothing when prompt is null", () => {
    cleanup = renderPrompt({
      prompt: null,
      onConfirm: vi.fn(),
      onCancel: vi.fn(),
    }).cleanup;
    expect(document.body.querySelector(".rounded-lg")).toBeNull();
  });

  it("shows confirm/cancel buttons for medium confidence and fires callbacks", () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const promptData = {
      assistantText: "Confirm action?",
      metadata: {
        intent: "create_lead",
        confidenceTier: "medium",
      },
    };
    const { container, cleanup: dispose } = renderPrompt({
      prompt: promptData,
      onConfirm,
      onCancel,
    });
    cleanup = dispose;
    const label = intentLabel("create_lead");
    expect(container.textContent).toContain(`would you like me to ${label}`);

    const buttons = Array.from(container.querySelectorAll("button"));
    const confirm = buttons.find((btn) => btn.textContent?.includes("Yes"));
    const cancel = buttons.find((btn) => btn.textContent?.includes("No"));
    expect(confirm).toBeTruthy();
    expect(cancel).toBeTruthy();

    act(() => confirm?.dispatchEvent(new MouseEvent("click", { bubbles: true })));
    act(() => cancel?.dispatchEvent(new MouseEvent("click", { bubbles: true })));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("shows low-confidence text without confirm button", () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const promptData = {
      assistantText: "Need more info",
      metadata: {
        intent: "view_ytd_progress",
        confidenceTier: "low",
      },
    };
    const { container, cleanup: dispose } = renderPrompt({
      prompt: promptData,
      onConfirm,
      onCancel,
    });
    cleanup = dispose;
    expect(container.textContent).toContain("Need more info");
    const confirmButton = Array.from(container.querySelectorAll("button")).find((btn) =>
      btn.textContent?.includes("Yes"),
    );
    expect(confirmButton).toBeUndefined();
    const cancelButton = Array.from(container.querySelectorAll("button")).find((btn) =>
      btn.textContent?.includes("clarify"),
    );
    expect(cancelButton).toBeDefined();
  });
});
