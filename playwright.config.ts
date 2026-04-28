import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Lean Canvas e2e tests.
 *
 * Prerequisites
 * ─────────────
 * 1. The dev server must be running or will be started by this config.
 * 2. A test user session is required.  Generate `e2e/.auth/session.json`
 *    by running the login setup fixture once:
 *
 *      npx playwright test --project=setup
 *
 * 3. Set env vars in .env.test (never commit):
 *      E2E_BASE_URL=http://localhost:3000
 *      E2E_USER_EMAIL=...
 *      E2E_USER_PASSWORD=...
 *
 * Running the tests
 * ─────────────────
 *   npx playwright test               # all projects
 *   npx playwright test lean-canvas   # one file
 *   npx playwright test --ui          # interactive mode
 */

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    /* ── Auth setup (runs once, generates session file) ─── */
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },

    /* ── Desktop Chrome ──────────────────────────────────── */
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/session.json',
      },
      dependencies: ['setup'],
    },

    /* ── Mobile Safari — 375px (iPhone SE) ──────────────── */
    {
      name: 'mobile-safari',
      use: {
        ...devices['iPhone SE'],
        storageState: 'e2e/.auth/session.json',
      },
      dependencies: ['setup'],
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
