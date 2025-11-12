// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { UIActionExecutor } from "@/lib/mira/action-executor";
import { MIRA_PREFILL_TARGETS } from "@/lib/mira/prefillTargets.ts";

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock("@/admin/components/ui/dialog", () => {
  const PassThrough = ({ children }) => <div>{children}</div>;
  return {
    Dialog: PassThrough,
    DialogContent: PassThrough,
    DialogHeader: PassThrough,
    DialogTitle: PassThrough,
  };
});

vi.mock("@/admin/components/ui/select", () => {
  const PassThrough = ({ children }) => <div>{children}</div>;
  const Item = ({ children }) => <div>{children}</div>;
  return {
    Select: PassThrough,
    SelectContent: PassThrough,
    SelectItem: Item,
    SelectTrigger: PassThrough,
    SelectValue: PassThrough,
  };
});

import NewLeadDialog from "@/admin/modules/customers/components/NewLeadDialog.jsx";

describe("Auto action integration", () => {
  let container: HTMLDivElement | null = null;
  let root: ReturnType<typeof createRoot> | null = null;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (root) {
      act(() => {
        root?.unmount();
      });
      root = null;
    }
    if (container?.parentNode) {
      container.parentNode.removeChild(container);
    }
    container = null;
    document.body.innerHTML = "";
  });

  it("prefills the new lead dialog and rolls back on undo", async () => {
    root = createRoot(container!);
    await act(async () => {
      root!.render(
        <NewLeadDialog open={true} onClose={() => {}} onSubmit={() => {}} isLoading={false} />,
      );
    });

    const nameInput = document.getElementById("name") as HTMLInputElement;
    expect(nameInput).toBeTruthy();
    expect(nameInput.value).toBe("");

    const executor = new UIActionExecutor({
      navigate: () => {},
      notify: () => {},
    });

    await act(async () => {
      await executor.executeActions(
        [
          {
            action: "frontend_prefill",
            target: MIRA_PREFILL_TARGETS.NEW_LEAD_FORM,
            payload: { name: "Auto Lead", contact_number: "12345678" },
          },
        ],
        { correlationId: "integration-prefill-1" },
      );
    });

    expect(nameInput.value).toBe("Auto Lead");

    await act(async () => {
      window.dispatchEvent(
        new CustomEvent("mira:auto-actions:undo", {
          detail: { id: "integration-prefill-1" },
        }),
      );
    });

    expect(nameInput.value).toBe("");
  });
});
