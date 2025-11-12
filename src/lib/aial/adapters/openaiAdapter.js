import { getEnvVar, parseIntegerEnv, parseNumberEnv } from "../config.js";

const DEFAULT_MODEL = "gpt-4o-mini";
const DEFAULT_BASE_URL = "https://api.openai.com/v1";
const DEFAULT_TEMPERATURE = 0.2;
const DEFAULT_MAX_TOKENS = 512;
const HEALTH_TTL_MS = 60_000;

function normalizeMessage(message) {
  if (!message) return null;
  const role = message.role ?? "user";
  let content = message.content;
  if (typeof content === "object") {
    try {
      content = JSON.stringify(content);
    } catch {
      content = String(content);
    }
  }
  if (typeof content !== "string") {
    content = String(content ?? "");
  }
  return { role, content };
}

function buildMessages(event, systemPrompt) {
  const messages = [];

  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }

  const payload = event?.payload ?? {};
  const hasConversation = Array.isArray(payload.messages) && payload.messages.length > 0;

  if (hasConversation) {
    for (const item of payload.messages) {
      const normalized = normalizeMessage(item);
      if (normalized) messages.push(normalized);
    }
  } else {
    const prompt =
      typeof payload.prompt === "string"
        ? payload.prompt
        : typeof payload.text === "string"
          ? payload.text
          : null;

    if (prompt) {
      messages.push({ role: "user", content: prompt });
    } else if (Object.keys(payload).length > 0) {
      messages.push({
        role: "user",
        content: `Context:\n${JSON.stringify(payload, null, 2)}`,
      });
    } else {
      messages.push({
        role: "user",
        content: "Provide an advisor-ready summary for the current session context.",
      });
    }
  }

  return messages;
}

export class OpenAiAdapter {
  constructor(options) {
    if (!options?.apiKey) {
      throw new Error("OpenAiAdapter requires an apiKey");
    }

    this.id = options.id ?? "openai";
    this.model = options.model ?? DEFAULT_MODEL;
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl?.replace(/\/$/, "") ?? DEFAULT_BASE_URL;
    this.temperature = options.temperature ?? DEFAULT_TEMPERATURE;
    this.maxTokens = options.maxTokens ?? DEFAULT_MAX_TOKENS;
    this.systemPrompt = options.systemPrompt;

    this.lastHealthAt = 0;
    this.lastHealthStatus = false;
    this.healthTtl = options.healthTtl ?? HEALTH_TTL_MS;
  }

  async health() {
    const now = Date.now();
    if (now - this.lastHealthAt < this.healthTtl) {
      return this.lastHealthStatus;
    }

    try {
      const response = await fetch(`${this.baseUrl}/models/${this.model}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      this.lastHealthStatus = response.ok;
    } catch {
      this.lastHealthStatus = false;
    } finally {
      this.lastHealthAt = now;
    }

    return this.lastHealthStatus;
  }

  async execute(event) {
    const messages = buildMessages(event, this.systemPrompt);
    const url = `${this.baseUrl}/chat/completions`;
    const startedAt = Date.now();

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        temperature: this.temperature,
        max_tokens: this.maxTokens,
        messages,
      }),
    });

    if (!response.ok) {
      const errorPayload = await safeJson(response);
      throw new Error(
        `OpenAI request failed (${response.status} ${response.statusText})${
          errorPayload?.error?.message ? `: ${errorPayload.error.message}` : ""
        }`,
      );
    }

    const data = await response.json();
    const latencyMs = Date.now() - startedAt;
    const choice = data.choices?.[0];
    const content = choice?.message?.content ?? "";

    return {
      content,
      tokensUsed: data.usage?.total_tokens ?? null,
      latencyMs,
      intentCandidates: extractIntentCandidates(choice),
    };
  }
}

async function safeJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function extractIntentCandidates(choice) {
  if (!choice?.message?.tool_calls) return null;

  const intents = [];
  for (const toolCall of choice.message.tool_calls) {
    const name = toolCall?.function?.name;
    if (!name) continue;
    let score = null;
    try {
      const parsed = JSON.parse(toolCall.function.arguments ?? "{}");
      if (typeof parsed.confidence === "number") {
        score = parsed.confidence;
      }
    } catch {
      // ignore parsing errors
    }
    intents.push({
      id: name,
      score: score ?? 0.5,
    });
  }
  return intents.length > 0 ? intents : null;
}

export function isOpenAiConfigured() {
  return Boolean(getEnvVar("OPENAI_API_KEY") ?? getEnvVar("OPENAI_API_KEY_B64"));
}

export function createOpenAiAdapter(options = {}) {
  const apiKey = options.apiKey ?? getEnvVar("OPENAI_API_KEY");
  if (!apiKey) {
    return null;
  }

  const model = options.model ?? getEnvVar("OPENAI_MODEL") ?? DEFAULT_MODEL;
  const baseUrl = options.baseUrl ?? getEnvVar("OPENAI_BASE_URL") ?? DEFAULT_BASE_URL;
  const systemPrompt = options.systemPrompt ?? getEnvVar("OPENAI_SYSTEM_PROMPT");
  const temperature =
    options.temperature ??
    parseNumberEnv("OPENAI_TEMPERATURE", DEFAULT_TEMPERATURE);
  const maxTokens =
    options.maxTokens ?? parseIntegerEnv("OPENAI_MAX_TOKENS", DEFAULT_MAX_TOKENS);

  return new OpenAiAdapter({
    id: options.id,
    apiKey,
    model,
    baseUrl,
    systemPrompt,
    temperature,
    maxTokens,
    healthTtl: options.healthTtl,
  });
}
