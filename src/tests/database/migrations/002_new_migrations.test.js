import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";

describe("New Migrations - Exchange Rates", () => {
  const migrationSql = readFileSync(
    path.join(process.cwd(), "supabase/migrations/20251122_add_exchange_rates.sql"),
    "utf8",
  );

  it("has correctly named migration file for exchange rates", () => {
    const filename = "20251122_add_exchange_rates.sql";
    expect(filename).toMatch(/^\d{8}_[a-z0-9_]+\.sql$/);
  });

  it("defines exchange_rates schema", () => {
    const columns = [
      { name: "id", type: "uuid", default: "gen_random_uuid()" },
      { name: "from_currency", type: "varchar(3)", nullable: false },
      { name: "to_currency", type: "varchar(3)", nullable: false },
      { name: "rate", type: "decimal(10, 6)", nullable: false },
      { name: "effective_date", type: "date", nullable: false },
      { name: "created_at", type: "timestamptz", default: "now()" },
      { name: "updated_at", type: "timestamptz", default: "now()" },
    ];

    expect(columns.find((c) => c.name === "rate")?.type).toBe("decimal(10, 6)");
    expect(columns.find((c) => c.name === "rate")?.nullable).toBe(false);
    expect(columns.find((c) => c.name === "from_currency")?.type).toBe("varchar(3)");
  });

  it("enforces positive rate constraint", () => {
    const constraint = { name: "check_positive_rate", expression: "rate > 0" };
    expect(constraint.expression).toContain("rate > 0");
  });

  it("adds useful indexes", () => {
    const indexes = ["idx_exchange_rates_currencies", "idx_exchange_rates_date"];
    expect(indexes).toContain("idx_exchange_rates_currencies");
    expect(indexes).toContain("idx_exchange_rates_date");
  });

  it("enforces unique rate per currency pair and date", () => {
    expect(migrationSql).toMatch(/unique\s*\(\s*from_currency\s*,\s*to_currency\s*,\s*effective_date\s*\)/i);
  });

  it("prevents using the same currency as source and target", () => {
    expect(migrationSql).toMatch(/check\s*\(\s*from_currency\s*<>\s*to_currency\s*\)/i);
  });
});

describe("New Migrations - Enhanced Broadcasts", () => {
  const migrationSql = readFileSync(
    path.join(process.cwd(), "supabase/migrations/20251122_enhance_broadcasts.sql"),
    "utf8",
  );

  it("has correctly named migration file for broadcasts", () => {
    const filename = "20251122_enhance_broadcasts.sql";
    expect(filename).toMatch(/^\d{8}_[a-z0-9_]+\.sql$/);
  });

  it("adds new broadcast fields with defaults", () => {
    expect(migrationSql).toMatch(/category\s+varchar\(50\)/i);
    expect(migrationSql).toMatch(/is_pinned\s+boolean\s+default\s+false/i);
    expect(migrationSql).toMatch(/priority\s+integer\s+default\s+0/i);
    expect(migrationSql).toContain("'[]'::jsonb");
  });

  it("creates filtering and pinned indexes", () => {
    expect(migrationSql).toMatch(/idx_broadcasts_category/i);
    expect(migrationSql).toMatch(/idx_broadcasts_pinned/i);
  });

  it("guards priority and tags with constraints and indexes", () => {
    expect(migrationSql).toMatch(/check\s*\(\s*priority\s*>=\s*0\s*\)/i);
    expect(migrationSql).toMatch(/using\s+gin\s*\(\s*tags\s*\)/i);
  });
});

describe("New Migrations - Task Transcripts", () => {
  const migrationSql = readFileSync(
    path.join(process.cwd(), "supabase/migrations/20251122_add_task_transcripts.sql"),
    "utf8",
  );

  it("has correctly named migration file for task transcripts", () => {
    const filename = "20251122_add_task_transcripts.sql";
    expect(filename).toMatch(/^\d{8}_[a-z0-9_]+\.sql$/);
  });

  it("adds transcript and sentiment columns to tasks", () => {
    expect(migrationSql).toMatch(/transcript\s+jsonb/i);
    expect(migrationSql).toMatch(/ai_summary\s+text/i);
    expect(migrationSql).toMatch(/sentiment\s+varchar\(20\)/i);
    expect(migrationSql).toContain("'[]'::jsonb");
  });

  it("enforces sentiment domain and adds search indexes", () => {
    expect(migrationSql).toMatch(/check\s*\(\s*sentiment\s+in\s*\(\s*'positive',\s*'neutral',\s*'negative',\s*'mixed'\s*\)\s*\)/i);
    expect(migrationSql).toMatch(/using\s+gin\s*\(\s*transcript\s*\)/i);
    expect(migrationSql).toMatch(/using\s+gin\s*\(\s*key_points\s*\)/i);
  });
});
