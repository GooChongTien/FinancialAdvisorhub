/**
 * Analytics Tools - Supabase Integration
 * Performance metrics and analytics data
 */

import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import {
  ToolRegistry,
  createSuccessResult,
  createErrorResult,
  type ToolContext,
  type ToolResult,
} from "./registry.ts";

// Zod Schemas
const GetPerformanceSchema = z.object({
  advisorId: z.string(),
  period: z.enum(["MTD", "QTD", "YTD", "ALL"]).default("MTD"),
});

const GetFunnelSchema = z.object({
  period: z.enum(["7D", "30D", "90D", "YTD"]).default("30D"),
  advisorId: z.string().optional(),
});

const GetTeamStatsSchema = z.object({
  teamId: z.string().optional(),
});

const GetTrendSchema = z.object({
  advisorId: z.string(),
  months: z.number().min(1).max(24).default(12),
});

// Types
export interface PerformanceMetrics {
  total_policies: number;
  total_premium: number;
  total_commission: number;
  conversion_rate: number;
  period: string;
}

export interface ConversionFunnel {
  leads_new: number;
  leads_contacted: number;
  leads_qualified: number;
  proposals_created: number;
  proposals_submitted: number;
  policies_issued: number;
  conversion_rate: number;
}

export interface TeamStats {
  total_advisors: number;
  total_policies: number;
  average_premium: number;
  top_performers: Array<{ advisor_id: string; name: string; policies: number; premium: number }>;
}

export interface TrendData {
  month: string;
  policies: number;
  premium: number;
  commission: number;
}

// Tool Handlers

async function getPerformance(
  params: z.infer<typeof GetPerformanceSchema>,
  context?: ToolContext,
): Promise<ToolResult<PerformanceMetrics>> {
  try {
    const supabase = context?.supabase as SupabaseClient | undefined;
    if (!supabase) {
      // Mock data
      return createSuccessResult({
        total_policies: 15,
        total_premium: 187500,
        total_commission: 18750,
        conversion_rate: 0.23,
        period: params.period,
      });
    }

    // Calculate date range
    const now = new Date();
    let startDate: Date;

    switch (params.period) {
      case "MTD":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "QTD":
        startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        break;
      case "YTD":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(0); // All time
    }

    const { data: policies, error } = await supabase
      .from("policies")
      .select("premium, commission, status")
      .eq("advisor_id", params.advisorId)
      .gte("issued_date", startDate.toISOString());

    if (error) {
      return createErrorResult("DATABASE_ERROR", error.message, error);
    }

    const total_policies = policies?.length || 0;
    const total_premium = policies?.reduce((sum, p) => sum + (p.premium || 0), 0) || 0;
    const total_commission = policies?.reduce((sum, p) => sum + (p.commission || 0), 0) || 0;

    // Calculate conversion rate (policies / leads in same period)
    const { count: leadsCount } = await supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("owner", params.advisorId)
      .gte("created_at", startDate.toISOString());

    const conversion_rate = leadsCount ? total_policies / leadsCount : 0;

    return createSuccessResult({
      total_policies,
      total_premium,
      total_commission,
      conversion_rate: Number(conversion_rate.toFixed(3)),
      period: params.period,
    });
  } catch (error) {
    return createErrorResult(
      "EXECUTION_ERROR",
      error instanceof Error ? error.message : "Failed to get performance metrics",
      error,
    );
  }
}

async function getFunnel(
  params: z.infer<typeof GetFunnelSchema>,
  context?: ToolContext,
): Promise<ToolResult<ConversionFunnel>> {
  try {
    const supabase = context?.supabase as SupabaseClient | undefined;
    if (!supabase) {
      // Mock data
      return createSuccessResult({
        leads_new: 45,
        leads_contacted: 38,
        leads_qualified: 22,
        proposals_created: 18,
        proposals_submitted: 12,
        policies_issued: 8,
        conversion_rate: 0.178,
      });
    }

    // Calculate date range
    const now = new Date();
    const daysAgo = parseInt(params.period.replace("D", ""));
    const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

    let leadsQuery = supabase.from("leads").select("status", { count: "exact" }).gte("created_at", startDate.toISOString());

    if (params.advisorId) {
      leadsQuery = leadsQuery.eq("owner", params.advisorId);
    }

    const { data: leads, error: leadsError } = await leadsQuery;

    if (leadsError) {
      return createErrorResult("DATABASE_ERROR", leadsError.message, leadsError);
    }

    const leads_new = leads?.filter((l) => l.status === "new").length || 0;
    const leads_contacted = leads?.filter((l) => l.status === "contacted").length || 0;
    const leads_qualified = leads?.filter((l) => l.status === "qualified").length || 0;

    // Get proposals
    let proposalsQuery = supabase.from("proposals").select("stage", { count: "exact" }).gte("created_at", startDate.toISOString());

    if (params.advisorId) {
      proposalsQuery = proposalsQuery.eq("advisor_id", params.advisorId);
    }

    const { data: proposals, error: proposalsError } = await proposalsQuery;

    if (proposalsError) {
      return createErrorResult("DATABASE_ERROR", proposalsError.message, proposalsError);
    }

    const proposals_created = proposals?.length || 0;
    const proposals_submitted = proposals?.filter((p) => p.stage === "submitted" || p.stage === "approved").length || 0;

    // Get issued policies
    let policiesQuery = supabase.from("policies").select("id", { count: "exact" }).gte("issued_date", startDate.toISOString());

    if (params.advisorId) {
      policiesQuery = policiesQuery.eq("advisor_id", params.advisorId);
    }

    const { count: policies_issued, error: policiesError } = await policiesQuery;

    if (policiesError) {
      return createErrorResult("DATABASE_ERROR", policiesError.message, policiesError);
    }

    const total_leads = leads?.length || 1;
    const conversion_rate = (policies_issued || 0) / total_leads;

    return createSuccessResult({
      leads_new,
      leads_contacted,
      leads_qualified,
      proposals_created,
      proposals_submitted,
      policies_issued: policies_issued || 0,
      conversion_rate: Number(conversion_rate.toFixed(3)),
    });
  } catch (error) {
    return createErrorResult(
      "EXECUTION_ERROR",
      error instanceof Error ? error.message : "Failed to get funnel data",
      error,
    );
  }
}

async function getTeamStats(
  params: z.infer<typeof GetTeamStatsSchema>,
  context?: ToolContext,
): Promise<ToolResult<TeamStats>> {
  try {
    const supabase = context?.supabase as SupabaseClient | undefined;
    if (!supabase) {
      // Mock data
      return createSuccessResult({
        total_advisors: 8,
        total_policies: 142,
        average_premium: 15600,
        top_performers: [
          { advisor_id: "A-001", name: "Alice Tan", policies: 28, premium: 421000 },
          { advisor_id: "A-002", name: "Bob Lee", policies: 24, premium: 389000 },
        ],
      });
    }

    // Get advisor count
    const { count: total_advisors, error: advisorsError } = await supabase
      .from("advisors")
      .select("*", { count: "exact", head: true });

    if (advisorsError) {
      return createErrorResult("DATABASE_ERROR", advisorsError.message, advisorsError);
    }

    // Get total policies and premium
    const { data: policies, error: policiesError } = await supabase.from("policies").select("advisor_id, premium");

    if (policiesError) {
      return createErrorResult("DATABASE_ERROR", policiesError.message, policiesError);
    }

    const total_policies = policies?.length || 0;
    const total_premium = policies?.reduce((sum, p) => sum + (p.premium || 0), 0) || 0;
    const average_premium = total_policies > 0 ? total_premium / total_policies : 0;

    // Calculate top performers
    const advisorStats = new Map<string, { policies: number; premium: number }>();
    policies?.forEach((p) => {
      const stats = advisorStats.get(p.advisor_id) || { policies: 0, premium: 0 };
      stats.policies++;
      stats.premium += p.premium || 0;
      advisorStats.set(p.advisor_id, stats);
    });

    const topPerformersArray = Array.from(advisorStats.entries())
      .map(([advisor_id, stats]) => ({ advisor_id, ...stats }))
      .sort((a, b) => b.premium - a.premium)
      .slice(0, 5);

    // Fetch advisor names
    const advisorIds = topPerformersArray.map((p) => p.advisor_id);
    const { data: advisorData } = await supabase.from("advisors").select("id, name").in("id", advisorIds);

    const top_performers = topPerformersArray.map((p) => ({
      ...p,
      name: advisorData?.find((a) => a.id === p.advisor_id)?.name || "Unknown",
    }));

    return createSuccessResult({
      total_advisors: total_advisors || 0,
      total_policies,
      average_premium: Number(average_premium.toFixed(2)),
      top_performers,
    });
  } catch (error) {
    return createErrorResult(
      "EXECUTION_ERROR",
      error instanceof Error ? error.message : "Failed to get team stats",
      error,
    );
  }
}

async function getMonthlyTrend(
  params: z.infer<typeof GetTrendSchema>,
  context?: ToolContext,
): Promise<ToolResult<TrendData[]>> {
  try {
    const supabase = context?.supabase as SupabaseClient | undefined;
    if (!supabase) {
      // Mock data
      const mockData: TrendData[] = [];
      for (let i = params.months - 1; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        mockData.push({
          month: date.toISOString().slice(0, 7),
          policies: Math.floor(Math.random() * 10) + 5,
          premium: Math.floor(Math.random() * 50000) + 100000,
          commission: Math.floor(Math.random() * 5000) + 10000,
        });
      }
      return createSuccessResult(mockData);
    }

    const trend: TrendData[] = [];
    const now = new Date();

    for (let i = params.months - 1; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const { data: policies, error } = await supabase
        .from("policies")
        .select("premium, commission")
        .eq("advisor_id", params.advisorId)
        .gte("issued_date", monthStart.toISOString())
        .lte("issued_date", monthEnd.toISOString());

      if (error) {
        return createErrorResult("DATABASE_ERROR", error.message, error);
      }

      const policies_count = policies?.length || 0;
      const premium = policies?.reduce((sum, p) => sum + (p.premium || 0), 0) || 0;
      const commission = policies?.reduce((sum, p) => sum + (p.commission || 0), 0) || 0;

      trend.push({
        month: monthStart.toISOString().slice(0, 7),
        policies: policies_count,
        premium,
        commission,
      });
    }

    return createSuccessResult(trend);
  } catch (error) {
    return createErrorResult(
      "EXECUTION_ERROR",
      error instanceof Error ? error.message : "Failed to get trend data",
      error,
    );
  }
}

/**
 * Register all analytics tools
 */
export function registerAnalyticsTools(registry: ToolRegistry): void {
  registry.registerTool({
    name: "analytics.getPerformance",
    description: "Get advisor performance metrics for a period",
    schema: GetPerformanceSchema,
    handler: getPerformance,
    module: "analytics",
    requiresAuth: true,
  });

  registry.registerTool({
    name: "analytics.getFunnel",
    description: "Get conversion funnel data",
    schema: GetFunnelSchema,
    handler: getFunnel,
    module: "analytics",
  });

  registry.registerTool({
    name: "analytics.getTeamStats",
    description: "Get team-wide statistics",
    schema: GetTeamStatsSchema,
    handler: getTeamStats,
    module: "analytics",
  });

  registry.registerTool({
    name: "analytics.getMonthlyTrend",
    description: "Get monthly trend data for an advisor",
    schema: GetTrendSchema,
    handler: getMonthlyTrend,
    module: "analytics",
    requiresAuth: true,
  });
}
