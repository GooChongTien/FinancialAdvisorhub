import { describe, expect, it, beforeEach, vi } from "vitest";

const updates: any[] = [];

function buildSupabaseMock() {
  const mockFrom = vi.fn((table: string) => {
    const api: any = {
      _payload: null,
      _eq: null,
      insert: vi.fn((payload: any) => {
        api._payload = payload;
        return api;
      }),
      update: vi.fn((payload: any) => {
        api._payload = payload;
        return api;
      }),
      delete: vi.fn(() => api),
      select: vi.fn(() => api),
      order: vi.fn(() => api),
      limit: vi.fn(() => api),
      in: vi.fn(() => api),
      is: vi.fn(() => api),
      eq: vi.fn((col: string, val: any) => {
        api._eq = [col, val];
        return api;
      }),
      single: vi.fn(async () => {
        if (table === "service_requests") {
          return { data: { id: "req-1", lead_id: "lead-123" }, error: null };
        }
        if (table === "tasks") {
          return { data: { id: "task-1", linked_lead_id: "lead-123" }, error: null };
        }
        if (table === "leads") {
          const payload = (api._payload?.[0] ?? api._payload) || {};
          updates.push(payload);
          return { data: { id: api._eq?.[1], ...payload }, error: null };
        }
        return { data: {}, error: null };
      }),
      maybeSingle: vi.fn(async () => ({ data: null, error: null })),
    };
    return api;
  });

  const supabase = {
    auth: {
      getUser: vi.fn(async () => ({ data: { user: { id: "advisor-1" } } })),
    },
    from: mockFrom,
  };

  return { supabase, mockFrom };
}

describe("adviseUAdminApi activity tracking", () => {
  beforeEach(() => {
    vi.resetModules();
    updates.length = 0;
  });

  it("updates lead temperature when creating a service request", async () => {
    const { supabase } = buildSupabaseMock();
    vi.doMock("@/admin/api/supabaseClient.js", () => ({
      __esModule: true,
      default: supabase,
    }));
    const { adviseUAdminApi } = await import("@/admin/api/adviseUAdminApi.js");

    await adviseUAdminApi.entities.ServiceRequest.create({ lead_id: "lead-123" });
    await new Promise((resolve) => setImmediate(resolve));

    expect(updates.length).toBeGreaterThan(0);
    const activityUpdate = updates.find((u) => u.temperature || u.temperature_bucket);
    expect(activityUpdate?.temperature ?? activityUpdate?.temperature_bucket).toBeTruthy();
    expect(activityUpdate?.last_activity_type).toBe("service_request");
  });

  it("updates lead temperature when creating a task linked to a lead", async () => {
    const { supabase } = buildSupabaseMock();
    vi.doMock("@/admin/api/supabaseClient.js", () => ({
      __esModule: true,
      default: supabase,
    }));
    const { adviseUAdminApi } = await import("@/admin/api/adviseUAdminApi.js");

    await adviseUAdminApi.entities.Task.create({ linked_lead_id: "lead-123" });
    await new Promise((resolve) => setImmediate(resolve));

    expect(updates.length).toBeGreaterThan(0);
    const activityUpdate = updates.find((u) => u.temperature || u.temperature_bucket);
    expect(activityUpdate?.last_activity_type).toBe("task");
  });
});
