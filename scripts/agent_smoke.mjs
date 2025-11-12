#!/usr/bin/env node
import fs from 'fs';

function loadEnv() {
  try {
    const raw = fs.readFileSync('.env.local', 'utf8');
    const map = {};
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (m) {
        let v = m[2];
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
        map[m[1]] = v;
      }
    }
    return map;
  } catch {
    return {};
  }
}

async function main() {
  const env = { ...process.env, ...loadEnv() };
  const base = env.VITE_AGENT_API_URL || `${env.VITE_SUPABASE_URL?.replace(/\/?$/, '')}/functions/v1`;
  if (!base) {
    console.error('Missing VITE_AGENT_API_URL or VITE_SUPABASE_URL');
    process.exit(2);
  }

  const headers = { 'Content-Type': 'application/json' };
  if (env.VITE_SUPABASE_ANON_KEY) headers['apikey'] = env.VITE_SUPABASE_ANON_KEY;
  if (env.SUPABASE_SERVICE_ROLE_KEY) headers['Authorization'] = `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`;

  // 1) Health check
  const health = await fetch(`${base}/agent-chat`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ mode: 'health' }),
  });
  if (!health.ok) {
    console.error('Health check failed', health.status);
    process.exit(1);
  }
  const hjson = await health.json().catch(() => ({}));
  if (String(hjson?.status).toLowerCase() !== 'ok') {
    console.error('Unexpected health payload', hjson);
    process.exit(1);
  }

  // 2) Batch chat sanity
  const batch = await fetch(`${base}/agent-chat`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ mode: 'batch', messages: [{ role: 'user', content: 'Hello Mira' }] }),
  });
  if (!batch.ok) {
    console.error('Batch chat failed', batch.status);
    process.exit(1);
  }
  const bjson = await batch.json().catch(() => ({}));
  if (!bjson?.message?.content) {
    console.error('Batch chat returned no content', bjson);
    process.exit(1);
  }

  console.log('Agent smoke OK');
}

main().catch((e) => {
  console.error('Smoke error', e);
  process.exit(1);
});

