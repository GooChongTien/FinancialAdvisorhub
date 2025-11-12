import { describe, expect, it } from "vitest";
import { serializeMiraEventFilters } from "@/admin/api/miraOpsApi.js";

describe("serializeMiraEventFilters", () => {
  it("omits empty values and encodes defined filters", () => {
    const query = serializeMiraEventFilters({
      limit: 25,
      offset: 50,
      module: "customer",
      status: "success",
      search: "quote",
      start: "2025-11-01T00:00:00.000Z",
      unused: "",
    });

    expect(query).toBe(
      "limit=25&offset=50&module=customer&status=success&search=quote&start=2025-11-01T00%3A00%3A00.000Z",
    );
  });

  it("returns empty string when filters are empty", () => {
    expect(serializeMiraEventFilters({})).toBe("");
  });
});

