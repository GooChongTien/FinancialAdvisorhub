// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { UIActionExecutor } from "@/lib/mira/action-executor";

const logEventMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/mira/action-logger.ts", () => ({
  logMiraActionEvent: logEventMock,
}));

describe("UIActionExecutor", () => {
  let navigateMock: ReturnType<typeof vi.fn>;
  let notifyMock: ReturnType<typeof vi.fn>;
  let confirmMock: ReturnType<typeof vi.fn>;
  let prefillMock: ReturnType<typeof vi.fn>;
  let popupMock: ReturnType<typeof vi.fn>;
  let headersMock: ReturnType<typeof vi.fn>;
  let executor: UIActionExecutor;

  beforeEach(() => {
    navigateMock = vi.fn();
    notifyMock = vi.fn();
    confirmMock = vi.fn().mockResolvedValue(true);
    prefillMock = vi.fn().mockResolvedValue(undefined);
    popupMock = vi.fn().mockResolvedValue(undefined);
    headersMock = vi.fn().mockResolvedValue({ Authorization: "Bearer test" });
    logEventMock.mockResolvedValue(undefined);

    executor = new UIActionExecutor({
      navigate: navigateMock,
      notify: notifyMock,
      requestConfirmation: confirmMock,
      emitPrefillEvent: prefillMock,
      triggerPopupEvent: popupMock,
      getAuthHeaders: headersMock,
      baseUrl: "/api",
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // @ts-expect-error cleanup
    delete global.fetch;
    logEventMock.mockReset();
  });

  it("navigates using createPageUrl", async () => {
    await executor.executeActions([
      {
        action: "navigate",
        page: "CustomerDetail?id=abc",
        params: { filter: "hot" },
      },
    ]);

    expect(navigateMock).toHaveBeenCalledTimes(1);
    expect(navigateMock).toHaveBeenCalledWith("/customers/detail?id=abc&filter=hot");
  });

  it("emits prefill events through the provided handler", async () => {
    const payload = { field: "name", value: "Kim", timestamp: new Date("2025-01-01T00:00:00Z") };
    await executor.executeActions([
      {
        action: "frontend_prefill",
        payload,
      },
    ]);

    expect(prefillMock).toHaveBeenCalledWith(
      {
        action: "frontend_prefill",
        payload: expect.objectContaining({
          field: "name",
          value: "Kim",
          timestamp: "2025-01-01T00:00:00.000Z",
        }),
      },
      null,
    );
    expect(notifyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "success",
        title: "Form prepared",
      }),
    );
  });

  it("executes backend actions with auth headers", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => "",
    });
    // @ts-expect-error override for tests
    global.fetch = fetchMock;

    await executor.executeActions([
      {
        action: "execute",
        confirm_required: true,
        api_call: {
          method: "POST",
          endpoint: "/mira/test",
          payload: { hello: "world" },
        },
      },
    ]);

    expect(confirmMock).toHaveBeenCalledTimes(1);
    expect(headersMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith("/api/mira/test", {
      method: "POST",
      headers: expect.objectContaining({
        Authorization: "Bearer test",
        "Content-Type": "application/json",
      }),
      body: JSON.stringify({ hello: "world" }),
    });
  });

  it("records failures when backend responds with error", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => "boom",
    });
    // @ts-expect-error override for tests
    global.fetch = fetchMock;

    const results = await executor.executeActions([
      {
        action: "execute",
        api_call: {
          method: "DELETE",
          endpoint: "/oops",
        },
      },
    ]);

    expect(results[0].success).toBe(false);
    expect(results[0].error).toContain("boom");
  });

  it("rejects invalid prefill payloads", async () => {
    const results = await executor.executeActions([
      {
        action: "frontend_prefill",
        // @ts-expect-error testing invalid payload
        payload: "not-an-object",
      },
    ]);

    expect(results[0].success).toBe(false);
    expect(prefillMock).not.toHaveBeenCalled();
    expect(notifyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "error",
        title: "Action failed",
      }),
    );
  });

  it("skips backend execution when confirmation is rejected", async () => {
    confirmMock.mockResolvedValueOnce(false);
    const fetchMock = vi.fn();
    // @ts-expect-error override for tests
    global.fetch = fetchMock;

    const results = await executor.executeActions([
      {
        action: "execute",
        confirm_required: true,
        api_call: {
          method: "POST",
          endpoint: "/blocked",
        },
      },
    ]);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(results[0].success).toBe(false);
    expect(results[0].error).toContain("cancelled");
  });

  it("logs payload shape on success", async () => {
    await executor.executeActions([
      {
        action: "navigate",
        page: "Home",
      },
    ]);

    expect(logEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        action: expect.objectContaining({ action: "navigate" }),
      }),
    );
  });

  it("continues when logger rejects", async () => {
    logEventMock.mockRejectedValueOnce(new Error("nope"));
    await executor.executeActions([
      {
        action: "navigate",
        page: "Home",
      },
    ]);
    expect(logEventMock).toHaveBeenCalled();
  });

  it("registers navigation undo callbacks tied to correlationId", async () => {
    window.history.pushState({}, "", "/customers?tab=leads");

    await executor.executeActions(
      [
        {
          action: "navigate",
          page: "CustomerDetail?id=auto-lead",
        },
      ],
      { correlationId: "auto-undo-1" },
    );

    expect(navigateMock).toHaveBeenCalledWith("/customers/detail?id=auto-lead");

    window.dispatchEvent(
      new CustomEvent("mira:auto-actions:undo", {
        detail: { id: "auto-undo-1" },
      }),
    );

    expect(navigateMock).toHaveBeenCalledWith("/customers?tab=leads", { replace: true });
  });

  it("triggers popup handler when navigate action specifies popup", async () => {
    await executor.executeActions(
      [
        {
          action: "navigate",
          page: "Customer",
          popup: "new_lead_form",
        },
      ],
      { correlationId: "popup-123" },
    );

    expect(popupMock).toHaveBeenCalledWith("new_lead_form", expect.objectContaining({ action: "navigate" }), "popup-123");
  });
});
