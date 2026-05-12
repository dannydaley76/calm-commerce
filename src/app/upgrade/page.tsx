import Link from "next/link";
import { LearnerShell } from "@/components/learner-shell";
import { BILLING_PLANS } from "@/lib/billing/products";
import { getAccessStateForCurrentUser } from "@/lib/auth/get-access-state";
import { CheckoutAutostart } from "./checkout-autostart";

const PLAN_ORDER = ["scout_basic", "scout_pro", "calm_commerce_os"] as const;

function nextCheckoutPlan(selectedPlan: string | undefined, activeProducts: string[]): string | undefined {
  if (selectedPlan === "calm_commerce_os") return undefined;
  if (selectedPlan === "scout_basic" && activeProducts.includes("scanner_extension")) return "scout_pro";
  if (selectedPlan === "scout_basic" && activeProducts.includes("research_workspace")) return undefined;
  if (selectedPlan === "scout_pro" && activeProducts.includes("research_workspace")) return undefined;
  return selectedPlan;
}

export default async function UpgradePage({
  searchParams,
}: {
  searchParams?: Promise<{ plan?: string }>;
}) {
  const [params, access] = await Promise.all([searchParams, getAccessStateForCurrentUser()]);
  const selectedPlan = params?.plan;
  const checkoutPlan = nextCheckoutPlan(selectedPlan, access.activeProducts);
  const hasBasic = access.activeProducts.includes("scanner_extension");
  const hasPro = access.activeProducts.includes("research_workspace");
  const hasOs = access.activeProducts.includes("calm_commerce_os");
  const scoutOnlyNav = !access.canAccessOsContent;
  const navItems = scoutOnlyNav
    ? [
      { href: "/ideas", label: "Scout Workspace" },
      { href: "/upgrade", label: "Upgrade", active: true },
      { href: "/account", label: "Account" },
    ]
    : [
      { href: "/", label: "Dashboard" },
      { href: "/program", label: "Program" },
      { href: "/ideas", label: "Ideas" },
      { href: "/lean-canvas", label: "Lean Canvas" },
      { href: "/metrics", label: "Metrics" },
      { href: "/account", label: "Account" },
    ];

  return (
    <LearnerShell
      items={navItems}
      homeHref={scoutOnlyNav ? "/ideas" : "/"}
      title="Upgrade"
      subtitle="Choose the product research or operating system tier that fits where you are."
    >
      <CheckoutAutostart plan={checkoutPlan} />
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
            const comingSoon = plan.code === "calm_commerce_os";
            const currentPlan =
              (plan.code === "scout_basic" && hasBasic && !hasPro && !hasOs) ||
              (plan.code === "scout_pro" && hasPro && !hasOs) ||
              (plan.code === "calm_commerce_os" && hasOs);
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

                  {currentPlan ? (
                    <button
                      type="button"
                      disabled
                      className="mt-auto inline-flex w-full cursor-default items-center justify-center rounded-xl border border-success-100 bg-success-100 px-5 py-3 font-semibold text-[#005e3f]"
                    >
                      Current plan
                    </button>
                  ) : comingSoon ? (
                    <button
                      type="button"
                      disabled
                      className="mt-auto inline-flex w-full cursor-not-allowed items-center justify-center rounded-xl border border-ink-100 bg-surface-sunken px-5 py-3 font-semibold text-ink-500"
                    >
                      Coming soon
                    </button>
                  ) : (
                    <form action="/api/billing/create-checkout-session" method="post" className="mt-auto pt-6">
                      <input type="hidden" name="plan" value={plan.code} />
                      <button className="inline-flex w-full items-center justify-center rounded-xl bg-cobalt-600 px-5 py-3 font-semibold !text-white transition hover:bg-cobalt-700">
                        {plan.cta}
                      </button>
                    </form>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        <div>
          <Link href={scoutOnlyNav ? "/ideas" : "/"} className="inline-flex items-center justify-center rounded-xl border border-ink-100 bg-white px-6 py-4 font-semibold text-ink-900">
            {scoutOnlyNav ? "Back to Scout Workspace" : "Back to dashboard"}
          </Link>
        </div>
      </div>
    </LearnerShell>
  );
}
