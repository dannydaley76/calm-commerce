import { LearnerShell } from "@/components/learner-shell";
import { getActiveProjectForCurrentUser } from "@/lib/auth/get-active-project";
import {
  ensureProductIdeaIds,
  findProductIdeaByIdOrLabel,
  getProductIdeaId,
  getProductIdeaLabel,
} from "@/lib/v2/worksheets/product-idea-identity";
import { MetricsClient } from "./metrics-client";

type MetricEntry = {
  id: string;
  week_ending: string;
  data_json: Record<string, string>;
  submitted_at: string;
};

type ProductIdeaOption = {
  id: string;
  label: string;
};

function parseRows(raw: string | undefined): Record<string, string | undefined>[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function getMetrics(): Promise<{
  authenticated: boolean;
  entries: MetricEntry[];
  productIdeas: ProductIdeaOption[];
  defaultProductIdeaId: string;
}> {
  try {
    const { supabase, user, projectId } = await getActiveProjectForCurrentUser();

    if (!user || !projectId) {
      return { authenticated: false, entries: [], productIdeas: [], defaultProductIdeaId: "" };
    }

    const [{ data, error }, { data: worksheetRows, error: worksheetError }] = await Promise.all([
      supabase
        .from("weekly_metrics")
        .select("id, week_ending, data_json, submitted_at")
        .eq("project_id", projectId)
        .order("submitted_at", { ascending: false }),
      supabase
        .from("worksheet_responses")
        .select("field_key, value_json")
        .eq("project_id", projectId),
    ]);

    if (error) throw error;
    if (worksheetError) throw worksheetError;

    const responseEntries = (worksheetRows ?? []).map((row) => [
      row.field_key,
      typeof row.value_json === "string" ? row.value_json : String(row.value_json ?? ""),
    ]) as Array<[string, string]>;
    const responses = Object.fromEntries(
      responseEntries,
    ) as Record<string, string>;
    const ideas = ensureProductIdeaIds(parseRows(responses.product_ideas));
    const productIdeas = ideas.map((idea, index) => ({
      id: getProductIdeaId(idea, index),
      label: getProductIdeaLabel(idea, index),
    }));
    const defaultIdea =
      findProductIdeaByIdOrLabel(ideas, responses.test_idea) ??
      findProductIdeaByIdOrLabel(ideas, responses.chosen_idea);
    const defaultProductIdeaId = defaultIdea
      ? getProductIdeaId(defaultIdea, ideas.indexOf(defaultIdea))
      : "";

    return { authenticated: true, entries: (data ?? []) as MetricEntry[], productIdeas, defaultProductIdeaId };
  } catch {
    return { authenticated: false, entries: [], productIdeas: [], defaultProductIdeaId: "" };
  }
}

async function markChapter17DashboardViewed() {
  try {
    const { supabase, user, projectId } = await getActiveProjectForCurrentUser();

    if (!user || !projectId) return;

    await supabase.from("chapter_progress").upsert(
      {
        project_id: projectId,
        chapter_id: "chapter-17",
        status: "completed",
        last_location_type: "completion",
        last_location_key: "dashboard_view",
        worksheet_completion_percent: 100,
        completed_at: new Date().toISOString(),
      },
      { onConflict: "project_id,chapter_id" },
    );

    await supabase.from("project_resume_state").upsert(
      {
        project_id: projectId,
        chapter_id: "chapter-17",
        last_location_type: "completion",
        last_location_key: "dashboard_view",
        resume_path: "/metrics",
      },
      { onConflict: "project_id" },
    );
  } catch {
    // Dashboard progress sync is non-blocking; the metrics page should still render.
  }
}

export default async function MetricsPage() {
  const { authenticated, entries, productIdeas, defaultProductIdeaId } = await getMetrics();
  if (authenticated) await markChapter17DashboardViewed();

  const isDev = process.env.NODE_ENV !== "production";

  const breadcrumbs = [
    { href: "/", label: "Dashboard" },
    { href: "/program", label: "Program" },
    { href: "/ideas", label: "Ideas" },
    { href: "/lean-canvas", label: "Lean Canvas" },
    { href: "/metrics", label: "Metrics", active: true },
    { href: "/account", label: "Account" },
  ];

  return (
    <LearnerShell
      items={breadcrumbs}
      title="Weekly Metrics"
      subtitle="Track marketplace tests and own-store performance as each idea moves from validation to trading."
    >
      <MetricsClient
        entries={entries}
        authenticated={authenticated}
        isDev={isDev}
        productIdeas={productIdeas}
        defaultProductIdeaId={defaultProductIdeaId}
      />
    </LearnerShell>
  );
}
