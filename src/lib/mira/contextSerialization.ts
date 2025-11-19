import type { MiraContext } from "@/lib/mira/types.ts";

const MAX_CONTEXT_BYTES = 2000;
const MAX_PAGE_DATA_DEPTH = 2;
const MAX_PAGE_DATA_KEYS = 24;
const MAX_ARRAY_LENGTH = 10;
const MAX_STRING_LENGTH = 256;

const encoder = new TextEncoder();

type AnyRecord = Record<string, unknown>;

function isPlainObject(value: unknown): value is AnyRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function coercePrimitive(value: unknown) {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  return undefined;
}

function measureBytes(payload: unknown): number {
  try {
    return encoder.encode(JSON.stringify(payload ?? null)).length;
  } catch {
    return 0;
  }
}

function pruneValue(
  value: unknown,
  depth: number,
  trimmedFields: string[],
  path: string,
): unknown {
  const primitive = coercePrimitive(value);
  if (typeof primitive === "string") {
    if (primitive.length > MAX_STRING_LENGTH) {
      trimmedFields.push(path);
      return `${primitive.slice(0, MAX_STRING_LENGTH)}…`;
    }
    return primitive;
  }
  if (primitive !== undefined) return primitive;

  if (Array.isArray(value)) {
    const limited = value.slice(0, MAX_ARRAY_LENGTH).map((item, index) =>
      pruneValue(item, depth + 1, trimmedFields, `${path}[${index}]`),
    );
    if (value.length > limited.length) {
      trimmedFields.push(`${path}[]`);
      limited.push("…");
    }
    return limited;
  }

  if (isPlainObject(value) && depth < MAX_PAGE_DATA_DEPTH) {
    const entries = Object.entries(value).filter(
      ([, val]) => typeof val !== "function" && val !== undefined,
    );
    const limited = entries.slice(0, MAX_PAGE_DATA_KEYS);
    const result: AnyRecord = {};
    for (const [key, val] of limited) {
      result[key] = pruneValue(val, depth + 1, trimmedFields, `${path}.${key}`);
    }
    if (entries.length > limited.length) {
      trimmedFields.push(`${path}.__keys__`);
    }
    return result;
  }

  trimmedFields.push(path);
  return undefined;
}

function prunePageData(
  pageData: unknown,
  trimmedFields: string[],
): AnyRecord | undefined {
  if (!isPlainObject(pageData)) return undefined;
  const result = pruneValue(pageData, 0, trimmedFields, "pageData");
  return isPlainObject(result) && Object.keys(result).length > 0 ? result : undefined;
}

export interface ContextSerializationMetrics {
  originalBytes: number;
  sanitizedBytes: number;
  trimmedFields: string[];
}

export interface SanitizedContextResult {
  context?: MiraContext;
  metrics: ContextSerializationMetrics;
}

export function sanitizeContextPayload(
  rawContext?: MiraContext | null,
): SanitizedContextResult {
  if (!rawContext || typeof rawContext !== "object") {
    return {
      context: undefined,
      metrics: { originalBytes: 0, sanitizedBytes: 0, trimmedFields: [] },
    };
  }

  const trimmedFields: string[] = [];
  const originalBytes = measureBytes(rawContext);

  const sanitized: MiraContext = {
    module: rawContext.module,
    page: rawContext.page,
  };

  const prunedPageData = prunePageData(rawContext.pageData, trimmedFields);
  if (prunedPageData) {
    sanitized.pageData = prunedPageData;
  }

  let sanitizedBytes = measureBytes(sanitized);
  if (sanitizedBytes > MAX_CONTEXT_BYTES && sanitized.pageData) {
    trimmedFields.push("pageData.__dropped__");
    delete sanitized.pageData;
    sanitizedBytes = measureBytes(sanitized);
  }

  return {
    context: sanitized,
    metrics: {
      originalBytes,
      sanitizedBytes,
      trimmedFields,
    },
  };
}
