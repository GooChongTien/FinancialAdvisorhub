import { getSupabaseClients } from "../../backend/api/supabase.ts";
import { jsonResponse, errorResponse } from "../../backend/utils/cors.ts";

const { admin: supabase } = getSupabaseClients("EMAIL_SENDER");

async function sendEmail(to: string, subject: string, body: string) {
  // TODO: integrate with your provider (e.g., Resend / SendGrid / SES)
  console.log([email-sender] ->  | );
  console.log(body);
  await new Promise((resolve) => setTimeout(resolve, 25));
}

async function processQueue(limit = 20) {
  const { data, error } = await supabase
    .from("email_outbox")
    .select("id, to_email, subject, body")
    .eq("status", "queued")
    .order("created_at", { ascending: true })
    .limit(limit);
  if (error) throw error;

  for (const row of data || []) {
    try {
      await sendEmail(row.to_email, row.subject, row.body);
      await supabase
        .from("email_outbox")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", row.id);
    } catch (_err) {
      await supabase
        .from("email_outbox")
        .update({ status: "failed" })
        .eq("id", row.id);
    }
  }

  return { processed: data?.length ?? 0 };
}

export default async function handler(req: Request): Promise<Response> {
  try {
    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      const to = String(body?.to_email || "").trim();
      const subject = String(body?.subject || "").trim();
      const bodyText = String(body?.body || "").trim();
      if (!to || !subject || !bodyText) {
        return jsonResponse({ error: "Missing to_email/subject/body" }, { status: 400 });
      }
      const { error } = await supabase.from("email_outbox").insert([
        {
          to_email: to,
          subject,
          body: bodyText,
          template: body?.template || null,
          status: "queued",
        },
      ]);
      if (error) throw error;
      return jsonResponse({ queued: true });
    }

    const result = await processQueue();
    return jsonResponse(result);
  } catch (e) {
    return errorResponse(String((e as Error)?.message || e));
  }
}

// deno-lint-ignore no-explicit-any
const maybeServe: any = (globalThis as any).Deno?.serve;
if (maybeServe) maybeServe(handler);
