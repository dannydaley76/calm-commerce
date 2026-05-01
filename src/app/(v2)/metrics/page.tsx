import { LearnerShell } from "@/components/learner-shell";
import { getActiveProjectForCurrentUser } from "@/lib/auth/get-active-project";
import { MetricsClient } from "./metrics-client";

type MetricEntry = {
  id: string;
  week_ending: string;
  data_json: Record<string, string>;
  submitted_at: string;
};

async function getMetrics(): Promise<{ authenticated: boolean; entries: MetricEntry[] }> {
  try {
    const { supabase, user, projectId } = await getActiveProjectForCurrentUser();

    if (!user || !projectId) {
      return { authenticated: false, entries: [] };
    }

    const { data, error } = await supabase
      .from("weekly_metrics")
      .select("id, week_ending, data_json, submitted_at")
      .eq("project_id", projectId)
      .order("submitted_at", { ascending: false });

    if (error) throw error;

    return { authenticated: true, entries: (data ?? []) as MetricEntry[] };
  } catch {
    return { authenticated: false, entries: [] };
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
  const { authenticated, entries } = await getMetrics();
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
      subtitle="Your store's performance over time. Numbers update each week as you log your metrics."
    >
      <MetricsClient entries={entries} authenticated={authenticated} isDev={isDev} />
    </LearnerShell>
  );
}
