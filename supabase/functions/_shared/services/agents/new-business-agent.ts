import type { MiraContext, MiraResponse } from "../types.ts";
import { SkillAgent } from "./base-agent.ts";
import { buildAgentResponse } from "./response-builder.ts";
import { createCRUDFlow, createNavigateAction, createPrefillAction, createExecuteAction } from "./action-templates.ts";
import {
  getNewBusinessTools,
  type CreateProposalInput,
} from "./tools/new-business-tools.ts";

const SYSTEM_PROMPT = `You are a proposal and underwriting specialist.
Guide advisors through proposal creation, quote generation, and underwriting submission.
Respond with concrete steps and reference the New Business workspace.`;

export class NewBusinessAgent extends SkillAgent {
  constructor() {
    super("NewBusinessAgent", "new_business", SYSTEM_PROMPT, getNewBusinessTools());
  }

  async execute(intent: string, context: MiraContext, userMessage: string): Promise<MiraResponse> {
    switch (intent) {
      case "start_new_proposal":
      case "create_proposal":
        return this.handleStartProposal(context, userMessage);
      case "view_proposals":
      case "navigate_to_stage":
        return this.handleViewProposals(context, userMessage);
      case "generate_quote":
        return this.handleGenerateQuote(context);
      case "compare_products":
        return this.handleCompareProducts(context);
      case "submit_for_uw":
      case "submit_for_underwriting":
        return this.handleSubmitForUnderwriting(context);
      default:
        return buildAgentResponse(
          this.id,
          intent,
          context,
          "I'll open the New Business workspace so you can continue.",
          [createNavigateAction(context.module, "/new-business")],
        );
    }
  }

  private async handleViewProposals(context: MiraContext, userMessage: string): Promise<MiraResponse> {
    // Extract search term from user message (e.g., "Kim" from "search Kim's proposal")
    const searchMatch = userMessage.match(/search\s+([^'s]+)/i) ||
                       userMessage.match(/find\s+([^'s]+)/i) ||
                       userMessage.match(/show\s+([^'s]+)/i);
    const searchTerm = searchMatch ? searchMatch[1].trim() : '';

    const actions = [
      createNavigateAction(context.module, "/new-business", searchTerm ? { search: searchTerm } : {}),
    ];

    const reply = searchTerm
      ? `Opening New Business page and searching for proposals related to "${searchTerm}".`
      : "I'll show you the New Business page with all your proposals.";

    return buildAgentResponse(this.id, "view_proposals", context, reply, actions, {
      subtopic: "proposal_creation",
    });
  }

  private async handleStartProposal(context: MiraContext, userMessage: string): Promise<MiraResponse> {
    const payload: CreateProposalInput = {
      customerId: (context.pageData?.customerId as string) ?? "C-2001",
      productId: (context.pageData?.productId as string) ?? "PR-1001",
      premium: Number(context.pageData?.premium ?? 1800),
    };

    await this.invokeTool("new_business__proposals.create", payload, { context });

    const actions = createCRUDFlow("create", context.module, {
      page: "/new-business",
      payload,
      description: "Open proposal builder with customer + product prefilled",
    });

    const reply =
      `Starting a new proposal for ${payload.customerId}. I'll prefill the selected product and premium ` +
      `from your last message "${userMessage.slice(0, 60)}".`;

    return buildAgentResponse(this.id, "start_new_proposal", context, reply, actions, {
      subtopic: "proposal",
    });
  }

  private async handleGenerateQuote(context: MiraContext): Promise<MiraResponse> {
    const productId = (context.pageData?.productId as string) ?? "PR-1001";
    const customerId = (context.pageData?.customerId as string) ?? "C-2001";
    const quote = await this.invokeTool("new_business__quotes.generate", { productId, customerId }, { context });

    const actions = [
      createExecuteAction("POST", "/api/new-business/quotes", { productId, customerId }),
      createPrefillAction({ quote }),
    ];

    const reply = `Generated a quick quote for product ${productId}. I'll show the premium and coverage breakdown now.`;
    return buildAgentResponse(this.id, "generate_quote", context, reply, actions, {
      subtopic: "proposal",
    });
  }

  private async handleCompareProducts(context: MiraContext): Promise<MiraResponse> {
    const productIds = (context.pageData?.productIds as string[]) ?? ["PR-1001", "PR-1002"];
    const actions = [
      createNavigateAction(context.module, "/new-business/compare", { ids: productIds.join(",") }),
    ];
    const reply = `Opening comparison view for ${productIds.length} product options so you can contrast premiums and coverage.`;
    return buildAgentResponse(this.id, "compare_products", context, reply, actions, {
      subtopic: "product_selection",
    });
  }

  private async handleSubmitForUnderwriting(context: MiraContext): Promise<MiraResponse> {
    const proposalId = (context.pageData?.proposalId as string) ?? "P-3001";
    await this.invokeTool("new_business__underwriting.submit", { proposalId }, { context });

    const actions = createCRUDFlow("update", context.module, {
      page: `/new-business/status/${proposalId}`,
      endpoint: `/api/new-business/proposals/${proposalId}/submit`,
      payload: { proposalId },
      description: "Confirm underwriting submission",
      confirmRequired: true,
    });

    const reply = `Submitting proposal ${proposalId} to underwriting. I'll show you the confirmation modal before sending.`;
    return buildAgentResponse(this.id, "submit_for_uw", context, reply, actions, {
      subtopic: "underwriting",
    });
  }

  async generateSuggestions(context: MiraContext) {
    const customerName =
      typeof context.pageData?.customerName === "string" && context.pageData.customerName.trim()
        ? context.pageData.customerName.trim()
        : "my latest lead";
    const productChoice =
      typeof context.pageData?.productName === "string" && context.pageData.productName.trim()
        ? context.pageData.productName.trim()
        : "the recommended plan";

    return [
      this.buildSuggestion({
        intent: "start_new_proposal",
        title: "Start proposal draft",
        description: `Use ${customerName}'s info to prefill the form.`,
        promptText: `Start a new proposal for ${customerName} and reuse any product selection already on this page.`,
        confidence: 0.84,
      }),
      this.buildSuggestion({
        intent: "generate_quote",
        title: `Quote ${productChoice}`,
        description: "Get quick premium guidance before presenting.",
        promptText: `Generate a quote for ${productChoice} using the customer I'm viewing.`,
        confidence: 0.76,
      }),
      this.buildSuggestion({
        intent: "submit_for_uw",
        title: "Check underwriting queue",
        description: "See which proposals are ready to submit.",
        promptText: "Show me proposals that are ready for underwriting submission and prepare the submit flow.",
        confidence: 0.71,
      }),
    ];
  }
}
