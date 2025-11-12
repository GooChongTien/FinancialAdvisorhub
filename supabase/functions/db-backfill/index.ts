import { getSupabaseClients } from "../../backend/api/supabase.ts";
import { jsonResponse, errorResponse } from "../../backend/utils/cors.ts";

const { admin: supabase } = getSupabaseClients("DB_BACKFILL");

async function getAdvisorIds() {
  let uuidId: string | undefined;
  try {
    const list = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
    uuidId = list?.data?.users?.[0]?.id ? String(list.data.users[0].id) : undefined;
  } catch (_err) {}

  let textId: string | undefined;
  try {
    const { data } = await supabase
      .from("profiles")
      .select("id, created_at")
      .order("created_at", { ascending: true })
      .limit(1);
    textId = (data || [])[0]?.id ? String((data || [])[0].id) : undefined;
  } catch (_err) {}

  return { uuidId, textId };
}

async function backfill(table: string, advisorId: string) {
  const { error } = await supabase
    .from(table)
    .update({ advisor_id: advisorId })
    .is("advisor_id", null);
  if (error) throw new Error(${table}: );
}

export default async function handler(_req: Request) {
  try {
    const ids = await getAdvisorIds();
    if (!ids.uuidId && !ids.textId) {
      throw new Error("No advisor profile found to backfill");
    }

    const results: Record<string, string> = {};
    if (ids.uuidId) {
      for (const table of ["leads", "tasks", "proposals", "policies", "broadcasts"]) {
        await backfill(table, ids.uuidId);
        results[table] = "updated";
      }
    }

    if (ids.textId) {
      await backfill("service_requests", ids.textId);
      results["service_requests"] = "updated";
    }

    return jsonResponse({ ok: true, advisor_uuid: ids.uuidId ?? null, advisor_text: ids.textId ?? null, results });
  } catch (e) {
    return errorResponse(String((e as Error)?.message || e));
  }
}

// deno-lint-ignore no-explicit-any
const maybeServe: any = (globalThis as any).Deno?.serve;
if (maybeServe) maybeServe(handler);
