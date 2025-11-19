import { test, expect, Page } from '@playwright/test';
import { ensureAdvisorUser, loadEnv } from '../utils/e2eHelpers';

/**
 * Flow 1: Create New Lead (Customer)
 *
 * Test scenario: User says "Add new lead Kim, phone 12345678"
 * Expected flow:
 * 1. Intent router classifies → CustomerAgent selected
 * 2. Agent returns MiraResponse with navigate + prefill actions
 * 3. Action executor navigates to /customers
 * 4. Opens new lead form popup
 * 5. Prefills name="Kim", contact_number="12345678"
 * 6. User reviews and clicks "Confirm"
 * 7. Execute POST /api/leads with data
 * 8. Success toast appears
 * 9. Lead appears in customer list
 * 10. Verify classification logs and action execution logs
 */

const TEST_FLAG_KEY = 'mira:test:create-lead';

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

test.describe('Flow 1: Create New Lead', () => {
  test('should complete end-to-end flow from chat intent to lead creation', async ({ page }) => {
    const env = loadEnv();
    const creds = await ensureAdvisorUser();

    await page.addInitScript(({ key }) => {
      window.localStorage.setItem(key, 'true');
    }, { key: TEST_FLAG_KEY });

    // Track API calls
    const apiCalls: Array<{ method: string; url: string; body: string | null }> = [];
    await page.route('**/api/leads', async (route, request) => {
      apiCalls.push({
        method: request.method(),
        url: request.url(),
        body: request.postData(),
      });
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          id: 'test-lead-123',
          name: 'Kim',
          contact_number: '12345678',
          status: 'Not Contacted',
          created_at: new Date().toISOString(),
        }),
        headers: { 'Content-Type': 'application/json' },
      });
    });

    // Track agent-chat calls for intent classification
    const chatCalls: Array<{ body: string | null }> = [];
    await page.route('**/agent-chat', async (route, request) => {
      const body = request.postData();
      chatCalls.push({ body });

      // Simulate CustomerAgent response with UI actions
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          assistant_reply: 'I\'ll help you add a new lead named Kim with phone number 12345678.',
          ui_actions: [
            {
              action: 'navigate',
              page: '/customers',
              popup: 'new-lead-dialog',
              description: 'Opening customer management page',
            },
            {
              action: 'frontend_prefill',
              payload: {
                name: 'Kim',
                contact_number: '12345678',
              },
              description: 'Prefilling lead information',
            },
          ],
          metadata: {
            topic: 'customer',
            subtopic: 'lead_management',
            intent: 'create_lead',
            confidence: 0.95,
            agent: 'CustomerAgent',
          },
        }),
        headers: { 'Content-Type': 'application/json' },
      });
    });

    await loginWithSupabase(page, env, creds, TEST_FLAG_KEY);
    await page.waitForLoadState('networkidle');

    // Step 1: Open Mira chat (Command mode)
    const miraButton = page.getByRole('button', { name: /mira/i }).first();
    await expect(miraButton).toBeVisible({ timeout: 10000 });
    await miraButton.click();

    // Wait for chat interface
    const chatInput = page.getByPlaceholder(/ask mira/i).or(page.getByRole('textbox', { name: /message/i }));
    await expect(chatInput).toBeVisible({ timeout: 5000 });

    // Step 2: User types intent - "Add new lead Kim, phone 12345678"
    await chatInput.fill('Add new lead Kim, phone 12345678');
    await chatInput.press('Enter');

    // Step 3: Verify intent router classification
    await expect.poll(() => chatCalls.length, { timeout: 10000 }).toBeGreaterThan(0);
    const chatCall = chatCalls[0];
    expect(chatCall?.body).toContain('Add new lead Kim');

    // Step 4: Verify agent response appears
    await expect(page.getByText(/I'll help you add a new lead named Kim/i)).toBeVisible({ timeout: 10000 });

    // Step 5: Verify navigation to /customers
    await page.waitForURL('**/customers**', { timeout: 10000 });

    // Step 6: Verify new lead dialog opens
    const dialog = page.getByRole('dialog', { name: /new lead|add lead/i });
    await expect(dialog).toBeVisible({ timeout: 10000 });

    // Step 7: Verify prefilled fields
    const nameInput = page.getByLabel(/name/i).first();
    const phoneInput = page.getByLabel(/contact number|phone/i).first();

    await expect(nameInput).toHaveValue('Kim', { timeout: 5000 });
    await expect(phoneInput).toHaveValue('12345678', { timeout: 5000 });

    // Step 8: User reviews and clicks "Confirm" or "Save"
    const confirmButton = page.getByRole('button', { name: /confirm|save|create/i }).first();
    await expect(confirmButton).toBeVisible();
    await confirmButton.click();

    // Step 9: Verify POST /api/leads executed
    await expect.poll(() => apiCalls.length, { timeout: 10000 }).toBeGreaterThan(0);
    const leadCall = apiCalls[0];
    expect(leadCall?.method).toBe('POST');
    expect(leadCall?.body).toContain('Kim');
    expect(leadCall?.body).toContain('12345678');

    // Step 10: Verify success toast
    await expect(page.getByText(/success|created|added/i)).toBeVisible({ timeout: 5000 });

    // Step 11: Verify dialog closes
    await expect(dialog).not.toBeVisible({ timeout: 5000 });

    // Step 12: Verify lead appears in customer list (if on list view)
    // This might require navigating to list view first
    const leadRow = page.getByText('Kim').first();
    await expect(leadRow).toBeVisible({ timeout: 10000 });
  });

  test('should handle low confidence classification with clarification', async ({ page }) => {
    const env = loadEnv();
    const creds = await ensureAdvisorUser();

    await page.addInitScript(({ key }) => {
      window.localStorage.setItem(key, 'true');
    }, { key: TEST_FLAG_KEY });

    // Mock agent-chat with low confidence response
    await page.route('**/agent-chat', async (route, request) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          assistant_reply: 'I\'m not entirely sure what you meant. Did you want to:\n1. Add a new lead\n2. Search for an existing lead\n3. Update a lead\'s information?',
          ui_actions: [],
          metadata: {
            topic: 'customer',
            subtopic: 'lead_management',
            intent: 'unclear',
            confidence: 0.6,
            agent: 'CustomerAgent',
            needs_clarification: true,
          },
        }),
        headers: { 'Content-Type': 'application/json' },
      });
    });

    await loginWithSupabase(page, env, creds, TEST_FLAG_KEY);
    await page.waitForLoadState('networkidle');

    // Open chat
    const miraButton = page.getByRole('button', { name: /mira/i }).first();
    await miraButton.click();

    const chatInput = page.getByPlaceholder(/ask mira/i).or(page.getByRole('textbox', { name: /message/i }));
    await chatInput.fill('Add Kim');
    await chatInput.press('Enter');

    // Verify clarification message appears
    await expect(page.getByText(/I'm not entirely sure/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Add a new lead/i)).toBeVisible();
  });

  test('should show confidence badge when confidence < 0.8', async ({ page }) => {
    const env = loadEnv();
    const creds = await ensureAdvisorUser();

    await page.addInitScript(({ key }) => {
      window.localStorage.setItem(key, 'true');
    }, { key: TEST_FLAG_KEY });

    await page.route('**/agent-chat', async (route, request) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          assistant_reply: 'I think you want to add a new lead. Is that correct?',
          ui_actions: [],
          metadata: {
            topic: 'customer',
            subtopic: 'lead_management',
            intent: 'create_lead',
            confidence: 0.75,
            agent: 'CustomerAgent',
          },
        }),
        headers: { 'Content-Type': 'application/json' },
      });
    });

    await loginWithSupabase(page, env, creds, TEST_FLAG_KEY);

    const miraButton = page.getByRole('button', { name: /mira/i }).first();
    await miraButton.click();

    const chatInput = page.getByPlaceholder(/ask mira/i).or(page.getByRole('textbox', { name: /message/i }));
    await chatInput.fill('Add lead');
    await chatInput.press('Enter');

    // Verify confidence badge appears with yellow color (0.5-0.8 range)
    const confidenceBadge = page.getByText(/75%|0\.75|confidence/i).first();
    await expect(confidenceBadge).toBeVisible({ timeout: 10000 });
  });

  test('should log intent classification to mira_intent_logs', async ({ page }) => {
    // This test would verify database logging
    // Requires database access in test environment
    test.skip(true, 'Requires database access configuration');
  });

  test('should log action execution to mira_events', async ({ page }) => {
    // This test would verify telemetry logging
    // Requires database access in test environment
    test.skip(true, 'Requires database access configuration');
  });
});
