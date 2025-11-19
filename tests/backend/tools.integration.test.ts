import { describe, expect, it, vi } from "vitest";

vi.mock("https://esm.sh/zod@3.25.76", async () => {
  const actual = await vi.importActual<typeof import("zod")>("zod");
  return { z: actual.z };
});

vi.mock("https://esm.sh/@supabase/supabase-js@2.45.0", () => {
  return {
    createClient: () => ({}),
  };
});

const queryStub = (() => {
  const stub: any = {};
  stub.select = () => stub;
  stub.insert = () => ({
    select: () => ({
      maybeSingle: () => ({ data: { id: "mock" }, error: null }),
    }),
  });
  stub.update = () => ({
    eq: () => ({
      select: () => ({
        maybeSingle: () => ({ data: { id: "mock" }, error: null }),
      }),
    }),
  });
  stub.eq = () => stub;
  stub.gte = () => stub;
  stub.lte = () => stub;
  stub.order = () => stub;
  stub.or = () => stub;
  stub.limit = () => ({ data: [], error: null, count: 0 });
  stub.range = () => ({ data: [], error: null, count: 0 });
  stub.maybeSingle = () => ({ data: { id: "mock" }, error: null });
  return stub;
})();

vi.mock("../../supabase/functions/_shared/services/tools/service-client.ts", () => ({
  createServiceClient: () => ({
    from: () => queryStub,
  }),
}));

vi.mock("../../supabase/functions/_shared/services/tools/error-handling.ts", async () => {
  const actual = await vi.importActual("../../supabase/functions/_shared/services/tools/error-handling.ts");
  return {
    ...actual,
    logToolError: vi.fn(),
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

const fakeReq = new Request("https://example.com");

describe("Tool registry end-to-end execution", () => {
  it("executes customer leads list", async () => {
    const result = await toolRegistry.executeTool("customer__leads.list", {
      req: fakeReq,
      args: { filters: { status: "new" } },
    });
    expect(result.success).toBe(true);
  });

  it("creates a new proposal draft", async () => {
    const result = await toolRegistry.executeTool("new_business__proposals.create", {
      req: fakeReq,
      args: { customerId: "C-1", productId: "P-1", advisorId: "A-1", price: 1000 },
    });
    expect(result.success).toBe(true);
  });

  it("executes analytics overview summary", async () => {
    const result = await toolRegistry.executeTool("analytics__overview.summary", {
      req: fakeReq,
      args: { advisorId: "A-1", range: "month" },
    });
    expect(result.success).toBe(true);
  });

  it("creates a todo task", async () => {
    const result = await toolRegistry.executeTool("todo__tasks.create", {
      req: fakeReq,
      args: { title: "Follow up", dueDate: "2025-11-15" },
    });
    expect(result.success).toBe(true);
  });

  it("lists broadcast campaigns", async () => {
    const result = await toolRegistry.executeTool("broadcast__broadcasts.list", {
      req: fakeReq,
      args: { status: "draft" },
    });
    expect(result.success).toBe(true);
  });

  it("fetches recent visualizer metrics", async () => {
    const result = await toolRegistry.executeTool("visualizer__metrics.recent", {
      req: fakeReq,
      args: { advisorId: "A-1" },
    });
    expect(result.success).toBe(true);
  });
});
