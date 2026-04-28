/**
 * Lean Canvas — end-to-end tests.
 *
 * Coverage
 * ────────
 * 1. Deep-link tab selection  (?tab=operating, ?tab=business)
 * 2. Client-side tab switching preserves scroll position
 * 3. Inline edit: Save persists on full page reload
 * 4. Inline edit: Escape cancels + returns focus to the card button
 * 5. Inline edit: Enter key submits
 * 6. Business Model "Skip for now" persists in localStorage
 * 7. "Bring back" un-skips a section
 * 8. Mobile (iPhone SE 375px): cards stack, tabs wrap, no horizontal scroll
 *
 * Pre-conditions
 * ──────────────
 * • The dev server is running (or started by the webServer config).
 * • e2e/.auth/session.json exists (run `npx playwright test --project=setup`).
 * • The test account has at least the Operating layer worksheet blank so
 *   inline edit tests start from a known state.
 */

import { test, expect, type Page } from '@playwright/test';

// ── Helpers ────────────────────────────────────────────────────────────

/** Navigate to /lean-canvas and wait for the shell to hydrate. */
async function gotoCanvas(page: Page, tab?: 'operating' | 'business') {
  const url = tab ? `/lean-canvas?tab=${tab}` : '/lean-canvas';
  await page.goto(url);
  // The LearnerShell h1 signals the page is ready.
  await expect(page.getByRole('heading', { name: 'Lean Canvas', level: 1 })).toBeVisible();
}

/** Clear the canvas preferences from localStorage to reset skip state. */
async function clearPreferences(page: Page) {
  await page.evaluate(() =>
    localStorage.removeItem('calm-commerce:canvas-preferences'),
  );
}

// ── Tab navigation ─────────────────────────────────────────────────────

test.describe('Tab navigation', () => {
  test('?tab=operating selects the Operating layer tab', async ({ page }) => {
    await gotoCanvas(page, 'operating');
    await expect(
      page.getByRole('tab', { name: /operating layer/i }),
    ).toHaveAttribute('aria-selected', 'true');
    await expect(
      page.getByRole('tab', { name: /business model layer/i }),
    ).toHaveAttribute('aria-selected', 'false');
  });

  test('?tab=business selects the Business model layer tab', async ({ page }) => {
    await gotoCanvas(page, 'business');
    await expect(
      page.getByRole('tab', { name: /business model layer/i }),
    ).toHaveAttribute('aria-selected', 'true');
  });

  test('clicking Business model layer switches panel content', async ({ page }) => {
    await gotoCanvas(page, 'operating');
    await page.getByRole('tab', { name: /business model layer/i }).click();

    await expect(
      page.getByRole('tab', { name: /business model layer/i }),
    ).toHaveAttribute('aria-selected', 'true');
    // The business panel heading becomes visible.
    await expect(page.getByRole('heading', { name: /business model canvas/i })).toBeVisible();
  });

  test('tab switch updates the URL ?tab parameter', async ({ page }) => {
    await gotoCanvas(page, 'operating');
    await page.getByRole('tab', { name: /business model layer/i }).click();
    await expect(page).toHaveURL(/tab=business/);
  });

  test('tab switch does NOT cause a full page navigation (no reload)', async ({ page }) => {
    await gotoCanvas(page, 'operating');
    // Inject a marker; if the page reloads it will be gone.
    await page.evaluate(() => { (window as Window & { __noReload__?: true }).__noReload__ = true; });
    await page.getByRole('tab', { name: /business model layer/i }).click();
    const marker = await page.evaluate(
      () => (window as Window & { __noReload__?: true }).__noReload__,
    );
    expect(marker).toBe(true);
  });

  test('tab switch preserves scroll position', async ({ page }) => {
    await gotoCanvas(page, 'operating');
    // Scroll down 400px then switch tabs.
    await page.evaluate(() => window.scrollTo(0, 400));
    const scrollBefore = await page.evaluate(() => window.scrollY);

    await page.getByRole('tab', { name: /business model layer/i }).click();
    const scrollAfter = await page.evaluate(() => window.scrollY);

    // Scroll position should not jump to the top (allow 80px tolerance for
    // any browser-internal adjustments).
    expect(Math.abs(scrollAfter - scrollBefore)).toBeLessThan(80);
  });

  test('keyboard: ArrowRight moves focus to next tab', async ({ page }) => {
    await gotoCanvas(page, 'operating');
    await page.getByRole('tab', { name: /operating layer/i }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(
      page.getByRole('tab', { name: /business model layer/i }),
    ).toHaveAttribute('aria-selected', 'true');
  });
});

// ── Inline edit ────────────────────────────────────────────────────────

test.describe('Inline edit (Time budget)', () => {
  test.beforeEach(async ({ page }) => {
    await gotoCanvas(page, 'operating');
  });

  test('clicking the Time budget card opens an inline input', async ({ page }) => {
    await page.getByRole('button', { name: /time budget/i }).click();
    // The input (type=number) should appear.
    const input = page.getByRole('spinbutton', { name: /time budget/i });
    await expect(input).toBeVisible();
    await expect(input).toBeFocused();
  });

  test('Escape cancels edit and returns focus to the card button', async ({
    page,
  }) => {
    await page.getByRole('button', { name: /time budget/i }).click();
    const input = page.getByRole('spinbutton', { name: /time budget/i });
    await input.press('Escape');

    // Input is gone.
    await expect(input).not.toBeVisible();
    // Focus has returned to the card button.
    await expect(page.getByRole('button', { name: /time budget/i })).toBeFocused();
  });

  test('Enter key submits the inline edit', async ({ page }) => {
    await page.getByRole('button', { name: /time budget/i }).click();
    const input = page.getByRole('spinbutton', { name: /time budget/i });
    await input.fill('20');
    await input.press('Enter');

    // The input closes and the value is shown.
    await expect(input).not.toBeVisible();
    await expect(page.getByText(/20/)).toBeVisible();
  });

  test('Save button persists the value on full page reload', async ({ page }) => {
    // Clear any previous value first.
    await page.getByRole('button', { name: /time budget/i }).click();
    const input = page.getByRole('spinbutton', { name: /time budget/i });
    await input.fill('18');
    await page.getByRole('button', { name: 'Save' }).click();

    // Confirm optimistic update shows immediately.
    await expect(page.getByText(/18/)).toBeVisible();

    // Full reload — value must come from the server now.
    await page.reload();
    await expect(page.getByText(/18/)).toBeVisible();
  });

  test('Cancel reverts to the previous value', async ({ page }) => {
    // Note the current displayed value before editing.
    const cardText = await page
      .getByRole('button', { name: /time budget/i })
      .textContent();

    await page.getByRole('button', { name: /time budget/i }).click();
    const input = page.getByRole('spinbutton', { name: /time budget/i });
    await input.fill('999');
    await page.getByRole('button', { name: 'Cancel' }).click();

    // The card should not show 999.
    await expect(page.getByText('999')).not.toBeVisible();
    // Card text should be unchanged.
    const cardTextAfter = await page
      .getByRole('button', { name: /time budget/i })
      .textContent();
    expect(cardTextAfter).toBe(cardText);
  });
});

// ── Business model skip ────────────────────────────────────────────────

test.describe('Business model Skip for now / Bring back', () => {
  test.beforeEach(async ({ page }) => {
    await gotoCanvas(page, 'business');
    // Reset skip state so every test starts clean.
    await clearPreferences(page);
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Lean Canvas', level: 1 })).toBeVisible();
  });

  test('empty Business Model cards show a "Skip for now" button', async ({
    page,
  }) => {
    const skipButtons = page.getByRole('button', { name: /skip for now/i });
    await expect(skipButtons.first()).toBeVisible();
  });

  test('clicking Skip hides the section description and shows "Bring back"', async ({
    page,
  }) => {
    const skipBtn = page.getByRole('button', { name: /skip for now/i }).first();
    await skipBtn.click();

    // Skipped state UI appears.
    await expect(
      page.getByRole('button', { name: /bring back/i }).first(),
    ).toBeVisible();
    await expect(page.getByText(/skipped for now/i).first()).toBeVisible();
  });

  test('"Bring back" restores the empty card with Start action', async ({
    page,
  }) => {
    // Skip the first skippable card.
    await page.getByRole('button', { name: /skip for now/i }).first().click();

    // Bring it back.
    await page.getByRole('button', { name: /bring back/i }).first().click();

    // "Skip for now" should reappear.
    await expect(
      page.getByRole('button', { name: /skip for now/i }).first(),
    ).toBeVisible();
  });

  test('skip state persists across page reloads (localStorage)', async ({
    page,
  }) => {
    await page.getByRole('button', { name: /skip for now/i }).first().click();
    await expect(
      page.getByRole('button', { name: /bring back/i }).first(),
    ).toBeVisible();

    // Reload — preferences are read from localStorage on mount.
    await page.reload();
    await expect(
      page.getByRole('button', { name: /bring back/i }).first(),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('skipped state does NOT persist after Bring back + reload', async ({
    page,
  }) => {
    // Skip.
    await page.getByRole('button', { name: /skip for now/i }).first().click();
    // Bring back.
    await page.getByRole('button', { name: /bring back/i }).first().click();
    // Reload.
    await page.reload();
    // Should show Skip again (not Bring back).
    await expect(
      page.getByRole('button', { name: /skip for now/i }).first(),
    ).toBeVisible({ timeout: 5_000 });
  });
});

// ── Deep-link anchors ──────────────────────────────────────────────────

test.describe('Edit / Start action links', () => {
  test('Operating long-form card "Edit" link goes to the Chapter 4 worksheet', async ({
    page,
  }) => {
    await gotoCanvas(page, 'operating');

    // Success metrics is a long-form (non-inline) card.
    const editLink = page
      .getByRole('link', { name: /edit/i })
      .filter({ hasText: /edit/i })
      .first();

    // Capture the href without navigating.
    const href = await editLink.getAttribute('href');
    expect(href).toMatch(/chapter\/set-your-founder-rules/);
  });

  test('Business model empty card "Start" link goes to the correct worksheet step', async ({
    page,
  }) => {
    await gotoCanvas(page, 'business');
    const startLink = page.getByRole('link', { name: /start/i }).first();
    const href = await startLink.getAttribute('href');
    // All business model start links should target chapter steps or worksheets.
    expect(href).toMatch(/\/chapter\//);
  });
});

// ── Mobile layout ──────────────────────────────────────────────────────

test.describe('Mobile layout (375px)', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('no horizontal scroll on the operating tab', async ({ page }) => {
    await gotoCanvas(page, 'operating');
    const bodyWidth   = await page.evaluate(() => document.body.scrollWidth);
    const windowWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(windowWidth + 2); // 2px tolerance
  });

  test('no horizontal scroll on the business model tab', async ({ page }) => {
    await gotoCanvas(page, 'business');
    await page.getByRole('tab', { name: /business model layer/i }).click();
    const bodyWidth   = await page.evaluate(() => document.body.scrollWidth);
    const windowWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(windowWidth + 2);
  });

  test('tabs remain interactive at 375px', async ({ page }) => {
    await gotoCanvas(page, 'operating');
    const businessTab = page.getByRole('tab', { name: /business model layer/i });
    await expect(businessTab).toBeVisible();
    await businessTab.click();
    await expect(businessTab).toHaveAttribute('aria-selected', 'true');
  });

  test('cards stack in a single column at 375px', async ({ page }) => {
    await gotoCanvas(page, 'business');
    await page.getByRole('tab', { name: /business model layer/i }).click();

    // All visible link/button cards should be narrower than the viewport.
    const cards = page.locator('[role="link"], button[class*="rounded"]');
    const count = await cards.count();

    for (let i = 0; i < Math.min(count, 4); i++) {
      const box = await cards.nth(i).boundingBox();
      if (box) {
        expect(box.x + box.width).toBeLessThanOrEqual(375 + 4); // 4px tolerance
      }
    }
  });
});
