import { test, expect } from '@playwright/test';
import fs from 'fs';

function loadEnv() {
  const raw = fs.readFileSync('.env.local', 'utf8');
  const map: Record<string, string> = {} as any;
  for (const line of raw.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (match) {
      let value = match[2];
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
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

test('Post meeting wrap creates a follow-up task after confirmation', async ({ page, baseURL }) => {
  await page.goto(`${baseURL}/`);
  await page.evaluate(() => { window.localStorage.clear(); window.sessionStorage.clear(); });
  await signin(page);

  const prompt = encodeURIComponent('post meeting wrap: please save my notes and create a follow up task');
  await page.goto(`${baseURL}/chat?prompt=${prompt}`);

  // Wait for confirmation card
  const cardTitle = page.getByText('Allow Mira', { exact: false });
  await expect(cardTitle).toBeVisible({ timeout: 15000 });

  // Approve once
  await page.getByRole('button', { name: 'Allow once' }).click();
  await expect(cardTitle).toHaveCount(0);

  // Navigate to ToDo list and look for the standard follow-up task
  await page.goto(`${baseURL}/todo`);
  // The default title from the skill
  const title = 'Follow up with client (from last meeting)';
  await expect(page.getByText(title, { exact: false })).toBeVisible({ timeout: 15000 });
});

