const executors = new Map();

export function registerExecutor(intentName, handler) {
  if (!intentName || typeof handler !== "function") {
    throw new Error("registerExecutor requires intentName and handler");
  }
  executors.set(intentName, handler);
}

export function unregisterExecutor(intentName) {
  executors.delete(intentName);
}

export async function executeIntent(intent, environment = {}) {
  if (!intent || typeof intent.name !== "string") {
    throw new Error("executeIntent requires an intent object");
  }

  const handler = executors.get(intent.name);
  if (!handler) {
    return {
      status: "unhandled",
      intent,
      message: `No executor registered for ${intent.name}`,
    };
  }

  try {
    const result = await handler(intent, environment);
    return {
      status: "completed",
      intent,
      result,
    };
  } catch (error) {
    return {
      status: "error",
      intent,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export function listRegisteredIntents() {
  return Array.from(executors.keys());
}
