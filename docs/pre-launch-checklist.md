# Pre-Launch Checklist

Last updated: 2026-05-11

This file tracks the practical work needed before taking Scout / Calm Commerce into paid launch traffic.

## Production Infrastructure

- [x] Split Supabase into separate development and production projects.
  - Dev should keep localhost redirects, test users, and Stripe test data.
  - Production should hold real users, real entitlements, and production redirects only.
- [ ] Run the current schema and product-entitlement migration on the production Supabase project.
- [ ] Point Vercel production env vars at the production Supabase project.
- [ ] Keep local `.env.local` pointed at the development Supabase project.
- [x] Update Supabase production auth URL configuration.
  - Site URL: `https://www.calmcommerce.net`
  - Redirect URLs:
    - `https://www.calmcommerce.net/auth/callback`
    - Vercel preview/deployment callback URL if used for testing
    - `http://localhost:3000/auth/callback` only in the dev Supabase project
- [ ] Configure branded auth email sender before launch.
  - Replace default Supabase sender with a Calm Commerce domain sender.
  - Likely sender: `hello@calmcommerce.net` or `support@calmcommerce.net`.

## Billing And Plans

- [x] Confirm live Stripe products and prices.
  - Scout Basic: one-time payment, 50 saved products.
  - Scout Pro: subscription, any-site / MCP-enhanced research.
  - Calm Commerce OS: coming soon until pricing is final.
- [x] In production env vars, set only live Stripe keys and live price IDs.
- [x] Ensure Stripe webhook endpoint points at production:
  - `https://www.calmcommerce.net/api/billing/webhook`
- [x] Test Stripe webhook creates the correct entitlement rows.
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
- [ ] Use temporary low save limits in local/staging for checkout QA.
  - Set `SCOUT_FREE_SAVE_LIMIT=1` and `SCOUT_BASIC_SAVE_LIMIT=2` locally or in staging when testing the upgrade path.
  - Keep production at `SCOUT_FREE_SAVE_LIMIT=3` and `SCOUT_BASIC_SAVE_LIMIT=50`.
  - Remove temporary low limits before any public traffic.
- [ ] Test duplicate source URL handling.
  - Duplicate import should offer to open or update existing product.
- [ ] Test extension import target uses production URL once DNS is ready.
  - `https://www.calmcommerce.net/ideas/import?payload=...`
- [ ] Build the production entitlement handoff between Calm Commerce and the Chrome extension.
  - When a user upgrades to Scout Pro in the web app, the extension should recognise Pro access without manual console storage changes.
  - Use the secure account-link flow at `/scout/connect?extensionId=...`; the extension stores a short-lived Calm Commerce token and calls the web app Scout proxy.
  - Add production env vars before testing: `SCOUT_EXTENSION_TOKEN_SECRET` and `SCOUT_MCP_API_KEY`.
  - Do not expose shared MCP server secrets in extension storage.
  - Verify the popup no longer shows Pro upgrade prompts for a confirmed Pro user, and that trend / any-site research can connect cleanly.

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

- [ ] Resolve current npm audit findings before public launch.
  - `npm audit --omit=dev` currently reports Next.js high-severity advisories and a PostCSS moderate advisory via Next.
  - Current app version checked: `next@16.1.6`.
  - Suggested audit target: upgrade Next deliberately rather than running `npm audit fix --force` blindly.
  - After upgrade, run `npm run typecheck`, `npx vitest run`, and a smoke test for auth, Scout import, checkout, and account access.
  - Separate note: the 2026-05-11 TanStack npm supply-chain incident does not appear to affect this repo based on current dependency checks, but continue checking dependency advisories before release.
- [x] **Very important:** run end-to-end margin calculation QA before launch.
  - Do this after development / staging / production environments are separated.
  - Cover AliExpress and Amazon scans from popup preview → payload → Workspace list → product detail page.
  - Verify simple known cases such as sell price `£20`, product cost `£10`, shipping `£0`.
  - Confirm whether platform fees, shipping, cached inputs, or old extension state are affecting displayed margin.
  - Add regression tests or documented fixtures once the expected calculation rules are final.
- [x] Run a blank-account production smoke test.
  - Signup confirmation email redirects to production, not localhost.
  - Stripe checkout redirects back to production.
  - Entitlement appears in Supabase.
  - Scout Workspace opens after payment.
  - OS routes remain locked for Scout-only users.
- [ ] Test production on mobile and desktop.
- [ ] Confirm domain and HTTPS are stable.
- [ ] Confirm Chrome extension package points to production URLs.
