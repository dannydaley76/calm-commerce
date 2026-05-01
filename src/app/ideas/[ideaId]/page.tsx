import { notFound } from "next/navigation";
import { LearnerShell } from "@/components/learner-shell";
import { getActiveProjectForCurrentUser } from "@/lib/auth/get-active-project";
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
  idea: ProductIdeaLifecycle | null;
  responses: ResponseMap;
}> {
  try {
    const { supabase, user, projectId } = await getActiveProjectForCurrentUser();
    if (!user || !projectId) return { authenticated: false, idea: null, responses: {} };

    const [{ data }, { data: metricRows }] = await Promise.all([
      supabase
        .from("worksheet_responses")
        .select("field_key, value_json")
        .eq("project_id", projectId),
      supabase
        .from("weekly_metrics")
        .select("id, week_ending, data_json")
        .eq("project_id", projectId)
        .order("week_ending", { ascending: false }),
    ]);

    const responses: ResponseMap = Object.fromEntries(
      (data ?? []).map((row) => [
        row.field_key,
        typeof row.value_json === "string" ? row.value_json : String(row.value_json ?? ""),
      ]),
    );
    const ideas = getProductIdeaLifecycles(responses, (metricRows ?? []) as MetricEntry[]);

    return {
      authenticated: true,
      idea: ideas.find((item) => item.ideaId === ideaId) ?? null,
      responses,
    };
  } catch {
    return { authenticated: false, idea: null, responses: {} };
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
    >
      {!data.authenticated || !data.idea ? (
        <section className="rounded-xl border border-ink-100 bg-surface-raised p-6 text-sm leading-6 text-ink-600">
          Sign in to load this idea.
        </section>
      ) : (
        <IdeaDetailClient idea={data.idea} responses={data.responses} />
      )}
    </LearnerShell>
  );
}
