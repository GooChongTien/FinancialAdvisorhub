import { tryLoadAgentConfig } from "./config.ts";
import { buildAgentAdapter, buildCandidateAdapters } from "./adapter-registry.ts";
import type {
  AdapterRequestContext,
  AgentAdapter,
  AgentChatRequest,
  AgentChatResult,
  AgentClient,
  AgentClientOptions,
  AgentEvent,
  AgentLogger,
} from "./types.ts";

const DEFAULT_LOGGER: AgentLogger = {
  debug: (...args) => console.debug("[AgentClient]", ...args),
  info: (...args) => console.info("[AgentClient]", ...args),
  warn: (...args) => console.warn("[AgentClient]", ...args),
  error: (...args) => console.error("[AgentClient]", ...args),
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function createLogger(overrides?: Partial<AgentLogger>): AgentLogger {
  if (!overrides) return DEFAULT_LOGGER;
  return {
    debug: overrides.debug ?? DEFAULT_LOGGER.debug,
    info: overrides.info ?? DEFAULT_LOGGER.info,
    warn: overrides.warn ?? DEFAULT_LOGGER.warn,
    error: overrides.error ?? DEFAULT_LOGGER.error,
  };
}

function computeBackoff(attempt: number) {
  const base = Math.pow(2, attempt) * 100;
  return Math.min(base, 2000);
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  if (!timeoutMs || timeoutMs <= 0) {
    return promise;
  }

  let timeoutHandle: number | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new Error(`${label} timed out after ${timeoutMs}ms`));
    }, timeoutMs) as unknown as number;
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }
}

class DefaultAgentClient implements AgentClient {
  constructor(
    private adapter: AgentAdapter,
    private options: {
      logger: AgentLogger;
      maxRetries: number;
      timeoutMs: number;
      candidates?: AgentAdapter[];
    }
  ) {}

  private async ensureHealthyAdapter(label: string): Promise<void> {
    try {
      const current = this.adapter;
      const supportsHealth = typeof current.health === "function";
      if (!supportsHealth) return; // assume healthy if not implemented
      const healthy = await withTimeout(current.health!(), Math.min(this.options.timeoutMs, 3000), `${label}.health`);
      if (healthy) return;
    } catch (err) {
      this.options.logger.warn(`${label}.health_check_error`, err as unknown);
    }

    // Attempt fallback to next healthy adapter
    const candidates = this.options.candidates ?? [];
    for (const candidate of candidates) {
      // Skip if same instance
      if (candidate === this.adapter) continue;
      try {
        const ok = typeof candidate.health === "function"
          ? await withTimeout(candidate.health!(), 2000, `${label}.candidate_health`)
          : true;
        if (ok) {
          const prev = this.adapter?.id ?? "unknown";
          this.adapter = candidate;
          this.options.logger.info("adapter.fallback", { from: prev, to: candidate.id });
          return;
        }
      } catch {}
    }
    // If none healthy, keep existing (errors will surface to caller)
  }

  async chat(request: AgentChatRequest, context?: AdapterRequestContext): Promise<AgentChatResult> {
    await this.ensureHealthyAdapter("chat");
    const execute = () => this.adapter.chat(request, context);
    return await this.executeWithRetry("chat", execute);
  }

  streamChat(request: AgentChatRequest, context?: AdapterRequestContext): AsyncGenerator<AgentEvent> {
    const self = this;
    async function* runner(): AsyncGenerator<AgentEvent> {
      let attempt = 0;
      while (attempt <= self.options.maxRetries) {
        try {
          await self.ensureHealthyAdapter("streamChat");
          for await (const event of self.adapter.streamChat(request, context)) {
            yield event;
            if (event.type === "done" || event.type === "error") {
              return;
            }
          }
          return;
        } catch (error) {
          attempt += 1;
          if (attempt > self.options.maxRetries) {
            throw error;
          }
          self.options.logger.warn(`streamChat failed (attempt ${attempt})`, error);
          await sleep(computeBackoff(attempt));
        }
      }
    }
    return runner();
  }

  async getClientSecret(): Promise<string> {
    await this.ensureHealthyAdapter("getClientSecret");
    if (typeof this.adapter.getClientSecret === "function") {
      return this.adapter.getClientSecret();
    }
    throw new Error("Active adapter does not expose client secrets");
  }

  async health(): Promise<boolean> {
    await this.ensureHealthyAdapter("health");
    if (typeof this.adapter.health !== "function") {
      return true;
    }
    try {
      return await this.adapter.health();
    } catch (error) {
      this.options.logger.warn("health check failed", error);
      return false;
    }
  }

  private async executeWithRetry<T>(
    label: string,
    executor: () => Promise<T>,
    attempt = 0
  ): Promise<T> {
    try {
      const result = executor();
      return await withTimeout(result, this.options.timeoutMs, label);
    } catch (error) {
      if (attempt >= this.options.maxRetries) {
        throw error;
      }
      this.options.logger.warn(`${label} failed (attempt ${attempt + 1})`, error);
      await sleep(computeBackoff(attempt));
      return this.executeWithRetry(label, executor, attempt + 1);
    }
  }

  getAdapterInfo() {
    return {
      id: this.adapter?.id ?? "unknown",
      name: this.adapter?.name,
    };
  }
}

export function createAgentClient(options: AgentClientOptions = {}): AgentClient {
  const config = tryLoadAgentConfig();
  const adapter =
    options.adapter ??
    buildAgentAdapter({
      tenantConfig: options.tenantConfig ?? null,
    });
  const logger = createLogger(options.logger);
  const candidates = buildCandidateAdapters({ tenantConfig: options.tenantConfig ?? null });

  return new DefaultAgentClient(adapter, {
    logger,
    maxRetries: options.maxRetries ?? config?.maxRetries ?? 2,
    timeoutMs: options.timeoutMs ?? config?.timeout ?? 30000,
    candidates,
  });
}
