import { AccessStatusBadge } from "@/components/access-status-badge";
import { LearnerShell } from "@/components/learner-shell";
import { PrimaryButton, DestructiveButton } from "@/components/design-system";
import { getActiveProjectForCurrentUser } from "@/lib/auth/get-active-project";
import { getAccessStateForCurrentUser } from "@/lib/auth/get-access-state";

async function getAccountState() {
  const [{ supabase, user, learnerId }, access] = await Promise.all([
    getActiveProjectForCurrentUser(),
    getAccessStateForCurrentUser(),
  ]);

  if (!user || !learnerId) {
    return { authenticated: false as const, access, deletionRequested: false };
  }

  const [{ data: learner }, { data: deletionRequest }] = await Promise.all([
    supabase.from("learners").select("email").eq("id", learnerId).maybeSingle(),
    supabase
      .from("account_deletion_requests")
      .select("id, status")
      .eq("learner_id", learnerId)
      .order("requested_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  return {
    authenticated: true as const,
    email: learner?.email ?? user.email ?? null,
    access,
    deletionRequested: !!deletionRequest,
    deletionStatus: deletionRequest?.status ?? null,
  };
}

/* ── Status banner helper ─────────────────────────────────────────── */

type BannerVariant = "success" | "error" | "info";

function Banner({
  variant,
  children,
}: {
  variant: BannerVariant;
  children: React.ReactNode;
}) {
  const styles: Record<BannerVariant, string> = {
    success: "bg-success-100 text-success-600 border-success-100",
    error:   "bg-error-100   text-error-700   border-error-100",
    info:    "bg-cobalt-100  text-cobalt-600  border-cobalt-100",
  };
  return (
    <div className={`rounded-xl border p-4 text-sm leading-6 ${styles[variant]}`}>
      {children}
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────────── */

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ profile?: string; deletion?: string }>;
}) {
  const [state, { deletion }] = await Promise.all([
    getAccountState(),
    searchParams,
  ]);
  const scoutOnlyNav = !state.access.canAccessOsContent;
  const navItems = scoutOnlyNav
    ? [
      { href: "/ideas", label: "Scout Workspace" },
      { href: "/upgrade", label: "Upgrade" },
      { href: "/account", label: "Account", active: true },
    ]
    : [
      { href: "/",            label: "Dashboard" },
      { href: "/program",     label: "Program" },
      { href: "/ideas",       label: "Ideas" },
      { href: "/lean-canvas", label: "Lean Canvas" },
      { href: "/metrics",     label: "Metrics" },
      { href: "/account",     label: "Account", active: true },
    ];

  return (
    <LearnerShell
      items={navItems}
      homeHref={scoutOnlyNav ? "/ideas" : "/"}
      title="Account"
      subtitle="Manage your account and access."
    >
      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">

        {/* ── Profile card ── */}
        <section className="rounded-[1.5rem] border border-ink-100 bg-surface-raised p-8 shadow-card">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cobalt-600">Profile</p>
          <h2 className="mt-4 font-[Manrope] text-2xl font-bold tracking-tight text-ink-900">
            Your account details
          </h2>

          {!state.authenticated ? (
            <div className="mt-6">
              <Banner variant="error">
                You are not signed in. Sign in first to view or manage your learner account.
              </Banner>
            </div>
          ) : (
            <div className="mt-6 space-y-6">

              {/* Info tiles */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-surface-sunken p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink-500">Email</p>
                  <p className="mt-2 text-sm leading-7 text-ink-900 break-all">{state.email || "Unknown"}</p>
                </div>
                <div className="rounded-xl bg-surface-sunken p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink-500">Access</p>
                  <div className="mt-3">
                    <AccessStatusBadge
                      status={state.access.entitlementStatus}
                      level={state.access.accessLevel}
                      activeProducts={state.access.activeProducts}
                      compact
                    />
                  </div>
                </div>
              </div>

            </div>
          )}
        </section>

        {/* ── Right column ── */}
        <section className="space-y-6">

          {/* Subscription card */}
          <div className="rounded-[1.5rem] border border-ink-100 bg-surface-raised p-8 shadow-card">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#545a95]">
              Manage access
            </p>
            <h3 className="mt-4 font-[Manrope] text-xl font-bold tracking-tight text-ink-900">
              Subscription and access
            </h3>
            <p className="mt-3 text-sm leading-7 text-ink-500">
              Review your current Scout access and upgrade when you need more research depth.
            </p>
            <div className="mt-6">
              <PrimaryButton href="/upgrade">View upgrade options</PrimaryButton>
            </div>
          </div>

          {/* Account deletion card */}
          <div className="rounded-[1.5rem] border border-ink-100 bg-surface-raised p-8 shadow-card">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-error-700">
              Account deletion
            </p>
            <h3 className="mt-4 font-[Manrope] text-xl font-bold tracking-tight text-ink-900">
              Request account deletion
            </h3>
            <p className="mt-3 text-sm leading-7 text-ink-500">
              If you want your account and saved Scout products removed, submit a deletion request here. We record the request and process it through support.
            </p>

            {/* Deletion feedback */}
            {deletion === "requested" && (
              <div className="mt-4">
                <Banner variant="info">
                  Deletion request received. We'll process this as soon as possible.
                </Banner>
              </div>
            )}
            {deletion === "error" && (
              <div className="mt-4">
                <Banner variant="error">Something went wrong. Please try again.</Banner>
              </div>
            )}

            {state.authenticated && state.deletionRequested ? (
              <div className="mt-5">
                <Banner variant="info">
                  <p className="font-semibold">Deletion request already received</p>
                  <p className="mt-1">
                    Status: {state.deletionStatus ?? "requested"}
                  </p>
                </Banner>
              </div>
            ) : state.authenticated ? (
              <form action="/api/account/request-deletion" method="post" className="mt-6">
                <DestructiveButton type="submit">Request account deletion</DestructiveButton>
              </form>
            ) : null}
          </div>

        </section>
      </div>
    </LearnerShell>
  );
}
