// @vitest-environment jsdom
import { describe, it, expect, beforeEach, beforeAll, vi } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CurrencySelector } from "@/admin/components/ui/CurrencySelector.jsx";

describe("CurrencySelector", () => {
  beforeAll(() => {
    // Radix Select expects these pointer capture APIs which jsdom does not provide
    if (!HTMLElement.prototype.hasPointerCapture) {
      HTMLElement.prototype.hasPointerCapture = () => false;
    }
    if (!HTMLElement.prototype.setPointerCapture) {
      HTMLElement.prototype.setPointerCapture = () => {};
    }
    if (!HTMLElement.prototype.releasePointerCapture) {
      HTMLElement.prototype.releasePointerCapture = () => {};
    }
    if (!HTMLElement.prototype.scrollIntoView) {
      HTMLElement.prototype.scrollIntoView = () => {};
    }
  });

  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    global.fetch = vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) });
  });

  it("renders label and current value", () => {
    render(<CurrencySelector value="USD" onChange={() => {}} />);
    expect(screen.getByText("Select Currency")).toBeInTheDocument();
    expect(screen.getByTestId("currency-trigger")).toHaveTextContent("USD");
  });

  it("prefers stored selection when uncontrolled", async () => {
    localStorage.setItem("preferred_currency", "EUR");
    render(<CurrencySelector />);
    const trigger = screen.getByTestId("currency-trigger");
    expect(trigger).toHaveTextContent("EUR");
  });

  it("falls back to defaultCurrency when nothing stored", () => {
    render(<CurrencySelector defaultCurrency="JPY" />);
    expect(screen.getByTestId("currency-trigger")).toHaveTextContent("JPY");
  });

  it("ignores stored/server preference when value is controlled", async () => {
    localStorage.setItem("preferred_currency", "EUR");
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ currency: "USD" }) });
    render(<CurrencySelector value="MYR" />);
    expect(screen.getByTestId("currency-trigger")).toHaveTextContent("MYR");
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("invokes onChange and persists selection", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CurrencySelector onChange={onChange} />);

    await user.click(screen.getByTestId("currency-trigger"));
    await user.click(screen.getByTestId("currency-USD"));

    expect(onChange).toHaveBeenCalledWith("USD");
    expect(localStorage.getItem("preferred_currency")).toBe("USD");
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/preferences/currency",
      expect.objectContaining({
        method: "POST",
        headers: expect.any(Object),
      }),
    );
  });

  it("filters currencies via search", async () => {
    const user = userEvent.setup();
    render(<CurrencySelector />);

    await user.click(screen.getByTestId("currency-trigger"));
    await user.type(screen.getByTestId("currency-search"), "yen");

    expect(screen.getByTestId("currency-JPY")).toBeInTheDocument();
    expect(screen.queryByTestId("currency-USD")).not.toBeInTheDocument();
  });

  it("shows empty state when no currencies match search", async () => {
    const user = userEvent.setup();
    render(<CurrencySelector />);

    await user.click(screen.getByTestId("currency-trigger"));
    await user.type(screen.getByTestId("currency-search"), "zzz");

    expect(screen.getByTestId("currency-empty")).toBeInTheDocument();
  });

  it("shows common currencies group first", async () => {
    const user = userEvent.setup();
    render(<CurrencySelector />);
    await user.click(screen.getByTestId("currency-trigger"));

    const content = screen.getByRole("presentation");
    const commonLabel = within(content).getAllByText("Common")[0];
    expect(commonLabel).toBeInTheDocument();

    // Common currencies should include SGD and USD
    expect(screen.getByTestId("currency-SGD")).toBeInTheDocument();
    expect(screen.getByTestId("currency-USD")).toBeInTheDocument();
  });

  it("supports disabling persistence", async () => {
    const user = userEvent.setup();
    render(<CurrencySelector persistSelection={false} />);

    await user.click(screen.getByTestId("currency-trigger"));
    await user.click(screen.getByTestId("currency-GBP"));

    expect(localStorage.getItem("preferred_currency")).toBeNull();
    const calls = (global.fetch ?? { mock: { calls: [] } }).mock.calls;
    expect(calls.filter(([, init]) => init?.method === "POST")).toHaveLength(0);
  });

  it("does not persist to server for non-persistable currencies", async () => {
    const user = userEvent.setup();
    render(<CurrencySelector />);

    await user.click(screen.getByTestId("currency-trigger"));
    await user.click(screen.getByTestId("currency-CHF"));

    const calls = (global.fetch ?? { mock: { calls: [] } }).mock.calls;
    expect(calls.filter(([, init]) => init?.method === "POST")).toHaveLength(0);
  });

  it("applies server preference on mount when available", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ currency: "USD" }),
    });
    render(<CurrencySelector />);
    const trigger = await screen.findByTestId("currency-trigger");
    await waitFor(() => expect(trigger).toHaveTextContent("USD"));
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/preferences/currency",
      expect.objectContaining({ method: "GET", headers: expect.any(Object) }),
    );
  });

  it("sends supabase auth token when persisting", async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    localStorage.setItem(
      "sb-testref-auth-token",
      JSON.stringify({ currentSession: { access_token: "token-123" } }),
    );
    render(<CurrencySelector />);
    await user.click(screen.getByTestId("currency-trigger"));
    await user.click(screen.getByTestId("currency-SGD"));

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/preferences/currency",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer token-123",
        }),
      }),
    );
  });
});
