const DEFAULT_NAMESPACE = "[AgentChat]";

function nowIso() {
  return new Date().toISOString();
}

export interface RequestLoggerOptions {
  requestId: string;
  tenantId?: string | null;
  mode?: string;
}

export interface RequestLogger {
  info(event: string, data?: Record<string, unknown>): void;
  warn(event: string, data?: Record<string, unknown>): void;
  error(event: string, data?: Record<string, unknown>): void;
}

function emit(level: "info" | "warn" | "error", event: string, payload: Record<string, unknown>) {
  const entry = {
    ts: nowIso(),
    event,
    ...payload,
  };

  if (level === "info") {
    console.info(DEFAULT_NAMESPACE, JSON.stringify(entry));
  } else if (level === "warn") {
    console.warn(DEFAULT_NAMESPACE, JSON.stringify(entry));
  } else {
    console.error(DEFAULT_NAMESPACE, JSON.stringify(entry));
  }
}

export function createRequestLogger(options: RequestLoggerOptions): RequestLogger {
  const base = {
    requestId: options.requestId,
    ...(options.tenantId ? { tenantId: options.tenantId } : {}),
    ...(options.mode ? { mode: options.mode } : {}),
  };

  return {
    info(event, data = {}) {
      emit("info", event, { ...base, ...data });
    },
    warn(event, data = {}) {
      emit("warn", event, { ...base, ...data });
    },
    error(event, data = {}) {
      emit("error", event, { ...base, ...data });
    },
  };
}
