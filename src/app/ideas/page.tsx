import { LearnerShell } from "@/components/learner-shell";
import { PageHero, PrimaryButton, SecondaryButton } from "@/components/design-system";
import { getActiveProjectForCurrentUser } from "@/lib/auth/get-active-project";
import {
  getProductIdeaLifecycles,
  type ProductIdeaLifecycle,
  type ProductIdeaLifecycleStatus,
} from "@/lib/v2/worksheets/product-idea-lifecycle";
import { IdeasIndexClient } from "./ideas-index-client";

type ResponseMap = Record<string, string>;
type MetricEntry = {
  id: string;
  week_ending: string;
  data_json: Record<string, string>;
};

async function getIdeaData(): Promise<{
  authenticated: boolean;
  ideas: ProductIdeaLifecycle[];
}> {
  try {
    const { supabase, user, projectId } = await getActiveProjectForCurrentUser();
    if (!user || !projectId) return { authenticated: false, ideas: [] };

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

    return {
      authenticated: true,
      ideas: getProductIdeaLifecycles(responses, (metricRows ?? []) as MetricEntry[]),
    };
  } catch {
    return { authenticated: false, ideas: [] };
  }
}

function lifecycleTone(status: ProductIdeaLifecycleStatus): string {
  if (status === "proceed") return "bg-success-100 text-[#005e3f]";
  if (status === "pivot" || status === "retest") return "bg-[#fff8e6] text-[#835700]";
  if (status === "test_running" || status === "test_reviewed" || status === "test_planned") {
    return "bg-[#eef4ff] text-cobalt-600";
  }
  return "bg-surface-sunken text-ink-500";
}

function ideaDetailHref(idea: ProductIdeaLifecycle): string {
  return `/ideas/${encodeURIComponent(idea.ideaId)}`;
}

function ideaPrimaryActionHref(idea: ProductIdeaLifecycle): string {
  return idea.nextAction.label === "Define customer"
    ? idea.nextAction.href
    : ideaDetailHref(idea);
}

function ideaActionPriority(status: ProductIdeaLifecycleStatus): number {
  const priority: Record<ProductIdeaLifecycleStatus, number> = {
    test_reviewed: 1,
    test_running: 2,
    test_planned: 3,
    proceed: 4,
    selected: 5,
    retest: 6,
    economics_checked: 7,
    draft: 8,
    pivot: 9,
  };
  return priority[status];
}

function nextIdea(ideas: ProductIdeaLifecycle[]): ProductIdeaLifecycle | null {
  return [...ideas].sort((a, b) => ideaActionPriority(a.status) - ideaActionPriority(b.status))[0] ?? null;
}

function DetailRow({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-500">
        {label}
      </dt>
      <dd className="mt-1 text-sm leading-6 text-ink-800">{value}</dd>
    </div>
  );
}

function IdeaTimeline({ idea }: { idea: ProductIdeaLifecycle }) {
  return (
    <ol className="mt-6 space-y-3 border-l border-ink-100 pl-4">
      {idea.timeline.map((event) => (
        <li key={event.key} className="relative">
          <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-cobalt-600 ring-4 ring-surface-raised" />
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="font-[Manrope] text-sm font-bold text-ink-900">{event.label}</p>
            <a
              href={event.href}
              className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-500 underline-offset-4 hover:text-cobalt-600 hover:underline"
            >
              {event.chapter}
            </a>
          </div>
          <p className="mt-1 text-xs leading-5 text-ink-500">{event.detail}</p>
        </li>
      ))}
    </ol>
  );
}

function EmptyIdeas() {
  return (
    <section className="rounded-xl border border-dashed border-ink-100 bg-surface-raised p-8">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cobalt-600">
        Idea history
      </p>
      <h2 className="mt-2 font-[Manrope] text-2xl font-bold text-ink-900">
        No product ideas yet
      </h2>
      <p className="mt-3 max-w-[620px] text-sm leading-7 text-ink-600">
        Start in Chapter 3 by adding a shortlist of product ideas. As you run the numbers and test on a marketplace, each idea will build a history here.
      </p>
      <div className="mt-5">
        <SecondaryButton href="/chapter/brainstorm-with-discipline/steps">
          Go to Chapter 3
        </SecondaryButton>
      </div>
    </section>
  );
}

function IdeaCard({ idea }: { idea: ProductIdeaLifecycle }) {
  return (
    <article className="rounded-xl border border-ink-100 bg-surface-raised p-6 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <a
            href={ideaDetailHref(idea)}
            className="font-[Manrope] text-lg font-bold text-ink-900 underline-offset-4 hover:text-cobalt-600 hover:underline"
          >
            {idea.label}
          </a>
          <p className="mt-2 text-sm leading-6 text-ink-600">
            {idea.latestSignal}
          </p>
        </div>
        <span className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${lifecycleTone(idea.status)}`}>
          {idea.statusLabel}
        </span>
      </div>

      <dl className="mt-6 grid gap-5 md:grid-cols-2">
        <DetailRow label="Demand evidence" value={idea.demandEvidence} />
        <DetailRow label="Competition notes" value={idea.competitionNotes} />
        <DetailRow label="Seasonality" value={idea.seasonality} />
        <DetailRow label="Economics decision" value={idea.economicsDecision} />
        <DetailRow label="Test marketplace" value={idea.testMarketplace} />
        <DetailRow label="Test result" value={idea.testResult} />
        <DetailRow label="Units sold" value={idea.unitsSold} />
        <DetailRow label="Test learning" value={idea.testLearning} />
        <DetailRow label="Test decision" value={idea.testDecision} />
        <DetailRow
          label="Metric entries"
          value={idea.metricEntries.length > 0 ? String(idea.metricEntries.length) : null}
        />
      </dl>

      <IdeaTimeline idea={idea} />

      <div className="mt-6 rounded-lg border border-cobalt-100 bg-cobalt-100/50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-cobalt-600">
              Next best action
            </p>
            <p className="mt-1 text-sm leading-6 text-ink-700">
              {idea.nextAction.note}
            </p>
          </div>
          <PrimaryButton href={ideaPrimaryActionHref(idea)} className="shrink-0">
            {idea.nextAction.label}
          </PrimaryButton>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <SecondaryButton href={ideaDetailHref(idea)} className="px-4 py-2">
          Open detail
        </SecondaryButton>
      </div>
    </article>
  );
}

export default async function IdeasPage() {
  const data = await getIdeaData();
  const actionIdea = data.authenticated ? nextIdea(data.ideas) : null;

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
      <div className="space-y-8">
        <PageHero
          label="Product candidates"
          title="Your idea history"
          description="Track each product idea from shortlist to economics check, marketplace test, and next decision."
        >
          <div className="flex flex-wrap gap-3">
            {actionIdea ? (
              <PrimaryButton href={ideaDetailHref(actionIdea)}>
                Open priority idea
              </PrimaryButton>
            ) : null}
            <SecondaryButton href="/chapter/brainstorm-with-discipline/steps?step=chapter-3-step-4-score-and-shortlist">
              {data.authenticated && data.ideas.length > 0 ? "Add another idea" : "Add first idea"}
            </SecondaryButton>
          </div>
        </PageHero>

        {!data.authenticated ? (
          <section className="rounded-xl border border-ink-100 bg-surface-raised p-6 text-sm leading-6 text-ink-600">
            Sign in to load your idea history.
          </section>
        ) : data.ideas.length === 0 ? (
          <EmptyIdeas />
        ) : (
          <IdeasIndexClient ideas={data.ideas} />
        )}
      </div>
    </LearnerShell>
  );
}
