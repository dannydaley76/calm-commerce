import { notFound } from "next/navigation";
import { PrimaryButton } from "@/components/design-system";
import { LearnerShell } from "@/components/learner-shell";
import { getActiveProjectForCurrentUser } from "@/lib/auth/get-active-project";
import { getAccessStateForCurrentUser } from "@/lib/auth/get-access-state";
import {
  getProductIdeaLifecycles,
  type ProductIdeaLifecycle,
} from "@/lib/v2/worksheets/product-idea-lifecycle";
import { IdeaDetailClient } from "./idea-detail-client";

type ResponseMap = Record<string, string>;
type MetricEntry = {
  id: string;
  week_ending: string;
  data_json: Record<string, string>;
};

async function getIdeaDetail(ideaId: string): Promise<{
  authenticated: boolean;
  canAccessOsContent: boolean;
  idea: ProductIdeaLifecycle | null;
  responses: ResponseMap;
  error?: string;
}> {
  try {
    const { supabase, user, projectId } = await getActiveProjectForCurrentUser();
    if (!user || !projectId) {
      return { authenticated: false, canAccessOsContent: false, idea: null, responses: {} };
    }

    const access = await getAccessStateForCurrentUser();
    const responseQuery = supabase
      .from("worksheet_responses")
      .select("field_key, value_json")
      .eq("project_id", projectId);
    const scopedResponseQuery = access.canAccessOsContent
      ? responseQuery
      : responseQuery.eq("worksheet_id", "ideas-worksheet");

    const { data } = await scopedResponseQuery;
    const metricRows = access.canAccessOsContent
      ? (
        await supabase
          .from("weekly_metrics")
          .select("id, week_ending, data_json")
          .eq("project_id", projectId)
          .order("week_ending", { ascending: false })
      ).data
      : [];

    const responses: ResponseMap = Object.fromEntries(
      (data ?? []).map((row) => [
        row.field_key,
        typeof row.value_json === "string" ? row.value_json : String(row.value_json ?? ""),
      ]),
    );
    const ideas = getProductIdeaLifecycles(responses, (metricRows ?? []) as MetricEntry[]);

    return {
      authenticated: true,
      canAccessOsContent: access.canAccessOsContent,
      idea: ideas.find((item) => item.ideaId === ideaId) ?? null,
      responses,
    };
  } catch (error) {
    return {
      authenticated: true,
      canAccessOsContent: false,
      idea: null,
      responses: {},
      error: error instanceof Error ? error.message : "Unable to load this idea right now.",
    };
  }
}

export default async function IdeaDetailPage({
  params,
}: {
  params: Promise<{ ideaId: string }>;
}) {
  const { ideaId } = await params;
  const data = await getIdeaDetail(decodeURIComponent(ideaId));

  if (data.authenticated && !data.idea) notFound();

  return (
    <LearnerShell
      items={[
        { href: "/",            label: "Dashboard" },
        { href: "/program",     label: "Program" },
        { href: "/ideas",       label: "Ideas", active: true },
        { href: "/lean-canvas", label: "Lean Canvas" },
        { href: "/metrics",     label: "Metrics" },
        { href: "/account",     label: "Account" },
      ]}
      title="Ideas"
      showLogout={data.authenticated}
    >
      {data.error ? (
        <section className="rounded-xl border border-error-100 bg-surface-raised p-6 text-sm leading-6 text-ink-700">
          <h2 className="font-[Manrope] text-lg font-bold text-ink-900">Idea could not be loaded</h2>
          <p className="mt-2 text-ink-600">
            Your session is active, but this idea did not load. Refresh the page, or try signing in again if this persists.
          </p>
        </section>
      ) : !data.authenticated || !data.idea ? (
        <section className="rounded-xl border border-ink-100 bg-surface-raised p-6 text-sm leading-6 text-ink-600">
          <PrimaryButton href={`/login?next=/ideas/${encodeURIComponent(ideaId)}`}>
            Sign in to load this idea
          </PrimaryButton>
        </section>
      ) : (
        <IdeaDetailClient
          idea={data.idea}
          responses={data.responses}
          canAccessOsContent={data.canAccessOsContent}
        />
      )}
    </LearnerShell>
  );
}
