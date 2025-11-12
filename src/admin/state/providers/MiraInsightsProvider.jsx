import { createContext, useContext, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { adviseUAdminApi } from "@/admin/api/adviseUAdminApi";

const MiraInsightsContext = createContext(null);
const REFRESH_INTERVAL_MS = 60_000;

async function loadInsights() {
  const [broadcasts, tasks, leads] = await Promise.all([
    adviseUAdminApi.entities.Broadcast.list("-published_date", 3).catch(() => []),
    adviseUAdminApi.entities.Task.list("-date", 5).catch(() => []),
    adviseUAdminApi.entities.Lead.list("-updated_at", 50).catch(() => []),
  ]);

  const items = [];

  (broadcasts ?? []).forEach((broadcast) => {
    items.push({
      id: `broadcast-${broadcast.id}`,
      title: broadcast.title,
      description: broadcast.content,
      type: "alert",
      tag: broadcast.category ?? "Broadcast",
      createdAt: broadcast.published_date,
    });
  });

  const upcomingTasks = (tasks ?? []).filter((task) => task?.date);
  upcomingTasks.slice(0, 2).forEach((task) => {
    items.push({
      id: `task-${task.id}`,
      title: task.title ?? "Upcoming task",
      description: task.date ? `Scheduled on ${task.date}` : null,
      type: "metric",
      tag: task.type ?? "Task",
    });
  });

  const complianceCandidates = (leads ?? []).filter((lead) => {
    if (!lead?.status) return false;
    const status = String(lead.status).toLowerCase();
    return status.includes("compliance") || status.includes("proposal");
  });

  complianceCandidates.slice(0, 3).forEach((lead) => {
    items.push({
      id: `compliance-${lead.id}`,
      title: `Review ${lead.name}`,
      description: lead.status
        ? `Status: ${lead.status}. Last updated ${lead.updated_at ?? lead.updated_date ?? "recently"}.`
        : "Potential compliance follow-up required.",
      type: "alert",
      tag: "Compliance",
    });
  });

  return items;
}

export function MiraInsightsProvider({ children }) {
  const query = useQuery({
    queryKey: ["mira-insights"],
    queryFn: loadInsights,
    staleTime: REFRESH_INTERVAL_MS,
  });

  const value = useMemo(
    () => ({
      insights: query.data ?? [],
      isLoading: query.isLoading,
      error: query.error ?? null,
      refetch: query.refetch,
      lastUpdated: query.dataUpdatedAt,
    }),
    [query.data, query.isLoading, query.error, query.refetch, query.dataUpdatedAt],
  );

  return (
    <MiraInsightsContext.Provider value={value}>
      {children}
    </MiraInsightsContext.Provider>
  );
}

export function useMiraInsights() {
  const context = useContext(MiraInsightsContext);
  if (!context) {
    throw new Error("useMiraInsights must be used within MiraInsightsProvider");
  }
  return context;
}
