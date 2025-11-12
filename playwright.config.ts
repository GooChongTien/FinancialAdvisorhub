import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  use: {
    baseURL: 'http://localhost:4173',
    headless: true,
    viewport: { width: 1366, height: 900 },
  },
  webServer: {
    command: 'npm run preview -- --port=4173',
    port: 4173,
    reuseExistingServer: true,
    timeout: 60_000,
  },
  reporter: [['list']],
});

