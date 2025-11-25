import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/tests/setup.js',
    include: [
      'tests/**/*.test.{ts,tsx,js,jsx}',
      'src/tests/**/*.test.{ts,tsx,js,jsx}'
    ],
    exclude: [
      'tests/**/*.spec.{ts,tsx,js,jsx}',
      'tests/e2e/**'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/tests/',
        '**/*.test.{js,jsx}',
        '**/*.spec.{js,jsx}',
        '**/mocks/',
        'vite.config.js',
        'vitest.config.js',
        'playwright.config.ts'
      ],
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'https://esm.sh/zod@3.25.76': 'zod',
      'https://esm.sh/@supabase/supabase-js@2.45.0': '@supabase/supabase-js',
      'https://esm.sh/@supabase/supabase-js@2.39.3': '@supabase/supabase-js',
      'https://esm.sh/@supabase/supabase-js@2': '@supabase/supabase-js'
    }
  }
});
