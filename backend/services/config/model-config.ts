interface TenantModelConfigRow {
  tenant_id: string;
  provider: string;
  model: string;
  priority?: number | null;
  temperature?: number | null;
  max_tokens?: number | null;
  max_retries?: number | null;
  timeout_ms?: number | null;
  metadata?: Record<string, unknown> | null;
  updated_at?: string | null;
}

export interface TenantModelConfig {
  tenantId: string;
  provider: string;
  model: string;
  priority: number;
  temperature?: number;
  maxTokens?: number;
  maxRetries?: number;
  timeoutMs?: number;
  metadata: Record<string, unknown>;
  updatedAt?: string;
}

const TABLE_NAME = "mira_model_configs";
const denoEnv = typeof Deno !== "undefined" ? Deno.env : undefined;
const CACHE_TTL_MS = Number(denoEnv?.get("MODEL_CONFIG_CACHE_TTL_MS") ?? 60_000);

interface CacheEntry {
  expiresAt: number;
  value: TenantModelConfig | null;
}

const cache = new Map<string, CacheEntry>();
let cachedClient: unknown = null;
let supabaseModulePromise: Promise<typeof import("../../api/supabase.ts")> | null = null;
let testFetcher: ((tenantId: string) => Promise<TenantModelConfig | null>) | null = null;

async function loadSupabaseFactory() {
  if (typeof Deno === "undefined") {
    return null;
  }
  if (!supabaseModulePromise) {
    supabaseModulePromise = import("../../api/supabase.ts");
  }
  try {
    return await supabaseModulePromise;
  } catch (error) {
    supabaseModulePromise = null;
    console.warn("[ModelConfig] Unable to import Supabase helper", error);
    return null;
  }
}

async function getServiceClient() {
  if (testFetcher) {
    return null;
  }
  if (cachedClient) {
    return cachedClient as ReturnType<typeof import("../../api/supabase.ts")["createServiceClient"]>;
  }
  const factoryModule = await loadSupabaseFactory();
  if (!factoryModule) return null;
  try {
    cachedClient = factoryModule.createServiceClient();
    return cachedClient;
  } catch (error) {
    console.warn("[ModelConfig] Unable to create Supabase client", error);
    cachedClient = null;
    return null;
  }
}

export function mapTenantModelConfig(row: TenantModelConfigRow): TenantModelConfig {
  return {
    tenantId: row.tenant_id,
    provider: row.provider,
    model: row.model,
    priority: row.priority ?? 0,
    temperature: typeof row.temperature === "number" ? row.temperature : undefined,
    maxTokens: typeof row.max_tokens === "number" ? row.max_tokens : undefined,
    maxRetries: typeof row.max_retries === "number" ? row.max_retries : undefined,
    timeoutMs: typeof row.timeout_ms === "number" ? row.timeout_ms : undefined,
    metadata: row.metadata ?? {},
    updatedAt: row.updated_at ?? undefined,
  };
}

async function queryTenantModelConfig(tenantId: string): Promise<TenantModelConfig | null> {
  if (testFetcher) {
    return testFetcher(tenantId);
  }
  const client = await getServiceClient();
  if (!client) return null;
  const { data, error } = await client
    .from(TABLE_NAME)
    .select(
      "tenant_id, provider, model, priority, temperature, max_tokens, max_retries, timeout_ms, metadata, updated_at"
    )
    .eq("tenant_id", tenantId)
    .order("priority", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn("[ModelConfig] Failed to load config", error);
    return null;
  }
  return data ? mapTenantModelConfig(data as TenantModelConfigRow) : null;
}

export interface FetchOptions {
  useCache?: boolean;
}

export async function fetchTenantModelConfig(
  tenantId: string,
  options: FetchOptions = {}
): Promise<TenantModelConfig | null> {
  if (!tenantId) {
    return null;
  }
  const now = Date.now();

  if (options.useCache !== false) {
    const entry = cache.get(tenantId);
    if (entry && entry.expiresAt > now) {
      return entry.value;
    }
  }

  const value = await queryTenantModelConfig(tenantId);
  cache.set(tenantId, { value, expiresAt: now + CACHE_TTL_MS });
  return value;
}

export function invalidateTenantModelConfigCache(tenantId?: string) {
  if (!tenantId) {
    cache.clear();
    return;
  }
  cache.delete(tenantId);
}

export function __setModelConfigFetcherForTests(
  fetcher: ((tenantId: string) => Promise<TenantModelConfig | null>) | null
) {
  testFetcher = fetcher;
  invalidateTenantModelConfigCache();
}
