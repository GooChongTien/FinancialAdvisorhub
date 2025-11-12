import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export type AdvisorScope = "personal" | "direct" | "group";

export async function resolveAdvisorIds(
  supabase: SupabaseClient,
  scope: AdvisorScope,
  advisorId: string | null,
): Promise<string[]> {
  if (!advisorId) return [];
  if (scope === "personal") {
    return [advisorId];
  }

  const query = supabase.from("advisor_hierarchy").select("advisor_id, depth").eq("manager_id", advisorId);
  if (scope === "direct") {
    const { data, error } = await query.eq("depth", 1);
    if (error) throw error;
    const ids = (data || []).map((row: any) => String(row.advisor_id));
    return ids.length ? ids : [advisorId];
  }

  const { data, error } = await query.gt("depth", 0);
  if (error) throw error;
  const ids = (data || []).map((row: any) => String(row.advisor_id));
  return ids.length ? ids : [advisorId];
}
