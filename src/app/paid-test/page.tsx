import { notFound } from "next/navigation";
import { AccessLockedCard } from "@/components/access-locked-card";
import { AccessStatusBadge } from "@/components/access-status-badge";
import { LearnerShell } from "@/components/learner-shell";
import { getAccessStateForCurrentUser } from "@/lib/auth/get-access-state";

export default async function PaidTestPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const access = await getAccessStateForCurrentUser();

  return (
    <LearnerShell
      items={[
        { href: "/", label: "Dashboard" },
        { href: "/program", label: "Program" },
        { href: "/lean-canvas", label: "Lean Canvas" },
        { href: "/metrics", label: "Metrics" },
        { href: "/account", label: "Account" },
      ]}
      title="Paid access test surface"
      subtitle="A temporary product surface for verifying preview vs paid vs expired entitlement behavior while the full paid learner flow is still being built."
    >
      {access.canAccessPaidContent ? (
        <div className="rounded-[2rem] bg-white p-8 shadow-[0px_24px_48px_rgba(48,50,59,0.08)] lg:p-10">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#0f7b53]">Paid access active</p>
            <AccessStatusBadge status={access.entitlementStatus} level={access.accessLevel} compact />
          </div>
          <h2 className="mt-4 font-[Manrope] text-4xl font-extrabold tracking-tight">You can see this because your entitlement is active</h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#5d5f68]">
            This page exists only as a temporary access-control proving surface. If you can see it, the app currently thinks you have paid access.
          </p>
          <div className="mt-8 rounded-[1.5rem] bg-[#eefcf5] p-6 text-[#005e3f]">
            <p className="font-semibold">Current effective state</p>
            <ul className="mt-3 space-y-2 text-sm leading-6">
              <li>- authenticated: {String(access.authenticated)}</li>
              <li>- learner id: {access.learnerId ?? "null"}</li>
              <li>- project id: {access.projectId ?? "null"}</li>
              <li>- dashboard access: {String(access.canAccessDashboard)}</li>
              <li>- paid content access: {String(access.canAccessPaidContent)}</li>
              <li>- entitlement status: {access.entitlementStatus ?? "unknown"}</li>
              <li>- access level: {access.accessLevel ?? "unknown"}</li>
            </ul>
          </div>
        </div>
      ) : (
        <AccessLockedCard
          title={access.entitlementStatus === "expired" || access.entitlementStatus === "cancelled" ? "Paid test surface locked" : "This test surface is paid-only"}
          body={
            access.entitlementStatus === "expired" || access.entitlementStatus === "cancelled"
              ? "Your dashboard access remains available, but this paid-only test surface is locked until you reactivate access."
              : "You are currently in preview mode, so this paid-only test surface is intentionally locked."
          }
        />
      )}
    </LearnerShell>
  );
}
