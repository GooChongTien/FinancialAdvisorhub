import { describe, it, expect } from "vitest";
import { intentLabel } from "../../supabase/functions/_shared/services/router/intent-label.ts";

describe("intentLabel", () => {
  it("returns friendly phrase for customer create lead intent", () => {
    expect(intentLabel("create_lead")).toBe("create new lead");
  });

  it("uses taxonomy display names when available", () => {
    expect(intentLabel("view_performance_dashboard")).toBe("view performance dashboard");
  });

  it("falls back gracefully when intent is unknown", () => {
    expect(intentLabel("totally_unknown_intent")).toBe("continue with this action");
  });
});
