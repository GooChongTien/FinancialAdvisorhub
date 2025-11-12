/**
 * Lightweight orchestration utilities for Edge functions.
 * Provides per-key queuing and retry with exponential backoff.
 */

import { logAgentEvent, logAgentError } from "./logger.ts";

export interface RetryOptions {
  attempts?: number;
  baseDelayMs?: number;
  backoffFactor?: number;
  jitterFactor?: number;
  operation?: string;
  context?: Record<string, unknown>;
}

export interface QueueOptions extends RetryOptions {
  queueKey?: string;
}

const defaultRetryOptions: Required<Omit<RetryOptions, "operation" | "context">> = {
  attempts: 3,
  baseDelayMs: 250,
  backoffFactor: 2,
  jitterFactor: 0.3,
};

const queueMap = new Map<string, Promise<unknown>>();

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function retryWithBackoff<T>(
  task: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const {
    attempts,
    baseDelayMs,
    backoffFactor,
    jitterFactor,
  } = { ...defaultRetryOptions, ...options };
  const operation = options.operation ?? "agent.task";
  const context = options.context ?? {};

  let lastError: unknown = null;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    const attemptContext = { ...context, attempt, attempts };
    try {
      if (attempt > 1) {
        await logAgentEvent("mira.agent.retry", attemptContext, "warn");
      }
      const result = await task();
      if (attempt > 1) {
        await logAgentEvent("mira.agent.retry.success", attemptContext, "info");
      }
      return result;
    } catch (error) {
      lastError = error;
      if (attempt === attempts) {
        break;
      }
      const backoff = baseDelayMs * Math.pow(backoffFactor, attempt - 1);
      const jitter = backoff * jitterFactor * (Math.random() - 0.5) * 2;
      const delay = Math.max(50, Math.round(backoff + jitter));
      await logAgentEvent("mira.agent.retry.schedule", { ...attemptContext, delay }, "warn");
      await sleep(delay);
    }
  }

  await logAgentError("mira.agent.retry.exhausted", lastError, {
    ...context,
    attempts,
    operation,
  });
  throw lastError instanceof Error ? lastError : new Error(String(lastError ?? "Unknown error"));
}

export async function runWithQueue<T>(
  task: () => Promise<T>,
  options: QueueOptions = {},
): Promise<T> {
  const queueKey = options.queueKey ?? "default";
  const operation = options.operation ?? "agent.task";
  const context = { ...options.context, queueKey, operation };

  const previous = queueMap.get(queueKey) ?? Promise.resolve();
  const runner = previous
    .catch(() => undefined)
    .then(async () => {
      const startedAt = performance.now();
      await logAgentEvent("mira.agent.operation.start", context, "debug");
      try {
        const result = await retryWithBackoff(task, options);
        const duration = Math.round(performance.now() - startedAt);
        await logAgentEvent("mira.agent.operation.success", { ...context, duration }, "info");
        return result;
      } catch (error) {
        const duration = Math.round(performance.now() - startedAt);
        await logAgentError("mira.agent.operation.error", error, { ...context, duration });
        throw error;
      }
    });

  const tracking = runner.catch(() => undefined);
  queueMap.set(queueKey, tracking);

  try {
    return await runner;
  } finally {
    if (queueMap.get(queueKey) === tracking) {
      queueMap.delete(queueKey);
    }
  }
}

