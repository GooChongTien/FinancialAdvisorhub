import type { AgentTool, ToolExecutionContext } from "../../types.ts";

export interface Lead {
  id: string;
  name: string;
  contact_number: string;
  email?: string;
  status: "new" | "contacted" | "qualified" | "won" | "lost";
  lead_source?: string;
  owner?: string;
}

export interface LeadFilters {
  status?: Lead["status"];
  lead_source?: string;
}

export interface CreateLeadInput {
  name: string;
  contact_number: string;
  email?: string;
  lead_source?: string;
}

export interface UpdateLeadInput {
  status?: Lead["status"];
  owner?: string;
}

export interface Customer {
  id: string;
  name: string;
  policies: number;
  total_premium: number;
}

const mockLeads: Lead[] = [
  { id: "L-1001", name: "Kim Tan", contact_number: "91234567", status: "new", lead_source: "Event" },
  { id: "L-1002", name: "Amanda Lim", contact_number: "92345678", status: "qualified", lead_source: "Referral" },
  { id: "L-1003", name: "Wei Zhang", contact_number: "93456789", status: "contacted", lead_source: "Website" },
];

const mockCustomers: Customer[] = [
  { id: "C-2001", name: "Kim Tan", policies: 2, total_premium: 12500 },
  { id: "C-2002", name: "Amanda Lim", policies: 3, total_premium: 19800 },
];

async function listLeads(filters: LeadFilters = {}): Promise<Lead[]> {
  return mockLeads.filter((lead) => {
    if (filters.status && lead.status !== filters.status) return false;
    if (filters.lead_source && lead.lead_source !== filters.lead_source) return false;
    return true;
  });
}

async function createLead(input: CreateLeadInput): Promise<Lead> {
  const newLead: Lead = {
    id: `L-${Math.floor(Math.random() * 9000) + 1000}`,
    status: "new",
    ...input,
  };
  mockLeads.push(newLead);
  return newLead;
}

async function updateLead(id: string, data: UpdateLeadInput): Promise<Lead> {
  const lead = mockLeads.find((l) => l.id === id);
  if (!lead) throw new Error(`Lead ${id} not found`);
  Object.assign(lead, data);
  return lead;
}

async function searchLead(query: string): Promise<Lead[]> {
  const lower = query.toLowerCase();
  return mockLeads.filter(
    (lead) =>
      lead.name.toLowerCase().includes(lower) ||
      lead.contact_number.includes(query) ||
      (lead.email?.toLowerCase().includes(lower) ?? false),
  );
}

async function getCustomer(id: string): Promise<Customer> {
  const customer = mockCustomers.find((c) => c.id === id) ?? mockCustomers[0];
  return customer;
}

export function getCustomerTools(): AgentTool[] {
  const tools: AgentTool[] = [
    {
      name: "customer__leads.list",
      description: "List leads filtered by status or source",
      handler: async (input: LeadFilters) => listLeads(input),
    },
    {
      name: "customer__leads.create",
      description: "Create a new lead record",
      handler: async (input: CreateLeadInput) => createLead(input),
    },
    {
      name: "customer__leads.update",
      description: "Update an existing lead by id",
      handler: async (input: { id: string } & UpdateLeadInput) => updateLead(input.id, input),
    },
    {
      name: "customer__leads.search",
      description: "Search leads by keyword",
      handler: async (input: { query: string }) => searchLead(input.query),
    },
    {
      name: "customer__customers.get",
      description: "Fetch customer summary",
      handler: async (input: { id: string }, _ctx: ToolExecutionContext) => getCustomer(input.id),
    },
  ];

  return tools;
}
