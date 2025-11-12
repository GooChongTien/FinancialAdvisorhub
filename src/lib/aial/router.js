const isDev = (() => {
  try {
    return typeof import.meta !== "undefined" &&
      typeof import.meta.env !== "undefined" &&
      import.meta.env &&
      import.meta.env.MODE === "development";
  } catch {
    return false;
  }
})();

const defaultLogger = {
  debug: (...args) => {
    if (isDev) {
      console.debug("[AIAL]", ...args);
    }
  },
  warn: (...args) => console.warn("[AIAL]", ...args),
  error: (...args) => console.error("[AIAL]", ...args),
};

function toArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value.slice() : [value];
}

async function adapterIsHealthy(adapter) {
  if (typeof adapter?.health !== "function") {
    return true;
  }
  try {
    return await adapter.health();
  } catch (error) {
    defaultLogger.warn(`Health check failed for adapter ${adapter?.id ?? "unknown"}`, error);
    return false;
  }
}

export class AIALRouter {
  constructor(adapters = [], options = {}) {
    this.adapters = toArray(adapters);
    this.logger = options.logger ?? defaultLogger;
    this.onAdapterError = options.onAdapterError;
  }

  registerAdapter(adapter) {
    if (!adapter) return;
    this.adapters.push(adapter);
  }

  setAdapters(nextAdapters = []) {
    this.adapters = toArray(nextAdapters);
  }

  getAdapters() {
    return this.adapters.slice();
  }

  async execute(event) {
    if (!event || typeof event !== "object") {
      throw new Error("AIALRouter.execute requires an event object");
    }
    if (!Array.isArray(this.adapters) || this.adapters.length === 0) {
      throw new Error("AIALRouter has no adapters registered");
    }

    for (const adapter of this.adapters) {
      if (!adapter) continue;

      const adapterId = adapter.id ?? "unknown";
      const healthy = await adapterIsHealthy(adapter);
      if (!healthy) {
        this.logger.debug(`Skipping adapter ${adapterId} (unhealthy)`);
        continue;
      }

      try {
        const response = await adapter.execute(event);
        if (!response) {
          throw new Error(`Adapter ${adapterId} returned no response`);
        }
        return {
          adapterId,
          model: adapter.model ?? "unknown",
          ...response,
        };
      } catch (error) {
        this.logger.warn(`Adapter ${adapterId} failed`, error);
        if (typeof this.onAdapterError === "function") {
          this.onAdapterError({ adapter, error, event });
        }
        continue;
      }
    }

    throw new Error("No healthy AI provider available");
  }
}
