import { createContext, useContext, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { adviseUAdminApi } from "@/admin/api/adviseUAdminApi";

const LeadDirectoryContext = createContext(null);

export function LeadDirectoryProvider({ children }) {
  const query = useQuery({
    queryKey: ["lead-directory"],
    queryFn: () => adviseUAdminApi.entities.Lead.list(200),
    staleTime: 60_000,
  });

  const value = useMemo(
    () => ({
      leads: query.data ?? [],
      isLoading: query.isLoading,
      error: query.error ?? null,
      refetch: query.refetch,
      lastUpdated: query.dataUpdatedAt,
    }),
    [query.data, query.isLoading, query.error, query.refetch, query.dataUpdatedAt],
  );

  return (
    <LeadDirectoryContext.Provider value={value}>
      {children}
    </LeadDirectoryContext.Provider>
  );
}

export function useLeadDirectory() {
  const context = useContext(LeadDirectoryContext);
  if (!context) {
    throw new Error("useLeadDirectory must be used within LeadDirectoryProvider");
  }
  return context;
}
