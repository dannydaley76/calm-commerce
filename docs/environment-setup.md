# Environment Setup

Last updated: 2026-05-12

Calm Commerce currently uses two Supabase projects because the free Supabase plan allows two active projects.

## Environment Map

| Environment | App URL | Supabase | Stripe |
| --- | --- | --- | --- |
| Local dev | `http://localhost:3000` | Dev project | Test mode |
| Vercel preview/staging | Vercel preview URL | Dev project | Test mode |
| Production | `https://www.calmcommerce.net` | Production project | Live mode |

Production must never point at the dev Supabase project.

## Local `.env.local`

Local development should use the dev Supabase project and Stripe test mode:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000

NEXT_PUBLIC_SUPABASE_URL=https://your-dev-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-dev-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-dev-service-role-key

STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_from_stripe_cli
STRIPE_SCOUT_BASIC_PRICE_ID=price_test_...
STRIPE_SCOUT_PRO_PRICE_ID=price_test_...
STRIPE_CALM_COMMERCE_OS_PRICE_ID=
```

`NEXT_PUBLIC_SUPABASE_URL` must be the project base URL, not the REST URL. Do not include `/rest/v1/`.

## Supabase Dev Auth URLs

In the dev Supabase project:

```txt
Authentication -> URL Configuration

Site URL:
http://localhost:3000

Redirect URLs:
http://localhost:3000/auth/callback
```

When using Vercel preview as staging, add the preview callback URL too:

```txt
https://your-preview-url.vercel.app/auth/callback
```

## Supabase Schema Setup

For a fresh dev or production Supabase project, run these files in SQL Editor in order:

1. `supabase-schema.sql`
2. `product-entitlements-migration.sql`
3. `weekly-metrics-migration.sql`
4. `weekly-metrics-rls-update-delete.sql`

After running the schema, create a blank test account and confirm the bootstrap creates:

- `learners`
- `projects`
- `learner_entitlements`

Fresh users should receive a preview entitlement.

## Stripe Test Setup

In Stripe test mode, create products/prices for:

- Scout Basic
  - one-time payment
  - env var: `STRIPE_SCOUT_BASIC_PRICE_ID`
- Scout Pro
  - subscription
  - env var: `STRIPE_SCOUT_PRO_PRICE_ID`

Calm Commerce OS is not launched yet. Keep the OS production button disabled. A test OS price can be created later, but `STRIPE_CALM_COMMERCE_OS_PRICE_ID` can stay empty while the OS plan is coming soon.

## Local Stripe Webhook

Install Stripe CLI if needed:

```bash
brew install stripe/stripe-cli/stripe
```

Log in:

```bash
stripe login
```

Forward local webhooks:

```bash
stripe listen --forward-to localhost:3000/api/billing/webhook
```

Copy the `whsec_...` value printed by Stripe CLI into `.env.local`:

```env
STRIPE_WEBHOOK_SECRET=whsec_...
```

Restart the dev server after changing `.env.local`.

## Local Paid-Flow Smoke Test

1. Start the app:

```bash
npm run dev
```

2. Start Stripe webhook forwarding in a second terminal:

```bash
stripe listen --forward-to localhost:3000/api/billing/webhook
```

3. Sign in with a dev Supabase test user.

4. Visit:

```txt
http://localhost:3000/upgrade?plan=scout_basic
```

5. Use Stripe test card:

```txt
4242 4242 4242 4242
Any future expiry
Any CVC
Any postcode
```

6. Confirm the webhook creates or updates a `learner_entitlements` row:

```txt
product_code = scanner_extension
billing_type = one_time
status = active
access_level = full
```

7. Repeat for:

```txt
http://localhost:3000/upgrade?plan=scout_pro
```

Expected Scout Pro entitlement:

```txt
product_code = research_workspace
billing_type = subscription
status = active
access_level = full
```

## Scout Extension Local Import

Set the unpacked extension to send imports to local dev:

```js
chrome.storage.local.set({
  calm_commerce_os_url: "http://localhost:3000"
});
```

Verify:

```js
chrome.storage.local.get(["calm_commerce_os_url"], console.log);
```

Production extension builds should point back to:

```txt
https://www.calmcommerce.net
```
