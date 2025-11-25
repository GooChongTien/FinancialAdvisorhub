import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { createServiceClient } from "./supabase.ts";
import type { MiraModule, ProactiveInsight, UIAction } from "./types.ts";

type QueryResult<T> = T[] | null;

interface TaskRecord {
  id: string;
  title: string;
  date: string;
  linked_lead_name?: string | null;
  advisor_id?: string | null;
}

interface ProposalRecord {
  id: string;
  proposer_name: string;
  stage: string;
  status: string;
  completion_percentage: number | null;
  last_updated: string | null;
  advisor_id?: string | null;
}

interface LeadRecord {
  id: string;
  name: string;
  status: string;
  last_contacted: string | null;
  advisor_id?: string | null;
}

interface AdvisorScope {
  advisorId: string | null;
  teamName: string | null;
  advisorIds: string[];
}

function tryCreateClient(): SupabaseClient | null {
  try {
    return createServiceClient();
  } catch (error) {
    console.warn("[MiraInsights] Falling back to local samples:", error instanceof Error ? error.message : error);
    return null;
  }
}

async function runQuery<T>(client: SupabaseClient | null, executor: (supabase: SupabaseClient) => Promise<QueryResult<T>>): Promise<T[]> {
  if (!client) return [];
  try {
    const result = await executor(client);
    return Array.isArray(result) ? result : [];
  } catch (error) {
    console.warn("[MiraInsights] Query failed:", error instanceof Error ? error.message : error);
    return [];
  }
}

const toDateOnly = (value: Date | string | number) => new Date(value).toISOString().slice(0, 10);

function formatRelative(dateString: string | null | undefined): string {
  if (!dateString) return "date unknown";
  const value = new Date(dateString);
  if (Number.isNaN(value.getTime())) return "date unknown";
  const diffDays = Math.round((Date.now() - value.getTime()) / 86400000);
  if (diffDays <= 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  const weeks = Math.round(diffDays / 7);
  if (weeks < 4) return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
  const months = Math.round(diffDays / 30);
  return `${months} month${months === 1 ? "" : "s"} ago`;
}

function buildNavigateAction(module: MiraModule | string, page: string, description: string, params?: Record<string, unknown>): UIAction {
  return {
    action: "navigate",
    module,
    page,
    description,
    params,
  };
}

async function resolveAdvisorScope(client: SupabaseClient | null, advisorId?: string | null): Promise<AdvisorScope> {
  const normalized = typeof advisorId === "string" && advisorId.trim().length > 0 ? advisorId.trim() : null;
  if (!client || !normalized) {
    return { advisorId: normalized, teamName: null, advisorIds: normalized ? [normalized] : [] };
  }

  let teamName: string | null = null;
  const advisorIds = new Set<string>();
  advisorIds.add(normalized);

  try {
    const { data: profile, error: profileError } = await client
      .from("profiles")
      .select("team_name")
      .eq("id", normalized)
      .maybeSingle();
    if (profileError) throw profileError;

    if (profile && typeof profile.team_name === "string" && profile.team_name.trim().length > 0) {
      teamName = profile.team_name.trim();
      const { data: teammates, error: teammateError } = await client
        .from("profiles")
        .select("id")
        .eq("team_name", teamName)
        .limit(50);
      if (teammateError) throw teammateError;
      (teammates ?? []).forEach((row) => {
        if (row && typeof row.id === "string" && row.id.trim().length > 0) {
          advisorIds.add(row.id.trim());
        }
      });
    }
  } catch (error) {
    console.warn("[MiraInsights] Failed to resolve advisor scope:", error instanceof Error ? error.message : error);
  }

  return { advisorId: normalized, teamName, advisorIds: Array.from(advisorIds) };
}

function applyAdvisorScope(query: any, scope: AdvisorScope, column = "advisor_id") {
  if (!scope.advisorIds.length) return query;
  return query.in(column, scope.advisorIds);
}

async function fetchOverdueTasks(client: SupabaseClient | null, scope: AdvisorScope): Promise<TaskRecord[]> {
  const today = toDateOnly(Date.now());
  return runQuery(client, async (supabase) => {
    let query = supabase.from("tasks").select("id,title,date,linked_lead_name,advisor_id").lt("date", today);
    query = applyAdvisorScope(query, scope);
    const { data, error } = await query.order("date", { ascending: true }).limit(5);
    if (error) throw error;
    return data;
  });
}

async function fetchStalledProposals(client: SupabaseClient | null, scope: AdvisorScope): Promise<ProposalRecord[]> {
  return runQuery(client, async (supabase) => {
    let query = supabase
      .from("proposals")
      .select("id,proposer_name,stage,status,completion_percentage,last_updated,advisor_id")
      .neq("status", "Completed")
      .lt("completion_percentage", 65);
    query = applyAdvisorScope(query, scope);
    const { data, error } = await query.order("completion_percentage", { ascending: true }).limit(5);
    if (error) throw error;
    return data;
  });
}

async function fetchInactiveLeads(client: SupabaseClient | null, scope: AdvisorScope): Promise<LeadRecord[]> {
  return runQuery(client, async (supabase) => {
    let query = supabase
      .from("leads")
      .select("id,name,status,last_contacted,advisor_id")
      .in("status", ["Not Initiated", "Contacted"]);
    query = applyAdvisorScope(query, scope);
    const { data, error } = await query.order("last_contacted", { ascending: true, nullsLast: false }).limit(5);
    if (error) throw error;
    return data;
  });
}

async function fetchDismissedInsightIds(client: SupabaseClient | null, advisorId: string | null): Promise<Set<string>> {
  if (!client || !advisorId) return new Set();
  try {
    const { data, error } = await client
      .from("mira_insight_dismissals")
      .select("insight_id")
      .eq("advisor_id", advisorId);
    if (error) throw error;
    return new Set(
      (data ?? [])
        .map((row) => row?.insight_id)
        .filter((value): value is string => typeof value === "string" && value.trim().length > 0),
    );
  } catch (error) {
    console.warn("[MiraInsights] Failed to load dismissals:", error instanceof Error ? error.message : error);
    return new Set();
  }
}

function buildFallbackInsights(scope: AdvisorScope): ProactiveInsight[] {
  const personalizationHint = scope.advisorId
    ? "Add advisor ownership to your records so Mira can surface alerts for you or your team."
    : "Mira will stream overdue tasks, stalled proposals, and lead drift once the workspace syncs.";

  return [
    {
      id: "insight-demo-analytics",
      module: "analytics",
      tag: "Readiness",
      title: "Connect data for personalized insights",
      summary: personalizationHint,
      priority: "info",
      ctaLabel: "Open Analytics",
      ui_actions: [buildNavigateAction("analytics", "/analytics", "Open analytics overview")],
    },
  ];
}

export async function generateProactiveInsights(advisorId?: string | null): Promise<ProactiveInsight[]> {
  const client = tryCreateClient();
  const scope = await resolveAdvisorScope(client, advisorId);
  const [overdueTasks, stalledProposals, inactiveLeads] = await Promise.all([
    fetchOverdueTasks(client, scope),
    fetchStalledProposals(client, scope),
    fetchInactiveLeads(client, scope),
  ]);
  const dismissedIds = await fetchDismissedInsightIds(client, scope.advisorId);

  const insights: ProactiveInsight[] = [];

  if (overdueTasks.length > 0) {
    const oldest = overdueTasks[0];
    const summaryItems = overdueTasks
      .slice(0, 3)
      .map((task) => `- ${task.title}${task.linked_lead_name ? ` (${task.linked_lead_name})` : ""}`)
      .join("  ");
    const insightId = `insight-tasks-${oldest.id}`;
    if (!dismissedIds.has(insightId)) {
      insights.push({
        id: insightId,
        module: "todo",
        tag: "Tasks",
        title: `${overdueTasks.length} overdue task${overdueTasks.length === 1 ? "" : "s"}`,
        summary: summaryItems || `Oldest item slipped ${formatRelative(oldest.date)}.`,
        priority: overdueTasks.length >= 3 ? "critical" : "important",
        updated_at: oldest.date,
        ctaLabel: "Review tasks",
        ui_actions: [
          buildNavigateAction("todo", "/smart-plan", "Open Smart Plan filtered to overdue", {
            filter: "overdue",
          }),
        ],
      });
    }
  }

  if (stalledProposals.length > 0) {
    const slowest = stalledProposals[0];
    const completion = Math.round(Number(slowest.completion_percentage ?? 0));
    const insightId = `insight-proposal-${slowest.id}`;
    if (!dismissedIds.has(insightId)) {
      insights.push({
        id: insightId,
        module: "new_business",
        tag: "Pipeline",
        title: `${stalledProposals.length} proposal${stalledProposals.length === 1 ? "" : "s"} stuck`,
        summary: `${slowest.proposer_name} is ${completion}% through ${slowest.stage} and has not moved ${formatRelative(slowest.last_updated)}.`,
        priority: completion <= 30 ? "important" : "info",
        updated_at: slowest.last_updated ?? undefined,
        ctaLabel: "Open proposals",
        ui_actions: [
          buildNavigateAction("new_business", "/new-business", "Jump to proposal workspace", {
            status: "In Progress",
          }),
        ],
      });
    }
  }

  if (inactiveLeads.length > 0) {
    const leastRecent = inactiveLeads[0];
    const insightId = `insight-leads-${leastRecent.id}`;
    if (!dismissedIds.has(insightId)) {
      insights.push({
        id: insightId,
        module: "customer",
        tag: "Pipeline",
        title: `${inactiveLeads.length} lead${inactiveLeads.length === 1 ? "" : "s"} drifting`,
        summary: `${leastRecent.name} was last touched ${formatRelative(leastRecent.last_contacted)}.`,
        priority: "info",
        updated_at: leastRecent.last_contacted ?? undefined,
        ctaLabel: "View leads",
        ui_actions: [
          buildNavigateAction("customer", "/customers", "Open lead list sorted by oldest touch", {
            sort: "last_contacted",
          }),
        ],
      });
    }
  }

  if (!insights.length) {
    return buildFallbackInsights(scope);
  }

  return insights.slice(0, 4);
}

export default { generateProactiveInsights };
