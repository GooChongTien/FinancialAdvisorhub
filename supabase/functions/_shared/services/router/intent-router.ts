import taxonomy from "../../../../../docs/mira_topics.json" assert { type: "json" };
import type {
  IntentClassification,
  MiraContext,
  IntentRouter,
  CandidateAgentScore,
} from "../types.ts";
import { scoreIntent, applyThresholds, type IntentScore } from "./confidence-scorer.ts";
import { detectTopicSwitch } from "./topic-tracker.ts";
import { buildSystemPrompt, buildClassificationPrompt } from "./prompts.ts";
import { IntentCache, getIntentCache } from "./intent-cache.ts";
import { calculateBehavioralBoost, getBehavioralInsights } from "./behavioral-scorer.ts";

type Taxonomy = {
  topics: Array<{
    topic: string;
    display_name?: string;
    subtopics: Array<{
      subtopic: string;
      display_name?: string;
      intents: Array<{
        intent_name: string;
        display_name?: string;
        description?: string;
        example_phrases?: string[];
        required_fields?: string[];
        optional_fields?: string[];
      }>;
    }>;
  }>;
};

type IntentEntry = {
  topic: string;
  subtopic: string;
  intent: string;
  description?: string;
  examples: string[];
  requiredFields: string[];
  optionalFields: string[];
};

const taxonomyData = taxonomy as Taxonomy;

const INTENT_ENTRIES: IntentEntry[] = [];

for (const topic of taxonomyData.topics) {
  for (const subtopic of topic.subtopics) {
    for (const intent of subtopic.intents) {
      INTENT_ENTRIES.push({
        topic: topic.topic,
        subtopic: subtopic.subtopic,
        intent: intent.intent_name,
        description: intent.description,
        examples: intent.example_phrases ?? [],
        requiredFields: intent.required_fields ?? [],
        optionalFields: intent.optional_fields ?? [],
      });
    }
  }
}

const MODULE_AGENT_MAP: Record<string, string> = {
  customer: "CustomerAgent",
  new_business: "NewBusinessAgent",
  product: "ProductAgent",
  analytics: "AnalyticsAgent",
  todo: "ToDoAgent",
  broadcast: "BroadcastAgent",
  visualizer: "VisualizerAgent",
  fna: "mira_fna_advisor_agent",
  knowledge: "mira_knowledge_brain_agent",
  operations: "mira_ops_task_agent",
  compliance: "mira_ops_task_agent",
};

const DEFAULT_AGENT = "CustomerAgent";

const normalize = (input: string) => input.toLowerCase().trim();

interface ClassificationOptions {
  previousTopic?: string | null;
  history?: string[];
}

export class IntentRouterService implements IntentRouter {
  constructor(private readonly options?: { highThreshold?: number; mediumThreshold?: number }) {}

  async classifyIntent(
    userMessage: string,
    context: MiraContext,
    opts: ClassificationOptions = {},
  ): Promise<IntentClassification> {
    const text = (userMessage ?? "").trim();
    if (!text) {
      return this.buildFallback(context);
    }

    // Check cache first to avoid expensive scoring
    const cache = getIntentCache<IntentClassification>();
    const cacheKey = IntentCache.generateKey(text, {
      module: context.module,
      page: context.page,
    });

    const cached = cache.get(cacheKey);
    if (cached) {
      // Return cached result with updated topic switch detection
      const detection = detectTopicSwitch(
        opts.previousTopic ?? null,
        cached.topic,
        cached.confidence,
      );
      return {
        ...cached,
        shouldSwitchTopic: detection.shouldSwitch,
      };
    }

    // Cache miss - perform intent scoring
    const scores = this.scoreAllIntents(text, context);
    const best = scores[0] ?? null;
    const candidates = scores.slice(0, 3).map((score) => this.toCandidateAgentScore(score));

    const fallbackTopic = context.module ?? opts.previousTopic ?? "customer";
    const fallbackSubtopic = best?.subtopic ?? "general";
    const fallbackIntent = best?.intent ?? "ops__agent_passthrough";

    const decision = applyThresholds(best);
    const detection = detectTopicSwitch(
      opts.previousTopic ?? null,
      best?.topic ?? fallbackTopic,
      best?.adjustedScore ?? 0,
    );

    const classification: IntentClassification = {
      topic: best?.topic ?? fallbackTopic,
      subtopic: best?.subtopic ?? fallbackSubtopic,
      intent: best?.intent ?? fallbackIntent,
      confidence: best?.adjustedScore ?? 0,
      candidateAgents: candidates,
      shouldSwitchTopic: detection.shouldSwitch,
      confidenceTier: decision.threshold,
    };

    // Store in cache for future requests
    cache.set(cacheKey, classification);

    return classification;
  }

  selectAgent(classification: IntentClassification): CandidateAgentScore {
    const [primary] = classification.candidateAgents ?? [];
    if (primary) return primary;
    const agentId = agentForTopic(classification.topic);
    return { agentId, score: classification.confidence, reason: "fallback_by_topic" };
  }

  private scoreAllIntents(message: string, context: MiraContext): IntentScore[] {
    const results: IntentScore[] = [];
    const behavioralContext = context.behavioral_context;

    for (const entry of INTENT_ENTRIES) {
      const score = scoreIntent(entry.intent, message, context, {
        topic: entry.topic,
        subtopic: entry.subtopic,
        examplePhrases: entry.examples,
        requiredFields: entry.requiredFields,
      });

      // Apply behavioral boost if context is available
      if (behavioralContext) {
        const behavioralBoost = calculateBehavioralBoost(
          entry.intent,
          entry.topic,
          behavioralContext
        );

        if (behavioralBoost > 0) {
          score.adjustedScore = Math.min(score.adjustedScore + behavioralBoost, 1.0);
          score.reasons.push(`behavioral_boost:${behavioralBoost.toFixed(2)}`);
        }
      }

      results.push(score);
    }
    return results.sort((a, b) => b.adjustedScore - a.adjustedScore);
  }

  private toCandidateAgentScore(score: IntentScore): CandidateAgentScore {
    return {
      agentId: agentForTopic(score.topic),
      score: Number(score.adjustedScore.toFixed(3)),
      reason: score.reasons.join(",") || undefined,
    };
  }

  private buildFallback(context: MiraContext): IntentClassification {
    return {
      topic: context.module ?? "customer",
      subtopic: "general",
      intent: "ops__agent_passthrough",
      confidence: 0,
      candidateAgents: [
        {
          agentId: agentForTopic(context.module ?? "customer"),
          score: 0,
          reason: "empty_message",
        },
      ],
      shouldSwitchTopic: false,
      confidenceTier: "low",
    };
  }
}

function agentForTopic(topic: string): string {
  return MODULE_AGENT_MAP[topic] ?? DEFAULT_AGENT;
}

export function buildRouterPrompts(userMessage: string, context: MiraContext) {
  return {
    system: buildSystemPrompt(context),
    classification: buildClassificationPrompt(userMessage, context),
  };
}

export const intentRouter = new IntentRouterService();
