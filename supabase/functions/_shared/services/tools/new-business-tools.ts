import { z } from "https://esm.sh/zod@3.25.76";
import { toolRegistry } from "./registry.ts";
import type { ToolContext } from "./types.ts";
import { createServiceClient } from "./service-client.ts";
import { executeSafely } from "./error-handling.ts";

const proposalFiltersSchema = z.object({
  status: z.string().optional(),
  advisorId: z.string().optional(),
  updatedAfter: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

async function proposalsList(ctx: ToolContext, args: z.infer<typeof proposalFiltersSchema>) {
  const parsed = proposalFiltersSchema.parse(args ?? {});

  return executeSafely(
    "new_business__proposals.list",
    async () => {
      const client = createServiceClient();
      let query = client.from("proposals").select("*", { count: "exact" });
      if (parsed.status) query = query.eq("status", parsed.status);
      if (parsed.advisorId) query = query.eq("advisor_id", parsed.advisorId);
      if (parsed.updatedAfter) query = query.gte("updated_at", parsed.updatedAfter);
      const { data, error, count } = await query.order("updated_at", { ascending: false }).limit(50);
      if (error) throw error;
      return { rows: data ?? [], total: count ?? 0 };
    },
    args
  );
}

const proposalCreateSchema = z.object({
  customerId: z.string().min(1),
  productId: z.string().min(1),
  advisorId: z.string().min(1),
  price: z.number().min(0),
});

async function proposalsCreate(ctx: ToolContext, args: z.infer<typeof proposalCreateSchema>) {
  return executeSafely(
    "new_business__proposals.create",
    async () => {
      const client = createServiceClient();
      const { data, error } = await client
        .from("proposals")
        .insert([{ ...args, status: "draft" }])
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    args
  );
}

const proposalGetSchema = z.object({
  id: z.string().min(1),
});

async function proposalsGet(ctx: ToolContext, args: z.infer<typeof proposalGetSchema>) {
  return executeSafely(
    "new_business__proposals.get",
    async () => {
      const client = createServiceClient();
      const { data, error } = await client.from("proposals").select("*").eq("id", args.id).maybeSingle();
      if (error) throw error;
      return data;
    },
    args
  );
}

const quoteSchema = z.object({
  productId: z.string().min(1),
  customerId: z.string().min(1),
});

async function quotesGenerate(ctx: ToolContext, args: z.infer<typeof quoteSchema>) {
  const { productId, customerId } = args;

  return executeSafely(
    "new_business__quotes.generate",
    async () => {
      const client = createServiceClient();
      const { data: product, error: productErr } = await client.from("products").select("id,base_rate").eq("id", productId).maybeSingle();
      if (productErr) throw productErr;
      if (!product) throw new Error("Product not found");
      const { data: customer, error: customerErr } = await client.from("customers").select("id,risk_score").eq("id", customerId).maybeSingle();
      if (customerErr) throw customerErr;
      const multiplier = customer?.risk_score ? 1 + Math.min(customer.risk_score / 100, 0.5) : 1;
      const premium = Number(product.base_rate ?? 100) * multiplier;
      return { premium, productId, customerId };
    },
    args
  );
}

const underwritingSubmitSchema = z.object({
  proposalId: z.string().min(1),
});

async function underwritingSubmit(ctx: ToolContext, args: z.infer<typeof underwritingSubmitSchema>) {
  return executeSafely(
    "new_business__underwriting.submit",
    async () => {
      const client = createServiceClient();
      const { data, error } = await client
        .from("proposals")
        .update({ status: "submitted_to_uw" })
        .eq("id", args.proposalId)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    args
  );
}

const underwritingStatusSchema = z.object({
  proposalId: z.string().min(1),
});

async function underwritingCheckStatus(ctx: ToolContext, args: z.infer<typeof underwritingStatusSchema>) {
  return executeSafely(
    "new_business__underwriting.checkStatus",
    async () => {
      const client = createServiceClient();
      const { data, error } = await client
        .from("underwriting_requests")
        .select("*")
        .eq("proposal_id", args.proposalId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    args
  );
}

toolRegistry.registerTool("new_business__proposals.list", proposalsList, proposalFiltersSchema);
toolRegistry.registerTool("new_business__proposals.create", proposalsCreate, proposalCreateSchema);
toolRegistry.registerTool("new_business__proposals.get", proposalsGet, proposalGetSchema);
toolRegistry.registerTool("new_business__quotes.generate", quotesGenerate, quoteSchema);
toolRegistry.registerTool("new_business__underwriting.submit", underwritingSubmit, underwritingSubmitSchema);
toolRegistry.registerTool("new_business__underwriting.checkStatus", underwritingCheckStatus, underwritingStatusSchema);
