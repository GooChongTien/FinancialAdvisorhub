import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import { spawn } from 'node:child_process';

export function loadEnv() {
  const raw = fs.readFileSync('.env.local', 'utf8');
  const map: Record<string, string> = {} as any;
  for (const line of raw.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (match) {
      let value = match[2];
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      map[match[1]] = value;
    }
  }
  return map;
}

export async function ensureAdvisorUser() {
  const env = loadEnv();
  const email = env.E2E_EMAIL || 'advisor.e2e@advisorhub.io';
  const password = env.E2E_PASSWORD || 'DevPassword123!';
  const serviceRole =
    env.SUPABASE_SERVICE_ROLE_KEY ||
    env.SUPABASE_SERVICE_KEY ||
    env.VITE_SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRole) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for Playwright auth.');
  }
  const adminClient = createClient(env.VITE_SUPABASE_URL!, serviceRole, { auth: { persistSession: false } });
  const existing = await adminClient.auth.admin.listUsers({ email });
  let user = existing.data?.users?.[0] ?? null;
  if (!user) {
    try {
      const created = await adminClient.auth.admin.createUser({ email, password, email_confirm: true });
      if (created.error) throw created.error;
      user = created.data.user;
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message ?? '';
      if (!message.toLowerCase().includes('already been registered')) {
        throw err;
      }
      const retry = await adminClient.auth.admin.listUsers({ email });
      user = retry.data?.users?.[0] ?? null;
    }
  } else {
    await adminClient.auth.admin.updateUserById(user.id, { password, email_confirm: true });
  }
  if (!user?.id) {
    throw new Error('Unable to resolve advisor user id for e2e tests.');
  }
  return { email, password, id: user.id } as const;
}

type ProposalRow = {
  id: string;
  advisor_id?: string | null;
  fact_finding_data?: Record<string, unknown> | null;
  fna_data?: Record<string, unknown> | null;
  recommendation_data?: { advice_confirmed?: boolean } | null;
  quotation_data?: Record<string, unknown> | null;
};

function hasObjectContent(value: unknown): boolean {
  return Boolean(value && typeof value === 'object' && Object.keys(value as Record<string, unknown>).length > 0);
}

function isCompletedProposal(row: ProposalRow | null | undefined): row is ProposalRow {
  if (!row?.id) return false;
  const recommendation = row.recommendation_data ?? {};
  return (
    hasObjectContent(row.fact_finding_data) &&
    hasObjectContent(row.fna_data) &&
    hasObjectContent(row.quotation_data) &&
    (recommendation as { advice_confirmed?: boolean }).advice_confirmed === true
  );
}

export async function ensureProposal(advisorId?: string): Promise<string> {
  const env = loadEnv();
  const serviceRole =
    env.SUPABASE_SERVICE_ROLE_KEY ||
    env.SUPABASE_SERVICE_KEY ||
    env.VITE_SUPABASE_SERVICE_ROLE_KEY;
  const supabase = createClient(env.VITE_SUPABASE_URL!, serviceRole ?? env.VITE_SUPABASE_ANON_KEY!);
  if (advisorId) {
    process.env.E2E_ADVISOR_ID = advisorId;
  }

  const fetchLatest = async () => {
    const { data, error } = await supabase
      .from('proposals')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    if (error) {
      if (error.code === '42501') {
        throw new Error('Supabase RLS prevented data seeding. Set SUPABASE_SERVICE_ROLE_KEY in .env.local or relax the policy for local testing.');
      }
      throw error;
    }
    return (data ?? []) as ProposalRow[];
  };

  const pickComplete = (rows: ProposalRow[]) =>
    rows.find((row) => isCompletedProposal(row) && (!advisorId || row.advisor_id === advisorId));

  await new Promise<void>((resolve, reject) => {
    const childEnv = { ...process.env };
    if (advisorId) childEnv.E2E_ADVISOR_ID = advisorId;
    const cp = spawn(process.platform === 'win32' ? 'node.exe' : 'node', ['scripts/create_completed_lead.mjs'], {
      stdio: 'inherit',
      env: childEnv,
    });
    cp.on('exit', (code: number) => (code === 0 ? resolve() : reject(new Error('seed failed'))));
    cp.on('error', reject);
  });

  const seeded = await fetchLatest();
  const completeSeeded = pickComplete(seeded);
  if (completeSeeded?.id) {
    console.log(`ensureProposal returning ${completeSeeded.id}`);
    return completeSeeded.id;
  }

  throw new Error('Unable to locate a completed proposal for testing. Please check seeding script.');
}
