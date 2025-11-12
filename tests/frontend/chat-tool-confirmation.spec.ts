import { test, expect } from '@playwright/test';
import fs from 'fs';

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

async function signin(page) {
  const env = loadEnv();
  const email = env.E2E_EMAIL || 'advisor.e2e@advisorhub.io';
  const password = env.E2E_PASSWORD || 'DevPassword123!';
  await page.goto('/login');
  await page.evaluate(
    async ({ url, anonKey, email, password }) => {
      const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.45.0');
      const client = createClient(url, anonKey, { auth: { persistSession: true } });
      const { error } = await client.auth.signInWithPassword({ email, password });
      if (error) throw error;
    },
    { url: env.VITE_SUPABASE_URL, anonKey: env.VITE_SUPABASE_ANON_KEY, email, password },
  );
}

test('Chat tool-call confirmation flow', async ({ page, baseURL }) => {
  await page.goto(`${baseURL}/`);
  await page.waitForTimeout(200);
  await page.evaluate(() => { window.localStorage.clear(); window.sessionStorage.clear(); });
  await signin(page);

  // Trigger a skill that yields a navigate action (ops__prepare_meeting)
  const prompt = encodeURIComponent('prepare meeting agenda for this client');
  await page.goto(`${baseURL}/chat?prompt=${prompt}`);

  // Expect inline confirmation card to appear
  const cardTitle = page.getByText('Allow Mira', { exact: false });
  await expect(cardTitle).toBeVisible({ timeout: 15000 });

  // Click Allow once
  await page.getByRole('button', { name: 'Allow once' }).click();

  // Card should disappear
  await expect(cardTitle).toHaveCount(0);

  // Assistant message should render some content
  await expect(page.getByText('agenda', { exact: false })).toBeVisible({ timeout: 10000 });
});

