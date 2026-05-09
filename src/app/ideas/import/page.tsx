import { AccessLockedCard } from "@/components/access-locked-card";
import { LearnerShell } from "@/components/learner-shell";
import { PageHero, PrimaryButton, SecondaryButton } from "@/components/design-system";
import { getAccessStateForCurrentUser, type LearnerAccessState } from "@/lib/auth/get-access-state";
import { ImportIdeaClient } from "./import-idea-client";

async function getImportAccess(): Promise<LearnerAccessState | null> {
  try {
    return await getAccessStateForCurrentUser();
  } catch {
    return null;
  }
}

export default async function ImportIdeaPage({
  searchParams,
}: {
  searchParams: Promise<{ payload?: string }>;
}) {
  const [{ payload }, access] = await Promise.all([
    searchParams,
    getImportAccess(),
  ]);
  const authenticated = !!access?.authenticated && !!access.projectId;

  return (
    <LearnerShell
      items={[
        { href: "/", label: "Dashboard" },
        { href: "/program", label: "Program" },
        { href: "/ideas", label: "Ideas", active: true },
        { href: "/lean-canvas", label: "Lean Canvas" },
        { href: "/metrics", label: "Metrics" },
        { href: "/account", label: "Account" },
      ]}
      title="Ideas"
    >
      {!authenticated ? (
        <PageHero
          label="Scanner import"
          title="Sign in to import this idea"
          description="Scanner research is saved to your Calm Commerce ideas, economics and notes once you review it."
        >
          <div className="flex flex-wrap gap-3">
            <PrimaryButton href={`/login?next=${encodeURIComponent(`/ideas/import${payload ? `?payload=${payload}` : ""}`)}`}>
              Sign in
            </PrimaryButton>
            <SecondaryButton href={`/signup?next=${encodeURIComponent(`/ideas/import${payload ? `?payload=${payload}` : ""}`)}`}>
              Create account
            </SecondaryButton>
          </div>
        </PageHero>
      ) : !access?.canUseScannerImport ? (
        <AccessLockedCard
          title="Scanner import locked"
          body="Scout imports are available to Scout extension buyers, research workspace subscribers, and Calm Commerce OS users."
        />
      ) : (
        <ImportIdeaClient payloadParam={payload} />
      )}
    </LearnerShell>
  );
}
