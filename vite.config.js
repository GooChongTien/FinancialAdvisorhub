import { defineConfig } from "vite";
import { configDefaults } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";

export default defineConfig({
  plugins: [react()],
  css: {
    postcss: {
      plugins: [tailwindcss(), autoprefixer()],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx", "tests/**/*.spec.ts", "tests/**/*.spec.tsx"],
    exclude: [
      ...configDefaults.exclude,
      "tests/e2e/**",
      "tests/e2e.spec.ts",
      // Exclude Playwright specs from Vitest collection
      "tests/frontend/**/*.spec.ts",
    ],
    coverage: {
      provider: "v8",
    },
  },
});
