import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  __setModelConfigFetcherForTests,
  fetchTenantModelConfig,
  invalidateTenantModelConfigCache,
  mapTenantModelConfig,
} from "../../backend/services/config/model-config.ts";

const row = {
  tenant_id: "tenant_123",
  provider: "openai",
  model: "gpt-4o-mini",
  priority: 1,
  temperature: 0.3,
  max_tokens: 1024,
  max_retries: 4,
  timeout_ms: 25000,
  metadata: { tier: "gold" },
  updated_at: "2024-11-10T00:00:00.000Z",
};

describe("model config loader", () => {
  beforeEach(() => {
    invalidateTenantModelConfigCache();
    __setModelConfigFetcherForTests(null);
  });

  it("maps database rows into runtime configs", () => {
    const config = mapTenantModelConfig(row);
    expect(config).toEqual({
      tenantId: "tenant_123",
      provider: "openai",
      model: "gpt-4o-mini",
      priority: 1,
      temperature: 0.3,
      maxTokens: 1024,
      maxRetries: 4,
      timeoutMs: 25000,
      metadata: { tier: "gold" },
      updatedAt: "2024-11-10T00:00:00.000Z",
    });
  });

  it("caches configs until invalidated", async () => {
    const fetcher = vi.fn(async () => mapTenantModelConfig(row));
    __setModelConfigFetcherForTests(fetcher);

    const first = await fetchTenantModelConfig("tenant_123");
    const second = await fetchTenantModelConfig("tenant_123");

    expect(first).toBeDefined();
    expect(second).toBeDefined();
    expect(fetcher).toHaveBeenCalledTimes(1);

    invalidateTenantModelConfigCache("tenant_123");
    await fetchTenantModelConfig("tenant_123");
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});
