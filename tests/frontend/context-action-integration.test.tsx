// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { MiraContextProvider, useMiraContext } from "@/admin/state/providers/MiraContextProvider.jsx";
import { ToastProvider } from "@/admin/components/ui/toast.jsx";
import { MiraConfirmProvider } from "@/lib/mira/useMiraConfirm";
import useUIActionExecutor from "@/lib/mira/useUIActionExecutor.ts";
import type { UIAction } from "@/lib/mira/types.ts";

const logEventMock = vi.hoisted(() => vi.fn());
const getSessionMock = vi.hoisted(() => vi.fn().mockResolvedValue({ data: { session: null } }));

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock("@/lib/mira/action-logger.ts", () => ({
  logMiraActionEvent: logEventMock,
}));

vi.mock("@/admin/api/supabaseClient.js", () => {
  const supabase = {
    auth: {
      getSession: getSessionMock,
    },
  };
  return { __esModule: true, default: supabase, supabase };
});

type HarnessHandle = {
  run: (actions: UIAction[], options?: { correlationId?: string | null }) => Promise<unknown> | undefined;
  currentPath: () => string;
  isReady: () => boolean;
};

const TestHarness = forwardRef<HarnessHandle>((_, ref) => {
  const executor = useUIActionExecutor();
  const { setPageData, pageData } = useMiraContext();
  const location = useLocation();
  const [ready, setReady] = useState(false);
  const desiredPageData = { lead_id: "lead-123", stage: "prospect" };

  useEffect(() => {
    if (!pageData || Object.keys(pageData).length === 0) {
      setPageData(desiredPageData);
      return;
    }
    setReady(true);
  }, [pageData, setPageData, location.pathname, location.search]);

  useImperativeHandle(ref, () => ({
    run: (actions, options) => executor.executeActions(actions, options),
    currentPath: () => `${location.pathname}${location.search}`,
    isReady: () => ready,
  }));

  return <div data-testid="current-path">{location.pathname}{location.search}</div>;
});

function renderHarness(initialEntry = "/customers/detail?leadId=lead-123") {
  const ref = createRef<HarnessHandle>();
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <ToastProvider>
        <MiraConfirmProvider>
          <MiraContextProvider>
            <TestHarness ref={ref} />
          </MiraContextProvider>
        </MiraConfirmProvider>
      </ToastProvider>
    </MemoryRouter>,
  );
  return ref;
}

describe("Context + UI Action integration", () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  const originalFetch = globalThis.fetch;
  const originalWindowFetch = typeof window !== "undefined" ? window.fetch : undefined;

  beforeEach(() => {
    logEventMock.mockReset();
    fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
      text: async () => "",
    });
    (globalThis as any).fetch = fetchMock;
    if (typeof window !== "undefined") {
      (window as any).fetch = fetchMock;
    }
  });

  afterEach(() => {
    (globalThis as any).fetch = originalFetch;
    if (typeof window !== "undefined") {
      (window as any).fetch = originalWindowFetch;
    }
  });

  it("runs navigation, prefill, and execute actions with the current context snapshot", async () => {
    const harnessRef = renderHarness();
    const harness = harnessRef.current;
    expect(harness).toBeTruthy();
    await waitFor(() => expect(harness?.isReady()).toBe(true));
    const prefillEvents: Array<{ action: UIAction; correlationId?: string | null }> = [];
    const prefillListener = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      prefillEvents.push(detail);
    };
    window.addEventListener("mira:prefill", prefillListener);

    const actions: UIAction[] = [
      {
        action: "frontend_prefill",
        target: "customers.new_lead_form",
        payload: { name: "Jamie Tan", contact_number: "81234567" },
        description: "Prefill lead form",
      },
      {
        action: "execute",
        description: "Create CRM lead",
        api_call: {
          method: "POST",
          endpoint: "/api/leads",
          payload: { name: "Jamie Tan" },
        },
      },
      {
        action: "navigate",
        page: "CustomerDetail?id=lead-123",
        params: { filter: "hot" },
        description: "Open customer detail",
      },
    ];

    await harness?.run(actions, { correlationId: "ctx-flow" });

    window.removeEventListener("mira:prefill", prefillListener);

    expect(screen.getByTestId("current-path")).toHaveTextContent("/customers/detail");
    expect(prefillEvents).toHaveLength(1);
    expect(prefillEvents[0]?.action?.payload).toEqual(
      expect.objectContaining({ name: "Jamie Tan", contact_number: "81234567" }),
    );
    const executeCall = fetchMock.mock.calls.find(([url]) => typeof url === "string" && url.includes("/api/leads"));
    expect(executeCall).toBeTruthy();
    expect(executeCall?.[1]).toMatchObject({
      method: "POST",
      body: JSON.stringify({ name: "Jamie Tan" }),
    });

    const executeLog = logEventMock.mock.calls
      .map((call) => call[0])
      .find((entry) => entry?.action?.action === "execute");
    expect(executeLog?.context).toMatchObject({
      module: "customer",
      page: "/customers/detail",
      pageData: expect.objectContaining({ lead_id: "lead-123", stage: "prospect" }),
    });
    expect(executeLog?.correlationId).toBe("ctx-flow");
  });

  it("surfaces the confirmation dialog for execute actions marked as confirm_required", async () => {
    const harnessRef = renderHarness("/smart-plan");
    const harness = harnessRef.current;
    expect(harness).toBeTruthy();
    await waitFor(() => expect(harness?.isReady()).toBe(true));
    const confirmAction: UIAction = {
      action: "execute",
      description: "Archive completed task",
      confirm_required: true,
      api_call: {
        method: "DELETE",
        endpoint: "/api/tasks/task-99",
        payload: { task_id: "task-99" },
      },
    };
    const user = userEvent.setup();

    const execution = harness?.run([confirmAction], { correlationId: "confirm-flow" }) ?? Promise.resolve();
    const dialog = await screen.findByTestId("mira-confirm-dialog");
    expect(dialog).toHaveTextContent("Archive completed task");
    await user.click(screen.getByTestId("mira-confirm-approve"));
    await execution;

    const deleteCall = fetchMock.mock.calls.find(([url]) => typeof url === "string" && url.includes("tasks/task-99"));
    expect(deleteCall?.[1]).toMatchObject({ method: "DELETE" });
    expect(logEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: expect.objectContaining({ action: "execute" }),
        success: true,
        correlationId: "confirm-flow",
      }),
    );
  });
});
