import type { MiraContext } from "../types.ts";

export interface IntentScore {
  intent: string;
  topic: string;
  subtopic: string;
  baseScore: number;
  adjustedScore: number;
  reasons: string[];
}

export interface RoutingDecision {
  selected: IntentScore | null;
  threshold: "high" | "medium" | "low";
}

export const CONFIDENCE_THRESHOLDS = {
  high: 0.7,
  medium: 0.4,
};

function overlapScore(message: string, phrase: string): number {
  const tokens = new Set(
    phrase
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(Boolean),
  );
  if (tokens.size === 0) return 0;
  const words = message
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  if (words.length === 0) return 0;
  let matches = 0;
  for (const word of words) {
    if (tokens.has(word)) matches++;
  }
  return Math.min(1, matches / tokens.size);
}

export function scoreIntent(
  intentName: string,
  message: string,
  context: MiraContext | undefined,
  options: {
    topic: string;
    subtopic: string;
    examplePhrases?: string[];
    requiredFields?: string[];
  },
): IntentScore {
  const reasons: string[] = [];
  const normalized = message.toLowerCase();
  let score = 0;

  if (intentName && normalized.includes(intentName.replace(/_/g, " "))) {
    score += 0.3;
    reasons.push("direct_intent_keyword");
  }

  if (options.examplePhrases?.length) {
    let best = 0;
    for (const phrase of options.examplePhrases) {
      best = Math.max(best, overlapScore(normalized, phrase));
    }
    if (best > 0) {
      score += Math.min(0.4, best * 0.4);
      reasons.push("example_overlap");
    }
  }

  if (options.requiredFields?.some((field) => normalized.includes(field.replace(/_/g, " ")))) {
    score += 0.1;
    reasons.push("required_field_match");
  }

  if (context && context.module === options.topic) {
    score += 0.15;
    reasons.push("context_module_match");
  }

  const adjusted = Math.min(1, score);
  return {
    intent: intentName,
    topic: options.topic,
    subtopic: options.subtopic,
    baseScore: score,
    adjustedScore: adjusted,
    reasons,
  };
}

export function applyThresholds(score: IntentScore | null): RoutingDecision {
  if (!score) {
    return { selected: null, threshold: "low" };
  }

  if (score.adjustedScore >= CONFIDENCE_THRESHOLDS.high) {
    return { selected: score, threshold: "high" };
  }
  if (score.adjustedScore >= CONFIDENCE_THRESHOLDS.medium) {
    return { selected: score, threshold: "medium" };
  }
  return { selected: score, threshold: "low" };
}
