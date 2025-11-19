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
  high: 0.65,   // Lowered from 0.7 - execute immediately with good semantic match
  medium: 0.45, // Lowered from 0.4 - soft confirm with reasonable match
  // Below 0.45: "low" - clarification needed
  // Below 0.30: fallback to module default
};

/**
 * Enhanced overlap scoring that rewards partial matches better
 * Uses bidirectional matching to handle both user message → example and example → user message
 */
function overlapScore(message: string, phrase: string): number {
  const phraseTokens = new Set(
    phrase
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(Boolean),
  );

  const messageTokens = message
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

  if (phraseTokens.size === 0 || messageTokens.length === 0) return 0;

  // Count matches from message tokens
  let messageMatches = 0;
  for (const word of messageTokens) {
    if (phraseTokens.has(word)) messageMatches++;
  }

  // Forward score: how much of the example phrase is covered by the message
  const forwardScore = messageMatches / phraseTokens.size;

  // Backward score: how much of the message is covered by the example
  const backwardScore = messageMatches / messageTokens.length;

  // Use harmonic mean for balanced scoring (penalizes low scores on either side)
  const harmonicMean = forwardScore > 0 && backwardScore > 0
    ? (2 * forwardScore * backwardScore) / (forwardScore + backwardScore)
    : 0;

  // Boost for exact substring matches (handles cases like "show tasks" matching "show my tasks")
  const exactBoost = phrase.toLowerCase().includes(message.toLowerCase()) ||
                    message.toLowerCase().includes(phrase.toLowerCase()) ? 0.15 : 0;

  return Math.min(1, harmonicMean + exactBoost);
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

  // 1. Direct intent keyword match (0-0.25 points) - reduced weight
  if (intentName && normalized.includes(intentName.replace(/_/g, " "))) {
    score += 0.25;
    reasons.push("direct_intent_keyword");
  }

  // 2. Example phrase matching (0-0.50 points) - INCREASED weight with better scoring
  if (options.examplePhrases?.length) {
    let bestScore = 0;
    let matchCount = 0;

    for (const phrase of options.examplePhrases) {
      const overlap = overlapScore(normalized, phrase);
      if (overlap > bestScore) {
        bestScore = overlap;
      }
      if (overlap > 0.3) { // Count good matches
        matchCount++;
      }
    }

    if (bestScore > 0) {
      // Base score from best match (0-0.50)
      score += bestScore * 0.50;
      reasons.push(`example_match:${bestScore.toFixed(2)}`);

      // Bonus for multiple good matches (shows consistent pattern) - up to 0.10
      if (matchCount > 1) {
        const bonus = Math.min(0.10, (matchCount - 1) * 0.03);
        score += bonus;
        reasons.push(`multi_match_bonus:${matchCount}`);
      }
    }
  }

  // 3. Required field presence (0-0.10 points)
  const matchedFields = options.requiredFields?.filter(
    (field) => normalized.includes(field.replace(/_/g, " "))
  ) || [];

  if (matchedFields.length > 0) {
    const fieldScore = Math.min(0.10, matchedFields.length * 0.05);
    score += fieldScore;
    reasons.push(`required_fields:${matchedFields.length}`);
  }

  // 4. Context module match (0-0.20 points) - INCREASED from 0.15
  if (context && context.module === options.topic) {
    score += 0.20;
    reasons.push("context_module_match");
  }

  // 5. Message length factor - short messages get small boost (more likely to be direct)
  const wordCount = normalized.split(/\s+/).length;
  if (wordCount >= 2 && wordCount <= 5) {
    score += 0.05;
    reasons.push("concise_query");
  }

  // Cap at 1.0
  const adjusted = Math.min(1.0, score);

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
