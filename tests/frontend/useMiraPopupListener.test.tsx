// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import React, { act } from "react";
import { createRoot } from "react-dom/client";

import useMiraPopupListener from "@/admin/hooks/useMiraPopupListener.js";
import { MIRA_POPUP_TARGETS } from "@/lib/mira/popupTargets.ts";

// Signal to React that act() is supported in this environment.
// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function mountHarness(targetId, handler) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  function Harness() {
    useMiraPopupListener(targetId, handler);
    return null;
  }

  act(() => {
    root.render(React.createElement(Harness));
  });

  return () => {
    act(() => root.unmount());
    container.remove();
  };
}

describe("useMiraPopupListener", () => {
  let cleanup = () => {};

  beforeEach(() => {
    cleanup();
    cleanup = () => {};
  });

  it("invokes handler when popup id matches", () => {
    const handler = vi.fn();
    cleanup = mountHarness(MIRA_POPUP_TARGETS.SMART_PLAN_NEW_TASK, handler);

    act(() => {
      window.dispatchEvent(
        new CustomEvent("mira:popup", {
          detail: {
            popup: "smart_plan.new_task_dialog",
            correlationId: "123",
          },
        }),
      );
    });

    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        popup: "smart_plan.new_task_dialog",
        correlationId: "123",
      }),
    );
  });

  it("runs undo callback when auto-actions undo fires", () => {
    const undoSpy = vi.fn();
    const handler = vi.fn().mockImplementation(() => undoSpy);
    cleanup = mountHarness(MIRA_POPUP_TARGETS.NEW_LEAD_FORM, handler);

    act(() => {
      window.dispatchEvent(
        new CustomEvent("mira:popup", {
          detail: {
            popup: "customers.new_lead_form",
            correlationId: "undo-1",
          },
        }),
      );
    });

    act(() => {
      window.dispatchEvent(
        new CustomEvent("mira:auto-actions:undo", {
          detail: { id: "undo-1" },
        }),
      );
    });

    expect(undoSpy).toHaveBeenCalledTimes(1);
  });
});
