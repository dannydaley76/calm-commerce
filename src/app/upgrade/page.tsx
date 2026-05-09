import Link from "next/link";
import { LearnerShell } from "@/components/learner-shell";
import { BILLING_PLANS } from "@/lib/billing/products";

const PLAN_ORDER = ["scout_basic", "scout_pro", "calm_commerce_os"] as const;

export default function UpgradePage() {
  return (
    <LearnerShell
      items={[
        { href: "/", label: "Dashboard" },
        { href: "/program", label: "Program" },
        { href: "/ideas", label: "Ideas" },
        { href: "/lean-canvas", label: "Lean Canvas" },
        { href: "/metrics", label: "Metrics" },
        { href: "/account", label: "Account" },
      ]}
      title="Upgrade"
      subtitle="Choose the product research or operating system tier that fits where you are."
    >
      <div className="space-y-8">
        <div className="rounded-xl border border-ink-100 bg-surface-raised p-6 shadow-card">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cobalt-600">Scout to OS</p>
          <h1 className="mt-3 font-[Manrope] text-3xl font-bold tracking-tight text-ink-900">Start with product research, upgrade when the idea is ready.</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-ink-600">
            Scout captures products at the top of the funnel. Calm Commerce OS turns the best candidates into tests, numbers, metrics, and a real operating plan.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {PLAN_ORDER.map((planCode) => {
            const plan = BILLING_PLANS[planCode];
            return (
              <article key={plan.code} className="flex rounded-xl border border-ink-100 bg-surface-raised p-6 shadow-card">
                <div className="flex min-h-full flex-col">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-cobalt-600">
                      {plan.billingType === "one_time" ? "One-time" : "Subscription"}
                    </p>
                    <h2 className="mt-3 font-[Manrope] text-2xl font-bold text-ink-900">{plan.name}</h2>
                    <p className="mt-2 text-lg font-bold text-ink-900">{plan.priceLabel}</p>
                    <p className="mt-3 text-sm leading-6 text-ink-600">{plan.description}</p>
                  </div>

                  <ul className="mt-5 space-y-3 text-sm leading-6 text-ink-700">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex gap-2">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cobalt-600" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <form action="/api/billing/create-checkout-session" method="post" className="mt-auto pt-6">
                    <input type="hidden" name="plan" value={plan.code} />
                    <button className="inline-flex w-full items-center justify-center rounded-xl bg-cobalt-600 px-5 py-3 font-semibold !text-white transition hover:bg-cobalt-700">
                      {plan.cta}
                    </button>
                  </form>
                </div>
              </article>
            );
          })}
        </div>

        <div>
          <Link href="/" className="inline-flex items-center justify-center rounded-xl border border-ink-100 bg-white px-6 py-4 font-semibold text-ink-900">
            Back to dashboard
          </Link>
        </div>
      </div>
    </LearnerShell>
  );
}
