/**
 * OpenAI Agent configuration and environment validation
 * Reads and validates required environment variables for Agent integration
 */

export interface AgentConfig {
  apiKey: string;
  workflowId: string;
  baseUrl: string;
  timeout: number;
  maxRetries: number;
}

/**
 * Validate and load Agent configuration from environment
 * Throws if required variables are missing
 */
export function loadAgentConfig(): AgentConfig {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  const workflowId = Deno.env.get("AGENT_WORKFLOW_ID");
  const baseUrl = Deno.env.get("AGENT_BASE_URL") || "https://api.openai.com/v1";
  const timeout = parseInt(Deno.env.get("AGENT_TIMEOUT") || "30000", 10);
  const maxRetries = parseInt(Deno.env.get("AGENT_MAX_RETRIES") || "3", 10);

  if (!apiKey) {
    throw new Error("Missing required env: OPENAI_API_KEY");
  }

  if (!workflowId) {
    throw new Error("Missing required env: AGENT_WORKFLOW_ID");
  }

  // Validate workflow ID format
  if (!workflowId.startsWith("wf_")) {
    throw new Error(`Invalid AGENT_WORKFLOW_ID format: ${workflowId}. Expected format: wf_*`);
  }

  return {
    apiKey,
    workflowId,
    baseUrl,
    timeout,
    maxRetries,
  };
}

/**
 * Safe config loader that returns null on error
 * Useful for optional Agent features
 */
export function tryLoadAgentConfig(): AgentConfig | null {
  try {
    return loadAgentConfig();
  } catch (error) {
    console.warn("[Agent Config] Failed to load:", error instanceof Error ? error.message : error);
    return null;
  }
}
