import type { AgentTool } from "../../types.ts";

export interface FinancialPlan {
  customerId: string;
  summary: string;
  projections: Array<{ year: number; value: number }>;
}

export interface Scenario {
  id: string;
  name: string;
  growthRate: number;
  premium: number;
}

export interface Comparison {
  scenarios: string[];
  table: Array<{ metric: string; values: Record<string, number> }>;
}

async function generatePlan(customerId: string): Promise<FinancialPlan> {
  return {
    customerId,
    summary: "Baseline retirement plan with balanced growth.",
    projections: [
      { year: 2025, value: 150000 },
      { year: 2030, value: 320000 },
      { year: 2040, value: 620000 },
    ],
  };
}

async function getScenarios(customerId: string): Promise<Scenario[]> {
  return [
    { id: `${customerId}-S1`, name: "Balanced growth", growthRate: 0.06, premium: 800 },
    { id: `${customerId}-S2`, name: "Aggressive growth", growthRate: 0.08, premium: 900 },
  ];
}

async function compareScenarios(scenarioIds: string[]): Promise<Comparison> {
  const table = [
    {
      metric: "Projected Value @ 65",
      values: Object.fromEntries(scenarioIds.map((id, idx) => [id, 500000 + idx * 60000])),
    },
    {
      metric: "Total Premium Paid",
      values: Object.fromEntries(scenarioIds.map((id, idx) => [id, 180000 + idx * 20000])),
    },
  ];
  return {
    scenarios: scenarioIds,
    table,
  };
}

export function getVisualizerTools(): AgentTool[] {
  return [
    {
      name: "visualizer__generatePlan",
      description: "Generate financial plan summary for a customer",
      handler: async (input: { customerId: string }) => generatePlan(input.customerId),
    },
    {
      name: "visualizer__getScenarios",
      description: "Fetch saved scenarios for a customer",
      handler: async (input: { customerId: string }) => getScenarios(input.customerId),
    },
    {
      name: "visualizer__compareScenarios",
      description: "Compare multiple scenarios",
      handler: async (input: { scenarioIds: string[] }) => compareScenarios(input.scenarioIds),
    },
  ];
}
