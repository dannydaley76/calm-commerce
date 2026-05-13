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

- [ ] Make Scout-only navigation consistent across Workspace, detail, account, and upgrade pages.
  - Scout-only users should see the same core nav everywhere: `Workspace`, `Upgrade`, and `Account`.
  - Keep `Upgrade` as a normal nav item, not a loud persistent CTA.
  - Continue using contextual upgrade banners only when a user hits a limit or tries a Pro-only feature.
  - Reason: account currently exposes `Upgrade`, while Workspace can hide it, which makes the paid path harder to find.
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
- [ ] Add richer note formatting in Scout product notes.
  - Support simple lists, clickable URLs, and preserved line breaks.
  - Keep it lightweight and safe rather than introducing full rich-text editing at launch.
  - Reason: notes are becoming part of the product decision record, and users will naturally paste supplier links, competitor URLs, and short checklists.

## Scout Enrichment Infrastructure

- [ ] Build a Scout Pro extraction learning queue.
  - Log weak scans where important fields are missing after first-pass and second-pass AI extraction.
  - Store domain/platform, URL pattern, missing fields, extracted snippets, field source (`json_ld`, `meta`, `dom_summary`, `platform_profile`, `ai`), confidence, and whether the second pass recovered the data.
  - Review recurring failures and turn them into MCP platform profiles to reduce token usage.
  - Keep the Chrome extension thin: it should send page context, while MCP owns structured parsing, platform profiles, and AI fallback.
  - Track token cost per scan and flag domains that are expensive or unreliable.
  - Reason: Pro failures should become a structured improvement loop, not one-off support noise.
- [ ] Improve Scout Pro MCP extraction quality before marketing it as broad product-page scanning.
  - Add field-level confidence for extracted values such as price, rating, reviews, orders, variants, and image.
  - Separate observed page data from inferred AI analysis in the payload and UI.
  - Prefer deterministic MCP extraction order: JSON-LD/schema.org product data, meta tags, page-context summaries, known platform profile, generic heuristics, then AI fallback for missing fields.
  - Add `priceType` labelling, such as `supplier cost`, `retail listing price`, or `unknown`, so Amazon/eBay prices are not mistaken for product cost.
  - Return short source snippets for important fields, for example `23 sold` or `2,024 reviews`, so users can trust where the data came from.
  - Give clearer missing-data reasons instead of generic `No data`, such as `Scout could not find sales or review volume on this page.`
  - Add platform-aware extraction profiles for known sites such as eBay, Etsy, Temu, Shopify storefronts, TikTok Shop, and Walmart before relying on one generic prompt.
  - Keep marketing language honest: `AI-assisted scanning across more product pages`, not `works on any product page`, until reliability is proven.
  - Reason: Pro is the paid upgrade, so users need confidence that extracted data is labelled, explainable, and safe to act on.
- [ ] Consider Oxylabs or a similar ecommerce scraping API once "scan any product website" becomes painful to maintain.
  - Use this only after the DataForSEO / Keepa enrichment path proves there is demand for deeper scans.
  - Primary benefit: robust extraction across many storefronts without maintaining custom selectors and anti-bot handling.
  - Keep it post-launch because it adds recurring cost and infrastructure complexity before we know scan volume.
