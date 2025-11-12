// @vitest-environment jsdom
import { describe, expect, it, beforeEach, afterEach } from "vitest";
import React, { useEffect } from "react";
import { createRoot } from "react-dom/client";
import { MiraConfirmProvider, useMiraConfirm } from "@/lib/mira/useMiraConfirm";

function mountHarness(onReady: (api: any) => void) {
  const div = document.createElement("div");
  document.body.appendChild(div);
  const root = createRoot(div);

  function Harness() {
    const api = useMiraConfirm();
    useEffect(() => {
      onReady(api);
    }, [api]);
    return null;
  }

  root.render(
    <MiraConfirmProvider>
      <Harness />
    </MiraConfirmProvider>,
  );

  return {
    cleanup: () => {
      root.unmount();
      div.remove();
    },
  };
}

async function waitForDialog() {
  for (let i = 0; i < 20; i++) {
    if (document.querySelector("[data-testid='mira-confirm-dialog']")) return;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error("dialog did not open");
}

describe("useMiraConfirm", () => {
  let harnessCleanup: (() => void) | null = null;

  afterEach(() => {
    if (harnessCleanup) {
      harnessCleanup();
      harnessCleanup = null;
    }
    document.body.innerHTML = "";
  });

  it("resolves true when user approves", async () => {
    let api: any;
    const harness = mountHarness((ctx) => {
      api = ctx;
    });
    harnessCleanup = harness.cleanup;
    await new Promise((resolve) => setTimeout(resolve, 0));

    const promise = api.requestConfirmation({
      action: "execute",
      api_call: { method: "POST", endpoint: "/test", payload: { foo: "bar" } },
    });

    await waitForDialog();
    document.querySelector("[data-testid='mira-confirm-approve']").dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await expect(promise).resolves.toBe(true);
  });

  it("resolves false when user cancels", async () => {
    let api: any;
    const harness = mountHarness((ctx) => {
      api = ctx;
    });
    harnessCleanup = harness.cleanup;
    await new Promise((resolve) => setTimeout(resolve, 0));

    const promise = api.requestConfirmation({
      action: "execute",
      api_call: { method: "DELETE", endpoint: "/test" },
    });
    await waitForDialog();
    document.querySelector("[data-testid='mira-confirm-cancel']").dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await expect(promise).resolves.toBe(false);
  });
});
