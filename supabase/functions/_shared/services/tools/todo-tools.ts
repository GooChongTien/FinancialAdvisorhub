import { z } from "https://esm.sh/zod@3.25.76";
import type { ToolContext } from "./types.ts";
import { createServiceClient } from "./service-client.ts";
import { executeSafely } from "./error-handling.ts";

const tasksListSchema = z.object({
  advisorId: z.string().optional(),
  status: z.string().optional(),
  limit: z.number().int().min(1).max(50).optional(),
});

async function tasksList(ctx: ToolContext, args: z.infer<typeof tasksListSchema>) {
  const { advisorId, status, limit = 20 } = tasksListSchema.parse(args);

  return executeSafely(
    "todo__tasks.list",
    async () => {
      const client = createServiceClient();
      let query = client.from("tasks").select("*");
      if (advisorId) query = query.eq("advisor_id", advisorId);
      if (status) query = query.eq("status", status);
      const { data, error } = await query.order("date", { ascending: true }).limit(limit);
      if (error) throw error;
      return data;
    },
    args
  );
}

const taskCreateSchema = z.object({
  title: z.string().min(1),
  advisorId: z.string().optional(),
  due: z.string().optional(),
});

async function tasksCreate(ctx: ToolContext, args: z.infer<typeof taskCreateSchema>) {
  const payload = taskCreateSchema.parse(args);

  return executeSafely(
    "todo__tasks.create",
    async () => {
      const client = createServiceClient();
      const { data, error } = await client
        .from("tasks")
        .insert([{ title: payload.title, advisor_id: payload.advisorId ?? null, due: payload.due ?? null }])
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    args
  );
}

const taskUpdateSchema = z.object({
  id: z.string().min(1),
  status: z.string().min(1),
});

async function tasksUpdate(ctx: ToolContext, args: z.infer<typeof taskUpdateSchema>) {
  const { id, status } = taskUpdateSchema.parse(args);

  return executeSafely(
    "todo__tasks.update",
    async () => {
      const client = createServiceClient();
      const { data, error } = await client.from("tasks").update({ status }).eq("id", id).select().maybeSingle();
      if (error) throw error;
      return data;
    },
    args
  );
}

// Export tools for registration in registry.ts
export const todoTools = {
  "todo__tasks.list": { handler: tasksList, schema: tasksListSchema },
  "todo__tasks.create": { handler: tasksCreate, schema: taskCreateSchema },
  "todo__tasks.update": { handler: tasksUpdate, schema: taskUpdateSchema }
};
