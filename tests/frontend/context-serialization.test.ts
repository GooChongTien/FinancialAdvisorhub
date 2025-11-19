import { describe, expect, it } from "vitest";
import { sanitizeContextPayload } from "../../src/lib/mira/contextSerialization.ts";

describe("sanitizeContextPayload", () => {
  it("trims large pageData payloads and records metrics", () => {
    const context = {
      module: "customer",
      page: "/customer",
      pageData: {
        note: "a".repeat(600),
        nested: { big: "b".repeat(600) },
        arrayValues: Array.from({ length: 15 }, (_, idx) => ({ idx, value: "x".repeat(50) })),
      },
    };

    const { context: sanitized, metrics } = sanitizeContextPayload(context);
    expect(sanitized?.pageData?.note?.length).toBeLessThanOrEqual(257);
    expect(Array.isArray(sanitized?.pageData?.arrayValues)).toBe(true);
    expect(metrics.trimmedFields.length).toBeGreaterThan(0);
    expect(metrics.sanitizedBytes).toBeLessThan(metrics.originalBytes);
  });

  it("drops pageData entirely when still over byte budget", () => {
    const context = {
      module: "analytics",
      page: "/analytics",
      pageData: Array.from({ length: 100 }, (_, idx) => ({ row: idx, value: "data" })),
    };

    const { context: sanitized } = sanitizeContextPayload(context);
    expect(sanitized?.pageData).toBeUndefined();
  });

  it("handles undefined context gracefully", () => {
    const result = sanitizeContextPayload(undefined);
    expect(result.context).toBeUndefined();
    expect(result.metrics.originalBytes).toBe(0);
  });
});
