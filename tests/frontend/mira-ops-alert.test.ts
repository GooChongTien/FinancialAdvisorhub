import { describe, expect, it } from "vitest";
import { buildAlertState } from "@/admin/lib/miraOpsMetrics.js";

function createEvent({ success, id }) {
  return {
    id,
    success,
    actions: [{ action_type: "navigate" }],
    metadata: {},
    created_at: new Date().toISOString(),
  };
}

describe("buildAlertState", () => {
  it("activates when failure rate exceeds 5%", () => {
    const events = [
      ...Array.from({ length: 95 }, (_, index) => createEvent({ success: true, id: `s-${index}` })),
      ...Array.from({ length: 6 }, (_, index) => createEvent({ success: false, id: `f-${index}` })),
    ];
    const state = buildAlertState(events, 0.05, 50);
    expect(state.active).toBe(true);
    expect(state.rate).toBeGreaterThan(0.05);
    expect(state.total).toBe(events.length);
  });

  it("clears when rate drops below threshold", () => {
    const events = [
      ...Array.from({ length: 59 }, (_, index) => createEvent({ success: true, id: `s-${index}` })),
      createEvent({ success: false, id: "f-1" }),
    ];
    const state = buildAlertState(events, 0.05, 20);
    expect(state.active).toBe(false);
    expect(state.rate).toBeLessThan(0.05);
  });
});
