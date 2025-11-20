#!/usr/bin/env node
/**
 * Simple helper to run a SQL file against Postgres using the pg client.
 *
 * Required environment variables:
 *   PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE
 *
 * Usage:
 *   node scripts/run-sql.js path/to/file.sql
 */

import { readFile } from 'node:fs/promises';
import { exit } from 'node:process';
import { Client } from 'pg';

const [, , sqlFile] = process.argv;

if (!sqlFile) {
  console.error('Usage: node scripts/run-sql.js <path-to-sql-file>');
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
  const sql = await readFile(sqlFile, 'utf8');
  await client.connect();
  await client.query(sql);
  console.log(`Executed SQL from ${sqlFile}`);
} catch (error) {
  console.error('Failed to execute SQL file:', error instanceof Error ? error.message : error);
  exit(1);
} finally {
  await client.end().catch(() => {});
}
