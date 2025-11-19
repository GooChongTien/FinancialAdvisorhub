import { describe, expect, it, vi } from "vitest";

vi.mock("https://esm.sh/zod@3.25.76", async () => {
  const actual = await vi.importActual<typeof import("zod")>("zod");
  return { z: actual.z };
});

vi.mock("https://esm.sh/@supabase/supabase-js@2.45.0", () => {
  return {
    createClient: () => ({
      from: () => ({
        select: () => ({ range: () => ({ data: [], error: null, count: 0 }), eq: () => ({}) }),
        insert: () => ({ select: () => ({ maybeSingle: () => ({ data: null, error: null }) }) }),
        update: () => ({ select: () => ({ maybeSingle: () => ({ data: null, error: null }) }) }),
        order: () => ({ limit: () => ({ data: [], error: null }) }),
        limit: () => ({ data: [], error: null }),
        gt: () => ({ data: [], error: null }),
        gte: () => ({ data: [], error: null }),
        lt: () => ({ data: [], error: null }),
        lte: () => ({ data: [], error: null }),
        or: () => ({ limit: () => ({ data: [], error: null }) }),
      }),
      auth: { getUser: async () => ({ data: { user: { id: null } } }) },
    }),
  };
});

import { toolRegistry } from "../../supabase/functions/_shared/services/tools/registry.ts";

import "../../supabase/functions/_shared/services/tools/customer-tools.ts";
import "../../supabase/functions/_shared/services/tools/new-business-tools.ts";
import "../../supabase/functions/_shared/services/tools/product-tools.ts";
import "../../supabase/functions/_shared/services/tools/analytics-tools.ts";
import "../../supabase/functions/_shared/services/tools/todo-tools.ts";
import "../../supabase/functions/_shared/services/tools/broadcast-tools.ts";
import "../../supabase/functions/_shared/services/tools/visualizer-tools.ts";

describe("Tool registry registrations", () => {
  const expectedTools = [
    "customer__leads.list",
    "customer__leads.create",
    "customer__leads.update",
    "customer__leads.search",
    "customer__customers.get",
    "new_business__proposals.list",
    "new_business__proposals.create",
    "new_business__proposals.get",
    "new_business__quotes.generate",
    "new_business__underwriting.submit",
    "new_business__underwriting.checkStatus",
    "product__products.search",
    "analytics__overview.summary",
    "analytics__overview.drilldown",
    "todo__tasks.list",
    "todo__tasks.create",
    "todo__tasks.update",
    "broadcast__broadcasts.create",
    "broadcast__broadcasts.list",
    "broadcast__broadcasts.publish",
    "visualizer__metrics.recent",
  ];

  it("registers all expected tool names", () => {
    for (const name of expectedTools) {
      expect(toolRegistry.getTool(name)).toBeTruthy();
    }
  });
});
