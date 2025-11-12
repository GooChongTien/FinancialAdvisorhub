import { AIALRouter } from "./router.js";
import { createMockAdapter } from "./adapters/mockAdapter.js";
import { createOpenAiAdapter } from "./adapters/openaiAdapter.js";
import { createSupabaseAgentAdapter } from "./adapters/supabaseAgentAdapter.js";
import { isFeatureEnabled } from "./config.js";

export function createDefaultAdapters(options = {}) {
  if (options.adapters && options.adapters.length > 0) {
    return options.adapters.slice();
  }

  const adapters = [];
  const edgeEnabled = options.disableEdge !== true;
  const openAiEnabled = options.disableOpenAi !== true;

  if (edgeEnabled) {
    const edgeAdapter = createSupabaseAgentAdapter(options.edge);
    if (edgeAdapter) {
      adapters.push(edgeAdapter);
    }
  }

  if (openAiEnabled) {
    const openAiAdapter = createOpenAiAdapter(options.openAi);
    if (openAiAdapter) {
      adapters.push(openAiAdapter);
    }
  }

  const includeMock =
    options.includeMockAdapter !== undefined
      ? options.includeMockAdapter
      : adapters.length === 0;

  if (includeMock) {
    adapters.push(createMockAdapter(options.mock));
  }

  return adapters;
}

export function createAialRouter(options = {}) {
  const adapters = createDefaultAdapters(options);
  return new AIALRouter(adapters, {
    logger: options.logger,
    onAdapterError: options.onAdapterError,
  });
}

export function shouldEnableAial(defaultValue = true) {
  return isFeatureEnabled("MIRA_AIAL_ENABLED", defaultValue);
}

export { isOpenAiConfigured } from "./adapters/openaiAdapter.js";
