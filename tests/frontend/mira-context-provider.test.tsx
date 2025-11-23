// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import React, { act, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter, useLocation, useNavigate } from "react-router-dom";

import { MiraContextProvider, useMiraContext } from "@/admin/state/providers/MiraContextProvider.jsx";

// Ensure React knows this environment supports act()
// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function waitFor(predicate: () => boolean, timeoutMs = 1500, stepMs = 15) {
  const start = Date.now();
  return new Promise<void>((resolve, reject) => {
    function check() {
      if (predicate()) {
        resolve();
        return;
      }
      if (Date.now() - start >= timeoutMs) {
        reject(new Error("waitFor timeout"));
        return;
      }
      setTimeout(check, stepMs);
    }
    check();
  });
}

function mountProvider({
  initialEntries = ["/"],
  onPrimary,
  onSecondary,
}: {
  initialEntries?: string[];
  onPrimary: (payload: { context: any; navigate: ReturnType<typeof useNavigate>; location: ReturnType<typeof useLocation> }) => void;
  onSecondary?: (ctx: any) => void;
}) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  function SecondaryObserver({ onUpdate }: { onUpdate: (ctx: any) => void }) {
    const ctx = useMiraContext();
    useEffect(() => {
      onUpdate(ctx);
    }, [ctx, onUpdate]);
    return null;
  }

  function PrimaryObserver() {
    const ctx = useMiraContext();
    const navigate = useNavigate();
    const location = useLocation();
    useEffect(() => {
      onPrimary({ context: ctx, navigate, location });
    }, [ctx, navigate, location, onPrimary]);
    if (onSecondary) {
      return <SecondaryObserver onUpdate={onSecondary} />;
    }
    return null;
  }

  act(() => {
    root.render(
      <MemoryRouter initialEntries={initialEntries}>
        <MiraContextProvider>
          <PrimaryObserver />
        </MiraContextProvider>
      </MemoryRouter>,
    );
  });

  return () => {
    act(() => root.unmount());
    container.remove();
  };
}

describe("MiraContextProvider", () => {
  let cleanup: () => void = () => {};

  afterEach(() => {
    cleanup();
    cleanup = () => {};
  });

  it("updates module and page when navigation changes location", async () => {
    let snapshot: any;
    cleanup = mountProvider({
      initialEntries: ["/advisor/customers"],
      onPrimary: (payload) => {
        snapshot = payload;
      },
    });

    await waitFor(() => snapshot && snapshot.context.page === "/advisor/customers");
    expect(snapshot.context.module).toBe("customer");

    const navigate = snapshot.navigate;
    await act(async () => {
      navigate("/advisor/analytics/performance");
    });

    await waitFor(() => snapshot && snapshot.context.page === "/advisor/analytics/performance");
    expect(snapshot.context.module).toBe("analytics");
  });

  it("resets pageData on route change and getContext mirrors state", async () => {
    let snapshot: any;
    cleanup = mountProvider({
      initialEntries: ["/advisor/customers?tab=list"],
      onPrimary: (payload) => {
        snapshot = payload;
      },
    });

    await waitFor(() => snapshot && snapshot.context.page === "/advisor/customers");

    await act(async () => {
      snapshot.context.setPageData({ draft: "yes" });
    });
    await waitFor(() => snapshot.context.pageData.draft === "yes");
    const firstContext = snapshot.context.getContext();
    expect(firstContext.page).toBe("/advisor/customers");
    expect(firstContext.pageData.draft).toBe("yes");

    const navigate = snapshot.navigate;
    await act(async () => {
      navigate("/advisor/todo");
    });
    await waitFor(() => snapshot && snapshot.context.page === "/advisor/todo");
    expect(snapshot.context.pageData).toEqual({});
    const secondContext = snapshot.context.getContext();
    expect(secondContext.module).toBe("todo");
  });

  it("provides the same context to multiple consumers", async () => {
    let primary: any;
    let secondary: any;
    cleanup = mountProvider({
      initialEntries: ["/advisor/customers"],
      onPrimary: (payload) => {
        primary = payload;
      },
      onSecondary: (ctx) => {
        secondary = ctx;
      },
    });

    await waitFor(() => primary && secondary);
    expect(primary.context.module).toBe("customer");
    expect(secondary.module).toBe("customer");

    const navigate = primary.navigate;
    await act(async () => {
      navigate("/advisor/broadcast/detail");
    });

    await waitFor(() => secondary && secondary.module === "broadcast");
    expect(primary.context.module).toBe("broadcast");
    expect(secondary.module).toBe("broadcast");
  });
});
