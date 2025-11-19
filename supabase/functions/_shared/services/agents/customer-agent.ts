import type { MiraContext, MiraResponse } from "../types.ts";
import { buildAgentResponse } from "./response-builder.ts";
import { SkillAgent } from "./base-agent.ts";
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

    await this.invokeTool("customer__leads.create", payload, { context });

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

    await this.invokeTool("customer__leads.list", filters, { context });

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

    await this.invokeTool("customer__leads.search", { query }, { context });

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
    await this.invokeTool("customer__customers.get", { id: leadId }, { context });

    const actions = [createNavigateAction(context.module, `/customer/detail/${leadId}`)];
    const reply = `Opening the lead record ${leadId} so you can review notes, tasks, and history.`;
    return buildAgentResponse(this.id, "view_lead_detail", context, reply, actions, {
      subtopic: "lead_detail",
    });
  }

  private async handleUpdateLeadStatus(context: MiraContext): Promise<MiraResponse> {
    const leadId = (context.pageData?.leadId as string) ?? "L-1001";
    const status = (context.pageData?.status as string) ?? "qualified";
    await this.invokeTool("customer__leads.update", { id: leadId, status }, { context });

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

  async generateSuggestions(context: MiraContext) {
    const leadName =
      typeof context.pageData?.leadName === "string" && context.pageData.leadName.trim()
        ? context.pageData.leadName.trim()
        : "a new prospect";
    const warmFilter =
      typeof context.pageData?.status === "string" && context.pageData.status.trim()
        ? context.pageData.status.trim()
        : "warm";
    const overdueStatus =
      typeof context.pageData?.followUpStatus === "string" && context.pageData.followUpStatus.trim()
        ? context.pageData.followUpStatus.trim()
        : "overdue";

    return [
      this.buildSuggestion({
        intent: "create_lead",
        title: "Capture a new lead",
        description: `Prefill Customer 360 with ${leadName}.`,
        promptText: `Create a new lead for ${leadName} and fill any missing phone or source details you can infer.`,
        confidence: 0.86,
      }),
      this.buildSuggestion({
        intent: "list_leads",
        title: `Review ${warmFilter} leads`,
        description: "Surface the filtered list so I can triage quickly.",
        promptText: `Show me my ${warmFilter} leads in Customer 360 and highlight ones without recent activity.`,
        confidence: 0.74,
      }),
      this.buildSuggestion({
        intent: "update_lead_status",
        title: `Nudge ${overdueStatus} follow-ups`,
        description: "Open the detail view so I can update statuses.",
        promptText: `Open the lead detail for my ${overdueStatus} follow-ups and prepare the status dropdown so I can update them.`,
        confidence: 0.71,
      }),
    ];
  }
}
