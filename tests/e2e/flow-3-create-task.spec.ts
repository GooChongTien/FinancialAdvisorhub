import { test, expect, Page } from '@playwright/test';
import { ensureAdvisorUser, loadEnv } from '../utils/e2eHelpers';

/**
 * Flow 3: Create Task (To-Do Agent)
 *
 * Test scenario 1: User says "Remind me to follow up with Kim tomorrow"
 * Expected flow:
 * 1. Intent router classifies → ToDoAgent selected
 * 2. Agent parses "tomorrow" as due_date
 * 3. Agent returns navigate + prefill + execute actions
 * 4. Frontend navigates to /todo
 * 5. Opens new task modal
 * 6. Prefills title="Follow up with Kim", due_date=tomorrow
 * 7. Shows confirmation dialog
 * 8. User confirms → POST /api/tasks
 * 9. Success toast, task appears in list
 *
 * Test scenario 2: User asks "What are my tasks for today?"
 * Expected flow:
 * 1. ToDoAgent returns navigate action to /todo with today filter
 * 2. Frontend navigates and displays filtered tasks
 *
 * Test scenario 3: Copilot suggests "Complete overdue tasks"
 * Expected flow:
 * 1. Copilot mode shows suggestion with overdue task count
 * 2. User clicks suggestion
 * 3. Navigates to /todo?filter=overdue
 */

const TEST_FLAG_KEY = 'mira:test:create-task';

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

test.describe('Flow 3: Create Task', () => {
  test('should create task via natural language command', async ({ page }) => {
    const env = loadEnv();
    const creds = await ensureAdvisorUser();

    await page.addInitScript(({ key }) => {
      window.localStorage.setItem(key, 'true');
    }, { key: TEST_FLAG_KEY });

    // Track API calls
    const apiCalls: Array<{ method: string; url: string; body: string | null }> = [];
    await page.route('**/api/tasks', async (route, request) => {
      apiCalls.push({
        method: request.method(),
        url: request.url(),
        body: request.postData(),
      });

      // Calculate tomorrow's date
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          id: 'test-task-123',
          title: 'Follow up with Kim',
          due_date: tomorrow.toISOString().split('T')[0],
          status: 'pending',
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

      // Calculate tomorrow's date for response
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      // Simulate ToDoAgent response with UI actions
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          assistant_reply: "I'll create a reminder to follow up with Kim tomorrow.",
          ui_actions: [
            {
              action: 'navigate',
              page: '/todo',
              popup: 'new-task-dialog',
              description: 'Opening task management page',
            },
            {
              action: 'frontend_prefill',
              payload: {
                title: 'Follow up with Kim',
                due_date: tomorrowStr,
              },
              description: 'Prefilling task details',
            },
          ],
          metadata: {
            topic: 'todo',
            subtopic: 'task_management',
            intent: 'create_task',
            confidence: 0.91,
            agent: 'ToDoAgent',
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

    // Step 2: User types task creation command
    await chatInput.fill('Remind me to follow up with Kim tomorrow');
    await chatInput.press('Enter');

    // Step 3: Verify intent router classification
    await expect.poll(() => chatCalls.length, { timeout: 10000 }).toBeGreaterThan(0);
    const chatCall = chatCalls[0];
    expect(chatCall?.body).toContain('Remind me to follow up with Kim');

    // Step 4: Verify agent response appears
    await expect(page.getByText(/I'll create a reminder/i)).toBeVisible({ timeout: 10000 });

    // Step 5: Verify navigation to /todo
    await page.waitForURL('**/todo**', { timeout: 10000 });

    // Step 6: Verify new task dialog opens
    const dialog = page.getByRole('dialog', { name: /new task|add task|create task/i });
    await expect(dialog).toBeVisible({ timeout: 10000 });

    // Step 7: Verify prefilled fields
    const titleInput = page.getByLabel(/title|task name/i).first();
    const dueDateInput = page.getByLabel(/due date|date/i).first();

    await expect(titleInput).toHaveValue('Follow up with Kim', { timeout: 5000 });

    // Verify tomorrow's date is prefilled
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    await expect(dueDateInput).toHaveValue(tomorrowStr, { timeout: 5000 });

    // Step 8: User reviews and clicks "Confirm" or "Create"
    const confirmButton = page.getByRole('button', { name: /confirm|save|create/i }).first();
    await expect(confirmButton).toBeVisible();
    await confirmButton.click();

    // Step 9: Verify POST /api/tasks executed
    await expect.poll(() => apiCalls.length, { timeout: 10000 }).toBeGreaterThan(0);
    const taskCall = apiCalls[0];
    expect(taskCall?.method).toBe('POST');
    expect(taskCall?.body).toContain('Follow up with Kim');

    // Step 10: Verify success toast
    await expect(page.getByText(/success|created|added/i)).toBeVisible({ timeout: 5000 });

    // Step 11: Verify dialog closes
    await expect(dialog).not.toBeVisible({ timeout: 5000 });

    // Step 12: Verify task appears in list
    const taskRow = page.getByText('Follow up with Kim').first();
    await expect(taskRow).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to today\'s tasks via chat command', async ({ page }) => {
    const env = loadEnv();
    const creds = await ensureAdvisorUser();

    await page.addInitScript(({ key }) => {
      window.localStorage.setItem(key, 'true');
    }, { key: TEST_FLAG_KEY });

    await page.route('**/agent-chat', async (route, request) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          assistant_reply: 'Here are your tasks for today.',
          ui_actions: [
            {
              action: 'navigate',
              page: '/todo',
              params: {
                filter: 'today',
              },
              description: 'Opening today\'s tasks',
            },
          ],
          metadata: {
            topic: 'todo',
            subtopic: 'task_management',
            intent: 'list_tasks',
            confidence: 0.89,
            agent: 'ToDoAgent',
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
    await chatInput.fill('What are my tasks for today?');
    await chatInput.press('Enter');

    await expect(page.getByText(/Here are your tasks for today/i)).toBeVisible({ timeout: 10000 });

    // Verify navigation to /todo with today filter
    await page.waitForURL('**/todo**', { timeout: 10000 });
    const url = page.url();
    expect(url).toContain('/todo');
    expect(url).toContain('filter=today');
  });

  test('should show overdue tasks via copilot suggestion', async ({ page }) => {
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
              id: 'suggestion-overdue',
              type: 'action',
              title: 'Complete overdue tasks',
              description: 'You have 3 overdue tasks that need attention',
              promptText: 'Show my overdue tasks',
              confidence: 0.92,
              metadata: {
                topic: 'todo',
                subtopic: 'task_management',
                intent: 'list_overdue_tasks',
                count: 3,
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
          assistant_reply: 'Here are your 3 overdue tasks.',
          ui_actions: [
            {
              action: 'navigate',
              page: '/todo',
              params: {
                filter: 'overdue',
              },
              description: 'Showing overdue tasks',
            },
          ],
          metadata: {
            topic: 'todo',
            subtopic: 'task_management',
            intent: 'list_overdue_tasks',
            confidence: 0.92,
            agent: 'ToDoAgent',
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
    const overdueSuggestion = page.getByText(/Complete overdue tasks/i).first();
    await expect(overdueSuggestion).toBeVisible({ timeout: 10000 });

    // Click suggestion
    await overdueSuggestion.click();

    // Verify navigation
    await page.waitForURL('**/todo**', { timeout: 10000 });
    const url = page.url();
    expect(url).toContain('/todo');
    expect(url).toContain('filter=overdue');
  });

  test('should handle ambiguous task creation command', async ({ page }) => {
    const env = loadEnv();
    const creds = await ensureAdvisorUser();

    await page.addInitScript(({ key }) => {
      window.localStorage.setItem(key, 'true');
    }, { key: TEST_FLAG_KEY });

    await page.route('**/agent-chat', async (route, request) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          assistant_reply: 'I need more details. When would you like to be reminded? Please specify a date or time.',
          ui_actions: [],
          metadata: {
            topic: 'todo',
            subtopic: 'task_management',
            intent: 'create_task',
            confidence: 0.58,
            agent: 'ToDoAgent',
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
    await chatInput.fill('Remind me about Kim');
    await chatInput.press('Enter');

    // Verify clarification request
    await expect(page.getByText(/I need more details/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/specify a date or time/i)).toBeVisible();
  });

  test('should show confidence badge for medium confidence task intent', async ({ page }) => {
    const env = loadEnv();
    const creds = await ensureAdvisorUser();

    await page.addInitScript(({ key }) => {
      window.localStorage.setItem(key, 'true');
    }, { key: TEST_FLAG_KEY });

    await page.route('**/agent-chat', async (route, request) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          assistant_reply: 'I think you want to create a task. Is that correct?',
          ui_actions: [],
          metadata: {
            topic: 'todo',
            subtopic: 'task_management',
            intent: 'create_task',
            confidence: 0.68,
            agent: 'ToDoAgent',
          },
        }),
        headers: { 'Content-Type': 'application/json' },
      });
    });

    await loginWithSupabase(page, env, creds, TEST_FLAG_KEY);

    const miraButton = page.getByRole('button', { name: /mira/i }).first();
    await miraButton.click();

    const chatInput = page.getByPlaceholder(/ask mira/i).or(page.getByRole('textbox', { name: /message/i }));
    await chatInput.fill('task Kim');
    await chatInput.press('Enter');

    // Verify confidence badge appears with yellow color (0.5-0.8 range)
    const confidenceBadge = page.getByText(/68%|0\\.68|confidence/i).first();
    await expect(confidenceBadge).toBeVisible({ timeout: 10000 });
  });
});
