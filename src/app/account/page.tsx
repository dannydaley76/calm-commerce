import Link from "next/link";
import { AccessStatusBadge } from "@/components/access-status-badge";
import { LearnerShell } from "@/components/learner-shell";
import { getActiveProjectForCurrentUser } from "@/lib/auth/get-active-project";
import { getAccessStateForCurrentUser } from "@/lib/auth/get-access-state";

async function getAccountState() {
  const [{ supabase, user, learnerId }, access] = await Promise.all([
    getActiveProjectForCurrentUser(),
    getAccessStateForCurrentUser(),
  ]);

  if (!user || !learnerId) {
    return {
      authenticated: false,
      email: null,
      fullName: null,
      currencyCode: "GBP",
      access,
      deletionRequested: false,
    };
  }

  const [{ data: learner }, { data: deletionRequest }] = await Promise.all([
    supabase.from("learners").select("email, full_name").eq("id", learnerId).maybeSingle(),
    supabase.from("account_deletion_requests").select("id, status").eq("learner_id", learnerId).order("requested_at", { ascending: false }).limit(1).maybeSingle(),
  ]);

  return {
    authenticated: true,
    email: learner?.email ?? user.email ?? null,
    fullName: learner?.full_name ?? null,
    currencyCode: "GBP",
    access,
    deletionRequested: !!deletionRequest,
    deletionStatus: deletionRequest?.status ?? null,
  };
}

export default async function AccountPage() {
  const state = await getAccountState();

  return (
    <LearnerShell
      items={[
        { href: "/", label: "Dashboard" },
        { href: "/program", label: "Program" },
        { href: "/lean-canvas", label: "Lean Canvas" },
        { href: "/metrics", label: "Metrics" },
        { href: "/account", label: "Account", active: true },
      ]}
      title="Account"
      subtitle="Manage your current learner account details and support actions."
    >
      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
        <section className="rounded-[2rem] bg-white p-8 shadow-[0px_24px_48px_rgba(48,50,59,0.08)]">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#0053dc]">Profile</p>
          <h2 className="mt-4 font-[Manrope] text-3xl font-extrabold tracking-tight">Your account details</h2>

          {!state.authenticated ? (
            <div className="mt-6 rounded-2xl bg-[#fff1f0] p-5 text-[#a83836]">
              <p className="font-semibold">You are not signed in.</p>
              <p className="mt-2 text-sm leading-6">Sign in first to view or manage your learner account.</p>
            </div>
          ) : (
            <div className="mt-6 space-y-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl bg-[#f4f3fa] p-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#5d5f68]">Email</p>
                  <p className="mt-2 text-sm leading-7 text-[#30323b]">{state.email || "Unknown"}</p>
                </div>
                <div className="rounded-2xl bg-[#f4f3fa] p-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#5d5f68]">Money units</p>
                  <p className="mt-2 text-sm leading-7 text-[#30323b]">GBP (temporary default)</p>
                </div>
                <div className="rounded-2xl bg-[#f4f3fa] p-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#5d5f68]">Access state</p>
                  <div className="mt-3"><AccessStatusBadge status={state.access.entitlementStatus} level={state.access.accessLevel} compact /></div>
                </div>
              </div>

              <form action="/api/account/update-profile" method="post" className="rounded-2xl bg-[#f8fbff] p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#0053dc]">Edit profile</p>
                <div className="mt-4 grid max-w-2xl gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-[#30323b]" htmlFor="full_name">Full name</label>
                    <input
                      id="full_name"
                      name="full_name"
                      defaultValue={state.fullName ?? ""}
                      className="mt-2 w-full rounded-xl border border-[#d7d9e6] bg-white px-4 py-3 text-sm text-[#30323b] outline-none focus:border-[#0053dc]"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#30323b]" htmlFor="currency_code">Currency</label>
                    <input
                      id="currency_code"
                      name="currency_code"
                      value="GBP"
                      disabled
                      className="mt-2 w-full rounded-xl border border-[#d7d9e6] bg-[#f4f3fa] px-4 py-3 text-sm text-[#5d5f68] outline-none"
                    />
                  </div>
                </div>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-[#5d5f68]">
                  Currency preference is temporarily fixed to GBP until the learner schema rollout is completed. Locale-aware onboarding and profile editing remain tracked follow-up work.
                </p>
                <div className="mt-4">
                  <button className="inline-flex items-center justify-center rounded-xl bg-[#0053dc] px-5 py-3 font-semibold !text-white">
                    Save profile
                  </button>
                </div>
              </form>
            </div>
          )}
        </section>

        <section className="space-y-6">
          <div className="rounded-[2rem] bg-white p-8 shadow-[0px_24px_48px_rgba(48,50,59,0.08)]">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#5b48d6]">Manage access</p>
            <h3 className="mt-4 font-[Manrope] text-2xl font-extrabold tracking-tight">Subscription and access</h3>
            <p className="mt-3 text-sm leading-7 text-[#5d5f68]">
              You can review your current access path here and move toward the paid experience from this page when needed.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <Link href="/upgrade" className="inline-flex items-center justify-center rounded-xl bg-[#5b48d6] px-5 py-3 font-semibold !text-white">
                View upgrade options
              </Link>
              <Link href="/dev/mock-billing" className="inline-flex items-center justify-center rounded-xl border border-[#d7d9e6] bg-white px-5 py-3 font-semibold text-[#30323b]">
                Access options
              </Link>
            </div>
          </div>

          <div className="rounded-[2rem] bg-white p-8 shadow-[0px_24px_48px_rgba(48,50,59,0.08)]">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#a83836]">Account deletion</p>
            <h3 className="mt-4 font-[Manrope] text-2xl font-extrabold tracking-tight">Request account deletion</h3>
            <p className="mt-3 text-sm leading-7 text-[#5d5f68]">
              If you want your account removed, you can submit a deletion request here and it will be handled through the current support flow.
            </p>
            {state.deletionRequested ? (
              <div className="mt-5 rounded-2xl bg-[#fff7ed] p-5 text-[#865400]">
                <p className="font-semibold">Deletion request already received</p>
                <p className="mt-2 text-sm leading-6">Current status: {state.deletionStatus ?? "requested"}</p>
              </div>
            ) : (
              <form action="/api/account/request-deletion" method="post" className="mt-6">
                <button className="inline-flex items-center justify-center rounded-xl bg-[#a83836] px-5 py-3 font-semibold !text-white">
                  Request account deletion
                </button>
              </form>
            )}
          </div>
        </section>
      </div>
    </LearnerShell>
  );
}
