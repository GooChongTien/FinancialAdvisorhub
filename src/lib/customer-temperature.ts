type TemperatureBucket = "hot" | "warm" | "cold";

export interface TemperatureInput {
  lastInteractionAt?: string | Date | null;
  activeProposals?: number;
  openServiceRequests?: number;
  // Legacy fields - kept for backward compatibility but not used in new logic
  openTasks?: number;
  sentimentScore?: number;
  recentInteractions?: number;
}

export interface TemperatureResult {
  bucket: TemperatureBucket;
  score: number; // 0 to 1 (deprecated - kept for backward compatibility)
}

function toTimestamp(value?: string | Date | null): number | null {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  const ts = parsed.getTime();
  return Number.isNaN(ts) ? null : ts;
}

function clampScore(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

/**
 * Calculate customer temperature based on last contact date and activity status.
 *
 * Rules:
 * - Last contacted ≤ 7 days → Hot
 * - Last contacted ≤ 30 days → Warm
 * - Last contacted > 30 days OR never contacted:
 *   - If has active proposal OR active service request → Warm
 *   - Otherwise → Cold
 */
export function calculateCustomerTemperature(input: TemperatureInput = {}): TemperatureResult {
  const now = Date.now();
  const lastInteractionTs = toTimestamp(input.lastInteractionAt);
  const daysSinceInteraction =
    lastInteractionTs !== null ? (now - lastInteractionTs) / (1000 * 60 * 60 * 24) : Number.POSITIVE_INFINITY;

  const activeProposals = Math.max(0, input.activeProposals ?? 0);
  const openServiceRequests = Math.max(0, input.openServiceRequests ?? 0);
  const hasActiveWork = activeProposals > 0 || openServiceRequests > 0;

  let bucket: TemperatureBucket;
  let score: number;

  // Rule-based temperature classification
  if (daysSinceInteraction <= 7) {
    bucket = "hot";
    score = 0.9; // High score for backward compatibility
  } else if (daysSinceInteraction <= 30) {
    bucket = "warm";
    score = 0.6; // Medium score for backward compatibility
  } else {
    // More than 30 days or never contacted
    if (hasActiveWork) {
      bucket = "warm";
      score = 0.5; // Active work keeps them warm
    } else {
      bucket = "cold";
      score = 0.2; // Low score for backward compatibility
    }
  }

  return { bucket, score };
}

export function mergeTemperatureSnapshots(results: TemperatureResult[]): TemperatureResult {
  if (!Array.isArray(results) || results.length === 0) {
    return { bucket: "cold", score: 0 };
  }
  const maxScore = results.reduce((max, r) => Math.max(max, r?.score ?? 0), 0);
  const bucket: TemperatureBucket = maxScore >= 0.7 ? "hot" : maxScore >= 0.4 ? "warm" : "cold";
  return { bucket, score: clampScore(maxScore) };
}
