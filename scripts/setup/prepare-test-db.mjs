#!/usr/bin/env node
/**
 * Lightweight helper to prepare a local Postgres test database.
 * Usage:
 *   TEST_DATABASE_URL=postgres://... npm run test:unit
 *   node scripts/setup/prepare-test-db.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envUrl = process.env.TEST_DATABASE_URL;
const configPath = path.resolve(__dirname, "./test-db.config.json");

function loadConfig() {
  if (envUrl) return { connectionString: envUrl };
  if (fs.existsSync(configPath)) {
    return JSON.parse(fs.readFileSync(configPath, "utf-8"));
  }
  return null;
}

async function runSql(client, filePath) {
  if (!fs.existsSync(filePath)) return;
  const sql = fs.readFileSync(filePath, "utf-8");
  if (!sql.trim()) return;
  await client.query(sql);
}

async function main() {
  const config = loadConfig();
  if (!config?.connectionString) {
    console.log("[prepare-test-db] Skipping (no TEST_DATABASE_URL or config file).");
    process.exit(0);
  }

  const client = new pg.Client({
    connectionString: config.connectionString,
    ssl: config.ssl ? { rejectUnauthorized: false } : false,
  });

  try {
    await client.connect();
    console.log("[prepare-test-db] Connected.");

    const schemaPath = path.resolve(__dirname, "../../tests/database/schema.sql");
    const seedPath = path.resolve(__dirname, "../../tests/database/seed.sql");

    await runSql(client, schemaPath);
    await runSql(client, seedPath);

    console.log("[prepare-test-db] Schema and seed applied (idempotent).");
  } catch (err) {
    console.error("[prepare-test-db] Failed:", err.message);
    process.exitCode = 1;
  } finally {
    await client.end().catch(() => {});
  }
}

main();
