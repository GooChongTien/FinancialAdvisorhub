import { test, expect, Page } from '@playwright/test';
import { ensureAdvisorUser, loadEnv } from '../utils/e2eHelpers';

/**
 * Flow 4: Product Search (Product Agent)
 *
 * Test scenario 1: User says "Show me all life insurance products"
 * Expected flow:
 * 1. Intent router classifies → ProductAgent selected
 * 2. Agent identifies category filter: "life_insurance"
 * 3. Agent returns navigate action with filters
 * 4. Frontend navigates to /product?category=life_insurance
 * 5. Product page displays filtered results
 *
 * Test scenario 2: Copilot suggests "Compare life insurance products"
 * Expected flow:
 * 1. On new proposal page, copilot shows suggestion
 * 2. User clicks suggestion
 * 3. Returns navigate action to comparison view
 * 4. Shows comparison table
 *
 * Test scenario 3: User searches for specific feature
 * Expected flow:
 * 1. User asks "Find products with savings features"
 * 2. ProductAgent performs keyword search
 * 3. Navigates to product search results
 */

const TEST_FLAG_KEY = 'mira:test:product-search';

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

test.describe('Flow 4: Product Search', () => {
  test('should navigate to filtered product list via chat command', async ({ page }) => {
    const env = loadEnv();
    const creds = await ensureAdvisorUser();

    await page.addInitScript(({ key }) => {
      window.localStorage.setItem(key, 'true');
    }, { key: TEST_FLAG_KEY });

    // Track agent-chat calls
    const chatCalls: Array<{ body: string | null }> = [];
    await page.route('**/agent-chat', async (route, request) => {
      const body = request.postData();
      chatCalls.push({ body });

      // Simulate ProductAgent response
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          assistant_reply: "I'll show you all life insurance products available.",
          ui_actions: [
            {
              action: 'navigate',
              page: '/product',
              params: {
                category: 'life_insurance',
              },
              description: 'Opening life insurance product catalog',
            },
          ],
          metadata: {
            topic: 'product',
            subtopic: 'search',
            intent: 'list_by_category',
            confidence: 0.94,
            agent: 'ProductAgent',
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

    // Step 2: User types product search command
    await chatInput.fill('Show me all life insurance products');
    await chatInput.press('Enter');

    // Step 3: Verify intent classification
    await expect.poll(() => chatCalls.length, { timeout: 10000 }).toBeGreaterThan(0);
    const chatCall = chatCalls[0];
    expect(chatCall?.body).toContain('Show me all life insurance products');

    // Step 4: Verify agent response appears
    await expect(page.getByText(/I'll show you all life insurance products/i)).toBeVisible({ timeout: 10000 });

    // Step 5: Verify navigation to /product with category filter
    await page.waitForURL('**/product**', { timeout: 10000 });
    const url = page.url();
    expect(url).toContain('/product');
    expect(url).toContain('category=life_insurance');

    // Step 6: Verify product page displays
    await expect(page.getByText(/product|insurance/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to product comparison via copilot suggestion', async ({ page }) => {
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
              id: 'suggestion-compare',
              type: 'action',
              title: 'Compare life insurance products',
              description: 'View side-by-side comparison of life insurance options',
              promptText: 'Compare life insurance products',
              confidence: 0.87,
              metadata: {
                topic: 'product',
                subtopic: 'comparison',
                intent: 'compare_products',
                category: 'life_insurance',
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
          assistant_reply: 'I\\'ll show you a comparison of life insurance products.',
          ui_actions: [
            {
              action: 'navigate',
              page: '/product/compare',
              params: {
                category: 'life_insurance',
              },
              description: 'Opening product comparison view',
            },
          ],
          metadata: {
            topic: 'product',
            subtopic: 'comparison',
            intent: 'compare_products',
            confidence: 0.87,
            agent: 'ProductAgent',
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
    const compareSuggestion = page.getByText(/Compare life insurance products/i).first();
    await expect(compareSuggestion).toBeVisible({ timeout: 10000 });

    // Click suggestion
    await compareSuggestion.click();

    // Verify navigation
    await page.waitForURL('**/product/compare**', { timeout: 10000 });
    const url = page.url();
    expect(url).toContain('/product/compare');
    expect(url).toContain('category=life_insurance');

    // Verify comparison view displays
    await expect(page.getByText(/comparison|compare/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('should search products by keyword', async ({ page }) => {
    const env = loadEnv();
    const creds = await ensureAdvisorUser();

    await page.addInitScript(({ key }) => {
      window.localStorage.setItem(key, 'true');
    }, { key: TEST_FLAG_KEY });

    await page.route('**/agent-chat', async (route, request) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          assistant_reply: 'I found products with savings features for you.',
          ui_actions: [
            {
              action: 'navigate',
              page: '/product',
              params: {
                search: 'savings',
              },
              description: 'Searching for products with savings features',
            },
          ],
          metadata: {
            topic: 'product',
            subtopic: 'search',
            intent: 'search_by_keyword',
            confidence: 0.88,
            agent: 'ProductAgent',
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
    await chatInput.fill('Find products with savings features');
    await chatInput.press('Enter');

    await expect(page.getByText(/I found products with savings features/i)).toBeVisible({ timeout: 10000 });

    // Verify navigation to product search
    await page.waitForURL('**/product**', { timeout: 10000 });
    const url = page.url();
    expect(url).toContain('/product');
    expect(url).toContain('search=savings');
  });

  test('should show product details via insight card', async ({ page }) => {
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
              id: 'insight-popular-product',
              type: 'recommendation',
              title: 'Whole Life Plus is trending',
              description: 'This product has high conversion rates this quarter. Consider recommending it.',
              severity: 'info',
              actionLabel: 'View Product',
              actionUrl: '/product/whole-life-plus',
              metadata: {
                product_id: 'whole-life-plus',
                conversion_rate: 0.42,
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
    const productInsight = page.getByText(/Whole Life Plus is trending/i);
    await expect(productInsight).toBeVisible({ timeout: 10000 });

    // Click action button
    const viewProductButton = page.getByRole('button', { name: /view product/i }).first();
    await expect(viewProductButton).toBeVisible({ timeout: 5000 });
    await viewProductButton.click();

    // Verify navigation
    await page.waitForURL('**/product/whole-life-plus**', { timeout: 10000 });
  });

  test('should handle low confidence product query', async ({ page }) => {
    const env = loadEnv();
    const creds = await ensureAdvisorUser();

    await page.addInitScript(({ key }) => {
      window.localStorage.setItem(key, 'true');
    }, { key: TEST_FLAG_KEY });

    await page.route('**/agent-chat', async (route, request) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          assistant_reply: 'I\\'m not sure which type of insurance you\\'re looking for. Did you mean:\\n1. Life insurance\\n2. Health insurance\\n3. Investment products',
          ui_actions: [],
          metadata: {
            topic: 'product',
            subtopic: 'search',
            intent: 'unclear',
            confidence: 0.52,
            agent: 'ProductAgent',
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
    await chatInput.fill('Show me insurance');
    await chatInput.press('Enter');

    // Verify clarification request
    await expect(page.getByText(/I'm not sure which type/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Life insurance/i)).toBeVisible();
    await expect(page.getByText(/Health insurance/i)).toBeVisible();
  });

  test('should show confidence badge for medium confidence product intent', async ({ page }) => {
    const env = loadEnv();
    const creds = await ensureAdvisorUser();

    await page.addInitScript(({ key }) => {
      window.localStorage.setItem(key, 'true');
    }, { key: TEST_FLAG_KEY });

    await page.route('**/agent-chat', async (route, request) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          assistant_reply: 'I think you want to see term life insurance products. Is that correct?',
          ui_actions: [
            {
              action: 'navigate',
              page: '/product',
              params: {
                category: 'term_life',
              },
            },
          ],
          metadata: {
            topic: 'product',
            subtopic: 'search',
            intent: 'list_by_category',
            confidence: 0.74,
            agent: 'ProductAgent',
          },
        }),
        headers: { 'Content-Type': 'application/json' },
      });
    });

    await loginWithSupabase(page, env, creds, TEST_FLAG_KEY);

    const miraButton = page.getByRole('button', { name: /mira/i }).first();
    await miraButton.click();

    const chatInput = page.getByPlaceholder(/ask mira/i).or(page.getByRole('textbox', { name: /message/i }));
    await chatInput.fill('term life');
    await chatInput.press('Enter');

    // Verify confidence badge appears with yellow color (0.5-0.8 range)
    const confidenceBadge = page.getByText(/74%|0\\.74|confidence/i).first();
    await expect(confidenceBadge).toBeVisible({ timeout: 10000 });
  });
});
