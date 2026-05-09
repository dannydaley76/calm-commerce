import { PageHero, PrimaryButton, SecondaryButton } from "@/components/design-system";
import { getAccessStateForCurrentUser } from "@/lib/auth/get-access-state";
import { CaptureIdeaClient } from "./capture-idea-client";

export default async function CaptureIdeaPage({
  searchParams,
}: {
  searchParams: Promise<{ payload?: string }>;
}) {
  const [{ payload }, access] = await Promise.all([
    searchParams,
    getAccessStateForCurrentUser(),
  ]);
  const nextPath = `/ideas/capture${payload ? `?payload=${encodeURIComponent(payload)}` : ""}`;

  return (
    <main className="min-h-screen bg-surface-canvas px-6 py-12 text-ink-900 lg:px-8">
      <div className="mx-auto max-w-2xl">
      {!access.authenticated ? (
        <PageHero
          label="Scout capture"
          title="Sign in to save this product"
          description="Scout will add the product to your Workspace as soon as you sign in."
        >
          <div className="flex flex-wrap gap-3">
            <PrimaryButton href={`/login?next=${encodeURIComponent(nextPath)}`}>
              Sign in
            </PrimaryButton>
            <SecondaryButton href={`/signup?next=${encodeURIComponent(nextPath)}`}>
              Create account
            </SecondaryButton>
          </div>
        </PageHero>
      ) : (
        <CaptureIdeaClient payloadParam={payload} />
      )}
      </div>
    </main>
  );
}
