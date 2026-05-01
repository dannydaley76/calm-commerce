import Link from "next/link";
import { LearnerShell } from "@/components/learner-shell";

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
      subtitle="Unlock the full learning experience with a paid access plan."
    >
      <div className="mx-auto max-w-3xl rounded-[2rem] bg-white p-8 shadow-[0px_24px_48px_rgba(11,42,57,0.08)] lg:p-10">
        <p className="mt-4 max-w-2xl text-sm leading-7 text-ink-500">
          You currently have preview access. Upgrade to unlock the paid chapters, the full worksheet journey, and the full in-app learning flow.
        </p>

        <div className="mt-8 rounded-[1.5rem] bg-[#f7f5ff] p-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#5b48d6]">MVP billing model</p>
          <p className="mt-3 text-base leading-7 text-ink-500">
            Recurring access billed every 6 months through Stripe.
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          <form action="/api/billing/create-checkout-session" method="post">
            <button className="inline-flex items-center justify-center rounded-xl bg-[#5b48d6] px-6 py-4 font-semibold !text-white">
              Continue to payment
            </button>
          </form>
          <Link href="/" className="inline-flex items-center justify-center rounded-xl border border-ink-100 bg-white px-6 py-4 font-semibold text-ink-900">
            Back to dashboard
          </Link>
        </div>
      </div>
    </LearnerShell>
  );
}
