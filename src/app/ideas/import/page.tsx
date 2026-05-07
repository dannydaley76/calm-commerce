import { LearnerShell } from "@/components/learner-shell";
import { PageHero, SecondaryButton } from "@/components/design-system";
import { getActiveProjectForCurrentUser } from "@/lib/auth/get-active-project";
import { ImportIdeaClient } from "./import-idea-client";

async function isAuthenticated(): Promise<boolean> {
  try {
    const { user, projectId } = await getActiveProjectForCurrentUser();
    return !!user && !!projectId;
  } catch {
    return false;
  }
}

export default async function ImportIdeaPage({
  searchParams,
}: {
  searchParams: Promise<{ payload?: string }>;
}) {
  const [{ payload }, authenticated] = await Promise.all([
    searchParams,
    isAuthenticated(),
  ]);

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
          <SecondaryButton href="/login">Sign in</SecondaryButton>
        </PageHero>
      ) : (
        <ImportIdeaClient payloadParam={payload} />
      )}
    </LearnerShell>
  );
}
