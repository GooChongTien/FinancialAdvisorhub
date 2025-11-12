import { createCorsHeaders } from "../utils/cors.ts";
import { knowledgeLookup } from "../services/knowledge/lookup.ts";

function json(data: unknown, origin: string, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...Object.fromEntries(createCorsHeaders(origin)) },
  });
}

export default async function handleRequest(req: Request): Promise<Response> {
  const origin = req.headers.get("origin") || "*";
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: createCorsHeaders(origin) });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, origin, 405);
  try {
    const body = await req.json();
    const tool = String(body?.tool || "");
    const args = (body?.args && typeof body.args === "object") ? body.args : {};
    if (!tool) return json({ error: "tool is required" }, origin, 400);
    switch (tool) {
      case "kb__knowledge_lookup": {
        const result = await knowledgeLookup(args);
        return json({ ok: true, result }, origin);
      }
      default:
        return json({ error: `Unknown tool: ${tool}` }, origin, 400);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return json({ error: message }, origin, 500);
  }
}

if (import.meta.main) {
  Deno.serve(handleRequest);
}

