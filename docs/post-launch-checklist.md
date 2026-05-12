# Post-Launch Checklist

Last updated: 2026-05-09

This file tracks improvements to make after the first paid Scout / Calm Commerce launch is live and usable.

## Scout Extension Gating

- [ ] Move free-limit enforcement into the Scout popup as well as the Workspace save API.
  - When a free user has hit their allowance, the extension should not fetch or display a fresh product score.
  - The popup should show a clear locked state: `You've hit your free limit. Upgrade to continue.`
  - Include an upgrade CTA that opens the Scout upgrade flow.
  - Keep server-side checks as the source of truth, because extension UI checks can be bypassed.
  - Reason: otherwise users can keep scanning, read/copy the popup output, and avoid upgrading even if Workspace saves are blocked.

## Scout Workspace Scale

- [ ] Add pagination to the Scout Workspace product list once real usage grows.
  - Target the `/ideas` table first.
  - Keep the default sort as newest first.
  - Preserve filters, search, and status tabs across page changes.
  - Consider page size options around 25 / 50 / 100 products.
  - Reason: Basic allows 50 saves now, Pro may accumulate hundreds, and the current table is optimized for launch testing rather than large catalog browsing.
- [ ] Add global default economics fees.
  - Let users define common fees once, such as Shopify, Stripe, Etsy, Amazon referral fees, or fixed payment-processing fees.
  - New product candidates should inherit those defaults automatically.
  - Product-level economics should still allow per-product overrides.
  - Reason: repeated fee entry is tedious and will get worse as users save more candidates.

## Scout Enrichment Infrastructure

- [ ] Consider Oxylabs or a similar ecommerce scraping API once "scan any product website" becomes painful to maintain.
  - Use this only after the DataForSEO / Keepa enrichment path proves there is demand for deeper scans.
  - Primary benefit: robust extraction across many storefronts without maintaining custom selectors and anti-bot handling.
  - Keep it post-launch because it adds recurring cost and infrastructure complexity before we know scan volume.
