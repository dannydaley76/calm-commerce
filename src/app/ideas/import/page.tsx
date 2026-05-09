import { AccessLockedCard } from "@/components/access-locked-card";
import { LearnerShell } from "@/components/learner-shell";
import { PageHero, PrimaryButton, SecondaryButton } from "@/components/design-system";
import { getAccessStateForCurrentUser, type LearnerAccessState } from "@/lib/auth/get-access-state";
import { scoutLimitMessage } from "@/lib/scout-workspace-limits";
import { getActiveProjectForCurrentUser } from "@/lib/auth/get-active-project";
import { ImportIdeaClient } from "./import-idea-client";

async function getImportAccess(): Promise<{ access: LearnerAccessState; savedCount: number } | null> {
  try {
    const access = await getAccessStateForCurrentUser();
    if (!access.authenticated || !access.projectId) return { access, savedCount: 0 };

    const { supabase, projectId } = await getActiveProjectForCurrentUser();
    const { data } = await supabase
      .from("worksheet_responses")
      .select("value_json")
      .eq("project_id", projectId)
      .eq("worksheet_id", "ideas-worksheet")
      .eq("field_key", "product_ideas")
      .maybeSingle();
    const rawValue = typeof data?.value_json === "string" ? data.value_json : String(data?.value_json ?? "");
    let savedCount = 0;
    try {
      const parsed = JSON.parse(rawValue);
      savedCount = Array.isArray(parsed) ? parsed.length : 0;
    } catch {
      savedCount = 0;
    }

    return { access, savedCount };
  } catch {
    return null;
  }
}

export default async function ImportIdeaPage({
  searchParams,
}: {
  searchParams: Promise<{ payload?: string }>;
}) {
  const [{ payload }, importAccess] = await Promise.all([
    searchParams,
    getImportAccess(),
  ]);
  const access = importAccess?.access ?? null;
  const savedCount = importAccess?.savedCount ?? 0;
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
      ) : access ? (
        <ImportIdeaClient
          payloadParam={payload}
          limitMessage={scoutLimitMessage(savedCount, access)}
        />
      ) : (
        <AccessLockedCard title="Scout import unavailable" body="We could not load your Scout Workspace access. Try refreshing, or sign in again." />
      )}
    </LearnerShell>
  );
}
