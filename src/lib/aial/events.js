import { getEnvVar } from "./config.js";

const DEFAULT_SOURCE = "web";

function randomId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `evt_${Math.random().toString(36).slice(2, 10)}`;
}

export function buildMetadata(overrides = {}) {
  const timestamp = overrides.timestamp ?? Date.now();
  const requestId = overrides.requestId ?? randomId();
  const source =
    overrides.source ??
    getEnvVar("MIRA_DEFAULT_SOURCE") ??
    DEFAULT_SOURCE;

  return {
    requestId,
    source,
    timestamp,
    ...("channel" in overrides ? { channel: overrides.channel } : {}),
    ...("tenantId" in overrides ? { tenantId: overrides.tenantId } : {}),
  };
}

export function createAialEvent({ id, intent = "freeform.message", payload = {}, metadata = {} } = {}) {
  const eventId = id ?? randomId();
  const normalizedMetadata = buildMetadata(metadata);

  return {
    id: eventId,
    intent,
    payload,
    metadata: normalizedMetadata,
  };
}
