import { describe, expect, it } from "vitest";
import { spawnSync } from "child_process";
import path from "path";

const scriptPath = path.resolve("scripts/setup/prepare-test-db.mjs");

describe("prepare-test-db script", () => {
  it("exits cleanly when no TEST_DATABASE_URL is provided", async () => {
    const result = spawnSync("node", [scriptPath], {
      env: { ...process.env, TEST_DATABASE_URL: "" },
      encoding: "utf-8",
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/Skipping/i);
  });
});
