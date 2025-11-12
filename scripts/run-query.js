#!/usr/bin/env node
/**
 * Run a SQL query against Postgres and print the JSON result.
 *
 * Usage:
 *   node scripts/run-query.js "select 1"
 */

import { exit } from 'node:process';
import { Client } from 'pg';

const query = process.argv.slice(2).join(' ');

if (!query) {
  console.error('Usage: node scripts/run-query.js "<sql-query>"');
  exit(1);
}

const requiredEnv = ['PGHOST', 'PGUSER', 'PGPASSWORD', 'PGDATABASE'];
const missing = requiredEnv.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(`Missing required environment variables: ${missing.join(', ')}`);
  exit(1);
}

const port = Number.parseInt(process.env.PGPORT ?? '5432', 10);

const client = new Client({
  host: process.env.PGHOST,
  port: Number.isNaN(port) ? 5432 : port,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  const result = await client.query(query);
  console.log(JSON.stringify(result.rows, null, 2));
} catch (error) {
  console.error('Query failed:', error instanceof Error ? error.message : error);
  exit(1);
} finally {
  await client.end().catch(() => {});
}
