import React, { createContext, useContext, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adviseUAdminApi } from "@/admin/api/adviseUAdminApi";

const PreferencesContext = createContext(null);

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
    language: user?.language || "English",
    currency: user?.currency || "SGD",
    two_fa_enabled: Boolean(user?.two_fa_enabled),
  }), [user?.language, user?.currency, user?.two_fa_enabled]);

  const updatePrefs = (partial) => {
    updateMutation.mutate(partial);
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

