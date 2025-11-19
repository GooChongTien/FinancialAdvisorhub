import type { MiraContext, MiraResponse, SuggestedIntent } from "../types.ts";
import { SkillAgent } from "./base-agent.ts";
import { buildAgentResponse } from "./response-builder.ts";
import { createNavigateAction } from "./action-templates.ts";
import { getAnalyticsTools } from "./tools/analytics-tools.ts";

const SYSTEM_PROMPT = `You are a performance analytics advisor.
Interpret dashboards, guide advisors to relevant charts, and explain what to watch.
Always reference the Analytics pages and remind the advisor how to adjust filters.`;

export class AnalyticsAgent extends SkillAgent {
  constructor() {
    super("AnalyticsAgent", "analytics", SYSTEM_PROMPT, getAnalyticsTools());
  }

  async execute(intent: string, context: MiraContext): Promise<MiraResponse> {
    switch (intent) {
      case "view_ytd_progress":
        return this.handleYTD(context);
      case "view_monthly_trend":
        return this.handleMonthlyTrend(context);
      case "compare_to_team":
        return this.handleTeamComparison(context);
      case "view_stage_counts":
        return this.handleStageCounts(context);
      case "identify_drop_off":
        return this.handleDropOff(context);
      default:
        return buildAgentResponse(
          this.id,
          intent,
          context,
          "Opening analytics overview.",
          [createNavigateAction(context.module, "/analytics")],
        );
    }
  }

  private async handleYTD(context: MiraContext): Promise<MiraResponse> {
    await this.invokeTool("analytics__overview.summary", { timeframe: "month" }, { context });
    const actions = [createNavigateAction(context.module, "/analytics", { range: "YTD" })];
    const reply = "Showing your YTD premium, proposals, and conversion. Use the range toggle to switch periods.";
    return buildAgentResponse(this.id, "view_ytd_progress", context, reply, actions, {
      subtopic: "performance",
    });
  }

  private async handleMonthlyTrend(context: MiraContext): Promise<MiraResponse> {
    await this.invokeTool("analytics__overview.trend", { days: 30 }, { context });
    const actions = [createNavigateAction(context.module, "/analytics/monthly")];
    const reply = "Highlighting month-over-month premium trend. I'll annotate the peaks and dips for you.";
    return buildAgentResponse(this.id, "view_monthly_trend", context, reply, actions, {
      subtopic: "trend",
    });
  }

  private async handleTeamComparison(context: MiraContext): Promise<MiraResponse> {
    await this.invokeTool("analytics__overview.drilldown", { groupBy: "module" }, { context });
    const actions = [createNavigateAction(context.module, "/analytics/team-comparison")];
    const reply = "Comparing your metrics with the team average and identifying the top performers.";
    return buildAgentResponse(this.id, "compare_to_team", context, reply, actions, {
      subtopic: "team",
    });
  }

  private async handleStageCounts(context: MiraContext): Promise<MiraResponse> {
    await this.invokeTool("analytics__overview.drilldown", { groupBy: "status" }, { context });
    const actions = [createNavigateAction(context.module, "/analytics/funnel")];
    const reply = "Opening funnel view to show counts across each stage. I'll flag any bottlenecks.";
    return buildAgentResponse(this.id, "view_stage_counts", context, reply, actions, {
      subtopic: "funnel",
    });
  }

  private async handleDropOff(context: MiraContext): Promise<MiraResponse> {
    await this.invokeTool("analytics__overview.trend", { days: 90 }, { context });
    const actions = [createNavigateAction(context.module, "/analytics/funnel", { highlight: "dropoff" })];
    const reply =
      "Analyzing the conversion funnel to highlight where prospects drop off most. I'll suggest follow-up actions.";
    return buildAgentResponse(this.id, "identify_drop_off", context, reply, actions, {
      subtopic: "funnel",
    });
  }

  async generateSuggestions(): Promise<SuggestedIntent[]> {
    return [
      this.buildSuggestion({
        intent: "view_ytd_progress",
        title: "Review YTD performance",
        description: "See premium and conversion stacked against target.",
        promptText: "Show my YTD premium and conversion progress versus goal.",
        confidence: 0.83,
      }),
      this.buildSuggestion({
        intent: "view_stage_counts",
        title: "Check funnel bottlenecks",
        description: "Surface the stage with the steepest drop-off.",
        promptText: "Open the funnel view and highlight which stage has the steepest drop-off this month.",
        confidence: 0.77,
      }),
      this.buildSuggestion({
        intent: "compare_to_team",
        title: "Benchmark against team",
        description: "See how I rank on proposals and conversion.",
        promptText: "Compare my performance to the team average for this quarter.",
        confidence: 0.7,
      }),
    ];
  }
}
