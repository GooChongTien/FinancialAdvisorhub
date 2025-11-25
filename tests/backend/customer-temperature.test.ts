import { describe, it, expect } from "vitest";
import { calculateCustomerTemperature, mergeTemperatureSnapshots } from "@/lib/customer-temperature";

const daysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
};

describe("calculateCustomerTemperature", () => {
  it("returns hot when last contacted within 7 days", () => {
    const result = calculateCustomerTemperature({
      lastInteractionAt: daysAgo(5),
    });
    expect(result.bucket).toBe("hot");
    expect(result.score).toBeGreaterThanOrEqual(0.7);
  });

  it("returns warm when last contacted within 30 days", () => {
    const result = calculateCustomerTemperature({
      lastInteractionAt: daysAgo(20),
    });
    expect(result.bucket).toBe("warm");
    expect(result.score).toBeGreaterThan(0.4);
  });

  it("returns cold when never contacted and no active work", () => {
    const result = calculateCustomerTemperature({});
    expect(result.bucket).toBe("cold");
    expect(result.score).toBeLessThan(0.4);
  });

  it("returns warm when >30 days but has active proposal", () => {
    const result = calculateCustomerTemperature({
      lastInteractionAt: daysAgo(60),
      activeProposals: 1,
    });
    expect(result.bucket).toBe("warm");
  });

  it("returns warm when >30 days but has active service request", () => {
    const result = calculateCustomerTemperature({
      lastInteractionAt: daysAgo(90),
      openServiceRequests: 1,
    });
    expect(result.bucket).toBe("warm");
  });

  it("returns cold when >30 days and no active work", () => {
    const result = calculateCustomerTemperature({
      lastInteractionAt: daysAgo(60),
      activeProposals: 0,
      openServiceRequests: 0,
    });
    expect(result.bucket).toBe("cold");
  });

  it("handles invalid dates gracefully", () => {
    const result = calculateCustomerTemperature({
      lastInteractionAt: "not-a-date",
    });
    expect(result.bucket).toBe("cold");
  });
});

describe("mergeTemperatureSnapshots", () => {
  it("returns cold for empty input", () => {
    expect(mergeTemperatureSnapshots([])).toEqual({ bucket: "cold", score: 0 });
  });

  it("returns the highest bucket among snapshots", () => {
    const merged = mergeTemperatureSnapshots([
      { bucket: "cold", score: 0.2 },
      { bucket: "warm", score: 0.5 },
      { bucket: "hot", score: 0.9 },
    ]);
    expect(merged.bucket).toBe("hot");
    expect(merged.score).toBe(0.9);
  });
});
