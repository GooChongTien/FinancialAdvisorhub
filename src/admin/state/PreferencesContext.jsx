import React, { createContext, useContext, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adviseUAdminApi } from "@/admin/api/adviseUAdminApi";
import i18n, { SUPPORTED_LANGUAGES } from "@/lib/i18n/config";

const PreferencesContext = createContext(null);
const LANGUAGE_CODES = new Set(SUPPORTED_LANGUAGES.map((lang) => lang.code));
const LANGUAGE_NAME_TO_CODE = {
  english: "en",
  chinese: "zh",
  mandarin: "zh",
  malay: "ms",
  bahasa: "ms",
  tamil: "ta",
  hindi: "hi",
  spanish: "es",
  espanol: "es",
};

function normalizeLanguage(value) {
  if (!value) return "en";
  const trimmed = String(value).trim();
  const lower = trimmed.toLowerCase();
  if (LANGUAGE_CODES.has(lower)) return lower;
  return LANGUAGE_NAME_TO_CODE[lower] || "en";
}

function normalizeCurrency(value) {
  if (!value || typeof value !== "string") return "SGD";
  const upper = value.toUpperCase();
  return upper;
}

export function PreferencesProvider({ children }) {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ["current-user"],
    queryFn: () => adviseUAdminApi.auth.me(),
    staleTime: Infinity,
  });

  const updateMutation = useMutation({
    mutationFn: (partial) => adviseUAdminApi.auth.updateMe(partial),
    onSuccess: (next) => {
      // Keep React Query cache in sync so all consumers re-render immediately
      queryClient.setQueryData(["current-user"], (prev) => ({ ...(prev || {}), ...(next || {}) }));
    },
  });

  const prefs = useMemo(() => ({
    language: normalizeLanguage(user?.language),
    currency: normalizeCurrency(user?.currency),
    two_fa_enabled: Boolean(user?.two_fa_enabled),
  }), [user?.language, user?.currency, user?.two_fa_enabled]);

  useEffect(() => {
    const desiredLanguage = prefs.language;
    if (!desiredLanguage) return;
    if (i18n.language !== desiredLanguage) {
      i18n.changeLanguage(desiredLanguage);
    }
  }, [prefs.language]);

  const updatePrefs = (partial) => {
    const payload = { ...partial };
    if (partial.language !== undefined) {
      payload.language = normalizeLanguage(partial.language);
    }
    if (partial.currency !== undefined) {
      payload.currency = normalizeCurrency(partial.currency);
    }
    updateMutation.mutate(payload);
  };

  const value = useMemo(() => ({ prefs, updatePrefs, isLoading }), [prefs, updatePrefs, isLoading]);

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error("usePreferences must be used within PreferencesProvider");
  return ctx;
}

