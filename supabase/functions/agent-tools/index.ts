import { handleCors, jsonResponse, errorResponse } from "../_shared/utils/cors.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://esm.sh/zod@3.25.76";
import { toolRegistry } from "../_shared/services/tools/registry.ts";
import type { ToolContext } from "../_shared/services/tools/types.ts";
import "../_shared/services/tools/customer-tools.ts";
import "../_shared/services/tools/new-business-tools.ts";
import "../_shared/services/tools/product-tools.ts";
import "../_shared/services/tools/analytics-tools.ts";
import "../_shared/services/tools/todo-tools.ts";
import "../_shared/services/tools/broadcast-tools.ts";
import "../_shared/services/tools/visualizer-tools.ts";

type KnowledgeLookupArgs = {
  atom_id?: string;
  topic?: string;
  scenario?: string;
  limit?: number;
};

const knowledgeLookupSchema = z.object({
  atom_id: z.string().optional(),
  topic: z.string().optional(),
  scenario: z.string().optional(),
  limit: z.number().int().min(1).max(10).optional(),
});

async function knowledgeLookup(_ctx: ToolContext, args: KnowledgeLookupArgs) {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) throw new Error("Missing Supabase service env");
  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

  const limit = Math.min(Math.max(Number(args.limit ?? 3), 1), 10);
  if (typeof args.atom_id === "string") {
    const { data, error } = await supabase
      .from("knowledge_atoms")
      .select("id,title,content,topic")
      .eq("id", args.atom_id)
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (!data) return { success: true, data: { items: [] } };
    return {
      success: true,
      data: {
        items: [
          {
            atom_id: data.id,
            title: data.title,
            topic: data.topic,
            summary: (data.content ?? "").slice(0, 280),
          },
        ],
      },
    };
  }

  if (typeof args.topic === "string") {
    const { data, error } = await supabase
      .from("knowledge_atoms")
      .select("id,title,content,topic")
      .eq("topic", args.topic)
      .limit(limit);
    if (error) throw error;
    const items = (data ?? []).map((r: any) => ({
      atom_id: r.id,
      title: r.title,
      topic: r.topic,
      summary: (r.content ?? "").slice(0, 280),
    }));
    return { success: true, data: { items } };
  }

  if (typeof args.scenario === "string") {
    const phrase = args.scenario.toLowerCase();
    const { data: trig, error: tErr } = await supabase
      .from("scenario_triggers")
      .select("atom_id, trigger_phrase")
      .ilike("trigger_phrase", `%${phrase}%`)
      .limit(10);
    if (tErr) throw tErr;
    const atomIds = Array.from(new Set((trig ?? []).map((t: any) => t.atom_id))).slice(0, limit);
    if (atomIds.length === 0) return { success: true, data: { items: [] } };
    const { data: atoms, error: aErr } = await supabase
      .from("knowledge_atoms")
      .select("id,title,content,topic")
      .in("id", atomIds);
    if (aErr) throw aErr;
    const items = (atoms ?? []).map((r: any) => ({
      atom_id: r.id,
      title: r.title,
      topic: r.topic,
      summary: (r.content ?? "").slice(0, 280),
    }));
    return { success: true, data: { items } };
  }

  return { success: true, data: { items: [] } };
}

function createUserClientFromRequest(req: Request): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("VITE_SUPABASE_ANON_KEY");
  if (!url || !anon) throw new Error("Missing Supabase anon env");
  const auth = req.headers.get("authorization") || req.headers.get("Authorization");
  const headers: Record<string, string> = {};
  if (auth) headers["Authorization"] = auth;
  return createClient(url, anon, {
    auth: { persistSession: false },
    global: { headers },
  });
}

function toDateParts(input?: string | null): { date: string; time?: string } {
  try {
    if (input && /T/.test(input)) {
      const d = new Date(input);
      if (!isNaN(d.getTime())) {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        const hh = String(d.getHours()).padStart(2, "0");
        const mi = String(d.getMinutes()).padStart(2, "0");
        return { date: `${yyyy}-${mm}-${dd}`, time: `${hh}:${mi}` };
      }
    }
    if (input && /^\d{4}-\d{2}-\d{2}$/.test(String(input))) {
      return { date: String(input) };
    }
  } catch {}
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return { date: `${yyyy}-${mm}-${dd}` };
}

async function insertTaskWithCompatibility(supabase: SupabaseClient, payload: Record<string, unknown>) {
  try {
    const { data, error } = await supabase.from("tasks").insert([payload]).select().maybeSingle();
    if (error) throw error;
    return data ?? null;
  } catch (err) {
    const msg = (err as { message?: string })?.message || "";
    if (/(advisor_id)/i.test(msg)) {
      const clone = { ...payload } as Record<string, unknown>;
      delete clone["advisor_id"];
      const { data, error } = await supabase.from("tasks").insert([clone]).select().maybeSingle();
      if (error) throw error;
      return data ?? null;
    }
    throw err;
  }
}

type CreateTaskArgs = {
  customerId?: string | null;
  title?: string;
  due?: string;
  notes?: string;
};

const createTaskSchema = z.object({
  customerId: z.string().nullable().optional(),
  title: z.string().optional(),
  due: z.string().optional(),
  notes: z.string().optional(),
});

async function createTask(ctx: ToolContext, args: CreateTaskArgs) {
  const client = createUserClientFromRequest(ctx.req);
  const { data: userData } = await client.auth.getUser();
  const uid = userData.user?.id ?? null;
  const { customerId, title, due, notes } = args ?? {};
  const dt = toDateParts(typeof due === "string" ? due : null);
  const row: Record<string, unknown> = {
    title: String(title || "Follow up"),
    type: "Task",
    date: dt.date,
    time: dt.time ?? null,
    linked_lead_id: customerId ?? null,
    notes: typeof notes === "string" ? notes : null,
  };
  if (uid) row["advisor_id"] = uid;
  const created = await insertTaskWithCompatibility(client, row);
  return { success: true, data: { action: "create_task", task: created } };
}

type LogNoteArgs = {
  customerId?: string | null;
  text?: string;
};

const logNoteSchema = z.object({
  customerId: z.string().nullable().optional(),
  text: z.string().optional(),
});

async function logNote(ctx: ToolContext, args: LogNoteArgs) {
  const client = createUserClientFromRequest(ctx.req);
  const { data: userData } = await client.auth.getUser();
  const uid = userData.user?.id ?? null;
  const { customerId, text } = args ?? {};
  const payload = {
    lead_id: customerId ?? null,
    field: "note",
    old_value: null,
    new_value: String(text || ""),
    changed_by: uid,
  } as Record<string, unknown>;
  try {
    const { data, error } = await client.from("lead_edit_history").insert([payload]).select().maybeSingle();
    if (error) throw error;
    return { success: true, data: { action: "log_note", note: data } };
  } catch (_e) {
    const dt = toDateParts(null);
    const row: Record<string, unknown> = {
      title: "Note",
      type: "Task",
      date: dt.date,
      linked_lead_id: customerId ?? null,
      notes: String(text || ""),
    };
    if (uid) row["advisor_id"] = uid;
    const created = await insertTaskWithCompatibility(client, row);
    return { success: true, data: { action: "log_note", task: created } };
  }
}

type UpdateFieldArgs = {
  customerId?: string | null;
  path?: string;
  value?: unknown;
};

const updateFieldSchema = z.object({
  customerId: z.string().nullable().optional(),
  path: z.string().optional(),
  value: z.unknown().optional(),
});

async function updateField(ctx: ToolContext, args: UpdateFieldArgs) {
  const client = createUserClientFromRequest(ctx.req);
  const { data: userData } = await client.auth.getUser();
  const uid = userData.user?.id ?? null;
  const { path, value, customerId } = args ?? {};
  const payload = {
    lead_id: customerId ?? null,
    field: String(path || "unknown"),
    old_value: null,
    new_value: typeof value === "string" ? value : JSON.stringify(value ?? null),
    changed_by: uid,
  } as Record<string, unknown>;
  try {
    const { data, error } = await client.from("lead_edit_history").insert([payload]).select().maybeSingle();
    if (error) throw error;
    return { success: true, data: { action: "update_field", edit: data } };
  } catch (_e) {
    return { success: true, data: { action: "update_field", acknowledged: true } };
  }
}

type PrefillArgs = {
  customerId?: string | null;
  form?: string;
  fields?: Record<string, unknown>;
};

const prefillSchema = z.object({
  customerId: z.string().nullable().optional(),
  form: z.string().optional(),
  fields: z.record(z.unknown()).optional(),
});

async function prefillForm(ctx: ToolContext, args: PrefillArgs) {
  const client = createUserClientFromRequest(ctx.req);
  const { data: userData } = await client.auth.getUser();
  const uid = userData.user?.id ?? null;
  const { form, fields, customerId } = args ?? {};
  const payload = {
    lead_id: customerId ?? null,
    field: `prefill:${String(form || "")}`,
    old_value: null,
    new_value: JSON.stringify(fields ?? {}),
    changed_by: uid,
  } as Record<string, unknown>;
  try {
    const { data, error } = await client.from("lead_edit_history").insert([payload]).select().maybeSingle();
    if (error) throw error;
    return { success: true, data: { action: "prefill_form", edit: data } };
  } catch (_e) {
    return { success: true, data: { action: "prefill_form", acknowledged: true } };
  }
}

type NavigateArgs = {
  route?: string;
  section?: string;
  anchor?: string;
};

const navigateSchema = z.object({
  route: z.string().optional(),
  section: z.string().optional(),
  anchor: z.string().optional(),
});

async function navigate(_ctx: ToolContext, args: NavigateArgs) {
  return {
    success: true,
    data: { action: "navigate", route: args.route, section: args.section, anchor: args.anchor },
  };
}

toolRegistry.registerTool("kb__knowledge_lookup", knowledgeLookup, knowledgeLookupSchema);
toolRegistry.registerTool("ops__navigate", navigate, navigateSchema);
toolRegistry.registerTool("ops__create_task", createTask, createTaskSchema);
toolRegistry.registerTool("ops__log_note", logNote, logNoteSchema);
toolRegistry.registerTool("fna__update_field", updateField, updateFieldSchema);
toolRegistry.registerTool("fna__prefill_form", prefillForm, prefillSchema);

Deno.serve(async (req) => {
  const pre = handleCors(req);
  if (pre) return pre;
  if (req.method !== "POST") return errorResponse("Method not allowed", 405);
  try {
    const body = await req.json();
    const tool = String(body?.tool || "");
    const args = body?.args ?? {};
    const toolResult = await toolRegistry.executeTool(tool, { req, args });
    if (!toolResult.success) {
      const code = toolResult.error?.code ?? "tool_error";
      const status = code === "tool_not_found" ? 404 : code === "validation_error" ? 400 : 500;
      return errorResponse(toolResult.error?.message ?? "Tool execution failed", status);
    }
    return jsonResponse({ ok: true, result: toolResult.data });
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : "Unknown error", 500);
  }
});
