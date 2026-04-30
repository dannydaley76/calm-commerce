import { PrimaryButton, SecondaryButton } from "@/components/design-system";

type AccessLockedCardProps = {
  title?: string;
  body?: string;
};

/**
 * Shown when a learner is on preview or expired access.
 * Uses design-system PrimaryButton / SecondaryButton and palette tokens.
 */
export function AccessLockedCard({
  title = "Unlock full access",
  body = "Your account is active in the app, but this area is part of the paid learning experience. Upgrade or reactivate to continue.",
}: AccessLockedCardProps) {
  return (
    <div className="rounded-[1.5rem] border border-ink-100 bg-surface-raised p-6 shadow-card">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#545a95]">
        Access
      </p>
      <h2 className="mt-3 font-[Manrope] text-2xl font-extrabold tracking-tight text-ink-900">
        {title}
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-500">{body}</p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <PrimaryButton href="/upgrade">Upgrade access</PrimaryButton>
        <SecondaryButton href="/">Back to dashboard</SecondaryButton>
      </div>
    </div>
  );
}
