import taxonomy from "../../../../../docs/mira_topics.json" assert { type: "json" };
import type { MiraContext } from "../types.ts";

type IntentSample = {
  topic: string;
  subtopic: string;
  intent_name: string;
  display_name?: string;
  example_phrases?: string[];
};

type Taxonomy = {
  topics: Array<{
    topic: string;
    subtopics: Array<{
      subtopic: string;
      intents: IntentSample[];
    }>;
  }>;
};

const asTaxonomy = taxonomy as Taxonomy;

const EXAMPLE_LIMIT = 3;

function collectExamples(): string {
  const lines: string[] = [];
  for (const topic of asTaxonomy.topics) {
    for (const subtopic of topic.subtopics) {
      for (const intent of subtopic.intents.slice(0, EXAMPLE_LIMIT)) {
        const phrases = (intent.example_phrases ?? []).slice(0, 2);
        if (phrases.length === 0) continue;
        lines.push(
          `- Intent "${intent.intent_name}" (${topic.topic}/${subtopic.subtopic}) -> Examples: ${phrases.join(
            " | ",
          )}`,
        );
      }
    }
  }
  return lines.join("\n");
}

const FEW_SHOTS = collectExamples();

export function buildSystemPrompt(context?: MiraContext): string {
  const contextLine = context
    ? `Current module: ${context.module}. Current page: ${context.page}.`
    : "Current module unknown.";

  return `
You are Mira's intent classifier. Your job is to map an advisor's utterance to the most relevant topic, subtopic, and intent from the provided taxonomy.
- Always return the best matching intent with a confidence score between 0 and 1.
- Consider the current UI context when disambiguating similar intents.
- If no intent matches, return the closest topic but lower the confidence.

${contextLine}
`.trim();
}

export function buildClassificationPrompt(userMessage: string, context?: MiraContext): string {
  const contextSection = context
    ? `Module: ${context.module}\nPage: ${context.page}\nPage Data: ${JSON.stringify(
        context.pageData ?? {},
      )}`
    : "Module: unknown\nPage: unknown";

  return `
Classify the following advisor request into the Mira intent taxonomy.

${contextSection}

Advisor message:
"""
${userMessage}
"""

Return JSON with keys: topic, subtopic, intent, confidence (0-1), reasoning.
`.trim();
}

export function buildFewShotExamples(): string {
  return FEW_SHOTS;
}

export function buildClarificationPrompt(ambiguousIntents: string[]): string {
  return `
The previous classification was ambiguous between: ${ambiguousIntents.join(", ")}.
Ask the advisor a short clarifying question to decide between these options.
`.trim();
}
