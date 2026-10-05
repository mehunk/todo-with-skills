import { existsSync } from "node:fs";
import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

// Local runs read Clerk keys and the E2E user from .env.local (CI sets them as
// real environment variables, which win). E2E_ENV_FILE points elsewhere, e.g.
// at the main checkout's file from a git worktree.
const envFile = path.resolve(
  import.meta.dirname,
  process.env.E2E_ENV_FILE ?? ".env.local",
);
if (existsSync(envFile)) process.loadEnvFile(envFile);

// @clerk/testing reads CLERK_PUBLISHABLE_KEY; the app reads the VITE_ one.
process.env.CLERK_PUBLISHABLE_KEY ??= process.env.VITE_CLERK_PUBLISHABLE_KEY;

// A port of its own, so a `npm run dev` on 3000 from another checkout is never
// mistaken for this one.
const LOCAL_PORT = 3100;
const baseURL = process.env.BASE_URL ?? `http://localhost:${LOCAL_PORT}`;

export default defineConfig({
  testDir: "./e2e",
  // Browser specs only: e2e/**/*.test.ts are Vitest unit tests of the helpers.
  testMatch: "**/*.spec.ts",
  globalSetup: "./e2e/global.setup.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // Kept on failure so CI can upload them as artifacts.
  outputDir: "test-results",
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report" }],
  ],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // BASE_URL targets a running deployment; otherwise start a dev server.
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: `npx vite dev --port ${LOCAL_PORT} --strictPort`,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        env: {
          VITE_CLERK_PUBLISHABLE_KEY: process.env.CLERK_PUBLISHABLE_KEY ?? "",
        },
      },
});
