import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import { spawn } from 'node:child_process';

function loadEnv() {
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

async function ensureAdvisorUser() {
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

async function ensureProposal(advisorId?: string): Promise<string> {
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

test('E10/E11 smoke: quotation + application', async ({ page, baseURL }) => {
  const env = loadEnv();
  const creds = await ensureAdvisorUser();
  const id = await ensureProposal(creds.id);
  expect(id).toBeTruthy();

  await page.goto(`${baseURL}/`);
  await page.waitForTimeout(200);
  await page.evaluate(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  page.on('console', (message) => {
    console.log(`browser:${message.type()}:${message.text()}`);
  });

  await page.goto(`${baseURL}/login`);
  await page.evaluate(
    async ({ url, anonKey, email, password }) => {
      const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.45.0');
      const client = createClient(url, anonKey, { auth: { persistSession: true } });
      const { error } = await client.auth.signInWithPassword({ email, password });
      if (error) throw error;
    },
    { url: env.VITE_SUPABASE_URL, anonKey: env.VITE_SUPABASE_ANON_KEY, email: creds.email, password: creds.password },
  );
  const storageKeys = await page.evaluate(() => Object.keys(window.localStorage));
  console.log('localStorage keys after login', storageKeys);
  await page.reload();
  await page.goto(`${baseURL}/`);
  await page.goto(`${baseURL}/proposals/detail?id=${id}&e2e=1`);
  await expect(page.getByText('Proposal #', { exact: false })).toBeVisible();

  await page.getByRole('button', { name: 'Quotation', exact: true }).click();
  await expect(page.getByText('Products & Benefits', { exact: false })).toBeVisible();

  const generateIllustrationButton = page.getByRole('button', { name: 'Generate Illustration' });
  if (await generateIllustrationButton.isEnabled()) {
    await generateIllustrationButton.click();
    await expect(page.getByText('Product Illustration Preview')).toBeVisible();
    await page.keyboard.press('Escape');
  }

  await page.getByRole('button', { name: 'Duplicate Scenario' }).click();
  await page.getByRole('button', { name: 'Compare' }).click();
  await expect(page.getByText('Compare Quote Scenarios')).toBeVisible();
  await page.getByRole('button', { name: 'Select This Quote' }).click();
  await page.waitForTimeout(250);

  const applicationTab = page.getByRole('button', { name: 'Application', exact: true });
  await applicationTab.waitFor({ state: 'visible' });
  await applicationTab.click();
  const applicationHeader = page.getByText('Application Details');
  await applicationHeader.scrollIntoViewIfNeeded();
  await expect(applicationHeader).toBeVisible();
  await expect(page.getByText('Completion:', { exact: false })).toBeVisible();

  const reqPairs: Array<[string, string]> = [
    ['Full Name *', 'Alex Tan'],
    ['NRIC *', 'S1234567A'],
    ['Date of Birth *', '1990-01-01'],
    ['Contact Number *', '+6500000000'],
    ['Address *', '123 Example St'],
    ['Occupation *', 'Engineer'],
  ];
  for (const [label, val] of reqPairs) {
    const input = page.getByLabel(label);
    if (await input.count()) {
      const cur = await input.inputValue().catch(() => '');
      if (!cur) await input.fill(val);
    }
  }

  const genderBox = page.getByRole('combobox', { name: 'Gender *' });
  if (await genderBox.count()) {
    await genderBox.click();
    await page.getByRole('option', { name: 'Male' }).click();
  }

  const addBen = page.getByRole('button', { name: 'Add Beneficiary' });
  if (await addBen.count()) await addBen.click();
  const alloc = page.getByLabel('Allocation % *').first();
  if (await alloc.count()) {
    await alloc.fill('100');
    const bname = page.getByLabel('Name *').first();
    if (await bname.count()) await bname.fill('Spouse Name');
    const rel = page.getByLabel('Relationship *').first();
    if (await rel.count()) {
      await rel.click();
      await page.getByRole('option', { name: 'Spouse' }).click();
    }
  }

  const noBtns = page.locator('button:has-text("No")');
  const noCount = await noBtns.count();
  for (let i = 0; i < noCount; i += 1) {
    await noBtns.nth(i).click().catch(() => {});
  }

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.locator('#health_decl').click({ force: true });
  await page.locator('#data').click({ force: true });
  await page.locator('#terms').click({ force: true });

  const canvas = page.locator('canvas').first();
  const box = await canvas.boundingBox();
  if (box) {
    const x = box.x + box.width / 4;
    const y = box.y + box.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + 50, y + 10);
    await page.mouse.move(x + 100, y - 10);
    await page.mouse.up();
  }

  const autofill = page.getByTestId('e2e-autofill');
  if (await autofill.count()) await autofill.click();
  const e2eSubmit = page.getByTestId('e2e-submit');
  if (await e2eSubmit.count()) {
    await e2eSubmit.click();
  } else {
    await page.getByRole('button', { name: 'Submit Application' }).click();
  }

  await expect(page.getByText('Application Submitted', { exact: false })).toBeVisible({ timeout: 10000 });
});

test('Agent telemetry views are queryable', async () => {
  const env = loadEnv();
  const serviceRole =
    env.SUPABASE_SERVICE_ROLE_KEY ||
    env.SUPABASE_SERVICE_KEY ||
    env.VITE_SUPABASE_SERVICE_ROLE_KEY;
  expect(serviceRole, 'SUPABASE_SERVICE_ROLE_KEY must be set for telemetry contract test').toBeTruthy();

  const supabase = createClient(env.VITE_SUPABASE_URL!, serviceRole!, { auth: { persistSession: false } });

  const { data: dailyMetrics, error: dailyError } = await supabase
    .from('mira_telemetry_daily_metrics')
    .select('*')
    .limit(1);
  expect(dailyError).toBeNull();
  expect(Array.isArray(dailyMetrics)).toBe(true);

  const { data: recentEvents, error: recentError } = await supabase
    .from('mira_telemetry_recent_events')
    .select('*')
    .limit(1);
  expect(recentError).toBeNull();
  expect(Array.isArray(recentEvents)).toBe(true);
});
