import { test, expect, Page } from '@playwright/test';
import { ensureAdvisorUser, loadEnv } from '../utils/e2eHelpers';

/**
 * E2E Tests: Entity Customer CRUD + Roster Upload
 *
 * Test scenarios:
 * 1. Create entity customer via form
 * 2. View entity customer detail
 * 3. Upload employee roster
 * 4. Update entity customer details
 * 5. Delete entity customer
 */

const TEST_FLAG_KEY = 'mira:test:entity-customer';

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

test.describe('Entity Customer CRUD', () => {
  let entityId: string;

  test('should create entity customer via form', async ({ page }) => {
    const env = loadEnv();
    const creds = await ensureAdvisorUser();

    await page.addInitScript(({ key }) => {
      window.localStorage.setItem(key, 'true');
    }, { key: TEST_FLAG_KEY });

    // Track API calls
    const apiCalls: Array<{ method: string; url: string; body: string | null }> = [];
    await page.route('**/api/entity-customers', async (route, request) => {
      const body = request.postData();
      apiCalls.push({
        method: request.method(),
        url: request.url(),
        body,
      });

      if (request.method() === 'POST') {
        const data = body ? JSON.parse(body) : {};
        entityId = 'test-entity-' + Date.now();

        await route.fulfill({
          status: 201,
          body: JSON.stringify({
            id: entityId,
            company_name: data.company_name,
            business_registration_no: data.business_registration_no,
            industry: data.industry,
            num_employees: data.num_employees,
            annual_revenue: data.annual_revenue,
            customer_type: 'Entity',
            created_at: new Date().toISOString(),
          }),
          headers: { 'Content-Type': 'application/json' },
        });
      }
    });

    await loginWithSupabase(page, env, creds, TEST_FLAG_KEY);

    // Navigate to entity customers page
    await page.goto('/advisor/entity-customers');
    await page.waitForLoadState('networkidle');

    // Click "New Entity Customer" button
    await page.click('text=New Entity Customer');

    // Wait for form dialog
    await expect(page.getByRole('dialog')).toBeVisible();

    // Fill entity customer form
    await page.fill('[name="company_name"]', 'TechCorp Pte Ltd');
    await page.fill('[name="business_registration_no"]', '202300001A');
    await page.selectOption('[name="industry"]', 'Technology');
    await page.fill('[name="num_employees"]', '50');
    await page.fill('[name="annual_revenue"]', '5000000');

    // Fill keyman details
    await page.fill('[name="keyman_name"]', 'John Doe');
    await page.fill('[name="keyman_position"]', 'CEO');
    await page.fill('[name="keyman_email"]', 'john.doe@techcorp.com');
    await page.fill('[name="keyman_contact"]', '91234567');

    // Submit form
    await page.click('button:has-text("Create Entity Customer")');

    // Wait for API call
    await page.waitForTimeout(500);

    // Verify API was called
    expect(apiCalls.length).toBeGreaterThan(0);
    const createCall = apiCalls.find(c => c.method === 'POST');
    expect(createCall).toBeTruthy();

    if (createCall?.body) {
      const payload = JSON.parse(createCall.body);
      expect(payload.company_name).toBe('TechCorp Pte Ltd');
      expect(payload.business_registration_no).toBe('202300001A');
      expect(payload.customer_type).toBe('Entity');
    }

    // Verify success message
    await expect(page.locator('text=/entity customer.*created/i')).toBeVisible({ timeout: 3000 });

    // Verify entity appears in list
    await expect(page.locator('text=TechCorp Pte Ltd')).toBeVisible();
  });

  test('should view entity customer detail', async ({ page }) => {
    const env = loadEnv();
    const creds = await ensureAdvisorUser();

    await page.addInitScript(({ key }) => {
      window.localStorage.setItem(key, 'true');
    }, { key: TEST_FLAG_KEY });

    // Mock entity customer detail API
    await page.route('**/api/entity-customers/*', async (route, request) => {
      if (request.method() === 'GET') {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            id: 'test-entity-123',
            company_name: 'TechCorp Pte Ltd',
            business_registration_no: '202300001A',
            industry: 'Technology',
            num_employees: 50,
            annual_revenue: 5000000,
            customer_type: 'Entity',
            keyman_details: {
              name: 'John Doe',
              position: 'CEO',
              email: 'john.doe@techcorp.com',
              contact_number: '91234567',
            },
            created_at: new Date().toISOString(),
          }),
          headers: { 'Content-Type': 'application/json' },
        });
      }
    });

    await loginWithSupabase(page, env, creds, TEST_FLAG_KEY);

    // Navigate to entity customer detail
    await page.goto('/advisor/entity-customers/detail?id=test-entity-123');
    await page.waitForLoadState('networkidle');

    // Verify entity header
    await expect(page.getByRole('heading', { name: 'TechCorp Pte Ltd' })).toBeVisible();
    await expect(page.locator('text=Entity')).toBeVisible();
    await expect(page.locator('text=202300001A')).toBeVisible();

    // Verify tabs are shown correctly
    await expect(page.getByRole('tab', { name: 'Overview' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Portfolio' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Servicing' })).toBeVisible();

    // Verify Gap & Opportunity tab is NOT shown for entities
    await expect(page.getByRole('tab', { name: 'Gap & Opportunity' })).not.toBeVisible();

    // Check Overview tab content
    await page.click('text=Overview');
    await expect(page.locator('text=Company Details')).toBeVisible();
    await expect(page.locator('text=Technology')).toBeVisible();
    await expect(page.locator('text=50')).toBeVisible(); // employees

    // Check keyman details
    await expect(page.locator('text=John Doe')).toBeVisible();
    await expect(page.locator('text=CEO')).toBeVisible();
  });

  test('should upload employee roster', async ({ page }) => {
    const env = loadEnv();
    const creds = await ensureAdvisorUser();

    await page.addInitScript(({ key }) => {
      window.localStorage.setItem(key, 'true');
    }, { key: TEST_FLAG_KEY });

    const uploadCalls: Array<{ body: string | null }> = [];

    // Mock entity customer detail API
    await page.route('**/api/entity-customers/test-entity-123', async (route, request) => {
      if (request.method() === 'GET') {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            id: 'test-entity-123',
            company_name: 'TechCorp Pte Ltd',
            business_registration_no: '202300001A',
            industry: 'Technology',
            num_employees: 50,
            annual_revenue: 5000000,
            customer_type: 'Entity',
            employee_roster: null, // No roster yet
            created_at: new Date().toISOString(),
          }),
          headers: { 'Content-Type': 'application/json' },
        });
      } else if (request.method() === 'PATCH') {
        // Handle roster upload
        const body = request.postData();
        uploadCalls.push({ body });

        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            id: 'test-entity-123',
            company_name: 'TechCorp Pte Ltd',
            employee_roster: body ? JSON.parse(body).employee_roster : [],
          }),
          headers: { 'Content-Type': 'application/json' },
        });
      }
    });

    await loginWithSupabase(page, env, creds, TEST_FLAG_KEY);

    // Navigate to entity customer detail
    await page.goto('/advisor/entity-customers/detail?id=test-entity-123');
    await page.waitForLoadState('networkidle');

    // Click Overview tab
    await page.click('text=Overview');

    // Find and click upload roster button
    await page.click('text=Upload Employee Roster');

    // Create a mock CSV file
    const csvContent = `Name,Email,Position,Department
Alice Wong,alice@techcorp.com,Manager,Engineering
Bob Tan,bob@techcorp.com,Developer,Engineering
Charlie Lee,charlie@techcorp.com,Designer,Marketing`;

    // Upload file
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('input[type="file"]');
    const fileChooser = await fileChooserPromise;

    // Create a temporary file for upload
    await fileChooser.setFiles({
      name: 'employees.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent),
    });

    // Wait for upload to process
    await page.waitForTimeout(1000);

    // Click confirm/save button
    await page.click('button:has-text("Save Roster")');

    // Wait for API call
    await page.waitForTimeout(500);

    // Verify upload was called
    expect(uploadCalls.length).toBeGreaterThan(0);

    if (uploadCalls[0]?.body) {
      const payload = JSON.parse(uploadCalls[0].body);
      expect(payload.employee_roster).toBeTruthy();
      expect(Array.isArray(payload.employee_roster)).toBe(true);
      expect(payload.employee_roster.length).toBeGreaterThan(0);
    }

    // Verify success message
    await expect(page.locator('text=/roster.*uploaded/i')).toBeVisible({ timeout: 3000 });

    // Verify employee list is shown
    await expect(page.locator('text=Alice Wong')).toBeVisible();
    await expect(page.locator('text=Bob Tan')).toBeVisible();
    await expect(page.locator('text=Charlie Lee')).toBeVisible();
  });

  test('should update entity customer details', async ({ page }) => {
    const env = loadEnv();
    const creds = await ensureAdvisorUser();

    await page.addInitScript(({ key }) => {
      window.localStorage.setItem(key, 'true');
    }, { key: TEST_FLAG_KEY });

    const updateCalls: Array<{ body: string | null }> = [];

    // Mock API
    await page.route('**/api/entity-customers/test-entity-123', async (route, request) => {
      if (request.method() === 'GET') {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            id: 'test-entity-123',
            company_name: 'TechCorp Pte Ltd',
            business_registration_no: '202300001A',
            industry: 'Technology',
            num_employees: 50,
            annual_revenue: 5000000,
            customer_type: 'Entity',
          }),
          headers: { 'Content-Type': 'application/json' },
        });
      } else if (request.method() === 'PATCH') {
        const body = request.postData();
        updateCalls.push({ body });

        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            id: 'test-entity-123',
            company_name: body ? JSON.parse(body).company_name : 'TechCorp Pte Ltd',
            num_employees: body ? JSON.parse(body).num_employees : 50,
          }),
          headers: { 'Content-Type': 'application/json' },
        });
      }
    });

    await loginWithSupabase(page, env, creds, TEST_FLAG_KEY);

    // Navigate to entity customer detail
    await page.goto('/advisor/entity-customers/detail?id=test-entity-123');
    await page.waitForLoadState('networkidle');

    // Click edit button
    await page.click('button:has-text("Edit")');

    // Wait for edit form
    await expect(page.getByRole('dialog')).toBeVisible();

    // Update number of employees
    await page.fill('[name="num_employees"]', '75');

    // Save changes
    await page.click('button:has-text("Save Changes")');

    // Wait for API call
    await page.waitForTimeout(500);

    // Verify update was called
    expect(updateCalls.length).toBeGreaterThan(0);

    if (updateCalls[0]?.body) {
      const payload = JSON.parse(updateCalls[0].body);
      expect(payload.num_employees).toBe(75);
    }

    // Verify success message
    await expect(page.locator('text=/updated/i')).toBeVisible({ timeout: 3000 });
  });

  test('should delete entity customer', async ({ page }) => {
    const env = loadEnv();
    const creds = await ensureAdvisorUser();

    await page.addInitScript(({ key }) => {
      window.localStorage.setItem(key, 'true');
    }, { key: TEST_FLAG_KEY });

    const deleteCalls: string[] = [];

    // Mock API
    await page.route('**/api/entity-customers/test-entity-123', async (route, request) => {
      if (request.method() === 'GET') {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            id: 'test-entity-123',
            company_name: 'TechCorp Pte Ltd',
            business_registration_no: '202300001A',
            customer_type: 'Entity',
          }),
          headers: { 'Content-Type': 'application/json' },
        });
      } else if (request.method() === 'DELETE') {
        deleteCalls.push(request.url());
        await route.fulfill({
          status: 204,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    });

    await loginWithSupabase(page, env, creds, TEST_FLAG_KEY);

    // Navigate to entity customer detail
    await page.goto('/advisor/entity-customers/detail?id=test-entity-123');
    await page.waitForLoadState('networkidle');

    // Click delete button
    await page.click('button:has-text("Delete")');

    // Confirm deletion in dialog
    await expect(page.locator('text=/confirm.*delete/i')).toBeVisible();
    await page.click('button:has-text("Confirm")');

    // Wait for API call
    await page.waitForTimeout(500);

    // Verify delete was called
    expect(deleteCalls.length).toBe(1);

    // Verify success message
    await expect(page.locator('text=/deleted/i')).toBeVisible({ timeout: 3000 });

    // Verify redirect to entity customers list
    await expect(page).toHaveURL(/\/advisor\/entity-customers$/);
  });
});
