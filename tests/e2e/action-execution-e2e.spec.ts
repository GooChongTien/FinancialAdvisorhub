import { test, expect, Page } from '@playwright/test';
import { ensureAdvisorUser, loadEnv } from '../utils/e2eHelpers';

const TEST_FLAG_KEY = 'mira:test:ui-actions';

async function loginWithSupabase(
  page: Page,
  env: Record<string, string>,
  creds: { email: string; password: string },
  flagKey: string,
) {
  await page.goto('/login');
  await page.waitForTimeout(50);
  await page.evaluate(({ key }) => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.localStorage.setItem(key, 'true');
  }, { key: flagKey });
  await page.evaluate(
    async ({ url, anonKey, email, password }) => {
      const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.45.0');
      const client = createClient(url, anonKey, { auth: { persistSession: true } });
      const { error } = await client.auth.signInWithPassword({ email, password });
      if (error) throw error;
    },
    { url: env.VITE_SUPABASE_URL, anonKey: env.VITE_SUPABASE_ANON_KEY, email: creds.email, password: creds.password },
  );
  await page.goto('/');
}

test('UI action executor drives navigation, prefill, and execute flows', async ({ page }) => {
  const env = loadEnv();
  const creds = await ensureAdvisorUser();

  await page.addInitScript(({ key }) => {
    window.localStorage.setItem(key, 'true');
  }, { key: TEST_FLAG_KEY });

  const executeCalls: Array<{ method: string; body: string | null }> = [];
  await page.route('**/__playwright__/echo', async (route, request) => {
    executeCalls.push({
      method: request.method(),
      body: request.postData(),
    });
    await route.fulfill({
      status: 200,
      body: JSON.stringify({ ok: true }),
      headers: { 'Content-Type': 'application/json' },
    });
  });

  await loginWithSupabase(page, env, creds, TEST_FLAG_KEY);
  await page.waitForSelector('[data-testid="mira-action-test-panel"]', { timeout: 15000 });

  // Navigate action: trigger from Broadcast page and ensure we land on Customer Detail.
  await page.goto('/broadcast');
  await page.getByTestId('mira-test-navigate').click();
  await page.waitForURL('**/customers/detail**', { timeout: 15000 });

  // Prefill action: go to Customer list, trigger, confirm dialog + field values.
  await page.goto('/customers');
  await page.getByTestId('mira-test-prefill').click();
  const dialog = page.getByRole('dialog', { name: /add new lead/i });
  await expect(dialog).toBeVisible();
  await expect(page.getByLabel('Name')).toHaveValue('Playwright Lead', { timeout: 10000 });
  await expect(page.getByLabel('Contact Number')).toHaveValue('81234567');
  await expect(page.getByLabel('Email (Optional)')).toHaveValue('lead+playwright@advisorhub.io');
  await page.keyboard.press('Escape');

  // Execute action: ensure fetch fired + toast surfaced.
  await page.getByTestId('mira-test-execute').click();
  await expect(page.getByText('Action completed', { exact: false })).toBeVisible();
  await expect.poll(() => executeCalls.length, { timeout: 5000 }).toBe(1);
  expect(executeCalls[0]?.method).toBe('POST');
  expect(executeCalls[0]?.body).toContain('"ping":"mira"');
});
