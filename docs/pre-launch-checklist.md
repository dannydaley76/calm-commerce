# Pre-Launch Checklist

Last updated: 2026-05-11

This file tracks the practical work needed before taking Scout / Calm Commerce into paid launch traffic.

## Production Infrastructure

- [ ] Split Supabase into separate development and production projects.
  - Dev should keep localhost redirects, test users, and Stripe test data.
  - Production should hold real users, real entitlements, and production redirects only.
- [ ] Run the current schema and product-entitlement migration on the production Supabase project.
- [ ] Point Vercel production env vars at the production Supabase project.
- [ ] Keep local `.env.local` pointed at the development Supabase project.
- [ ] Update Supabase production auth URL configuration.
  - Site URL: `https://www.calmcommerce.net`
  - Redirect URLs:
    - `https://www.calmcommerce.net/auth/callback`
    - Vercel preview/deployment callback URL if used for testing
    - `http://localhost:3000/auth/callback` only in the dev Supabase project
- [ ] Configure branded auth email sender before launch.
  - Replace default Supabase sender with a Calm Commerce domain sender.
  - Likely sender: `hello@calmcommerce.net` or `support@calmcommerce.net`.

## Billing And Plans

- [ ] Confirm live Stripe products and prices.
  - Scout Basic: one-time payment, 50 saved products.
  - Scout Pro: subscription, any-site / MCP-enhanced research.
  - Calm Commerce OS: coming soon until pricing is final.
- [ ] In production env vars, set only live Stripe keys and live price IDs.
- [ ] Ensure Stripe webhook endpoint points at production:
  - `https://www.calmcommerce.net/api/billing/webhook`
- [ ] Test Stripe webhook creates the correct entitlement rows.
  - Scout Basic: `product_code = scanner_extension`, `billing_type = one_time`, `status = active`.
  - Scout Pro: `product_code = research_workspace`, `billing_type = subscription`, `status = active`.
- [ ] Disable the Calm Commerce OS checkout button until the OS plan is ready.
  - Button copy should say `Coming soon`.
  - It should not submit to Stripe while `STRIPE_CALM_COMMERCE_OS_PRICE_ID` is unset.

## Scout Workspace And Extension

- [ ] Use the standalone Scout extension repo as the only extension source.
  - Canonical local path: `/Users/admin/winning-product-scanner`.
  - Chrome should load the unpacked extension from that folder.
  - Do not maintain or test an embedded `extension/` copy inside the OS repo.
- [ ] Test public install-first Scout journey.
  - User lands on `/scout`.
  - User clicks to install the Chrome extension.
  - Once the Chrome Web Store listing is live, this should open the public listing.
  - Before the listing is live, show clear temporary copy such as `Chrome Web Store link coming soon` or provide internal test instructions.
  - User installs extension, scans a product, then clicks `Save to Workspace`.
  - If not signed in, user signs up or logs in and returns to the import review.
  - User can save 3 products for free before payment.
  - Upgrade prompt appears when the limit is hit or when Pro features are requested.
- [ ] Avoid forcing payment before installation in the public Scout flow.
  - `/scout` should sell the value and drive extension install first.
  - Payment should happen after the user has captured value or needs more capacity.
- [ ] Test free save limit.
  - Free users can save 3 products.
  - Fourth save is blocked with clear upgrade copy.
- [ ] Test Scout Basic save limit.
  - Basic users can save 50 products.
  - Archive still counts.
  - Delete frees capacity.
- [ ] Test duplicate source URL handling.
  - Duplicate import should offer to open or update existing product.
- [ ] Test extension import target uses production URL once DNS is ready.
  - `https://www.calmcommerce.net/ideas/import?payload=...`

## Abuse And Tool Protection

- [ ] Add protection against scripts abusing Scout import / analysis endpoints.
  - Rate-limit `/api/ideas/import` by user and IP.
  - Rate-limit MCP / Pro analysis endpoint by user and plan.
  - Enforce payload size and schema validation server-side.
  - Consider CAPTCHA or email verification before free saves if abuse appears.
  - Log rejected attempts for review.
- [ ] Keep server-side entitlement checks as source of truth.
  - Do not rely on extension UI gating alone.
  - Free/basic/pro limits must be enforced by API routes.

## Analytics And Reporting

- [ ] Add basic product analytics before public launch.
  - Landing page visits.
  - Signup started / completed.
  - Checkout started / completed.
  - Extension import opened.
  - Product saved.
  - Save limit hit.
  - Upgrade CTA clicked.
- [ ] Add operational reporting.
  - Number of users by entitlement tier.
  - Number of saved products.
  - Free users near or at limit.
  - Basic users near or at 50-save limit.
  - Stripe checkout failures / webhook failures.
- [ ] Decide analytics tool.
  - Lightweight option: Vercel Analytics plus custom Supabase event table.
  - Product analytics option: PostHog.
  - Avoid heavy setup until the paid flow is proven.

## Launch QA

- [ ] **Very important:** run end-to-end margin calculation QA before launch.
  - Do this after development / staging / production environments are separated.
  - Cover AliExpress and Amazon scans from popup preview → payload → Workspace list → product detail page.
  - Verify simple known cases such as sell price `£20`, product cost `£10`, shipping `£0`.
  - Confirm whether platform fees, shipping, cached inputs, or old extension state are affecting displayed margin.
  - Add regression tests or documented fixtures once the expected calculation rules are final.
- [ ] Run a blank-account production smoke test.
  - Signup confirmation email redirects to production, not localhost.
  - Stripe checkout redirects back to production.
  - Entitlement appears in Supabase.
  - Scout Workspace opens after payment.
  - OS routes remain locked for Scout-only users.
- [ ] Test production on mobile and desktop.
- [ ] Confirm domain and HTTPS are stable.
- [ ] Confirm Chrome extension package points to production URLs.
