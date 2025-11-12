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
    await this.invokeTool("broadcasts.list", { status }, { context });
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
    await this.invokeTool("broadcasts.create", payload, { context });
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
    await this.invokeTool("broadcasts.getStats", { id: campaignId }, { context });
    const actions = [
      createNavigateAction(context.module, `/broadcast/detail/${campaignId}/stats`),
      createPrefillAction({ campaignId }),
    ];
    const reply = `Opening stats for campaign ${campaignId} with delivery, open, and click metrics.`;
    return buildAgentResponse(this.id, "view_campaign_stats", context, reply, actions, {
      subtopic: "analytics",
    });
  }
}
