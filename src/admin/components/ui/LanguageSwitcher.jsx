import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES } from "@/lib/i18n/config";
import { resolveSupabaseAuthToken } from "@/admin/utils/supabaseAuthToken";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { Globe } from "lucide-react";

/**
 * LanguageSwitcher Component
 *
 * Provides a dropdown to switch between supported languages.
 * Updates i18n configuration and persists selection to localStorage.
 *
 * Supported languages:
 * - English (en)
 * - Chinese (zh)
 * - Malay (ms)
 * - Tamil (ta)
 * - Hindi (hi)
 * - Spanish (es)
 */
const FLAG_STYLES = {
  en: "bg-blue-500",
  zh: "bg-red-500",
  ms: "bg-green-500",
  ta: "bg-purple-500",
  hi: "bg-orange-500",
  es: "bg-amber-500",
};

const LOCAL_STORAGE_KEY = "preferred_language";
const SUPPORTED_LANGUAGE_CODES = new Set(SUPPORTED_LANGUAGES.map((lang) => lang.code));

function isSupportedLanguage(code) {
  if (!code) return false;
  const normalized = code.trim().toLowerCase();
  return SUPPORTED_LANGUAGE_CODES.has(normalized);
}

function FlagBadge({ code }) {
  const style = FLAG_STYLES[code] || "bg-slate-500";
  return (
    <span
      className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold text-white ${style}`}
      data-flag={code}
    >
      {code.toUpperCase()}
    </span>
  );
}

async function persistLanguagePreference(languageCode) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, languageCode);
    localStorage.setItem("i18nextLng", languageCode);
  } catch {
    // non-browser / quota issues are non-fatal
  }

  if (typeof fetch === "function") {
    try {
      const headers = { "Content-Type": "application/json" };
      const supabaseToken = resolveSupabaseAuthToken();
      if (supabaseToken) {
        headers.Authorization = `Bearer ${supabaseToken}`;
      }
      await fetch("/api/preferences/language", {
        method: "POST",
        headers,
        body: JSON.stringify({ language: languageCode }),
      });
    } catch {
      // ignore network failures; preference will remain local
    }
  }
}

export function LanguageSwitcher({ className = "", onLanguageChange }) {
  const { i18n } = useTranslation();
  const options = useMemo(() => SUPPORTED_LANGUAGES, []);

  useEffect(() => {
    let cancelled = false;

    const applyStoredPreference = () => {
      try {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (stored && stored !== i18n.language && isSupportedLanguage(stored)) {
          i18n.changeLanguage(stored);
        }
      } catch {
        // ignore storage errors
      }
    };

    const fetchServerPreference = async () => {
      if (typeof fetch !== "function") return;
      const headers = {};
      const supabaseToken = resolveSupabaseAuthToken();
      if (supabaseToken) {
        headers.Authorization = `Bearer ${supabaseToken}`;
      }
      try {
        const res = await fetch("/api/preferences/language", { method: "GET", headers });
        if (!res.ok) return;
        const data = await res.json().catch(() => null);
        const serverLang = typeof data?.language === "string" ? data.language : null;
        if (!serverLang || !isSupportedLanguage(serverLang) || cancelled) return;
        if (serverLang !== i18n.language) {
          i18n.changeLanguage(serverLang);
          try {
            localStorage.setItem(LOCAL_STORAGE_KEY, serverLang);
            localStorage.setItem("i18nextLng", serverLang);
          } catch {
            // ignore storage errors
          }
        }
      } catch {
        // best-effort; ignore network errors
      }
    };

    applyStoredPreference();
    fetchServerPreference();

    return () => {
      cancelled = true;
    };
  }, [i18n]);

  const handleLanguageChange = (languageCode) => {
    i18n.changeLanguage(languageCode);
    persistLanguagePreference(languageCode);
    onLanguageChange?.(languageCode);
  };

  return (
    <div className={`flex items-center gap-2 ${className}`} data-testid="language-switcher">
      <Globe className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      <Select value={i18n.language} onValueChange={handleLanguageChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select language" />
        </SelectTrigger>
        <SelectContent>
          {options.map((language) => (
            <SelectItem key={language.code} value={language.code} data-testid={`lang-option-${language.code}`}>
              <span className="flex items-center gap-2">
                <FlagBadge code={language.code} />
                <span className="truncate">{language.nativeName || language.name}</span>
                <span className="text-xs text-muted-foreground">({language.name})</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/**
 * Compact LanguageSwitcher for mobile or compact layouts
 */
export function LanguageSwitcherCompact({ className = '', onLanguageChange }) {
  const { i18n } = useTranslation();

  const currentLanguage = SUPPORTED_LANGUAGES.find(
    (lang) => lang.code === i18n.language
  );

  const handleLanguageChange = (languageCode) => {
    i18n.changeLanguage(languageCode);
    persistLanguagePreference(languageCode);
    onLanguageChange?.(languageCode);
  };

  return (
    <Select value={i18n.language} onValueChange={handleLanguageChange}>
      <SelectTrigger className={`w-[120px] ${className}`}>
        <SelectValue>
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            <span className="text-sm">{currentLanguage?.nativeName}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {SUPPORTED_LANGUAGES.map((language) => (
          <SelectItem key={language.code} value={language.code}>
            {language.nativeName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default LanguageSwitcher;
