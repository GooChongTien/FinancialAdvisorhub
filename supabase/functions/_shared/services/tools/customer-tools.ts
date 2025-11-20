import { z } from "https://esm.sh/zod@3.25.76";
import { executeSafely } from "./error-handling.ts";
import { toolRegistry } from "./registry.ts";
import { createServiceClient } from "./service-client.ts";
import type { ToolContext } from "./types.ts";

type LeadFilters = {
  status?: string;
  source?: string;
  startDate?: string;
  endDate?: string;
};

const leadFiltersSchema = z.object({
  status: z.string().optional(),
  source: z.string().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

const leadsListSchema = z.object({
  filters: leadFiltersSchema.optional(),
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().min(0).optional(),
});

async function leadsList(ctx: ToolContext, args: z.infer<typeof leadsListSchema>) {
  const parsed = leadsListSchema.parse(args ?? {});
  const { filters, limit = 20, offset = 0 } = parsed;

  return executeSafely(
    "customer__leads.list",
    async () => {
      const client = createServiceClient();
      let query = client.from("leads").select("*", { count: "exact" });

      if (filters?.status) query = query.eq("status", filters.status);
      if (filters?.source) query = query.eq("source", filters.source);
      if (filters?.startDate) query = query.gte("created_at", filters.startDate);
      if (filters?.endDate) query = query.lte("created_at", filters.endDate);

      const { data, error, count } = await query.range(offset, offset + limit - 1);
      if (error) throw error;

      return {
        rows: data ?? [],
        total: count ?? 0,
      };
    },
    args
  );
}

const leadCreateSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  status: z.string().optional(),
  source: z.string().optional(),
});

async function leadsCreate(ctx: ToolContext, args: z.infer<typeof leadCreateSchema>) {
  const payload = leadCreateSchema.parse(args);

  return executeSafely(
    "customer__leads.create",
    async () => {
      const client = createServiceClient();
      const { data, error } = await client.from("leads").insert([payload]).select().maybeSingle();
      if (error) throw error;

      return {
        data,
        ui_actions: [
          {
            action: "navigate",
            params: { page: "/customer" }
          },
          {
            action: "prefill",
            params: {
              form: "lead_create",
              data: payload
            }
          }
        ]
      };
    },
    args
  );
}

const leadUpdateSchema = z.object({
  id: z.string().min(1),
  updates: z
    .record(z.unknown())
    .refine((value) => Object.keys(value).length > 0, { message: "updates cannot be empty" }),
});

async function leadsUpdate(ctx: ToolContext, args: z.infer<typeof leadUpdateSchema>) {
  const { id, updates } = leadUpdateSchema.parse(args);

  return executeSafely(
    "customer__leads.update",
    async () => {
      const client = createServiceClient();
      const { data, error } = await client.from("leads").update(updates).eq("id", id).select().maybeSingle();
      if (error) throw error;
      return data;
    },
    args
  );
}

const leadSearchSchema = z.object({
  query: z.string().min(2),
  limit: z.number().int().min(1).max(50).optional(),
});

async function leadsSearch(ctx: ToolContext, args: z.infer<typeof leadSearchSchema>) {
  const { query, limit = 10 } = leadSearchSchema.parse(args);

  return executeSafely(
    "customer__leads.search",
    async () => {
      const client = createServiceClient();
      const { data, error } = await client
        .from("leads")
        .select("*")
        .or(`name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`)
        .limit(limit);
      if (error) throw error;
      return data;
    },
    args
  );
}

const customerGetSchema = z.object({
  id: z.string().min(1),
});

async function customerGet(ctx: ToolContext, args: z.infer<typeof customerGetSchema>) {
  const { id } = customerGetSchema.parse(args);

  return executeSafely(
    "customer__customers.get",
    async () => {
      const client = createServiceClient();
      const { data, error } = await client
        .from("customers")
        .select("*,policies(*),proposals(*)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    args
  );
}

toolRegistry.registerTool("customer__leads.list", leadsList, leadsListSchema);
toolRegistry.registerTool("customer__leads.create", leadsCreate, leadCreateSchema);
toolRegistry.registerTool("customer__leads.update", leadsUpdate, leadUpdateSchema);
toolRegistry.registerTool("customer__leads.search", leadsSearch, leadSearchSchema);
toolRegistry.registerTool("customer__customers.get", customerGet, customerGetSchema);
