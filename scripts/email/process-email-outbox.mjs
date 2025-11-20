#!/usr/bin/env node
/**
 * Process or enqueue emails in email_outbox using Supabase Service Role.
 *
 * Env vars required:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * Usage:
 *   node scripts/process-email-outbox.mjs                # process queued (max 20)
 *   node scripts/process-email-outbox.mjs --queue \
 *     --to you@example.com --subject "Test" --body "Hello"
 */

import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (!next || next.startsWith('--')) {
        args[key] = true;
      } else {
        args[key] = next;
        i++;
      }
    } else {
      args._.push(a);
    }
  }
  return args;
}

async function enqueue({ to, subject, body, template = null }) {
  if (!to || !subject || !body) {
    throw new Error('enqueue requires to, subject, body');
  }
  const { error } = await supabase.from('email_outbox').insert([
    { to_email: to, subject, body, template, status: 'queued' },
  ]);
  if (error) throw error;
  console.log('Enqueued email to', to);
}

async function processQueue(limit = 20) {
  const { data, error } = await supabase
    .from('email_outbox')
    .select('id,to_email,subject')
    .eq('status', 'queued')
    .order('created_at', { ascending: true })
    .limit(limit);
  if (error) throw error;
  const rows = data || [];
  if (rows.length === 0) {
    console.log('No queued emails.');
    return;
  }
  for (const row of rows) {
    try {
      // Simulate successful send; replace with provider integration later
      console.log(`[send] ${row.to_email} | ${row.subject}`);
      const { error: updErr } = await supabase
        .from('email_outbox')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', row.id);
      if (updErr) throw updErr;
    } catch (e) {
      console.warn('Failed to mark sent:', e?.message || e);
      await supabase.from('email_outbox').update({ status: 'failed' }).eq('id', row.id);
    }
  }
  console.log('Processed', rows.length, 'emails.');
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.queue || args['enqueue']) {
    await enqueue({ to: args.to, subject: args.subject, body: args.body, template: args.template ?? null });
  } else {
    await processQueue();
  }
}

main().catch((e) => {
  console.error(e?.message || e);
  process.exit(1);
});

