import Link from "next/link";
import { PrimaryButton, SecondaryButton } from "@/components/design-system";
import { BILLING_PLANS } from "@/lib/billing/products";
import { getAccessStateForCurrentUser } from "@/lib/auth/get-access-state";

const SCOUT_PLANS = [BILLING_PLANS.scout_basic, BILLING_PLANS.scout_pro] as const;

async function isSignedIn() {
  try {
    const access = await getAccessStateForCurrentUser();
    return access.authenticated;
  } catch {
    return false;
  }
}

function checkoutHref(planCode: string, signedIn: boolean) {
  const checkoutPath = `/upgrade?plan=${encodeURIComponent(planCode)}`;
  return signedIn ? checkoutPath : `/signup?next=${encodeURIComponent(checkoutPath)}`;
}

export default async function ScoutLandingPage() {
  const signedIn = await isSignedIn();

  return (
    <main className="min-h-screen bg-surface-sunken px-5 py-8 text-ink-900">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/" className="font-[Manrope] text-lg font-bold text-ink-900">
            Calm Commerce
          </Link>
          <div className="flex flex-wrap gap-3">
            <SecondaryButton href={signedIn ? "/ideas" : "/login?next=/ideas"} className="px-4 py-2">
              Scout Workspace
            </SecondaryButton>
            <SecondaryButton href={signedIn ? "/upgrade" : "/login?next=/upgrade"} className="px-4 py-2">
              Sign in
            </SecondaryButton>
          </div>
        </header>

        <section className="rounded-xl border border-ink-100 bg-surface-raised p-8 shadow-card lg:p-10">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cobalt-600">
            Scout by Calm Commerce
          </p>
          <div className="mt-5 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
            <div>
              <h1 className="font-[Manrope] text-4xl font-bold leading-tight tracking-tight text-ink-900 lg:text-5xl">
                Capture product ideas before they disappear.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-ink-600">
                Scout scores products while you research, then saves the best candidates into a simple workspace where you can review, filter, archive, and decide what deserves a real test.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <PrimaryButton href={checkoutHref("scout_basic", signedIn)}>
                  Start Scout Basic
                </PrimaryButton>
                <SecondaryButton href={checkoutHref("scout_pro", signedIn)}>
                  Start Scout Pro
                </SecondaryButton>
              </div>
            </div>
            <div className="rounded-xl border border-ink-100 bg-surface-sunken p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-ink-500">
                Free trial
              </p>
              <p className="mt-3 font-[Manrope] text-2xl font-bold text-ink-900">
                Save 3 products free
              </p>
              <p className="mt-3 text-sm leading-7 text-ink-600">
                Try Scout Workspace with three saved product candidates. Upgrade when you need more room or deeper Pro research.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-3">
          {[
            ["Score faster", "See demand, competition, confidence, and risk signals before a product gets into your shortlist."],
            ["Keep the list clean", "Sort, filter, mark promising products, archive weak ones, and delete research you no longer need."],
            ["Move into the OS", "When a product looks real, Calm Commerce OS carries it into numbers, testing, metrics, and launch decisions."],
          ].map(([title, body]) => (
            <div key={title} className="rounded-xl border border-ink-100 bg-surface-raised p-6 shadow-card">
              <h2 className="font-[Manrope] text-xl font-bold text-ink-900">{title}</h2>
              <p className="mt-3 text-sm leading-7 text-ink-600">{body}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          {SCOUT_PLANS.map((plan) => (
            <article key={plan.code} className="rounded-xl border border-ink-100 bg-surface-raised p-6 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-cobalt-600">
                    {plan.billingType === "one_time" ? "Starter pack" : "Subscription"}
                  </p>
                  <h2 className="mt-3 font-[Manrope] text-2xl font-bold text-ink-900">{plan.name}</h2>
                  <p className="mt-2 text-lg font-bold text-ink-900">{plan.priceLabel}</p>
                </div>
                <PrimaryButton href={checkoutHref(plan.code, signedIn)} className="shrink-0">
                  {plan.cta}
                </PrimaryButton>
              </div>
              <p className="mt-4 text-sm leading-7 text-ink-600">{plan.description}</p>
              <ul className="mt-5 space-y-3 text-sm leading-6 text-ink-700">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cobalt-600" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
