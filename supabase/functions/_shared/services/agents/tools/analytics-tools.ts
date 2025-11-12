import type { AgentTool } from "../../types.ts";

export interface Performance {
  advisorId: string;
  period: string;
  premium: number;
  proposals: number;
  conversionRate: number;
}

export interface ConversionFunnel {
  stages: Array<{ stage: string; count: number }>;
}

export interface TeamStats {
  averagePremium: number;
  topAdvisor: string;
  leaderboard: Array<{ advisor: string; premium: number }>;
}

export interface TrendData {
  months: string[];
  premiums: number[];
}

async function getPerformance(advisorId: string, period: string): Promise<Performance> {
  return {
    advisorId,
    period,
    premium: 48000,
    proposals: 38,
    conversionRate: 0.42,
  };
}

async function getFunnel(period: string): Promise<ConversionFunnel> {
  return {
    stages: [
      { stage: "Leads", count: 120 },
      { stage: "Opportunities", count: 60 },
      { stage: "Proposals", count: 32 },
      { stage: "Policies", count: 18 },
    ],
  };
}

async function getTeamStats(): Promise<TeamStats> {
  return {
    averagePremium: 38000,
    topAdvisor: "Gina Wong",
    leaderboard: [
      { advisor: "Gina Wong", premium: 56000 },
      { advisor: "Faizal Rahman", premium: 51000 },
      { advisor: "Kim Tan", premium: 48000 },
    ],
  };
}

async function getMonthlyTrend(advisorId: string): Promise<TrendData> {
  return {
    months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    premiums: [32000, 38000, 41000, 39000, 45000, 48000],
  };
}

export function getAnalyticsTools(): AgentTool[] {
  return [
    {
      name: "analytics.getPerformance",
      description: "Fetch advisor YTD performance",
      handler: async (input: { advisorId: string; period: string }) => getPerformance(input.advisorId, input.period),
    },
    {
      name: "analytics.getFunnel",
      description: "Retrieve funnel breakdown",
      handler: async (input: { period: string }) => getFunnel(input.period),
    },
    {
      name: "analytics.getTeamStats",
      description: "Get team comparison stats",
      handler: async () => getTeamStats(),
    },
    {
      name: "analytics.getMonthlyTrend",
      description: "Fetch advisor monthly trend data",
      handler: async (input: { advisorId: string }) => getMonthlyTrend(input.advisorId),
    },
  ];
}
