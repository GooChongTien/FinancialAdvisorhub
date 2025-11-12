import { getSupabaseClients } from "../../backend/api/supabase.ts";
import { errorResponse, jsonResponse } from "../../backend/utils/cors.ts";

export default async function handler(req: Request) {
  try {
    if (req.method !== "POST") {
      return jsonResponse({ error: "POST required" }, { status: 405 });
    }

    const body = await req.json().catch(() => ({}));
    const email = String(body?.email || "").trim();
    const password = String(body?.password || "").trim();
    if (!email || !password) {
      return jsonResponse({ error: "Missing email/password" }, { status: 400 });
    }

    const { admin } = getSupabaseClients("CREATE_ADVISOR");
    const result = await admin.auth.admin.createUser({ email, password, email_confirm: true });
    if (result.error) throw result.error;

    return jsonResponse({ id: result.data.user?.id, email: result.data.user?.email });
  } catch (e) {
    return errorResponse(String((e as Error)?.message || e));
  }
}

// deno-lint-ignore no-explicit-any
const maybeServe: any = (globalThis as any).Deno?.serve;
if (maybeServe) maybeServe(handler);
