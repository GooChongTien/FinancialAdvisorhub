import { describe, it, expect } from "vitest";
import { needsClarification, buildClarificationMessage } from "../../supabase/functions/_shared/services/router/clarification.ts";

describe("clarification helpers", () => {
  it("returns false for medium confidence but still provides confirmation copy", () => {
    expect(needsClarification("medium")).toBe(false);
    expect(buildClarificationMessage({ intent: "create_lead", confidenceTier: "medium" })).toContain("Just to confirm");
  });

  it("asks for more detail for low confidence", () => {
    expect(needsClarification("low")).toBe(true);
    expect(buildClarificationMessage({ intent: "view_performance_dashboard", confidenceTier: "low" })).toContain("make sure I get this right");
  });

  it("skips clarification for high confidence", () => {
    expect(needsClarification("high")).toBe(false);
  });
});
