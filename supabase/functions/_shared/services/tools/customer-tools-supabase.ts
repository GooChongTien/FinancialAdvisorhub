/**
 * Customer Tools - Supabase Integration
 * Real database operations for leads and customers
 */

import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import {
  ToolRegistry,
  createSuccessResult,
  createErrorResult,
  type ToolContext,
  type ToolResult,
} from "./registry.ts";

// Zod Schemas
const LeadFiltersSchema = z.object({
  status: z.enum(["new", "contacted", "qualified", "won", "lost"]).optional(),
  lead_source: z.string().optional(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
});

const CreateLeadSchema = z.object({
  name: z.string().min(1, "Name is required"),
  contact_number: z.string().min(8, "Contact number must be at least 8 digits"),
  email: z.string().email().optional(),
  lead_source: z.string().optional(),
  notes: z.string().optional(),
});

const UpdateLeadSchema = z.object({
  id: z.string(),
  status: z.enum(["new", "contacted", "qualified", "won", "lost"]).optional(),
  owner: z.string().optional(),
  notes: z.string().optional(),
});

const SearchLeadSchema = z.object({
  query: z.string().min(1, "Search query required"),
  limit: z.number().min(1).max(50).default(20),
});

const GetCustomerSchema = z.object({
  id: z.string(),
});

// Types
export interface Lead {
  id: string;
  name: string;
  contact_number: string;
  email?: string;
  status: "new" | "contacted" | "qualified" | "won" | "lost";
  lead_source?: string;
  owner?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  policies_count?: number;
  total_premium?: number;
  created_at?: string;
}

// Tool Handlers

async function listLeads(
  params: z.infer<typeof LeadFiltersSchema>,
  context?: ToolContext,
): Promise<ToolResult<Lead[]>> {
  try {
    const supabase = context?.supabase as SupabaseClient | undefined;
    if (!supabase) {
      // Fallback to mock data if no Supabase client
      return createSuccessResult([
        {
          id: "L-1001",
          name: "Kim Tan",
          contact_number: "91234567",
          status: "new",
          lead_source: "Event",
        },
        {
          id: "L-1002",
          name: "Amanda Lim",
          contact_number: "92345678",
          status: "qualified",
          lead_source: "Referral",
        },
      ]);
    }

    let query = supabase.from("leads").select("*");

    if (params.status) {
      query = query.eq("status", params.status);
    }
    if (params.lead_source) {
      query = query.eq("lead_source", params.lead_source);
    }

    query = query.range(params.offset, params.offset + params.limit - 1).order("created_at", { ascending: false });

    const { data, error } = await query;

    if (error) {
      return createErrorResult("DATABASE_ERROR", error.message, error);
    }

    return createSuccessResult(data as Lead[]);
  } catch (error) {
    return createErrorResult(
      "EXECUTION_ERROR",
      error instanceof Error ? error.message : "Failed to list leads",
      error,
    );
  }
}

async function createLead(
  params: z.infer<typeof CreateLeadSchema>,
  context?: ToolContext,
): Promise<ToolResult<Lead>> {
  try {
    const supabase = context?.supabase as SupabaseClient | undefined;
    if (!supabase) {
      // Fallback to mock
      return createSuccessResult({
        id: `L-${Math.floor(Math.random() * 9000) + 1000}`,
        status: "new" as const,
        ...params,
      });
    }

    const leadData = {
      ...params,
      status: "new",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from("leads").insert(leadData).select().single();

    if (error) {
      return createErrorResult("DATABASE_ERROR", error.message, error);
    }

    return createSuccessResult(data as Lead);
  } catch (error) {
    return createErrorResult(
      "EXECUTION_ERROR",
      error instanceof Error ? error.message : "Failed to create lead",
      error,
    );
  }
}

async function updateLead(
  params: z.infer<typeof UpdateLeadSchema>,
  context?: ToolContext,
): Promise<ToolResult<Lead>> {
  try {
    const supabase = context?.supabase as SupabaseClient | undefined;
    if (!supabase) {
      // Fallback to mock
      return createSuccessResult({
        id: params.id,
        name: "Mock Lead",
        contact_number: "00000000",
        status: params.status || "new",
      });
    }

    const { id, ...updateData } = params;
    const updatePayload = {
      ...updateData,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from("leads").update(updatePayload).eq("id", id).select().single();

    if (error) {
      return createErrorResult("DATABASE_ERROR", error.message, error);
    }

    if (!data) {
      return createErrorResult("NOT_FOUND", `Lead ${id} not found`);
    }

    return createSuccessResult(data as Lead);
  } catch (error) {
    return createErrorResult(
      "EXECUTION_ERROR",
      error instanceof Error ? error.message : "Failed to update lead",
      error,
    );
  }
}

async function searchLeads(
  params: z.infer<typeof SearchLeadSchema>,
  context?: ToolContext,
): Promise<ToolResult<Lead[]>> {
  try {
    const supabase = context?.supabase as SupabaseClient | undefined;
    if (!supabase) {
      // Fallback to mock search
      return createSuccessResult([
        {
          id: "L-1001",
          name: "Kim Tan",
          contact_number: "91234567",
          status: "new",
          lead_source: "Event",
        },
      ]);
    }

    const { query, limit } = params;

    // Use Postgres full-text search
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .or(`name.ilike.%${query}%,contact_number.ilike.%${query}%,email.ilike.%${query}%`)
      .limit(limit);

    if (error) {
      return createErrorResult("DATABASE_ERROR", error.message, error);
    }

    return createSuccessResult(data as Lead[]);
  } catch (error) {
    return createErrorResult(
      "EXECUTION_ERROR",
      error instanceof Error ? error.message : "Failed to search leads",
      error,
    );
  }
}

async function getCustomer(
  params: z.infer<typeof GetCustomerSchema>,
  context?: ToolContext,
): Promise<ToolResult<Customer>> {
  try {
    const supabase = context?.supabase as SupabaseClient | undefined;
    if (!supabase) {
      // Fallback to mock
      return createSuccessResult({
        id: params.id,
        name: "Mock Customer",
        policies_count: 2,
        total_premium: 12500,
      });
    }

    const { data, error } = await supabase.from("customers").select("*").eq("id", params.id).single();

    if (error) {
      return createErrorResult("DATABASE_ERROR", error.message, error);
    }

    if (!data) {
      return createErrorResult("NOT_FOUND", `Customer ${params.id} not found`);
    }

    return createSuccessResult(data as Customer);
  } catch (error) {
    return createErrorResult(
      "EXECUTION_ERROR",
      error instanceof Error ? error.message : "Failed to get customer",
      error,
    );
  }
}

/**
 * Register all customer tools
 */
export function registerCustomerTools(registry: ToolRegistry): void {
  registry.registerTool({
    name: "leads.list",
    description: "List leads filtered by status, source, with pagination",
    schema: LeadFiltersSchema,
    handler: listLeads,
    module: "customer",
  });

  registry.registerTool({
    name: "leads.create",
    description: "Create a new lead record",
    schema: CreateLeadSchema,
    handler: createLead,
    module: "customer",
    requiresAuth: true,
  });

  registry.registerTool({
    name: "leads.update",
    description: "Update an existing lead",
    schema: UpdateLeadSchema,
    handler: updateLead,
    module: "customer",
    requiresAuth: true,
  });

  registry.registerTool({
    name: "leads.search",
    description: "Search leads by name, phone, or email",
    schema: SearchLeadSchema,
    handler: searchLeads,
    module: "customer",
  });

  registry.registerTool({
    name: "customers.get",
    description: "Get customer details by ID",
    schema: GetCustomerSchema,
    handler: getCustomer,
    module: "customer",
  });
}
