import { createServiceClient } from "../_shared/services/supabase.ts";
import { handleCors, createCorsHeaders } from "../_shared/utils/cors.ts";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;
const OPS_ALLOWED_ROLES = ["ops", "admin"];
const OPS_DASHBOARD_ORIGIN = Deno.env.get("OPS_DASHBOARD_ORIGIN") || "*";

type FilterParams = {
  limit: number;
  offset: number;
  module?: string | null;
  action?: string | null;
  agent?: string | null;
  advisor?: string | null;
  page?: string | null;
  success?: boolean | null;
  search?: string | null;
  start?: string | null;
  end?: string | null;
  correlationId?: string | null;
  entityType?: string | null;
};

function clampLimit(value: string | null): number {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (Number.isFinite(parsed) && parsed > 0) {
    return Math.min(parsed, MAX_LIMIT);
  }
  return DEFAULT_LIMIT;
}

function parseOffset(value: string | null): number {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (Number.isFinite(parsed) && parsed >= 0) {
    return parsed;
  }
  return 0;
}

function parseBoolean(value: string | null): boolean | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (["true", "1", "yes", "success"].includes(normalized)) return true;
  if (["false", "0", "no", "failure", "fail"].includes(normalized)) return false;
  return null;
}

function sanitizeText(value: string | null, max = 120): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

function parseDate(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function parseFilters(url: URL): FilterParams {
  const params = url.searchParams;
  return {
    limit: clampLimit(params.get("limit")),
    offset: parseOffset(params.get("offset")),
    module: sanitizeText(params.get("module")),
    action: sanitizeText(params.get("action")),
    agent: sanitizeText(params.get("agent")),
    advisor: sanitizeText(params.get("advisor")),
    page: sanitizeText(params.get("page"), 160),
    success: parseBoolean(params.get("status") ?? params.get("success")),
    search: sanitizeText(params.get("search"), 160),
    start: parseDate(params.get("start") ?? params.get("since")),
    end: parseDate(params.get("end") ?? params.get("until")),
    correlationId: sanitizeText(params.get("correlation_id"), 160),
    entityType: sanitizeText(params.get("entity_type")),
  };
}

function applyFilters(
  query: ReturnType<ReturnType<typeof createServiceClient>["from"]>,
  filters: FilterParams,
  overrides: Partial<FilterParams> = {},
) {
  const effective = { ...filters, ...overrides };
  if (effective.module) {
    query = query.eq("journey_type", effective.module);
  }
  if (effective.action) {
    query = query.ilike("skill_name", `%${effective.action}%`);
  }
  if (effective.agent) {
    query = query.ilike("agent_name", `%${effective.agent}%`);
  }
  if (effective.advisor) {
    query = query.eq("advisor_id", effective.advisor);
  }
  if (effective.page) {
    query = query.contains("metadata", { page: effective.page });
  }
  if (effective.correlationId) {
    query = query.contains("metadata", { correlation_id: effective.correlationId });
  }
  if (effective.entityType) {
    query = query.contains("metadata", { entity_type: effective.entityType });
  }
  if (typeof effective.success === "boolean") {
    query = query.contains("metadata", { success: effective.success });
  }
  if (effective.start) {
    query = query.gte("created_at", effective.start);
  }
  if (effective.end) {
    query = query.lte("created_at", effective.end);
  }
  if (effective.search) {
    const pattern = `%${effective.search.replace(/[%_]/g, "\\$&")}%`;
    query = query.or(
      [
        `skill_name.ilike.${pattern}`,
        `metadata->>page.ilike.${pattern}`,
        `metadata->>target.ilike.${pattern}`,
        `metadata->>correlation_id.ilike.${pattern}`,
      ].join(","),
      { foreignTable: undefined },
    );
  }
  return query;
}

function normalizeMetadata(metadata: unknown): Record<string, unknown> {
  if (!metadata || typeof metadata !== "object") return {};
  return metadata as Record<string, unknown>;
}

function mapEvent(row: Record<string, any>) {
  const metadata = normalizeMetadata(row.metadata);
  const success =
    typeof metadata.success === "boolean"
      ? metadata.success
      : !(metadata.error_message ?? null);

  return {
    id: row.id,
    created_at: row.created_at,
    advisor_id: row.advisor_id,
    agent_name: row.agent_name,
    skill_name: row.skill_name,
    journey_type: row.journey_type,
    channel: row.channel,
    intent: row.intent,
    actions: Array.isArray(row.actions) ? row.actions : [],
    metadata,
    success,
    page: metadata.page ?? null,
    target: metadata.target ?? null,
    page_data_keys: Array.isArray(metadata.page_data_keys) ? metadata.page_data_keys : [],
    confirm_required: Boolean(metadata.confirm_required),
    correlation_id: metadata.correlation_id ?? null,
    error_message: metadata.error_message ?? null,
    entity_type: metadata.entity_type ?? null,
    entity_id: metadata.entity_id ?? null,
  };
}

async function fetchSummary(filters: FilterParams, client: ReturnType<typeof createServiceClient>) {
  const createBase = () => client.from("mira_events").select("id", { count: "exact", head: true });
  const [successResult, failureResult] = await Promise.all([
    applyFilters(createBase(), filters, { success: true }),
    applyFilters(createBase(), filters, { success: false }),
  ]);
  return {
    success: successResult.count ?? 0,
    failure: failureResult.count ?? 0,
  };
}

class OpsAccessError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function requireOpsAccess(req: Request, supabase: ReturnType<typeof createServiceClient>) {
  const header = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!header?.startsWith("Bearer ")) {
    throw new OpsAccessError("Unauthorized", 401);
  }
  const advisorId = (() => {
    const token = header.slice(7);
    const parts = token.split(".");
    if (parts.length < 2) return null;
    try {
      const payload = JSON.parse(atob(parts[1]));
      return typeof payload?.sub === "string" ? payload.sub : null;
    } catch (_err) {
      return null;
    }
  })();
  if (!advisorId) {
    throw new OpsAccessError("Unauthorized", 401);
  }
  const { data, error } = await supabase.from("profiles").select("role").eq("id", advisorId).maybeSingle();
  if (error) {
    throw new OpsAccessError("Unauthorized", 401);
  }
  const role = typeof data?.role === "string" ? data.role.toLowerCase() : null;
  if (!role || !OPS_ALLOWED_ROLES.includes(role)) {
    throw new OpsAccessError("Forbidden", 403);
  }
  return advisorId;
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin") || "*";
  const corsOrigin = OPS_DASHBOARD_ORIGIN === "*" ? origin : OPS_DASHBOARD_ORIGIN;
  const preflight = handleCors(req, Object.fromEntries(createCorsHeaders(corsOrigin)));
  if (preflight) return preflight;

  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: createCorsHeaders(corsOrigin),
    });
  }

  try {
    const filters = parseFilters(new URL(req.url));
    const supabase = createServiceClient();
    await requireOpsAccess(req, supabase);
    const rangeEnd = filters.offset + filters.limit - 1;

    let query = supabase
      .from("mira_events")
      .select("id, created_at, advisor_id, agent_name, skill_name, journey_type, channel, intent, actions, metadata", {
        count: "exact",
      });

    query = applyFilters(query, filters).order("created_at", { ascending: false }).range(filters.offset, rangeEnd);

    const { data, error, count } = await query;
    if (error) throw error;

    const summary = await fetchSummary(filters, supabase);
    const rows = Array.isArray(data) ? data : [];
    const total = typeof count === "number" ? count : rows.length;
    const pagination = {
      limit: filters.limit,
      offset: filters.offset,
      total,
      hasMore: filters.offset + filters.limit < total,
    };

    return new Response(
      JSON.stringify({
        events: rows.map(mapEvent),
        pagination,
        summary,
      }),
      {
        status: 200,
        headers: createCorsHeaders(corsOrigin),
      },
    );
  } catch (error) {
    if (error instanceof OpsAccessError) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: error.status,
        headers: createCorsHeaders(corsOrigin),
      });
    }
    const message = error instanceof Error ? error.message : "Failed to load telemetry events";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: createCorsHeaders(corsOrigin),
    });
  }
});
