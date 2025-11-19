import { z } from "https://esm.sh/zod@3.25.76";
import { toolRegistry } from "./registry.ts";
import type { ToolContext } from "./types.ts";
import { createServiceClient } from "./service-client.ts";
import { executeSafely } from "./error-handling.ts";

const broadcastCreateSchema = z.object({
  title: z.string().min(1),
  message: z.string().min(1),
  audience: z.string().optional(),
});

async function broadcastCreate(ctx: ToolContext, args: z.infer<typeof broadcastCreateSchema>) {
  const parsed = broadcastCreateSchema.parse(args);

  return executeSafely(
    "broadcast__broadcasts.create",
    async () => {
      const client = createServiceClient();
      const { data, error } = await client
        .from("broadcasts")
        .insert([{ title: parsed.title, message: parsed.message, audience: parsed.audience ?? "all", status: "draft" }])
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    args
  );
}

const broadcastListSchema = z.object({
  status: z.string().optional(),
  limit: z.number().int().min(1).max(50).optional(),
});

async function broadcastList(ctx: ToolContext, args: z.infer<typeof broadcastListSchema>) {
  const { status, limit = 20 } = broadcastListSchema.parse(args ?? {});

  return executeSafely(
    "broadcast__broadcasts.list",
    async () => {
      const client = createServiceClient();
      let query = client.from("broadcasts").select("*");
      if (status) query = query.eq("status", status);
      const { data, error } = await query.order("created_at", { ascending: false }).limit(limit);
      if (error) throw error;
      return data;
    },
    args
  );
}

toolRegistry.registerTool("broadcast__broadcasts.create", broadcastCreate, broadcastCreateSchema);
toolRegistry.registerTool("broadcast__broadcasts.list", broadcastList, broadcastListSchema);

const broadcastPublishSchema = z.object({
  id: z.string().min(1),
  publishedAt: z.string().optional(),
});

async function broadcastPublish(ctx: ToolContext, args: z.infer<typeof broadcastPublishSchema>) {
  const { id, publishedAt } = broadcastPublishSchema.parse(args);

  return executeSafely(
    "broadcast__broadcasts.publish",
    async () => {
      const client = createServiceClient();
      const { data, error } = await client
        .from("broadcasts")
        .update({ status: "published", published_at: publishedAt ?? new Date().toISOString() })
        .eq("id", id)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    args
  );
}

toolRegistry.registerTool("broadcast__broadcasts.publish", broadcastPublish, broadcastPublishSchema);
