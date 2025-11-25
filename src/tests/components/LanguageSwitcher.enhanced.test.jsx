// @vitest-environment jsdom
import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LanguageSwitcher } from "@/admin/components/ui/LanguageSwitcher";
import i18n from "@/lib/i18n/config";

describe("LanguageSwitcher enhancements", () => {
  beforeAll(() => {
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
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("loads preferred language from localStorage", async () => {
    localStorage.setItem("preferred_language", "ms");
    const user = userEvent.setup();
    render(<LanguageSwitcher />);

    const trigger = screen.getByRole("combobox");
    await user.click(trigger);
    expect(screen.getByTestId("lang-option-ms")).toBeInTheDocument();
    expect(trigger.textContent).toContain("Bahasa");
  });

  it("persists selection to localStorage and backend", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    global.fetch = fetchMock;

    render(<LanguageSwitcher />);
    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByTestId("lang-option-zh"));

    expect(localStorage.getItem("preferred_language")).toBe("zh");
    expect(localStorage.getItem("i18nextLng")).toBe("zh");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/preferences/language",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }),
    );
  });

  it("sends supabase auth token when available", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    global.fetch = fetchMock;
    localStorage.setItem(
      "sb-testref-auth-token",
      JSON.stringify({ currentSession: { access_token: "token-abc" } }),
    );

    render(<LanguageSwitcher />);
    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByTestId("lang-option-ta"));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/preferences/language",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer token-abc",
        }),
      }),
    );
  });

  it("applies server preference on mount", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ language: "hi" }),
    });
    global.fetch = fetchMock;

    render(<LanguageSwitcher />);

    await waitFor(() => expect(i18n.language).toBe("hi"));
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/preferences/language",
      expect.objectContaining({
        method: "GET",
        headers: expect.any(Object),
      }),
    );
  });

  it("renders flag badges for each language", async () => {
    const user = userEvent.setup();
    render(<LanguageSwitcher />);

    await user.click(screen.getByRole("combobox"));
    expect(screen.getByTestId("lang-option-en").querySelector("[data-flag='en']")).toBeInTheDocument();
    expect(screen.getByTestId("lang-option-hi").querySelector("[data-flag='hi']")).toBeInTheDocument();
  });

  it("ignores invalid stored language and keeps current language", () => {
    localStorage.setItem("preferred_language", "xx");
    const initial = i18n.language;
    render(<LanguageSwitcher />);
    expect(i18n.language).toBe(initial);
  });

  it("handles failed server preference fetch gracefully", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false });
    render(<LanguageSwitcher />);
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/preferences/language",
      expect.objectContaining({ method: "GET", headers: expect.any(Object) }),
    );
  });

  it("only calls changeLanguage once per selection", async () => {
    const user = userEvent.setup();
    const changeSpy = vi.spyOn(i18n, "changeLanguage");
    render(<LanguageSwitcher />);

    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByTestId("lang-option-zh"));

    expect(changeSpy).toHaveBeenCalledTimes(1);
  });

  it("shows current language text in trigger", () => {
    render(<LanguageSwitcher />);
    const text = screen.getByRole("combobox").textContent?.toLowerCase() ?? "";
    expect(text).not.toEqual("");
  });
});
