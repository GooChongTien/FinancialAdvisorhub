import type { MiraContext, MiraResponse } from "../types.ts";
import { buildAgentResponse } from "./response-builder.ts";
import { SkillAgent, type SuggestedIntent, type ProactiveInsight } from "./base-agent.ts";
import {
  createCRUDFlow,
  createNavigateAction,
  createPrefillAction,
} from "./action-templates.ts";
import { getCustomerTools, type LeadFilters, type CreateLeadInput } from "./tools/customer-tools.ts";

const SYSTEM_PROMPT = `You are a customer management specialist for AdvisorHub.
You help advisors manage leads, update statuses, and quickly drill into customer records.
Always provide a concise acknowledgement and outline the UI steps Mira will take.`;

export class CustomerAgent extends SkillAgent {
  constructor() {
    super("CustomerAgent", "customer", SYSTEM_PROMPT, getCustomerTools());
  }

  async execute(intent: string, context: MiraContext, userMessage: string): Promise<MiraResponse> {
    switch (intent) {
      case "create_lead":
        return this.handleCreateLead(context, userMessage);
      case "list_leads":
        return this.handleListLeads(context);
      case "search_lead":
        return this.handleSearchLead(context, userMessage);
      case "view_lead_detail":
        return this.handleViewLeadDetail(context);
      case "update_lead_status":
        return this.handleUpdateLeadStatus(context);
      default:
        return buildAgentResponse(
          this.id,
          intent,
          context,
          "Let me check the customer workspace for you.",
          [createNavigateAction(context.module, "/customer")],
        );
    }
  }

  private async handleCreateLead(context: MiraContext, userMessage: string): Promise<MiraResponse> {
    const payload: CreateLeadInput = {
      name: (context.pageData?.leadName as string) ?? "New Prospect",
      contact_number: (context.pageData?.contactNumber as string) ?? "00000000",
      lead_source: (context.pageData?.leadSource as string) ?? "Manual Entry",
    };

    await this.invokeTool("leads.create", payload, { context });

    const actions = createCRUDFlow("create", context.module, {
      page: "/customer",
      payload,
      description: "Prepare new lead form with captured details",
    });

    const reply =
      `I'll open the lead form on Customer 360 and prefill the name, contact, and source from your message ` +
      `("${userMessage.slice(0, 80)}"). Once you confirm, I'll submit the record.`;

    return buildAgentResponse(this.id, "create_lead", context, reply, actions, {
      subtopic: "lead_management",
    });
  }

  private async handleListLeads(context: MiraContext): Promise<MiraResponse> {
    const filters: LeadFilters = {
      status: (context.pageData?.status as any) ?? undefined,
      lead_source: (context.pageData?.lead_source as string) ?? undefined,
    };

    await this.invokeTool("leads.list", filters, { context });

    const actions = createCRUDFlow("read", context.module, {
      page: "/customer",
      filters,
    });

    const reply =
      "I'll surface the lead list with the filters you care about. Use the chips on the left to refine by status or source.";

    return buildAgentResponse(this.id, "list_leads", context, reply, actions, {
      subtopic: "lead_management",
    });
  }

  private async handleSearchLead(context: MiraContext, userMessage: string): Promise<MiraResponse> {
    const query =
      (context.pageData?.searchTerm as string) ?? userMessage.match(/(?:find|search)\s+(?<value>.+)$/i)?.groups?.value ?? "";

    await this.invokeTool("leads.search", { query }, { context });

    const actions = [
      createNavigateAction(context.module, "/customer", { search: query }),
      createPrefillAction({ search: query }),
    ];
    const reply = `Searching leads for "${query || "your criteria"}" and showing results in Customer 360.`;
    return buildAgentResponse(this.id, "search_lead", context, reply, actions, {
      subtopic: "lead_management",
    });
  }

  private async handleViewLeadDetail(context: MiraContext): Promise<MiraResponse> {
    const leadId = (context.pageData?.leadId as string) ?? "L-1001";
    await this.invokeTool("customers.get", { id: leadId }, { context });

    const actions = [createNavigateAction(context.module, `/customer/detail/${leadId}`)];
    const reply = `Opening the lead record ${leadId} so you can review notes, tasks, and history.`;
    return buildAgentResponse(this.id, "view_lead_detail", context, reply, actions, {
      subtopic: "lead_detail",
    });
  }

  private async handleUpdateLeadStatus(context: MiraContext): Promise<MiraResponse> {
    const leadId = (context.pageData?.leadId as string) ?? "L-1001";
    const status = (context.pageData?.status as string) ?? "qualified";
    await this.invokeTool("leads.update", { id: leadId, status }, { context });

    const actions = createCRUDFlow("update", context.module, {
      page: `/customer/detail/${leadId}`,
      payload: { status },
      endpoint: `/api/customer/leads/${leadId}`,
      description: "Confirm status change before submitting",
    });

    const reply = `Updating lead ${leadId} to status "${status}". I'll show you the summary first before submitting.`;
    return buildAgentResponse(this.id, "update_lead_status", context, reply, actions, {
      subtopic: "lead_management",
    });
  }

  async generateSuggestions(context: MiraContext): Promise<SuggestedIntent[]> {
    const suggestions: SuggestedIntent[] = [];

    // If on customer detail page, suggest next steps
    if (context.page.includes("/customer/detail")) {
      suggestions.push({
        id: "schedule_followup",
        title: "Schedule Follow-up",
        subtitle: "Book next appointment with this lead",
        promptText: "Schedule a follow-up appointment with this customer",
        icon: "calendar",
        module: "customer",
        priority: "high",
      });

      suggestions.push({
        id: "start_proposal",
        title: "Start New Proposal",
        subtitle: "Begin the sales process",
        promptText: "Create a new proposal for this customer",
        icon: "file-text",
        module: "customer",
        priority: "medium",
      });
    }

    // If on customer list page, suggest common actions
    if (context.page === "/customer" || context.page.includes("/customers")) {
      suggestions.push({
        id: "create_new_lead",
        title: "Add New Lead",
        subtitle: "Capture a new prospect",
        promptText: "Create a new lead",
        icon: "user-plus",
        module: "customer",
        priority: "high",
      });

      suggestions.push({
        id: "view_hot_leads",
        title: "View Hot Leads",
        subtitle: "See recently active prospects",
        promptText: "Show me hot leads from the last 7 days",
        icon: "flame",
        module: "customer",
        priority: "medium",
      });

      suggestions.push({
        id: "filter_qualified_leads",
        title: "Filter Qualified Leads",
        subtitle: "Focus on ready prospects",
        promptText: "Show me qualified leads",
        icon: "filter",
        module: "customer",
        priority: "medium",
      });
    }

    return suggestions;
  }

  async generateInsights(advisorId: string, context?: MiraContext): Promise<ProactiveInsight[]> {
    const insights: ProactiveInsight[] = [];

    // Example: Overdue follow-ups (in real implementation, would query database)
    insights.push({
      id: "overdue_followups",
      type: "alert",
      priority: "important",
      title: "3 overdue follow-ups",
      summary: "You have 3 leads that haven't been contacted in over 7 days",
      ui_actions: [createNavigateAction("customer", "/customer", { status: "contacted", overdue: "true" })],
      tag: "CUSTOMER",
      dismissible: true,
    });

    // Example: Hot leads metric
    insights.push({
      id: "hot_leads_count",
      type: "metric",
      priority: "info",
      title: "5 hot leads this week",
      summary: "New prospects with high engagement scores",
      ui_actions: [createNavigateAction("customer", "/customer", { status: "hot" })],
      tag: "CUSTOMER",
      dismissible: true,
    });

    return insights;
  }
}
