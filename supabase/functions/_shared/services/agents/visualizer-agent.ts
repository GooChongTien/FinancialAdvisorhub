import type { MiraContext, MiraResponse } from "../types.ts";
import { SkillAgent } from "./base-agent.ts";
import { buildAgentResponse } from "./response-builder.ts";
import { createNavigateAction, createPrefillAction } from "./action-templates.ts";
import { getVisualizerTools } from "./tools/visualizer-tools.ts";

const SYSTEM_PROMPT = `You are a financial planning and visualization expert.
Guide advisors through plan generation, scenario exploration, and comparisons.`;

export class VisualizerAgent extends SkillAgent {
  constructor() {
    super("VisualizerAgent", "visualizer", SYSTEM_PROMPT, getVisualizerTools());
  }

  async execute(intent: string, context: MiraContext): Promise<MiraResponse> {
    switch (intent) {
      case "generate_plan":
        return this.handleGeneratePlan(context);
      case "view_scenarios":
        return this.handleViewScenarios(context);
      case "compare_scenarios":
        return this.handleCompareScenarios(context);
      default:
        return buildAgentResponse(
          this.id,
          intent,
          context,
          "Opening Financial Visualizer.",
          [createNavigateAction(context.module, "/visualizer")],
        );
    }
  }

  private async handleGeneratePlan(context: MiraContext): Promise<MiraResponse> {
    const customerId = (context.pageData?.customerId as string) ?? "C-2001";
    const plan = await this.invokeTool("visualizer.generatePlan", { customerId }, { context });
    const actions = [
      createNavigateAction(context.module, "/visualizer", { customerId }),
      createPrefillAction({ plan }),
    ];
    const reply = `Generating a tailored plan for ${customerId} and loading the chart with projections.`;
    return buildAgentResponse(this.id, "generate_plan", context, reply, actions, {
      subtopic: "plan",
    });
  }

  private async handleViewScenarios(context: MiraContext): Promise<MiraResponse> {
    const customerId = (context.pageData?.customerId as string) ?? "C-2001";
    await this.invokeTool("visualizer.getScenarios", { customerId }, { context });
    const actions = [createNavigateAction(context.module, "/visualizer/scenarios", { customerId })];
    const reply = "Listing the saved scenarios so you can toggle between growth assumptions.";
    return buildAgentResponse(this.id, "view_scenarios", context, reply, actions, {
      subtopic: "scenario",
    });
  }

  private async handleCompareScenarios(context: MiraContext): Promise<MiraResponse> {
    const scenarioIds = (context.pageData?.scenarioIds as string[]) ?? ["C-2001-S1", "C-2001-S2"];
    await this.invokeTool("visualizer.compareScenarios", { scenarioIds }, { context });
    const actions = [
      createNavigateAction(context.module, "/visualizer/compare", { scenarioIds: scenarioIds.join(",") }),
    ];
    const reply = "Comparing the selected scenarios and surfacing the key differences in projected value.";
    return buildAgentResponse(this.id, "compare_scenarios", context, reply, actions, {
      subtopic: "comparison",
    });
  }
}
