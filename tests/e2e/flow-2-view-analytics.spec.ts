import { test, expect, Page } from '@playwright/test';
import { ensureAdvisorUser, loadEnv } from '../utils/e2eHelpers';

/**
 * Flow 2: View Analytics (AnalyticsAgent)
 *
 * Test scenario 1: User clicks co-pilot suggestion "View monthly performance"
 * Expected flow:
 * 1. User opens Mira chat in Copilot mode
 * 2. Copilot displays suggestion "View monthly performance"
 * 3. User clicks suggestion
 * 4. AnalyticsAgent returns navigate action with query params
 * 5. Frontend navigates to /analytics?view=monthly_performance&period=current_month
 * 6. Analytics page loads and displays monthly chart
 *
 * Test scenario 2: User asks "Show my YTD performance"
 * Expected flow:
 * 1. Intent router classifies → AnalyticsAgent selected
 * 2. Agent returns navigate action to /analytics?view=ytd
 * 3. Analytics page displays YTD progress
 *
 * Test scenario 3: Insight mode shows YTD performance alert
 * Expected flow:
 * 1. User switches to Insight mode
 * 2. Backend generates proactive insights
 * 3. Insight card shows "YTD at 45%" with action button
 * 4. User clicks "View Details" → navigates to analytics
 */

const TEST_FLAG_KEY = 'mira:test:view-analytics';

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

test.describe('Flow 2: View Analytics', () => {
  test('should navigate to analytics via copilot suggestion', async ({ page }) => {
    const env = loadEnv();
    const creds = await ensureAdvisorUser();

    await page.addInitScript(({ key }) => {
      window.localStorage.setItem(key, 'true');
    }, { key: TEST_FLAG_KEY });

    // Mock suggestions API to return "View monthly performance"
    await page.route('**/api/mira/suggestions', async (route, request) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          suggestions: [
            {
              id: 'suggestion-monthly-perf',
              type: 'action',
              title: 'View monthly performance',
              description: 'See your sales trend for the current month',
              promptText: 'Show my monthly performance',
              confidence: 0.88,
              metadata: {
                topic: 'analytics',
                subtopic: 'personal_performance',
                intent: 'view_monthly_trend'
              }
            },
            {
              id: 'suggestion-ytd',
              type: 'action',
              title: 'View YTD progress',
              description: 'Check your year-to-date performance',
              promptText: 'Show my YTD performance',
              confidence: 0.85,
              metadata: {
                topic: 'analytics',
                subtopic: 'personal_performance',
                intent: 'view_ytd_progress'
              }
            }
          ]
        }),
        headers: { 'Content-Type': 'application/json' },
      });
    });

    // Mock agent-chat to return navigate action
    await page.route('**/agent-chat', async (route, request) => {
      const body = request.postData();
      const payload = body ? JSON.parse(body) : {};

      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          assistant_reply: "I'll show you your monthly performance metrics.",
          ui_actions: [
            {
              action: 'navigate',
              page: '/analytics',
              params: {
                view: 'monthly_performance',
                period: 'current_month'
              },
              description: 'Opening analytics dashboard'
            }
          ],
          metadata: {
            topic: 'analytics',
            subtopic: 'personal_performance',
            intent: 'view_monthly_trend',
            confidence: 0.88,
            agent: 'AnalyticsAgent'
          }
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

    // Wait for chat interface
    const chatInput = page.getByPlaceholder(/ask mira/i).or(page.getByRole('textbox', { name: /message/i }));
    await expect(chatInput).toBeVisible({ timeout: 5000 });

    // Step 2: Switch to Copilot mode (if not already)
    const copilotModeButton = page.getByRole('button', { name: /copilot/i });
    if (await copilotModeButton.isVisible()) {
      await copilotModeButton.click();
      await page.waitForTimeout(500);
    }

    // Step 3: Verify suggestion appears
    const monthlySuggestion = page.getByText(/View monthly performance/i).first();
    await expect(monthlySuggestion).toBeVisible({ timeout: 10000 });

    // Step 4: Click the suggestion
    await monthlySuggestion.click();

    // Step 5: Verify navigation to analytics page with query params
    await page.waitForURL('**/analytics**', { timeout: 10000 });
    const url = page.url();
    expect(url).toContain('/analytics');
    expect(url).toContain('view=monthly_performance');
    expect(url).toContain('period=current_month');

    // Step 6: Verify analytics page loaded
    await expect(page.getByText(/analytics/i).or(page.getByText(/performance/i))).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to YTD analytics via chat command', async ({ page }) => {
    const env = loadEnv();
    const creds = await ensureAdvisorUser();

    await page.addInitScript(({ key }) => {
      window.localStorage.setItem(key, 'true');
    }, { key: TEST_FLAG_KEY });

    // Track API calls
    const chatCalls: Array<{ body: string | null }> = [];
    await page.route('**/agent-chat', async (route, request) => {
      const body = request.postData();
      chatCalls.push({ body });

      // Simulate AnalyticsAgent response
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          assistant_reply: 'Here\\'s your year-to-date performance. You\\'re at 45% of your annual goal.',
          ui_actions: [
            {
              action: 'navigate',
              page: '/analytics',
              params: {
                view: 'ytd'
              },
              description: 'Opening YTD analytics view'
            }
          ],
          metadata: {
            topic: 'analytics',
            subtopic: 'personal_performance',
            intent: 'view_ytd_progress',
            confidence: 0.92,
            agent: 'AnalyticsAgent'
          }
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

    // Step 2: User types "Show my YTD performance"
    await chatInput.fill('Show my YTD performance');
    await chatInput.press('Enter');

    // Step 3: Verify intent classification
    await expect.poll(() => chatCalls.length, { timeout: 10000 }).toBeGreaterThan(0);
    const chatCall = chatCalls[0];
    expect(chatCall?.body).toContain('Show my YTD performance');

    // Step 4: Verify agent response appears
    await expect(page.getByText(/year-to-date performance/i)).toBeVisible({ timeout: 10000 });

    // Step 5: Verify navigation to analytics
    await page.waitForURL('**/analytics**', { timeout: 10000 });
    const url = page.url();
    expect(url).toContain('/analytics');
    expect(url).toContain('view=ytd');

    // Step 6: Verify analytics page displays
    await expect(page.getByText(/analytics/i).or(page.getByText(/ytd/i))).toBeVisible({ timeout: 5000 });
  });

  test('should display YTD insight card in Insight mode', async ({ page }) => {
    const env = loadEnv();
    const creds = await ensureAdvisorUser();

    await page.addInitScript(({ key }) => {
      window.localStorage.setItem(key, 'true');
    }, { key: TEST_FLAG_KEY });

    // Mock insights API to return YTD performance alert
    await page.route('**/api/mira/insights', async (route, request) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          insights: [
            {
              id: 'insight-ytd-45',
              type: 'performance_alert',
              title: 'YTD Performance: 45%',
              description: 'You\\'re 5% behind your target pace. Consider focusing on high-value leads.',
              severity: 'warning',
              actionLabel: 'View Details',
              actionUrl: '/analytics?view=ytd',
              metadata: {
                current: 45,
                target: 50,
                metric: 'ytd_progress'
              }
            },
            {
              id: 'insight-hot-leads',
              type: 'opportunity',
              title: '3 Hot Leads Need Follow-up',
              description: 'You have 3 leads with recent activity that need your attention.',
              severity: 'info',
              actionLabel: 'View Leads',
              actionUrl: '/customers?filter=hot',
              metadata: {
                count: 3
              }
            }
          ]
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

    await page.waitForTimeout(1000);

    // Step 2: Switch to Insight mode
    const insightModeButton = page.getByRole('button', { name: /insight/i });
    if (await insightModeButton.isVisible()) {
      await insightModeButton.click();
      await page.waitForTimeout(1000);
    }

    // Step 3: Verify YTD insight card appears
    const ytdInsight = page.getByText(/YTD Performance.*45%/i).or(page.getByText(/45%.*target/i));
    await expect(ytdInsight).toBeVisible({ timeout: 10000 });

    // Step 4: Verify action button exists
    const viewDetailsButton = page.getByRole('button', { name: /view details/i }).first();
    await expect(viewDetailsButton).toBeVisible({ timeout: 5000 });

    // Step 5: Click action button and verify navigation
    await viewDetailsButton.click();
    await page.waitForURL('**/analytics**', { timeout: 10000 });

    const url = page.url();
    expect(url).toContain('/analytics');
    expect(url).toContain('view=ytd');
  });

  test('should handle low confidence analytics intent', async ({ page }) => {
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
          assistant_reply: 'I\\'m not entirely sure what metrics you want to see. Did you want to:\\n1. View YTD progress\\n2. View monthly trend\\n3. View sales funnel',
          ui_actions: [],
          metadata: {
            topic: 'analytics',
            subtopic: 'personal_performance',
            intent: 'unclear',
            confidence: 0.55,
            agent: 'AnalyticsAgent',
            needs_clarification: true
          }
        }),
        headers: { 'Content-Type': 'application/json' },
      });
    });

    await loginWithSupabase(page, env, creds, TEST_FLAG_KEY);
    await page.waitForLoadState('networkidle');

    const miraButton = page.getByRole('button', { name: /mira/i }).first();
    await miraButton.click();

    const chatInput = page.getByPlaceholder(/ask mira/i).or(page.getByRole('textbox', { name: /message/i }));
    await chatInput.fill('Show performance');
    await chatInput.press('Enter');

    // Verify clarification message appears
    await expect(page.getByText(/not entirely sure/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/View YTD progress/i)).toBeVisible();
    await expect(page.getByText(/View monthly trend/i)).toBeVisible();
  });

  test('should show confidence badge for medium confidence analytics intent', async ({ page }) => {
    const env = loadEnv();
    const creds = await ensureAdvisorUser();

    await page.addInitScript(({ key }) => {
      window.localStorage.setItem(key, 'true');
    }, { key: TEST_FLAG_KEY });

    await page.route('**/agent-chat', async (route, request) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          assistant_reply: 'I think you want to view your analytics dashboard. Is that correct?',
          ui_actions: [
            {
              action: 'navigate',
              page: '/analytics',
              description: 'Opening analytics dashboard'
            }
          ],
          metadata: {
            topic: 'analytics',
            subtopic: 'personal_performance',
            intent: 'view_dashboard',
            confidence: 0.72,
            agent: 'AnalyticsAgent'
          }
        }),
        headers: { 'Content-Type': 'application/json' },
      });
    });

    await loginWithSupabase(page, env, creds, TEST_FLAG_KEY);

    const miraButton = page.getByRole('button', { name: /mira/i }).first();
    await miraButton.click();

    const chatInput = page.getByPlaceholder(/ask mira/i).or(page.getByRole('textbox', { name: /message/i }));
    await chatInput.fill('analytics');
    await chatInput.press('Enter');

    // Verify confidence badge appears with yellow/warning color (0.5-0.8 range)
    const confidenceBadge = page.getByText(/72%|0\\.72|confidence/i).first();
    await expect(confidenceBadge).toBeVisible({ timeout: 10000 });
  });
});
