import type { AgentAdapter } from "./types.ts";
import type { TenantModelConfig } from "../config/model-config.ts";
import { createMockAgentAdapter } from "./mock-adapter.ts";
import { createOpenAiAdapter } from "./adapters/openai.ts";
import { createAnthropicAdapter } from "./adapters/anthropic.ts";
import { createRestAdapter } from "./adapters/rest.ts";
import { readEnv } from "../../utils/env.ts";

export interface AdapterRegistryOptions {
  tenantConfig?: TenantModelConfig | null;
}

function normalizeProvider(provider?: string | null) {
  return provider?.toLowerCase() ?? null;
}

function createAdapterFromTenant(config?: TenantModelConfig | null): AgentAdapter | null {
  if (!config) return null;
  const provider = normalizeProvider(config.provider);
  const metadata = config.metadata ?? {};

  switch (provider) {
    case "openai":
      return createOpenAiAdapter({
        model: config.model,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
        systemPrompt: metadata.systemPrompt as string | undefined,
        baseUrl: (metadata.baseUrl as string) ?? undefined,
        apiKey: (metadata.apiKey as string) ?? undefined,
      });
    case "anthropic":
      return createAnthropicAdapter({
        model: config.model,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
        systemPrompt: metadata.systemPrompt as string | undefined,
        baseUrl: metadata.baseUrl as string | undefined,
        apiKey: metadata.apiKey as string | undefined,
      });
    case "rest":
    case "custom_rest":
      return createRestAdapter({
        baseUrl: metadata.baseUrl as string | undefined,
        apiKey: metadata.apiKey as string | undefined,
        chatPath: metadata.chatPath as string | undefined,
        healthPath: metadata.healthPath as string | undefined,
        secretPath: metadata.secretPath as string | undefined,
      });
    case "mock":
      return createMockAgentAdapter();
    default:
      return null;
  }
}

function hasEnvOpenAi() {
  return Boolean(readEnv("OPENAI_API_KEY"));
}

function hasEnvAnthropic() {
  return Boolean(readEnv("ANTHROPIC_API_KEY"));
}

function hasEnvRest() {
  return Boolean(readEnv("AGENT_REST_BASE_URL"));
}

export function buildCandidateAdapters(options: AdapterRegistryOptions = {}): AgentAdapter[] {
  const candidates: AgentAdapter[] = [];

  const tenantAdapter = createAdapterFromTenant(options.tenantConfig);
  if (tenantAdapter) candidates.push(tenantAdapter);

  if (hasEnvOpenAi()) {
    const adapter = createOpenAiAdapter();
    if (adapter) candidates.push(adapter);
  }

  if (hasEnvAnthropic()) {
    const adapter = createAnthropicAdapter();
    if (adapter) candidates.push(adapter);
  }

  if (hasEnvRest()) {
    const adapter = createRestAdapter();
    if (adapter) candidates.push(adapter);
  }

  // Always include mock as a last resort
  candidates.push(createMockAgentAdapter());

  return candidates;
}

export function buildAgentAdapter(options: AdapterRegistryOptions = {}): AgentAdapter {
  // Preserve existing synchronous behavior by returning the first candidate
  // (health probing and auto-fallback are handled inside AgentClient now).
  const candidates = buildCandidateAdapters(options);
  return candidates[0]!;
}
