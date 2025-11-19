import { test, expect, Page } from '@playwright/test';
import { ensureAdvisorUser, loadEnv } from '../utils/e2eHelpers';

/**
 * Flow 5: Broadcast Campaign (Broadcast Agent)
 *
 * Test scenario 1: User says "Create broadcast to all hot leads"
 * Expected flow:
 * 1. Intent router classifies → BroadcastAgent selected
 * 2. Agent identifies audience filter: status="hot"
 * 3. Agent returns navigate + prefill actions
 * 4. Frontend navigates to /broadcast/new
 * 5. Prefills audience filter dropdown with "Hot Leads"
 * 6. User writes message and clicks "Send"
 * 7. Executes POST /api/broadcasts
 * 8. Success toast, redirects to campaign detail page
 *
 * Test scenario 2: User asks "Show my recent broadcasts"
 * Expected flow:
 * 1. BroadcastAgent returns navigate action to /broadcast
 * 2. Frontend displays recent broadcast campaigns
 *
 * Test scenario 3: Insight suggests targeting inactive leads
 * Expected flow:
 * 1. Insight card shows "15 inactive leads need attention"
 * 2. User clicks "Send Broadcast" action
 * 3. Navigates to /broadcast/new with inactive filter
 */

const TEST_FLAG_KEY = 'mira:test:broadcast';

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

test.describe('Flow 5: Broadcast Campaign', () => {
  test('should create broadcast via natural language command', async ({ page }) => {
    const env = loadEnv();
    const creds = await ensureAdvisorUser();

    await page.addInitScript(({ key }) => {
      window.localStorage.setItem(key, 'true');
    }, { key: TEST_FLAG_KEY });

    // Track API calls
    const apiCalls: Array<{ method: string; url: string; body: string | null }> = [];
    await page.route('**/api/broadcasts', async (route, request) => {
      apiCalls.push({
        method: request.method(),
        url: request.url(),
        body: request.postData(),
      });

      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          id: 'test-broadcast-123',
          title: 'Hot Leads Campaign',
          audience_filter: 'hot_leads',
          content: 'Important update for our valued clients',
          status: 'scheduled',
          created_at: new Date().toISOString(),
        }),
        headers: { 'Content-Type': 'application/json' },
      });
    });

    // Track agent-chat calls
    const chatCalls: Array<{ body: string | null }> = [];
    await page.route('**/agent-chat', async (route, request) => {
      const body = request.postData();
      chatCalls.push({ body });

      // Simulate BroadcastAgent response
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          assistant_reply: "I'll help you create a broadcast campaign for all hot leads.",
          ui_actions: [
            {
              action: 'navigate',
              page: '/broadcast/new',
              description: 'Opening broadcast creation page',
            },
            {
              action: 'frontend_prefill',
              payload: {
                audience_filter: 'hot_leads',
              },
              description: 'Prefilling audience filter',
            },
          ],
          metadata: {
            topic: 'broadcast',
            subtopic: 'message_campaigns',
            intent: 'create_broadcast',
            confidence: 0.90,
            agent: 'BroadcastAgent',
          },
        }),
        headers: { 'Content-Type': 'application/json' },
      });
    });

    await loginWithSupabase(page, env, creds, TEST_FLAG_KEY);
    await page.waitForLoadState('networkidle');

    // Step 1: Open Mira chat
    const miraButton = page.getByRole('button', { name: /mira/i }).first();
    await expect(miraButton).toBeVisible({ timeout: 10000 });
    await miraButton.click();

    const chatInput = page.getByPlaceholder(/ask mira/i).or(page.getByRole('textbox', { name: /message/i }));
    await expect(chatInput).toBeVisible({ timeout: 5000 });

    // Step 2: User types broadcast creation command
    await chatInput.fill('Create broadcast to all hot leads');
    await chatInput.press('Enter');

    // Step 3: Verify intent classification
    await expect.poll(() => chatCalls.length, { timeout: 10000 }).toBeGreaterThan(0);
    const chatCall = chatCalls[0];
    expect(chatCall?.body).toContain('Create broadcast to all hot leads');

    // Step 4: Verify agent response appears
    await expect(page.getByText(/I'll help you create a broadcast campaign/i)).toBeVisible({ timeout: 10000 });

    // Step 5: Verify navigation to /broadcast/new
    await page.waitForURL('**/broadcast/new**', { timeout: 10000 });

    // Step 6: Verify audience filter is prefilled
    const audienceSelect = page.getByLabel(/audience|filter|recipients/i).first();
    await expect(audienceSelect).toBeVisible({ timeout: 5000 });

    // Check if "Hot Leads" is selected
    const hotLeadsOption = page.getByText(/hot leads/i).first();
    await expect(hotLeadsOption).toBeVisible({ timeout: 5000 });

    // Step 7: User writes message
    const messageInput = page.getByLabel(/message|content/i).first();
    await expect(messageInput).toBeVisible();
    await messageInput.fill('Important update for our valued clients');

    // Step 8: User clicks "Send" or "Create"
    const sendButton = page.getByRole('button', { name: /send|create|schedule/i }).first();
    await expect(sendButton).toBeVisible();
    await sendButton.click();

    // Step 9: Verify POST /api/broadcasts executed
    await expect.poll(() => apiCalls.length, { timeout: 10000 }).toBeGreaterThan(0);
    const broadcastCall = apiCalls[0];
    expect(broadcastCall?.method).toBe('POST');
    expect(broadcastCall?.body).toContain('hot_leads');

    // Step 10: Verify success toast
    await expect(page.getByText(/success|created|scheduled/i)).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to broadcast list via chat command', async ({ page }) => {
    const env = loadEnv();
    const creds = await ensureAdvisorUser();

    await page.addInitScript(({ key }) => {
      window.localStorage.setItem(key, 'true');
    }, { key: TEST_FLAG_KEY });

    await page.route('**/agent-chat', async (route, request) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          assistant_reply: 'Here are your recent broadcast campaigns.',
          ui_actions: [
            {
              action: 'navigate',
              page: '/broadcast',
              description: 'Opening broadcast campaigns',
            },
          ],
          metadata: {
            topic: 'broadcast',
            subtopic: 'message_campaigns',
            intent: 'list_campaigns',
            confidence: 0.93,
            agent: 'BroadcastAgent',
          },
        }),
        headers: { 'Content-Type': 'application/json' },
      });
    });

    await loginWithSupabase(page, env, creds, TEST_FLAG_KEY);
    await page.waitForLoadState('networkidle');

    const miraButton = page.getByRole('button', { name: /mira/i }).first();
    await miraButton.click();

    const chatInput = page.getByPlaceholder(/ask mira/i).or(page.getByRole('textbox', { name: /message/i }));
    await chatInput.fill('Show my recent broadcasts');
    await chatInput.press('Enter');

    await expect(page.getByText(/Here are your recent broadcast campaigns/i)).toBeVisible({ timeout: 10000 });

    // Verify navigation to /broadcast
    await page.waitForURL('**/broadcast**', { timeout: 10000 });
    const url = page.url();
    expect(url).toContain('/broadcast');
  });

  test('should create broadcast for inactive leads via insight card', async ({ page }) => {
    const env = loadEnv();
    const creds = await ensureAdvisorUser();

    await page.addInitScript(({ key }) => {
      window.localStorage.setItem(key, 'true');
    }, { key: TEST_FLAG_KEY });

    // Mock insights API
    await page.route('**/api/mira/insights', async (route, request) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          insights: [
            {
              id: 'insight-inactive-leads',
              type: 'opportunity',
              title: '15 inactive leads need attention',
              description: 'These leads haven\\'t been contacted in over 30 days. Consider sending a re-engagement broadcast.',
              severity: 'warning',
              actionLabel: 'Send Broadcast',
              actionUrl: '/broadcast/new?audience=inactive',
              metadata: {
                count: 15,
                audience_filter: 'inactive',
              },
            },
          ],
        }),
        headers: { 'Content-Type': 'application/json' },
      });
    });

    await loginWithSupabase(page, env, creds, TEST_FLAG_KEY);
    await page.waitForLoadState('networkidle');

    const miraButton = page.getByRole('button', { name: /mira/i }).first();
    await miraButton.click();

    // Switch to Insight mode
    const insightModeButton = page.getByRole('button', { name: /insight/i });
    if (await insightModeButton.isVisible()) {
      await insightModeButton.click();
      await page.waitForTimeout(1000);
    }

    // Verify insight card appears
    const inactiveInsight = page.getByText(/15 inactive leads need attention/i);
    await expect(inactiveInsight).toBeVisible({ timeout: 10000 });

    // Click action button
    const sendBroadcastButton = page.getByRole('button', { name: /send broadcast/i }).first();
    await expect(sendBroadcastButton).toBeVisible({ timeout: 5000 });
    await sendBroadcastButton.click();

    // Verify navigation with audience filter
    await page.waitForURL('**/broadcast/new**', { timeout: 10000 });
    const url = page.url();
    expect(url).toContain('/broadcast/new');
    expect(url).toContain('audience=inactive');
  });

  test('should show broadcast suggestions in copilot mode', async ({ page }) => {
    const env = loadEnv();
    const creds = await ensureAdvisorUser();

    await page.addInitScript(({ key }) => {
      window.localStorage.setItem(key, 'true');
    }, { key: TEST_FLAG_KEY });

    // Mock suggestions API
    await page.route('**/api/mira/suggestions', async (route, request) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          suggestions: [
            {
              id: 'suggestion-broadcast-qualified',
              type: 'action',
              title: 'Send update to qualified leads',
              description: 'You have 8 qualified leads. Send them a product update.',
              promptText: 'Create broadcast to qualified leads',
              confidence: 0.86,
              metadata: {
                topic: 'broadcast',
                subtopic: 'message_campaigns',
                intent: 'create_broadcast',
                audience: 'qualified',
              },
            },
          ],
        }),
        headers: { 'Content-Type': 'application/json' },
      });
    });

    await page.route('**/agent-chat', async (route, request) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          assistant_reply: 'I\\'ll help you send an update to your 8 qualified leads.',
          ui_actions: [
            {
              action: 'navigate',
              page: '/broadcast/new',
            },
            {
              action: 'frontend_prefill',
              payload: {
                audience_filter: 'qualified',
              },
            },
          ],
          metadata: {
            topic: 'broadcast',
            subtopic: 'message_campaigns',
            intent: 'create_broadcast',
            confidence: 0.86,
            agent: 'BroadcastAgent',
          },
        }),
        headers: { 'Content-Type': 'application/json' },
      });
    });

    await loginWithSupabase(page, env, creds, TEST_FLAG_KEY);
    await page.waitForLoadState('networkidle');

    const miraButton = page.getByRole('button', { name: /mira/i }).first();
    await miraButton.click();

    // Switch to Copilot mode
    const copilotModeButton = page.getByRole('button', { name: /copilot/i });
    if (await copilotModeButton.isVisible()) {
      await copilotModeButton.click();
      await page.waitForTimeout(500);
    }

    // Verify suggestion appears
    const broadcastSuggestion = page.getByText(/Send update to qualified leads/i).first();
    await expect(broadcastSuggestion).toBeVisible({ timeout: 10000 });

    // Click suggestion
    await broadcastSuggestion.click();

    // Verify navigation
    await page.waitForURL('**/broadcast/new**', { timeout: 10000 });
  });

  test('should handle ambiguous broadcast command', async ({ page }) => {
    const env = loadEnv();
    const creds = await ensureAdvisorUser();

    await page.addInitScript(({ key }) => {
      window.localStorage.setItem(key, 'true');
    }, { key: TEST_FLAG_KEY });

    await page.route('**/agent-chat', async (route, request) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          assistant_reply: 'I need more details. Who should receive this broadcast?\\n1. All leads\\n2. Hot leads\\n3. Qualified leads\\n4. Inactive leads',
          ui_actions: [],
          metadata: {
            topic: 'broadcast',
            subtopic: 'message_campaigns',
            intent: 'create_broadcast',
            confidence: 0.61,
            agent: 'BroadcastAgent',
            needs_clarification: true,
          },
        }),
        headers: { 'Content-Type': 'application/json' },
      });
    });

    await loginWithSupabase(page, env, creds, TEST_FLAG_KEY);
    await page.waitForLoadState('networkidle');

    const miraButton = page.getByRole('button', { name: /mira/i }).first();
    await miraButton.click();

    const chatInput = page.getByPlaceholder(/ask mira/i).or(page.getByRole('textbox', { name: /message/i }));
    await chatInput.fill('Send broadcast');
    await chatInput.press('Enter');

    // Verify clarification request
    await expect(page.getByText(/I need more details/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/All leads/i)).toBeVisible();
    await expect(page.getByText(/Hot leads/i)).toBeVisible();
  });

  test('should show confidence badge for medium confidence broadcast intent', async ({ page }) => {
    const env = loadEnv();
    const creds = await ensureAdvisorUser();

    await page.addInitScript(({ key }) => {
      window.localStorage.setItem(key, 'true');
    }, { key: TEST_FLAG_KEY });

    await page.route('**/agent-chat', async (route, request) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          assistant_reply: 'I think you want to create a broadcast campaign. Is that correct?',
          ui_actions: [],
          metadata: {
            topic: 'broadcast',
            subtopic: 'message_campaigns',
            intent: 'create_broadcast',
            confidence: 0.69,
            agent: 'BroadcastAgent',
          },
        }),
        headers: { 'Content-Type': 'application/json' },
      });
    });

    await loginWithSupabase(page, env, creds, TEST_FLAG_KEY);

    const miraButton = page.getByRole('button', { name: /mira/i }).first();
    await miraButton.click();

    const chatInput = page.getByPlaceholder(/ask mira/i).or(page.getByRole('textbox', { name: /message/i }));
    await chatInput.fill('broadcast');
    await chatInput.press('Enter');

    // Verify confidence badge appears with yellow color (0.5-0.8 range)
    const confidenceBadge = page.getByText(/69%|0\\.69|confidence/i).first();
    await expect(confidenceBadge).toBeVisible({ timeout: 10000 });
  });
});
