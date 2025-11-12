const FEATURE_TRUE_VALUES = new Set(["1", "true", "yes", "on", "enabled"]);

function hasImportMetaEnv() {
  try {
    // Guard for SSR environments where import.meta might be undefined.
    return typeof import.meta !== "undefined" && !!import.meta && !!import.meta.env;
  } catch {
    return false;
  }
}

function hasProcessEnv() {
  return typeof process !== "undefined" && typeof process.env !== "undefined";
}

export function getEnvVar(name) {
  const candidates = [`VITE_${name}`, name];

  if (hasImportMetaEnv()) {
    for (const key of candidates) {
      if (Object.prototype.hasOwnProperty.call(import.meta.env, key)) {
        return import.meta.env[key];
      }
    }
  }

  if (hasProcessEnv()) {
    for (const key of candidates) {
      if (Object.prototype.hasOwnProperty.call(process.env, key)) {
        return process.env[key];
      }
    }
  }

  return undefined;
}

export function isFeatureEnabled(name, defaultValue = false) {
  const raw = getEnvVar(name);
  if (raw === undefined || raw === null) {
    return defaultValue;
  }

  if (typeof raw === "boolean") {
    return raw;
  }

  if (typeof raw === "number") {
    return raw !== 0;
  }

  if (typeof raw === "string") {
    const trimmed = raw.trim().toLowerCase();
    if (trimmed === "") return defaultValue;
    if (FEATURE_TRUE_VALUES.has(trimmed)) return true;
    if (trimmed === "0" || trimmed === "false" || trimmed === "no" || trimmed === "off" || trimmed === "disabled") {
      return false;
    }
  }

  return defaultValue;
}

export function parseIntegerEnv(name, fallback) {
  const raw = getEnvVar(name);
  if (raw === undefined || raw === null || raw === "") {
    return fallback;
  }
  const numberValue = Number.parseInt(String(raw), 10);
  return Number.isNaN(numberValue) ? fallback : numberValue;
}

export function parseNumberEnv(name, fallback) {
  const raw = getEnvVar(name);
  if (raw === undefined || raw === null || raw === "") {
    return fallback;
  }
  const numberValue = Number.parseFloat(String(raw));
  return Number.isNaN(numberValue) ? fallback : numberValue;
}
