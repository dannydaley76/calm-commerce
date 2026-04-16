import Link from "next/link";

export default function UpgradePage() {
  return (
    <main className="min-h-screen bg-[#faf8fe] px-6 py-10 text-[#30323b]">
      <div className="mx-auto max-w-3xl rounded-[2rem] bg-white p-8 shadow-[0px_24px_48px_rgba(48,50,59,0.08)] lg:p-10">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#5b48d6]">Upgrade</p>
        <h1 className="mt-4 font-[Manrope] text-4xl font-extrabold tracking-tight">Unlock the full learning experience</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-[#5d5f68]">
          You currently have preview access. Upgrade to unlock the paid chapters, the full worksheet journey, and the full in-app learning flow.
        </p>

        <div className="mt-8 rounded-[1.5rem] bg-[#f7f5ff] p-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#5b48d6]">MVP billing model</p>
          <p className="mt-3 text-base leading-7 text-[#5d5f68]">
            Recurring access billed every 6 months through Stripe.
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          <form action="/api/billing/create-checkout-session" method="post">
            <button className="inline-flex items-center justify-center rounded-xl bg-[#5b48d6] px-6 py-4 font-semibold !text-white">
              Continue to payment
            </button>
          </form>
          <Link href="/" className="inline-flex items-center justify-center rounded-xl border border-[#d7d9e6] bg-white px-6 py-4 font-semibold text-[#30323b]">
            Back to dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
