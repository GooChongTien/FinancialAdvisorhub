/**
 * Feature Flag System for MIRA Co-Pilot
 *
 * Provides runtime toggles for features, modes, and agents.
 * Supports percentage rollouts and advisor-specific overrides.
 */

export interface FeatureFlagConfig {
  enabled: boolean;
  rolloutPercentage?: number; // 0-100, if specified enables gradual rollout
  enabledFor?: string[]; // List of advisor IDs with access
  disabledFor?: string[]; // List of advisor IDs explicitly blocked
  description?: string;
}

export interface FeatureFlags {
  // Global kill switch
  MIRA_COPILOT_ENABLED: FeatureFlagConfig;

  // Mode toggles
  MIRA_COPILOT_MODE_COMMAND: FeatureFlagConfig;
  MIRA_COPILOT_MODE_INSIGHT: FeatureFlagConfig;
  MIRA_COPILOT_MODE_SUGGEST: FeatureFlagConfig;

  // Agent toggles
  MIRA_AGENT_CUSTOMER: FeatureFlagConfig;
  MIRA_AGENT_NEW_BUSINESS: FeatureFlagConfig;
  MIRA_AGENT_PRODUCT: FeatureFlagConfig;
  MIRA_AGENT_ANALYTICS: FeatureFlagConfig;
  MIRA_AGENT_TODO: FeatureFlagConfig;
  MIRA_AGENT_BROADCAST: FeatureFlagConfig;
  MIRA_AGENT_VISUALIZER: FeatureFlagConfig;

  // Performance features
  MIRA_INTENT_CACHE_ENABLED: FeatureFlagConfig;
  MIRA_LAZY_LOADING_ENABLED: FeatureFlagConfig;

  // Debug features
  MIRA_DEBUG_PANEL_ENABLED: FeatureFlagConfig;
}

/**
 * Default feature flag configuration
 * Can be overridden via environment variables or runtime config
 */
const DEFAULT_FLAGS: FeatureFlags = {
  // Global - enabled by default for all users
  MIRA_COPILOT_ENABLED: {
    enabled: true,
    rolloutPercentage: 100,
    description: "Global kill switch for MIRA Co-Pilot",
  },

  // Modes - all enabled by default
  MIRA_COPILOT_MODE_COMMAND: {
    enabled: true,
    rolloutPercentage: 100,
    description: "Enable Command mode (chat interface)",
  },
  MIRA_COPILOT_MODE_INSIGHT: {
    enabled: true,
    rolloutPercentage: 100,
    description: "Enable Insight mode (proactive insights)",
  },
  MIRA_COPILOT_MODE_SUGGEST: {
    enabled: true,
    rolloutPercentage: 100,
    description: "Enable Copilot mode (inline suggestions)",
  },

  // Agents - all enabled by default
  MIRA_AGENT_CUSTOMER: {
    enabled: true,
    rolloutPercentage: 100,
    description: "Enable Customer Agent",
  },
  MIRA_AGENT_NEW_BUSINESS: {
    enabled: true,
    rolloutPercentage: 100,
    description: "Enable New Business Agent",
  },
  MIRA_AGENT_PRODUCT: {
    enabled: true,
    rolloutPercentage: 100,
    description: "Enable Product Agent",
  },
  MIRA_AGENT_ANALYTICS: {
    enabled: true,
    rolloutPercentage: 100,
    description: "Enable Analytics Agent",
  },
  MIRA_AGENT_TODO: {
    enabled: true,
    rolloutPercentage: 100,
    description: "Enable Todo Agent",
  },
  MIRA_AGENT_BROADCAST: {
    enabled: true,
    rolloutPercentage: 100,
    description: "Enable Broadcast Agent",
  },
  MIRA_AGENT_VISUALIZER: {
    enabled: true,
    rolloutPercentage: 100,
    description: "Enable Visualizer Agent",
  },

  // Performance features
  MIRA_INTENT_CACHE_ENABLED: {
    enabled: true,
    rolloutPercentage: 100,
    description: "Enable intent classification caching",
  },
  MIRA_LAZY_LOADING_ENABLED: {
    enabled: true,
    rolloutPercentage: 100,
    description: "Enable lazy loading for MIRA components",
  },

  // Debug features - disabled by default
  MIRA_DEBUG_PANEL_ENABLED: {
    enabled: false,
    rolloutPercentage: 0,
    description: "Enable debug panel for developers",
  },
};

// In-memory cache for feature flags (refreshed periodically)
let cachedFlags: FeatureFlags = { ...DEFAULT_FLAGS };
let lastRefreshTime = Date.now();
const REFRESH_INTERVAL_MS = 60000; // 1 minute

/**
 * Load feature flags from environment variables
 * Format: MIRA_FF_[FLAG_NAME]=true|false|percentage
 */
function loadFlagsFromEnvironment(): Partial<FeatureFlags> {
  const envFlags: Partial<FeatureFlags> = {};

  for (const [key, defaultValue] of Object.entries(DEFAULT_FLAGS)) {
    const envKey = `MIRA_FF_${key}`;
    const envValue = Deno.env.get(envKey);

    if (envValue !== undefined) {
      const config: FeatureFlagConfig = { ...defaultValue };

      // Parse environment value
      if (envValue === "true" || envValue === "1") {
        config.enabled = true;
        config.rolloutPercentage = 100;
      } else if (envValue === "false" || envValue === "0") {
        config.enabled = false;
        config.rolloutPercentage = 0;
      } else {
        // Try parsing as percentage (e.g., "50")
        const percentage = Number.parseInt(envValue, 10);
        if (!Number.isNaN(percentage) && percentage >= 0 && percentage <= 100) {
          config.enabled = percentage > 0;
          config.rolloutPercentage = percentage;
        }
      }

      envFlags[key as keyof FeatureFlags] = config;
    }
  }

  return envFlags;
}

/**
 * Refresh feature flags from environment
 */
function refreshFlags(): void {
  const now = Date.now();
  if (now - lastRefreshTime < REFRESH_INTERVAL_MS) {
    return;
  }

  const envFlags = loadFlagsFromEnvironment();
  cachedFlags = { ...DEFAULT_FLAGS, ...envFlags };
  lastRefreshTime = now;
}

/**
 * Hash function for consistent rollout (same advisor always gets same result)
 */
function hashAdvisorId(advisorId: string, flagName: string): number {
  let hash = 0;
  const str = advisorId + flagName;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash) % 100;
}

/**
 * Check if a feature flag is enabled for a specific advisor
 */
export function isFeatureEnabled(
  flagName: keyof FeatureFlags,
  advisorId?: string,
): boolean {
  refreshFlags();

  const flag = cachedFlags[flagName];
  if (!flag) {
    console.warn(`[feature-flags] Unknown flag: ${flagName}`);
    return false;
  }

  // Check if globally disabled
  if (!flag.enabled) {
    return false;
  }

  // Check explicit disallow list
  if (advisorId && flag.disabledFor?.includes(advisorId)) {
    return false;
  }

  // Check explicit allow list
  if (advisorId && flag.enabledFor?.includes(advisorId)) {
    return true;
  }

  // Check rollout percentage
  if (flag.rolloutPercentage !== undefined && flag.rolloutPercentage < 100) {
    if (!advisorId) {
      // No advisor ID provided, use random rollout
      return Math.random() * 100 < flag.rolloutPercentage;
    }
    // Consistent hashing based rollout
    const hash = hashAdvisorId(advisorId, flagName);
    return hash < flag.rolloutPercentage;
  }

  return true;
}

/**
 * Check if MIRA Co-Pilot is enabled globally
 */
export function isMiraEnabled(advisorId?: string): boolean {
  return isFeatureEnabled("MIRA_COPILOT_ENABLED", advisorId);
}

/**
 * Check if a specific mode is enabled
 */
export function isModeEnabled(
  mode: "command" | "insight" | "suggest",
  advisorId?: string,
): boolean {
  if (!isMiraEnabled(advisorId)) {
    return false;
  }

  const flagMap: Record<string, keyof FeatureFlags> = {
    command: "MIRA_COPILOT_MODE_COMMAND",
    insight: "MIRA_COPILOT_MODE_INSIGHT",
    suggest: "MIRA_COPILOT_MODE_SUGGEST",
  };

  const flagName = flagMap[mode];
  return flagName ? isFeatureEnabled(flagName, advisorId) : false;
}

/**
 * Check if a specific agent is enabled
 */
export function isAgentEnabled(
  agentId: string,
  advisorId?: string,
): boolean {
  if (!isMiraEnabled(advisorId)) {
    return false;
  }

  // Map agent IDs to flag names
  const agentFlagMap: Record<string, keyof FeatureFlags> = {
    CustomerAgent: "MIRA_AGENT_CUSTOMER",
    NewBusinessAgent: "MIRA_AGENT_NEW_BUSINESS",
    ProductAgent: "MIRA_AGENT_PRODUCT",
    AnalyticsAgent: "MIRA_AGENT_ANALYTICS",
    TodoAgent: "MIRA_AGENT_TODO",
    BroadcastAgent: "MIRA_AGENT_BROADCAST",
    VisualizerAgent: "MIRA_AGENT_VISUALIZER",
  };

  const flagName = agentFlagMap[agentId];
  if (!flagName) {
    console.warn(`[feature-flags] Unknown agent: ${agentId}`);
    return true; // Default to enabled for unknown agents
  }

  return isFeatureEnabled(flagName, advisorId);
}

/**
 * Get all feature flags and their status for an advisor
 */
export function getAllFlags(advisorId?: string): Record<string, boolean> {
  refreshFlags();

  const result: Record<string, boolean> = {};
  for (const flagName of Object.keys(cachedFlags) as Array<keyof FeatureFlags>) {
    result[flagName] = isFeatureEnabled(flagName, advisorId);
  }
  return result;
}

/**
 * Get feature flag configuration (for admin/debug purposes)
 */
export function getFlagConfig(flagName: keyof FeatureFlags): FeatureFlagConfig | undefined {
  refreshFlags();
  return cachedFlags[flagName];
}

/**
 * Override a feature flag at runtime (for testing/admin purposes)
 * Note: This only affects the in-memory cache, not persistent storage
 */
export function overrideFlag(
  flagName: keyof FeatureFlags,
  config: Partial<FeatureFlagConfig>,
): void {
  refreshFlags();
  cachedFlags[flagName] = { ...cachedFlags[flagName], ...config };
  console.log(`[feature-flags] Override applied: ${flagName}`, config);
}

export default {
  isFeatureEnabled,
  isMiraEnabled,
  isModeEnabled,
  isAgentEnabled,
  getAllFlags,
  getFlagConfig,
  overrideFlag,
};
