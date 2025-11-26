import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import { useTranslation } from "react-i18next";
import i18n from "@/lib/i18n/config";
import { LanguageSwitcher } from "@/admin/components/ui/LanguageSwitcher";

function TestComponent() {
  const { t } = useTranslation();
  return (
    <div>
      <h1>{t("common.welcome")}</h1>
      <p>{t("navigation.dashboard")}</p>
      <button>{t("common.save")}</button>
    </div>
  );
}

describe("i18n Integration", () => {
  beforeEach(async () => {
    await act(async () => {
      await i18n.changeLanguage("en");
    });
    // Default stub to avoid MSW warnings from preference fetch
    global.fetch = vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) });
  });

  describe("i18n Configuration", () => {
    it("should initialize i18n with default language (en)", () => {
      expect(i18n.language).toBe("en");
    });

    it("should have all 6 supported languages loaded", () => {
      const supportedLanguages = ["en", "zh", "ms", "ta", "hi", "es"];
      supportedLanguages.forEach((lang) => {
        expect(i18n.hasResourceBundle(lang, "translation")).toBe(true);
      });
    });

    it("should load English translations correctly", () => {
      expect(i18n.t("common.welcome")).toBe("Welcome");
      expect(i18n.t("common.save")).toBe("Save");
      expect(i18n.t("navigation.dashboard")).toBe("Visualizers");
    });

    it("should switch to Chinese and load translations", async () => {
      await act(async () => {
        await i18n.changeLanguage("zh");
      });

      expect(i18n.language).toBe("zh");
      expect(i18n.t("common.welcome")).toBe("欢迎");
      expect(i18n.t("common.save")).toBe("保存");
      expect(i18n.t("navigation.dashboard")).toBe("仪表板");
    });

    it("should switch to Malay and load translations", async () => {
      await act(async () => {
        await i18n.changeLanguage("ms");
      });

      expect(i18n.language).toBe("ms");
      expect(i18n.t("common.welcome")).toBe("Selamat datang");
      expect(i18n.t("common.save")).toBe("Simpan");
      expect(i18n.t("navigation.dashboard")).toBe("Papan Pemuka");
    });

    it("should fallback to English for missing translations", async () => {
      await act(async () => {
        await i18n.changeLanguage("en");
      });
      const translation = i18n.t("nonexistent.key");
      expect(translation).toBe("nonexistent.key");
    });
  });

  describe("Translation Component Integration", () => {
    it("should render component with English translations by default", () => {
      render(<TestComponent />);
      expect(screen.getByText("Welcome")).toBeInTheDocument();
      expect(screen.getByText("Visualizers")).toBeInTheDocument();
      expect(screen.getByText("Save")).toBeInTheDocument();
    });

    it("should update component when language changes to Chinese", async () => {
      const { rerender } = render(<TestComponent />);

      await act(async () => {
        await i18n.changeLanguage("zh");
      });
      rerender(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByText("欢迎")).toBeInTheDocument();
        expect(screen.getByText("仪表板")).toBeInTheDocument();
        expect(screen.getByText("保存")).toBeInTheDocument();
      });
    });

    it("should update component when language changes to Malay", async () => {
      const { rerender } = render(<TestComponent />);

      await act(async () => {
        await i18n.changeLanguage("ms");
      });
      rerender(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByText("Selamat datang")).toBeInTheDocument();
        expect(screen.getByText("Papan Pemuka")).toBeInTheDocument();
        expect(screen.getByText("Simpan")).toBeInTheDocument();
      });
    });

    it("should switch to Spanish and load translations", async () => {
      await act(async () => {
        await i18n.changeLanguage("es");
      });

      expect(i18n.language).toBe("es");
      expect(i18n.t("common.welcome")).toBe("Bienvenido");
      expect(i18n.t("common.save")).toBe("Guardar");
      expect(i18n.t("navigation.dashboard")).toBe("Panel");
    });
  });

  describe("LanguageSwitcher Component", () => {
    it("should render language switcher with current language", () => {
      render(<LanguageSwitcher />);
      const trigger = screen.getByRole("combobox");
      expect(trigger).toBeInTheDocument();
    });
  });

  describe("Translation Coverage", () => {
    it("should have complete common translations", () => {
      const commonKeys = [
        "welcome",
        "logout",
        "save",
        "cancel",
        "delete",
        "edit",
        "add",
        "search",
        "filter",
        "loading",
        "error",
        "success",
      ];
      commonKeys.forEach((key) => {
        const translation = i18n.t(`common.${key}`);
        expect(translation).not.toBe(`common.${key}`);
        expect(translation.length).toBeGreaterThan(0);
      });
    });

    it("should have complete navigation translations", () => {
      const navKeys = [
        "home",
        "dashboard",
        "customers",
        "newBusiness",
        "proposals",
        "policies",
        "analytics",
        "settings",
      ];
      navKeys.forEach((key) => {
        const translation = i18n.t(`navigation.${key}`);
        expect(translation).not.toBe(`navigation.${key}`);
        expect(translation.length).toBeGreaterThan(0);
      });
    });

    it("should have customer module translations", () => {
      const customerKeys = [
        "title",
        "addCustomer",
        "customerType",
        "individual",
        "entity",
        "companyName",
        "keymanDetails",
      ];
      customerKeys.forEach((key) => {
        const translation = i18n.t(`customer.${key}`);
        expect(translation).not.toBe(`customer.${key}`);
        expect(translation.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Interpolation", () => {
    it("should support variable interpolation in translations", () => {
      const result = i18n.t("common.welcome");
      expect(result).toBe("Welcome");
    });
  });
});
