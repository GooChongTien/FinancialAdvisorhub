import { getIntentSchema } from "./catalog.js";

const MIN_CONFIDENCE = 0.4;

export function interpretIntent(response, defaultIntent) {
  if (!response) return null;

  const candidates = Array.isArray(response.intentCandidates)
    ? response.intentCandidates
    : [];

  if (candidates.length === 0 && defaultIntent) {
    return buildIntent(defaultIntent, 0.5, response);
  }

  const ranked = [...candidates].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  const top = ranked[0];
  if (!top || typeof top.id !== "string") {
    return null;
  }

  const confidence = typeof top.score === "number" ? top.score : 0;
  if (confidence < MIN_CONFIDENCE) {
    return null;
  }

  return buildIntent(top.id, confidence, response);
}

function buildIntent(intentName, confidence, response) {
  const schema = getIntentSchema(intentName);
  if (!schema) {
    return {
      name: intentName,
      confidence,
      context: response?.context ?? {},
      schema: null,
    };
  }

  const context = {};
  for (const key of schema.required ?? []) {
    context[key] = pickNested(response, key);
  }
  for (const key of schema.optional ?? []) {
    const value = pickNested(response, key);
    if (value !== undefined) {
      context[key] = value;
    }
  }

  return {
    name: schema.name,
    confidence,
    schema,
    context,
  };
}

function pickNested(response, path) {
  if (!response || typeof response !== "object") return undefined;
  if (!path.includes(".")) {
    return response[path];
  }
  return path.split(".").reduce((acc, segment) => {
    if (acc && typeof acc === "object" && segment in acc) {
      return acc[segment];
    }
    return undefined;
  }, response);
}
