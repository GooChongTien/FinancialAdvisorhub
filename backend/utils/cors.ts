export const DEFAULT_CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "OPTIONS, POST, GET",
};

export function createCorsHeaders(origin?: string): Headers {
  const headers = new Headers(DEFAULT_CORS_HEADERS);
  if (origin && origin !== "null") {
    headers.set("Access-Control-Allow-Origin", origin);
  }
  return headers;
}

export function handleCors(req: Request, headers: Record<string, string> = DEFAULT_CORS_HEADERS): Response | null {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers });
  }
  return null;
}

export function jsonResponse(data: unknown, init: ResponseInit = {}): Response {
  const headers = { "Content-Type": "application/json", ...DEFAULT_CORS_HEADERS, ...(init.headers ?? {}) };
  return new Response(JSON.stringify(data), { status: init.status ?? 200, headers });
}

export function errorResponse(message: string, status = 500, details?: unknown): Response {
  return jsonResponse({ error: message, details }, { status });
}
