import { createServiceClient } from "../supabase.ts";

export interface KnowledgeLookupQuery {
  atom_id?: string;
  topic?: string;
  scenario?: string;
  limit?: number;
}

export interface KnowledgeAtomRecord {
  id: string;
  title: string | null;
  content: string;
  topic: string | null;
}

export interface KnowledgeLookupResultItem {
  atom_id: string;
  title: string | null;
  topic: string | null;
  summary: string;
}

export interface KnowledgeLookupResult {
  items: KnowledgeLookupResultItem[];
}

function summarize(content: string, max = 280) {
  const s = content.replace(/\r/g, "").replace(/\n+/g, " \u00B6 ").trim();
  return s.length > max ? s.slice(0, max - 3) + "..." : s;
}

export async function knowledgeLookup(query: KnowledgeLookupQuery): Promise<KnowledgeLookupResult> {
  const supabase = createServiceClient();
  const limit = Math.min(Math.max(query.limit ?? 3, 1), 10);

  if (query.atom_id) {
    const { data, error } = await supabase
      .from("knowledge_atoms")
      .select("id,title,content,topic")
      .eq("id", query.atom_id)
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (!data) return { items: [] };
    return { items: [{ atom_id: data.id, title: data.title, topic: data.topic, summary: summarize(data.content) }] };
  }

  if (query.topic) {
    const { data, error } = await supabase
      .from("knowledge_atoms")
      .select("id,title,content,topic")
      .eq("topic", query.topic)
      .limit(limit);
    if (error) throw error;
    const items = (data ?? []).map((row: KnowledgeAtomRecord) => ({
      atom_id: row.id,
      title: row.title,
      topic: row.topic,
      summary: summarize(row.content),
    }));
    return { items };
  }

  if (query.scenario) {
    const phrase = String(query.scenario).toLowerCase();
    const { data: trig, error: tErr } = await supabase
      .from("scenario_triggers")
      .select("atom_id, trigger_phrase")
      .ilike("trigger_phrase", `%${phrase}%`)
      .limit(10);
    if (tErr) throw tErr;
    const atomIds = Array.from(new Set((trig ?? []).map((t: any) => t.atom_id))).slice(0, limit);
    if (atomIds.length === 0) return { items: [] };
    const { data: atoms, error: aErr } = await supabase
      .from("knowledge_atoms")
      .select("id,title,content,topic")
      .in("id", atomIds);
    if (aErr) throw aErr;
    const items = (atoms ?? []).map((row: KnowledgeAtomRecord) => ({
      atom_id: row.id,
      title: row.title,
      topic: row.topic,
      summary: summarize(row.content),
    }));
    return { items };
  }

  return { items: [] };
}

export default { knowledgeLookup };

