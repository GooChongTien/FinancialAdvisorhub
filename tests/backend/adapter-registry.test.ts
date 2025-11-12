import { beforeEach, describe, expect, it } from "vitest";
import { buildAgentAdapter } from "../../backend/services/agent/adapter-registry.ts";
import { TenantModelConfig } from "../../backend/services/config/model-config.ts";

const ORIGINAL_ENV = { ...process.env };

function resetEnv() {
  process.env = { ...ORIGINAL_ENV };
  delete (globalThis as any).OPENAI_API_KEY;
}

describe("agent adapter registry", () => {
  beforeEach(() => {
    resetEnv();
  });

  it("honors tenant-config provider selection", () => {
    const config: TenantModelConfig = {
      tenantId: "tenantA",
      provider: "mock",
      model: "n/a",
      priority: 0,
      metadata: {},
    };
    const adapter = buildAgentAdapter({ tenantConfig: config });
    expect(adapter.id).toBe("mock");
  });

  it("prefers OpenAI env when available", () => {
    process.env.OPENAI_API_KEY = "sk-test";
    const adapter = buildAgentAdapter();
    expect(adapter.id).toBe("openai");
  });

  it("falls back to mock when no providers configured", () => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.AGENT_REST_BASE_URL;
    const adapter = buildAgentAdapter();
    expect(adapter.id).toBe("mock");
  });
});
