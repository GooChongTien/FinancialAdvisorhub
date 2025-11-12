import { handleCors, jsonResponse, errorResponse } from "../_shared/utils/cors.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// Minimal local knowledge lookup using service key
async function knowledgeLookup(args: Record<string, unknown>) {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) throw new Error("Missing Supabase service env");
  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

  const limit = Math.min(Math.max(Number(args.limit ?? 3), 1), 10);
  if (typeof args.atom_id === "string") {
    const { data, error } = await supabase.from("knowledge_atoms").select("id,title,content,topic").eq("id", args.atom_id).limit(1).maybeSingle();
    if (error) throw error;
    if (!data) return { items: [] };
    return { items: [{ atom_id: data.id, title: data.title, topic: data.topic, summary: (data.content ?? "").slice(0, 280) }] };
  }

  if (typeof args.topic === "string") {
    const { data, error } = await supabase.from("knowledge_atoms").select("id,title,content,topic").eq("topic", args.topic).limit(limit);
    if (error) throw error;
    const items = (data ?? []).map((r: any) => ({ atom_id: r.id, title: r.title, topic: r.topic, summary: (r.content ?? "").slice(0, 280) }));
    return { items };
  }

  if (typeof args.scenario === "string") {
    const phrase = args.scenario.toLowerCase();
    const { data: trig, error: tErr } = await supabase.from("scenario_triggers").select("atom_id, trigger_phrase").ilike("trigger_phrase", `%${phrase}%`).limit(10);
    if (tErr) throw tErr;
    const atomIds = Array.from(new Set((trig ?? []).map((t: any) => t.atom_id))).slice(0, limit);
    if (atomIds.length === 0) return { items: [] };
    const { data: atoms, error: aErr } = await supabase.from("knowledge_atoms").select("id,title,content,topic").in("id", atomIds);
    if (aErr) throw aErr;
    const items = (atoms ?? []).map((r: any) => ({ atom_id: r.id, title: r.title, topic: r.topic, summary: (r.content ?? "").slice(0, 280) }));
    return { items };
  }
  return { items: [] };
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
  // First attempt: include advisor_id when available
  try {
    const { data, error } = await supabase.from("tasks").insert([payload]).select().maybeSingle();
    if (error) throw error;
    return data ?? null;
  } catch (err) {
    const msg = (err as { message?: string })?.message || "";
    if (/(advisor_id)/i.test(msg)) {
      // Retry without advisor_id if schema doesn't have it
      const clone = { ...payload } as Record<string, unknown>;
      delete clone["advisor_id"];
      const { data, error } = await supabase.from("tasks").insert([clone]).select().maybeSingle();
      if (error) throw error;
      return data ?? null;
    }
    throw err;
  }
}

async function createTask(req: Request, args: any) {
  const client = createUserClientFromRequest(req);
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
  return { ok: true, result: { action: "create_task", task: created } };
}

async function logNote(req: Request, args: any) {
  const client = createUserClientFromRequest(req);
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
  // Try lead_edit_history; fallback to a task if the table is absent
  try {
    const { data, error } = await client.from("lead_edit_history").insert([payload]).select().maybeSingle();
    if (error) throw error;
    return { ok: true, result: { action: "log_note", note: data } };
  } catch (_e) {
    // Fallback: create a Task with notes
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
    return { ok: true, result: { action: "log_note", task: created } };
  }
}

async function updateField(req: Request, args: any) {
  const client = createUserClientFromRequest(req);
  const { data: userData } = await client.auth.getUser();
  const uid = userData.user?.id ?? null;
  const { path, value, customerId } = args ?? {};
  // Audit trail only for now; business-specific mapping can be added later
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
    return { ok: true, result: { action: "update_field", edit: data } };
  } catch (_e) {
    return { ok: true, result: { action: "update_field", acknowledged: true } };
  }
}

async function prefillForm(req: Request, args: any) {
  const client = createUserClientFromRequest(req);
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
    return { ok: true, result: { action: "prefill_form", edit: data } };
  } catch (_e) {
    return { ok: true, result: { action: "prefill_form", acknowledged: true } };
  }
}

Deno.serve(async (req) => {
  const pre = handleCors(req);
  if (pre) return pre;
  if (req.method !== "POST") return errorResponse("Method not allowed", 405);
  try {
    const body = await req.json();
    const tool = String(body?.tool || "");
    const args = (body?.args && typeof body.args === "object") ? body.args : {};
    switch (tool) {
      case "kb__knowledge_lookup": {
        const result = await knowledgeLookup(args);
        return jsonResponse({ ok: true, result });
      }
      case "ops__navigate": {
        const { route, section, anchor } = args as any;
        return jsonResponse({ ok: true, result: { action: "navigate", route, section, anchor } });
      }
      case "ops__create_task": {
        return jsonResponse(await createTask(req, args));
      }
      case "ops__log_note": {
        return jsonResponse(await logNote(req, args));
      }
      case "fna__update_field": {
        return jsonResponse(await updateField(req, args));
      }
      case "fna__prefill_form": {
        return jsonResponse(await prefillForm(req, args));
      }
      default:
        return errorResponse("Unknown tool", 400);
    }
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : "Unknown error", 500);
  }
});
