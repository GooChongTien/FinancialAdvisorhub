import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adviseUAdminApi } from "@/admin/api/adviseUAdminApi";

const MiraChatContext = createContext(null);
const RECENT_LIMIT = 20;
const ACTIVE_THREAD_STORAGE_KEY = "advisorhub:mira-active-thread";

function safeStoreActiveThread(threadId) {
  try {
    if (typeof window === "undefined" || typeof window.sessionStorage === "undefined") {
      return;
    }
    if (!threadId) {
      window.sessionStorage.removeItem(ACTIVE_THREAD_STORAGE_KEY);
    } else {
      window.sessionStorage.setItem(ACTIVE_THREAD_STORAGE_KEY, threadId);
    }
  } catch {
    // Ignore storage failures (e.g., private mode)
  }
}

function readStoredActiveThread() {
  try {
    if (typeof window === "undefined" || typeof window.sessionStorage === "undefined") {
      return null;
    }
    return window.sessionStorage.getItem(ACTIVE_THREAD_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function MiraChatProvider({ children }) {
  const queryClient = useQueryClient();
  const [activeThreadId, setActiveThreadId] = useState(() => readStoredActiveThread());

  useEffect(() => {
    safeStoreActiveThread(activeThreadId);
  }, [activeThreadId]);

  const recentQuery = useQuery({
    queryKey: ["mira-chat", "recent"],
    queryFn: () => adviseUAdminApi.entities.MiraChat.listRecent(RECENT_LIMIT),
    staleTime: 30_000,
  });

  const touchMutation = useMutation({
    mutationFn: async ({ threadId, payload }) => {
      if (!threadId) return null;
      return adviseUAdminApi.entities.MiraChat.touch(threadId, payload ?? {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mira-chat"] });
    },
  });

  const renameMutation = useMutation({
    mutationFn: async ({ threadId, title }) => {
      if (!threadId || !title) return null;
      return adviseUAdminApi.entities.MiraChat.rename(threadId, title);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mira-chat"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (threadId) => {
      if (!threadId) return null;
      return adviseUAdminApi.entities.MiraChat.delete(threadId);
    },
    onSuccess: (_, threadId) => {
      queryClient.invalidateQueries({ queryKey: ["mira-chat"] });
      queryClient.removeQueries({ queryKey: ["mira-chat", "thread", threadId] });
      if (threadId && threadId === activeThreadId) {
        setActiveThreadId(null);
      }
    },
  });

  const setActiveThread = useCallback((threadId) => {
    setActiveThreadId(threadId ?? null);
  }, []);

  const touchThread = useCallback(
    async (threadId, payload) => {
      if (!threadId) return null;
      return touchMutation.mutateAsync({ threadId, payload });
    },
    [touchMutation],
  );

  const renameThread = useCallback(
    async (threadId, title) => {
      if (!threadId || !title) return null;
      return renameMutation.mutateAsync({ threadId, title });
    },
    [renameMutation],
  );

  const deleteThread = useCallback(
    async (threadId) => {
      if (!threadId) return null;
      return deleteMutation.mutateAsync(threadId);
    },
    [deleteMutation],
  );

  const searchThreads = useCallback(async (options = {}) => {
    return adviseUAdminApi.entities.MiraChat.search(options);
  }, []);

  const value = useMemo(
    () => ({
      recentThreads: recentQuery.data ?? [],
      isLoadingRecent: recentQuery.isLoading,
      recentError: recentQuery.error ?? null,
      refreshRecent: recentQuery.refetch,
      activeThreadId,
      setActiveThread,
      touchThread,
      renameThread,
      deleteThread,
      searchThreads,
    }),
    [
      recentQuery.data,
      recentQuery.isLoading,
      recentQuery.error,
      recentQuery.refetch,
      activeThreadId,
      setActiveThread,
      touchThread,
      renameThread,
      deleteThread,
      searchThreads,
    ],
  );

  return <MiraChatContext.Provider value={value}>{children}</MiraChatContext.Provider>;
}

export function useMiraChat() {
  const ctx = useContext(MiraChatContext);
  if (!ctx) {
    throw new Error("useMiraChat must be used within a MiraChatProvider");
  }
  return ctx;
}
