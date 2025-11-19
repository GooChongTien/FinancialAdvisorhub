import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { ensureAdvisorUser, ensureProposal, loadEnv } from './utils/e2eHelpers';

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
  await page.waitForTimeout(2000); // Give time for data to load
  await expect(page.getByText('Proposal #', { exact: false })).toBeVisible({ timeout: 10000 });

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
