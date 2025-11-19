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
  ...
