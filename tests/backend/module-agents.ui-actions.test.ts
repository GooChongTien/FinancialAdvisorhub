import { describe, expect, it } from "vitest";
import { CustomerAgent } from "../../supabase/functions/_shared/services/agents/customer-agent.ts";
import { NewBusinessAgent } from "../../supabase/functions/_shared/services/agents/new-business-agent.ts";
import { ProductAgent } from "../../supabase/functions/_shared/services/agents/product-agent.ts";
import { AnalyticsAgent } from "../../supabase/functions/_shared/services/agents/analytics-agent.ts";
import { ToDoAgent } from "../../supabase/functions/_shared/services/agents/todo-agent.ts";

const contexts = {
  customer: { module: "customer", page: "/customer", pageData: {} },
  new_business: { module: "new_business", page: "/new-business", pageData: {} },
  product: { module: "product", page: "/product", pageData: {} },
  analytics: { module: "analytics", page: "/analytics", pageData: {} },
  todo: { module: "todo", page: "/smart-plan", pageData: {} },
};

describe("Skill agents emit templated ui_actions", () => {
  it("CustomerAgent uses CRUD templates for create_lead", async () => {
    const agent = new CustomerAgent();
    const response = await agent.execute("create_lead", contexts.customer, "Add a lead");
    expect(Array.isArray(response.ui_actions)).toBe(true);
    expect(response.ui_actions?.some((action) => action.action === "navigate")).toBe(true);
    expect(response.ui_actions?.some((action) => action.action === "execute")).toBe(true);
  });

  it("CustomerAgent destructive flows require confirmation", async () => {
    const agent = new CustomerAgent();
    const response = await agent.execute("update_lead_status", contexts.customer, "Update status");
    const confirmAction = response.ui_actions?.find((action) => action.action === "execute");
    expect(confirmAction?.confirm_required).toBe(true);
  });

  it("NewBusinessAgent wiring produces navigate + execute actions", async () => {
    const agent = new NewBusinessAgent();
    const response = await agent.execute("create_proposal", contexts.new_business, "Create proposal");
    expect(response.ui_actions?.map((action) => action.action)).toContain("navigate");
    expect(response.ui_actions?.map((action) => action.action)).toContain("execute");
  });

  it("ProductAgent returns navigate actions for comparisons", async () => {
    const agent = new ProductAgent();
    const response = await agent.execute("compare_products", contexts.product, "Compare products");
    expect(response.ui_actions?.every((action) => action.action === "navigate")).toBe(true);
  });

  it("AnalyticsAgent focuses on navigation actions", async () => {
    const agent = new AnalyticsAgent();
    const response = await agent.execute("view_performance_dashboard", contexts.analytics, "Show dashboard");
    expect(response.ui_actions?.length).toBeGreaterThan(0);
    expect(response.ui_actions?.[0]?.action).toBe("navigate");
  });

  it("ToDoAgent update actions retain confirmation requirements", async () => {
    const agent = new ToDoAgent();
    const response = await agent.execute("mark_complete", contexts.todo, "Mark task");
    const executeAction = response.ui_actions?.find((action) => action.action === "execute");
    expect(executeAction?.confirm_required).toBe(true);
  });
});
