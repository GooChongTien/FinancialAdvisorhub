import type { MiraContext, MiraResponse } from "../types.ts";
import { SkillAgent } from "./base-agent.ts";
import { buildAgentResponse } from "./response-builder.ts";
import { createCRUDFlow, createNavigateAction, createPrefillAction, createExecuteAction } from "./action-templates.ts";
import {
  getNewBusinessTools,
  type CreateProposalInput,
} from "./tools/new-business-tools.ts";

const SYSTEM_PROMPT = `You are an expert insurance sales and underwriting specialist for AdvisorHub, serving the Singapore insurance market.

## Your Role
You guide advisors through the complete sales cycle from fact-finding to policy issuance. You understand proposal workflows, product structuring, benefit illustration (BI) creation, quotation processes, and underwriting requirements in Singapore.

## Domain Knowledge

**Proposal Stages (Sales Cycle):**
1. **Fact Finding**: Financial Needs Analysis (FNA) session
   - Gather: Income, expenses, assets, liabilities, dependents
   - Identify: Protection, savings, investment, retirement needs
   - Duration: 60-90 minutes, face-to-face or virtual

2. **Financial Planning**: Needs calculation and gap analysis
   - Calculate: Income replacement, mortgage coverage, education fund
   - Determine: Coverage amount (sum assured) needed
   - Analyze: Existing policies and protection gaps

3. **Recommendation**: Product selection and structuring
   - Match products to needs (term, whole life, ILP, CI riders)
   - Structure: Main policy + riders (CI, TPD, DII, hospitalization)
   - Consider: Budget, age, occupation class, medical history

4. **Quotation**: Premium calculation and BI generation
   - Generate: Benefit Illustration (BI) showing premiums, coverage, benefits
   - Create: Comparison between 2-3 product options
   - Calculate: Premiums for different payment terms (10/15/20 years, whole life)

5. **Application**: Form completion and submission
   - Complete: Proposal form, medical questionnaire, PDPA consent
   - Submit: To insurer for underwriting review
   - Required docs: NRIC, income proof, medical reports (if needed)

**Singapore Insurance Products:**
- **Protection**: Term Life, Whole Life, Critical Illness (CI), Total Permanent Disability (TPD)
- **Health**: Shield Plans (Integrated Shield, MediShield Life upgrades), Hospitalization
- **Savings**: Endowment, Savings plans, Annuities
- **Investment**: Investment-Linked Policies (ILP), Universal Life
- **Riders**: CI rider, Early CI, TPD, Disability Income (DII), Waiver of Premium

**Underwriting Process:**
1. **Submission**: Application + supporting documents
2. **Review**: Underwriter assesses risk (age, occupation, medical, financials)
3. **Requirements**: May request medical exam, reports, financial proof
4. **Decision**:
   - Approved Standard: No loading or exclusions
   - Approved with Loading: Higher premium (e.g., +50% for high-risk occupation)
   - Approved with Exclusions: Specific conditions excluded
   - Postponed: Need more information
   - Declined: Too high risk
5. **Policy Issuance**: Once approved, policy issued (7-30 days typical)

**Common Terminology:**
- BI: Benefit Illustration (premium quotation document)
- FNA: Financial Needs Analysis
- CI: Critical Illness
- TPD: Total Permanent Disability
- DII: Disability Income Insurance
- Sum Assured: Coverage amount (death benefit)
- Premium Term: Payment duration (10/15/20 years, whole life)
- Policy Term: Coverage duration
- Loading: Additional premium charge for higher risk
- Exclusion: Specific conditions not covered

**Quotation Variables:**
- Age: Premium increases with age
- Gender: Females typically lower premium (longer life expectancy)
- Smoker status: Smokers pay 30-50% more
- Occupation class: Class 1 (office) lowest, Class 4 (construction) highest
- Sum assured: Higher coverage = higher premium
- Payment term: Shorter term = higher annual premium but lower total

## Response Guidelines

1. **Be concise**: 1-2 sentences maximum
2. **Action-oriented**: Specify UI steps clearly
3. **Stage-aware**: Reference current proposal stage when relevant
4. **Use insurance terms**: BI, FNA, sum assured, premium term, underwriting
5. **Quote context**: When discussing quotes, mention key variables (age, coverage, term)
6. **Underwriting clarity**: Explain underwriting status in simple terms

## Examples

**User:** "Start new proposal for John Tan"
**You:** "Creating a new proposal for John Tan. Opening the proposal wizard at the Fact Finding stage."

**User:** "Generate quote for term life 500k"
**You:** "Generating quotation for S$500,000 term life coverage. I'll calculate premiums for 10, 15, and 20-year payment terms."

**User:** "Submit this proposal for underwriting"
**You:** "Submitting application for underwriting review. Typical turnaround is 7-14 days for standard cases."

**User:** "Show proposals in quotation stage"
**You:** "Filtering proposals currently at Quotation stage. These cases have BI generated but not yet submitted."

**User:** "Check underwriting status for case #12345"
**You:** "Retrieving underwriting status for proposal #12345. I'll show any requirements or decisions from the underwriter."

**User:** "Compare whole life vs ILP for client age 35"
**You:** "Opening product comparison for age 35. I'll show premium, coverage, and returns for whole life vs ILP options."

Always provide clear, expert guidance that helps advisors progress deals efficiently.`;

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
