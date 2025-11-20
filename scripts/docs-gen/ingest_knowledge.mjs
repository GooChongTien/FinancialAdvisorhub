#!/usr/bin/env node
// Minimal knowledge ingestion CLI for Mira
// Usage: node scripts/ingest_knowledge.mjs [--file "docs/# Phase 4 – Expert Brain with examples.txt"]

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import process from 'node:process';
import { createClient } from '@supabase/supabase-js';

function loadEnv() {
  const env = { ...process.env };
  try {
    const raw = fs.readFileSync('.env.local', 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      let val = m[2];
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!(m[1] in env)) env[m[1]] = val;
    }
  } catch (_) {}
  return env;
}

function sha256(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function parseArgs(argv) {
  const args = { file: "docs/# Phase 4 – Expert Brain with examples.txt" };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--file' && argv[i + 1]) {
      args.file = argv[++i];
    }
  }
  return args;
}

function extractAtomsFromText(content) {
  const lines = content.split(/\r?\n/);
  const atoms = [];
  let current = null;
  const headingRe = /^(###|####)\s*(\[?KA-[A-Z]+-\d+\]?)(.*)$/;
  for (const line of lines) {
    const h = line.match(headingRe);
    if (h) {
      if (current) atoms.push(current);
      const rawId = h[2].replace(/[\[\]]/g, '').trim();
      const title = (h[3] || '').trim();
      current = { id: rawId, title, content: '' };
    } else if (current) {
      current.content += (current.content ? '\n' : '') + line;
    }
  }
  if (current) atoms.push(current);
  return atoms.filter((a) => a.id && a.content?.trim());
}

function deriveTriggers(atom) {
  // naive trigger extraction: top tokens from first 200 chars
  const text = (atom.title + ' ' + atom.content.slice(0, 200)).toLowerCase();
  const tokens = text.split(/[^a-z0-9+]+/).filter((t) => t && t.length > 3);
  const freq = new Map();
  for (const t of tokens) freq.set(t, (freq.get(t) || 0) + 1);
  const top = [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([t]) => t);
  return top.map((phrase) => ({ phrase, weight: 1 }));
}

async function upsertSource(supabase, filePath, checksum) {
  const name = path.basename(filePath);
  const type = name.toLowerCase().endsWith('.txt') ? 'txt' : name.toLowerCase().endsWith('.docx') ? 'docx' : 'other';
  const { data, error } = await supabase
    .from('knowledge_sources')
    .upsert({ name, type, path: filePath, checksum }, { onConflict: 'path' })
    .select('id')
    .limit(1)
    .single();
  if (error) throw error;
  return data.id;
}

async function upsertAtom(supabase, sourceId, atom) {
  const contentHash = sha256(atom.content);
  const payload = {
    id: atom.id,
    source_id: sourceId,
    title: atom.title || null,
    content: atom.content,
    content_hash: contentHash,
    topic: atom.id.split('-')[1] || null,
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase.from('knowledge_atoms').upsert(payload, { onConflict: 'id' });
  if (error) throw error;
}

async function upsertTriggers(supabase, atomId, triggers) {
  if (!triggers?.length) return;
  for (const t of triggers) {
    const row = { atom_id: atomId, trigger_phrase: t.phrase, weight: t.weight };
    const { error } = await supabase
      .from('scenario_triggers')
      .upsert(row, { onConflict: 'atom_id,trigger_phrase' });
    if (error) console.warn('[ingest] trigger upsert warning', error.message);
  }
}

async function main() {
  const args = parseArgs(process.argv);
  const abs = path.resolve(process.cwd(), args.file);
  if (!fs.existsSync(abs)) {
    console.error(`[ingest] File not found: ${abs}`);
    process.exit(1);
  }

  const content = fs.readFileSync(abs, 'utf8');
  const checksum = sha256(content);
  const atoms = extractAtomsFromText(content);
  console.log(`[ingest] Parsed ${atoms.length} atoms from ${args.file}`);

  const env = loadEnv();
  const url = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_KEY || env.VITE_SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY;
  if (!url || !serviceKey) {
    console.warn('[ingest] Missing Supabase env; running in dry-run mode');
    for (const a of atoms) {
      const triggers = deriveTriggers(a);
      console.log(`ATOM ${a.id} :: ${a.title || ''} (content ${a.content.length} chars) triggers=${triggers.map((t) => t.phrase).join(',')}`);
    }
    return;
  }

  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
  const sourceId = await upsertSource(supabase, args.file, checksum);
  for (const a of atoms) {
    await upsertAtom(supabase, sourceId, a);
    const triggers = deriveTriggers(a);
    await upsertTriggers(supabase, a.id, triggers);
  }
  console.log('[ingest] Completed');
}

main().catch((err) => {
  console.error('[ingest] Failed', err?.message || err);
  process.exit(1);
});
