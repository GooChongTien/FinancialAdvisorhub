import type { MiraContext, MiraResponse } from "../types.ts";
import { SkillAgent } from "./base-agent.ts";
import { buildAgentResponse } from "./response-builder.ts";
import { createCRUDFlow, createNavigateAction, createPrefillAction } from "./action-templates.ts";
import { getBroadcastTools } from "./tools/broadcast-tools.ts";

const SYSTEM_PROMPT = `You are a campaign and messaging specialist.
Assist advisors in reviewing broadcasts, drafting new campaigns, and monitoring performance.`;

export class BroadcastAgent extends SkillAgent {
  constructor() {
    super("BroadcastAgent", "broadcast", SYSTEM_PROMPT, getBroadcastTools());
  }

  async execute(intent: string, context: MiraContext): Promise<MiraResponse> {
    switch (intent) {
      case "list_campaigns":
        return this.handleListCampaigns(context);
      case "create_broadcast":
        return this.handleCreateBroadcast(context);
      case "view_campaign_stats":
        return this.handleViewStats(context);
      default:
        return buildAgentResponse(
          this.id,
          intent,
          context,
          "Opening Broadcast workspace.",
          [createNavigateAction(context.module, "/broadcast")],
        );
    }
  }

  private async handleListCampaigns(context: MiraContext): Promise<MiraResponse> {
    const status = (context.pageData?.status as string) ?? undefined;
    await this.invokeTool("broadcast__broadcasts.list", { status }, { context });
    const actions = [createNavigateAction(context.module, "/broadcast", { status })];
    const reply = "Showing campaign list with the filters you specified.";
    return buildAgentResponse(this.id, "list_campaigns", context, reply, actions, {
      subtopic: "campaigns",
    });
  }

  private async handleCreateBroadcast(context: MiraContext): Promise<MiraResponse> {
    const payload = {
      title: (context.pageData?.title as string) ?? "Nurture Series",
      audience: (context.pageData?.audience as string) ?? "Warm leads",
    };
    await this.invokeTool("broadcast__broadcasts.create", payload, { context });
    const actions = createCRUDFlow("create", context.module, {
      page: "/broadcast/new",
      payload,
      description: "Prefill the broadcast composer",
    });
    const reply = "Drafting a new broadcast and prefilling the title + audience you mentioned.";
    return buildAgentResponse(this.id, "create_broadcast", context, reply, actions, {
      subtopic: "campaigns",
    });
  }

  private async handleViewStats(context: MiraContext): Promise<MiraResponse> {
    const campaignId = (context.pageData?.campaignId as string) ?? "B-1";
    await this.invokeTool("broadcast__broadcasts.getStats", { id: campaignId }, { context });
    const actions = [
      createNavigateAction(context.module, `/broadcast/detail/${campaignId}/stats`),
      createPrefillAction({ campaignId }),
    ];
    const reply = `Opening stats for campaign ${campaignId} with delivery, open, and click metrics.`;
    return buildAgentResponse(this.id, "view_campaign_stats", context, reply, actions, {
      subtopic: "analytics",
    });
  }

  async generateSuggestions(context: MiraContext) {
    const audience =
      typeof context.pageData?.audience === "string" && context.pageData.audience.trim()
        ? context.pageData.audience.trim()
        : "warm leads";
    const draftName =
      typeof context.pageData?.title === "string" && context.pageData.title.trim()
        ? context.pageData.title.trim()
        : "Nurture touch";
    const campaignId =
      typeof context.pageData?.campaignId === "string" && context.pageData.campaignId.trim()
        ? context.pageData.campaignId.trim()
        : "B-1";

    return [
      this.buildSuggestion({
        intent: "create_broadcast",
        title: `Draft ${draftName}`,
        description: "Spin up a new campaign with the current filters.",
        promptText: `Create a broadcast titled "${draftName}" targeting ${audience}.`,
        confidence: 0.8,
      }),
      this.buildSuggestion({
        intent: "list_campaigns",
        title: `Review ${audience} campaigns`,
        description: "Pull up the latest sends for this audience.",
        promptText: `Show my recent broadcasts targeting ${audience}.`,
        confidence: 0.72,
      }),
      this.buildSuggestion({
        intent: "view_campaign_stats",
        title: `Check stats for ${campaignId}`,
        description: "See opens, clicks, and bounce notes.",
        promptText: `Open the analytics for campaign ${campaignId} and summarize open/click rate.`,
        confidence: 0.69,
      }),
    ];
  }
}
