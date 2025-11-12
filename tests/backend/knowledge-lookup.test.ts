import { describe, expect, it, vi, beforeEach } from "vitest";

const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockIn = vi.fn();
const mockIlike = vi.fn();
const mockLimit = vi.fn();
const mockMaybeSingle = vi.fn();

function resetSupabaseMock() {
  mockFrom.mockReset().mockImplementation((_table: string) => ({
    select: mockSelect.mockImplementation((_cols?: string) => ({
      eq: mockEq.mockImplementation((_col: string, _val: any) => ({ limit: mockLimit.mockImplementation((_n: number) => ({ maybeSingle: mockMaybeSingle })) })),
      ilike: mockIlike.mockImplementation((_col: string, _val: any) => ({ limit: mockLimit })),
      in: mockIn,
    })),
  }));
  mockSelect.mockReset();
  mockEq.mockReset();
  mockIn.mockReset();
  mockIlike.mockReset();
  mockLimit.mockReset();
  mockMaybeSingle.mockReset();
}

vi.mock("../../backend/api/supabase.ts", () => ({
  createServiceClient: () => ({ from: mockFrom }),
}));

import { knowledgeLookup } from "../../backend/services/knowledge/lookup.ts";

describe("knowledge.lookup", () => {
  beforeEach(() => {
    resetSupabaseMock();
  });

  it("returns atom by id with summary", async () => {
    mockMaybeSingle.mockResolvedValue({ data: { id: "KA-ETH-04", title: "Mis-Selling Red-Flag Pattern", topic: "ETH", content: "- **Domain**: Ethics..." } });
    const res = await knowledgeLookup({ atom_id: "KA-ETH-04" });
    expect(res.items).toHaveLength(1);
    expect(res.items[0]?.atom_id).toBe("KA-ETH-04");
    expect(res.items[0]?.summary.length).toBeGreaterThan(10);
  });

  it("finds atoms via scenario trigger search", async () => {
    // scenario_triggers query
    mockLimit.mockResolvedValue({ data: [ { atom_id: "KA-ETH-04", trigger_phrase: "premium" } ], error: null });
    // knowledge_atoms query using .in
    mockIn.mockResolvedValue({ data: [ { id: "KA-ETH-04", title: "Mis-Selling Red-Flag Pattern", topic: "ETH", content: "- **Domain**: Ethics..." } ], error: null });
    const res = await knowledgeLookup({ scenario: "premium 25% income" });
    expect(res.items.find(i => i.atom_id === "KA-ETH-04")).toBeTruthy();
  });
});
