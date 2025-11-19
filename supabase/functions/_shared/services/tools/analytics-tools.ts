import { z } from "https://esm.sh/zod@3.25.76";
import { toolRegistry } from "./registry.ts";
import type { ToolContext } from "./types.ts";
import { createServiceClient } from "./service-client.ts";
import { executeSafely } from "./error-handling.ts";

const timeframeSchema = z.enum(["today", "week", "month"]);
type Timeframe = z.infer<typeof timeframeSchema>;

const overviewSchema = z.object({
  timeframe: timeframeSchema.optional(),
});

function buildSince(timeframe: Timeframe) {
  const now = new Date();
  if (timeframe === "week") now.setDate(now.getDate() - 7);
  else if (timeframe === "month") now.setMonth(now.getMonth() - 1);
  return now.toISOString();
}

async function analyticsOverview(_ctx: ToolContext, args: z.infer<typeof overviewSchema>) {
  const parsed = overviewSchema.parse(args ?? {});
  const timeframe = parsed.timeframe ?? "today";

  return executeSafely(
    "analytics__overview.summary",
    async () => {
      const client = createServiceClient();
      const since = buildSince(timeframe);
      const [{ count: tasksCount }, { count: proposalsCount }, { count: leadsCount }] = await Promise.all([
        client.from("tasks").select("*", { count: "exact" }).gte("created_at", since).range(0, 0),
        client.from("proposals").select("*", { count: "exact" }).gte("created_at", since).range(0, 0),
        client.from("leads").select("*", { count: "exact" }).gte("created_at", since).range(0, 0),
      ]);
      return {
        timeframe,
        tasks: tasksCount ?? 0,
        proposals: proposalsCount ?? 0,
        leads: leadsCount ?? 0,
      };
    },
    args
  );
}

const drilldownSchema = z.object({
  timeframe: timeframeSchema.optional(),
  groupBy: z.enum(["module", "status"]).optional(),
});

async function analyticsDrilldown(_ctx: ToolContext, args: z.infer<typeof drilldownSchema>) {
  const parsed = drilldownSchema.parse(args ?? {});
  const timeframe = parsed.timeframe ?? "today";
  const groupBy = parsed.groupBy ?? "module";

  return executeSafely(
    "analytics__overview.drilldown",
    async () => {
      const client = createServiceClient();
      const since = buildSince(timeframe);
      const column = groupBy === "status" ? "status" : "module";
      const { data, error } = await client
        .from("insights")
        .select(`${column},count`)
        .gte("created_at", since)
        .gt("count", 0)
        .order(column, { ascending: true });
      if (error) throw error;
      return { timeframe, groupBy, rows: data ?? [] };
    },
    args
  );
}

toolRegistry.registerTool("analytics__overview.summary", analyticsOverview, overviewSchema);
toolRegistry.registerTool("analytics__overview.drilldown", analyticsDrilldown, drilldownSchema);

const trendSchema = z.object({
  days: z.number().int().min(1).max(30).optional(),
});

function buildDateKey(input: string) {
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return input;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

async function analyticsTrend(_ctx: ToolContext, args: z.infer<typeof trendSchema>) {
  const parsed = trendSchema.parse(args ?? {});
  const rangeDays = parsed.days ?? 7;

  return executeSafely(
    "analytics__overview.trend",
    async () => {
      const client = createServiceClient();
      const since = new Date();
      since.setDate(since.getDate() - rangeDays + 1);
      const isoSince = since.toISOString();
      const tables = ["tasks", "proposals", "leads"];
      const rowsByTable: Record<string, Record<string, number>> = {};
      await Promise.all(
        tables.map(async (table) => {
          const { data, error } = await client
            .from(table)
            .select("created_at")
            .gte("created_at", isoSince)
            .order("created_at", { ascending: true });
          if (error) throw error;
          rowsByTable[table] = (data ?? []).reduce<Record<string, number>>((acc, entry) => {
            const key = buildDateKey(entry.created_at as string);
            acc[key] = (acc[key] ?? 0) + 1;
            return acc;
          }, {});
        }),
      );
      const trend: Array<{ date: string; tasks: number; proposals: number; leads: number }> = [];
      for (let i = 0; i < rangeDays; i++) {
        const day = new Date(since);
        day.setDate(day.getDate() + i);
        const key = buildDateKey(day.toISOString());
        trend.push({
          date: key,
          tasks: rowsByTable["tasks"]?.[key] ?? 0,
          proposals: rowsByTable["proposals"]?.[key] ?? 0,
          leads: rowsByTable["leads"]?.[key] ?? 0,
        });
      }
      return { timeframe: rangeDays, trend };
    },
    args
  );
}

toolRegistry.registerTool("analytics__overview.trend", analyticsTrend, trendSchema);
