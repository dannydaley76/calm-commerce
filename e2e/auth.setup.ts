/**
 * Auth setup fixture — runs once before all e2e tests.
 *
 * Logs in with E2E_USER_EMAIL + E2E_USER_PASSWORD, then saves
 * the authenticated browser state to e2e/.auth/session.json so
 * every subsequent test can re-use the session without re-logging in.
 *
 * Usage:
 *   E2E_USER_EMAIL=... E2E_USER_PASSWORD=... npx playwright test --project=setup
 */

import { test as setup, expect } from '@playwright/test';
import path from 'path';

const SESSION_FILE = path.join(__dirname, '.auth/session.json');

setup('authenticate', async ({ page }) => {
  const email    = process.env.E2E_USER_EMAIL;
  const password = process.env.E2E_USER_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'Set E2E_USER_EMAIL and E2E_USER_PASSWORD before running the setup project.',
    );
  }

  await page.goto('/');

  // ── Fill in the login form ───────────────────────────────────────────
  // Adjust selectors to match the actual login page markup.
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /sign in|log in/i }).click();

  // Wait for the learner shell to appear — confirms successful auth.
  await expect(page.getByText('Calm Commerce')).toBeVisible({ timeout: 10_000 });

  // Persist the session so other projects can re-use it.
  await page.context().storageState({ path: SESSION_FILE });
});
