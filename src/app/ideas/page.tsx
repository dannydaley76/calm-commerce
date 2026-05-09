import { LearnerShell } from "@/components/learner-shell";
import { PrimaryButton, SecondaryButton } from "@/components/design-system";
import { getActiveProjectForCurrentUser } from "@/lib/auth/get-active-project";
import { getAccessStateForCurrentUser } from "@/lib/auth/get-access-state";
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
  canAccessOsContent: boolean;
  canUseScannerImport: boolean;
  ideas: ProductIdeaLifecycle[];
  error?: string;
}> {
  try {
    const { supabase, user, projectId } = await getActiveProjectForCurrentUser();
    if (!user || !projectId) {
      return { authenticated: false, canAccessOsContent: false, canUseScannerImport: false, ideas: [] };
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

    return {
      authenticated: true,
      canAccessOsContent: access.canAccessOsContent,
      canUseScannerImport: access.canUseScannerImport,
      ideas: getProductIdeaLifecycles(responses, (metricRows ?? []) as MetricEntry[]),
    };
  } catch (error) {
    return {
      authenticated: true,
      canAccessOsContent: false,
      canUseScannerImport: false,
      ideas: [],
      error: error instanceof Error ? error.message : "Unable to load your ideas right now.",
    };
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
        Scout Workspace
      </p>
      <h2 className="mt-2 font-[Manrope] text-2xl font-bold text-ink-900">
        No products captured yet
      </h2>
      <p className="mt-3 max-w-[620px] text-sm leading-7 text-ink-600">
        Scan products with Scout or add ideas from the OS. This workspace is where captured products become a shortlist you can review, reject, test, or move into Calm Commerce.
      </p>
      <div className="mt-5">
        <SecondaryButton href="/scout">
          Get Scout extension
        </SecondaryButton>
      </div>
    </section>
  );
}

function importNotice(importStatus?: string, importError?: string) {
  if (importStatus === "added") {
    return {
      title: "Added to Scout Workspace",
      body: "The product was captured from Scout and is ready to sort, note, promote, or delete.",
      tone: "success",
    };
  }
  if (importStatus === "updated") {
    return {
      title: "Existing product updated",
      body: "Scout found this source URL already in Workspace, so the saved product was refreshed instead of duplicated.",
      tone: "success",
    };
  }
  if (!importError) return null;
  const messages: Record<string, string> = {
    missing: "Scout did not include product data. Open Scout on a product page and try Save to Workspace again.",
    invalid: "Scout sent product data we could not read. Reload the extension and try again.",
    expired: "That Scout capture is too old. Scan the product again to save fresh data.",
    scout_save_limit: "Your free Workspace saves are used up. Upgrade to save more product ideas.",
    failed: "The Scout capture could not be saved. Try again from the extension.",
  };
  return {
    title: "Scout import did not save",
    body: messages[importError] ?? messages.failed,
    tone: "error",
    cta: importError === "scout_save_limit" ? "Upgrade Scout" : null,
  };
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

export default async function IdeasPage({
  searchParams,
}: {
  searchParams?: Promise<{ imported?: string; importStatus?: string; importError?: string }>;
}) {
  const params = await searchParams;
  const data = await getIdeaData();
  const actionIdea = data.authenticated ? nextIdea(data.ideas) : null;
  const notice = importNotice(params?.importStatus, params?.importError);

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
      <div className="space-y-5">
        <section className="rounded-xl border border-ink-100 bg-surface-raised px-5 py-4 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cobalt-600">
                Product candidates
              </p>
              <h1 className="mt-1 font-[Manrope] text-2xl font-bold text-ink-900">
                Scout Workspace
              </h1>
              <p className="mt-1 max-w-[720px] text-sm leading-6 text-ink-600">
                Review captured products, sort by signal strength, keep the promising ones visible, and clear out the noise.
              </p>
            </div>
          <div className="flex flex-wrap gap-3">
            {!data.authenticated ? (
              <PrimaryButton href="/login?next=/ideas">
                Sign in to view ideas
              </PrimaryButton>
            ) : actionIdea ? (
              <PrimaryButton href={ideaDetailHref(actionIdea)}>
                Open priority idea
              </PrimaryButton>
            ) : null}
            {data.authenticated ? (
              <SecondaryButton href="/scout">
                Get Scout extension
              </SecondaryButton>
            ) : null}
            {data.authenticated && data.canAccessOsContent ? (
              <SecondaryButton href="/chapter/brainstorm-with-discipline/steps?step=chapter-3-step-4-score-and-shortlist">
                {data.ideas.length > 0 ? "Add another idea" : "Add first idea"}
              </SecondaryButton>
            ) : null}
          </div>
          </div>
        </section>

        {notice ? (
          <section
            className={[
              "rounded-xl border px-5 py-4 text-sm leading-6 shadow-card",
              notice.tone === "error"
                ? "border-error-100 bg-error-100 text-error-700 ring-2 ring-error-100"
                : "border-success-100 bg-success-100 text-[#005e3f]",
            ].join(" ")}
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-[Manrope] text-lg font-bold">{notice.title}</h2>
                <p className="mt-1">{notice.body}</p>
              </div>
              {notice.cta ? (
                <PrimaryButton href="/upgrade?plan=scout_basic">
                  {notice.cta}
                </PrimaryButton>
              ) : null}
            </div>
          </section>
        ) : null}

        {data.error ? (
          <section className="rounded-xl border border-error-100 bg-surface-raised p-6 text-sm leading-6 text-ink-700">
            <h2 className="font-[Manrope] text-lg font-bold text-ink-900">Ideas could not be loaded</h2>
            <p className="mt-2 text-ink-600">
              Your session is active, but the idea history did not load. Refresh the page, or try signing in again if this persists.
            </p>
          </section>
        ) : !data.authenticated ? null : data.ideas.length === 0 ? (
          <EmptyIdeas />
        ) : (
          <IdeasIndexClient
            ideas={data.ideas}
            canAccessOsContent={data.canAccessOsContent}
            highlightedIdeaId={params?.imported}
          />
        )}
      </div>
    </LearnerShell>
  );
}
