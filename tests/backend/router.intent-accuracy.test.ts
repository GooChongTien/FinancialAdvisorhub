import { beforeEach, describe, expect, it } from "vitest";
import { intentRouter } from "../../supabase/functions/_shared/services/router/intent-router.ts";
import { resetIntentCache } from "../../supabase/functions/_shared/services/router/intent-cache.ts";
import { applyThresholds } from "../../supabase/functions/_shared/services/router/confidence-scorer.ts";

const dataset = [
  { message: "Add a new lead named Sarah Lee with contact 91234567", intent: "create_lead", module: "customer" },
  { message: "Search for leads named David that came from referrals", intent: "search_leads", module: "customer" },
  { message: "Show me all hot leads this week", intent: "filter_leads", module: "customer" },
  { message: "Schedule a meeting with John Tan tomorrow at 2pm", intent: "schedule_appointment", module: "customer" },
  { message: "Update this lead status to qualified", intent: "update_lead_status", module: "customer" },
  { message: "Open the lead details for Amanda Lim", intent: "view_lead_details", module: "customer" },
  { message: "Start a new proposal for lead Sarah Lee", intent: "create_proposal", module: "new_business" },
  { message: "List submitted proposals from today", intent: "view_proposals", module: "new_business" },
  { message: "Advance proposal P-3002 to Financial Planning stage", intent: "update_proposal_stage", module: "new_business" },
  { message: "Submit this proposal for underwriting", intent: "submit_for_underwriting", module: "new_business" },
  { message: "Check underwriting status for proposal P-3002", intent: "check_underwriting_status", module: "new_business" },
  { message: "Generate a quote for product PR-1001 for customer C-2001", intent: "generate_quote", module: "new_business" },
  { message: "Show retirement income products", intent: "search_products_by_need", module: "product" },
  { message: "View product details for WealthPlus Saver", intent: "view_product_details", module: "product" },
  { message: "Compare PruLife with PruTerm", intent: "compare_products", module: "product" },
  { message: "Show my performance dashboard for this month", intent: "view_performance_dashboard", module: "analytics" },
  { message: "Open the conversion funnel view", intent: "view_conversion_funnel", module: "analytics" },
  { message: "Compare my metrics with the team average", intent: "compare_with_team", module: "analytics" },
  { message: "Create a follow-up task due tomorrow", intent: "create_task", module: "todo" },
  { message: "Show my calendar for next week", intent: "view_calendar", module: "todo" },
  { message: "Create a broadcast campaign for the Q4 promo", intent: "create_broadcast", module: "broadcast" },
];

beforeEach(() => {
  resetIntentCache();
});

describe("Intent Router accuracy", () => {
  it("classifies curated dataset with >= 90% accuracy", async () => {
    let correct = 0;
    for (const sample of dataset) {
      const context = { module: sample.module, page: `/${sample.module}`, pageData: {} };
      const result = await intentRouter.classifyIntent(sample.message, context);
      if (result.intent === sample.intent) {
        correct += 1;
      }
    }
    expect(correct / dataset.length).toBeGreaterThanOrEqual(0.9);
  });
});

describe("Confidence thresholds", () => {
  it("labels high confidence for strong matches", () => {
    const decision = applyThresholds({
      intent: "create_lead",
      topic: "customer",
      subtopic: "lead_management",
      baseScore: 0.9,
      adjustedScore: 0.9,
      reasons: ["example_overlap"],
    });
    expect(decision.threshold).toBe("high");
  });

  it("labels medium confidence for borderline matches", () => {
    const decision = applyThresholds({
      intent: "view_performance_dashboard",
      topic: "analytics",
      subtopic: "performance",
      baseScore: 0.45,
      adjustedScore: 0.45,
      reasons: ["context_module_match"],
    });
    expect(decision.threshold).toBe("medium");
  });

  it("labels low confidence when score is below thresholds", () => {
    const decision = applyThresholds({
      intent: "fallback",
      topic: "customer",
      subtopic: "general",
      baseScore: 0.1,
      adjustedScore: 0.1,
      reasons: [],
    });
    expect(decision.threshold).toBe("low");
  });
});
