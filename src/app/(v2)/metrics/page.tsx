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

export default async function MetricsPage() {
  const { authenticated, entries } = await getMetrics();

  const breadcrumbs = [
    { href: "/", label: "Dashboard" },
    { href: "/program", label: "Program" },
    { href: "/metrics", label: "Weekly Metrics", active: true },
  ];

  return (
    <LearnerShell
      items={breadcrumbs}
      title="Weekly Metrics"
      subtitle="Your store's performance over time. Numbers update each week as you log your metrics."
    >
      <MetricsClient entries={entries} authenticated={authenticated} />
    </LearnerShell>
  );
}
