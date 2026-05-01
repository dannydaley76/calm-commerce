import Link from "next/link";
import { AccessStatusBadge } from "@/components/access-status-badge";
import { LearnerShell } from "@/components/learner-shell";
import { PrimaryButton, SecondaryButton, ProgressBar, Eyebrow } from "@/components/design-system";
import { getActiveProjectForCurrentUser } from "@/lib/auth/get-active-project";
import { getAccessStateForCurrentUser } from "@/lib/auth/get-access-state";
import { calmCommerceChapterContent } from "@/lib/v2/content";
import {
  getProductIdeaLifecycles,
  type ProductIdeaLifecycle,
  type ProductIdeaLifecycleStatus,
} from "@/lib/v2/worksheets/product-idea-lifecycle";

/* ─────────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────────── */

type ChapterStatus = "not_started" | "in_progress" | "completed";

type ChapterEntry = {
  chapter: {
    id: string;
    number: number;
    slug: string;
    title: string;
    phase: number;
    phaseLabel: string;
    worksheetId?: string;
  };
  steps: unknown[];
};

type DashboardData =
  | { authenticated: false }
  | {
      authenticated: true;
      completedCount: number;
      totalChapters: number;
      progressPct: number;
      currentChapter: ChapterEntry | null;
      currentStatus: ChapterStatus;
      worksheetPct: number;
      allDone: boolean;
      ideaLifecycles: ProductIdeaLifecycle[];
    };

/* ─────────────────────────────────────────────────────────────
   Data
───────────────────────────────────────────────────────────── */

async function getDashboardData(): Promise<DashboardData> {
  try {
    const { supabase, user, projectId } = await getActiveProjectForCurrentUser();

    if (!user) return { authenticated: false };

    const chapters = (
      Object.values(calmCommerceChapterContent) as ChapterEntry[]
    ).sort((a, b) => a.chapter.number - b.chapter.number);

    if (!projectId) {
      return {
        authenticated: true,
        completedCount: 0,
        totalChapters: chapters.length,
        progressPct: 0,
        currentChapter: chapters[0] ?? null,
        currentStatus: "not_started",
        worksheetPct: 0,
        allDone: false,
        ideaLifecycles: [],
      };
    }

    const [{ data: rows }, { data: worksheetRows }] = await Promise.all([
      supabase
        .from("chapter_progress")
        .select("chapter_id, status, worksheet_completion_percent")
        .eq("project_id", projectId),
      supabase
        .from("worksheet_responses")
        .select("field_key, value_json")
        .eq("project_id", projectId),
    ]);

    const byId = Object.fromEntries(
      (rows ?? []).map((r) => [r.chapter_id, r]),
    );

    const completedCount = chapters.filter(
      (ch) => byId[ch.chapter.id]?.status === "completed",
    ).length;

    // Current = first in_progress → first not_started → last chapter
    const current =
      chapters.find((ch) => byId[ch.chapter.id]?.status === "in_progress") ??
      chapters.find((ch) => !byId[ch.chapter.id] || byId[ch.chapter.id].status === "not_started") ??
      chapters[chapters.length - 1] ??
      null;

    const currentRow = current ? byId[current.chapter.id] : null;
    const worksheetResponses = Object.fromEntries(
      (worksheetRows ?? []).map((row) => [
        row.field_key,
        typeof row.value_json === "string" ? row.value_json : String(row.value_json ?? ""),
      ]),
    );

    return {
      authenticated: true,
      completedCount,
      totalChapters: chapters.length,
      progressPct: Math.round((completedCount / chapters.length) * 100),
      currentChapter: current,
      currentStatus: (currentRow?.status as ChapterStatus | undefined) ?? "not_started",
      worksheetPct: Math.round(currentRow?.worksheet_completion_percent ?? 0),
      allDone: completedCount === chapters.length,
      ideaLifecycles: getProductIdeaLifecycles(worksheetResponses),
    };
  } catch {
    return { authenticated: false };
  }
}

/* ─────────────────────────────────────────────────────────────
   CTA derivation
───────────────────────────────────────────────────────────── */

type Cta = { href: string; label: string; secondary?: boolean };

function deriveCta(data: DashboardData): Cta {
  if (!data.authenticated) {
    return { href: "/login", label: "Sign in to continue" };
  }
  if (data.allDone) {
    return { href: "/lean-canvas", label: "Open your Lean Canvas" };
  }
  if (!data.currentChapter) {
    return { href: "/program", label: "Browse the program" };
  }
  const slug = data.currentChapter.chapter.slug;
  if (data.currentStatus === "not_started" && data.completedCount === 0) {
    return {
      href: `/chapter/${slug}/steps`,
      label: `Start Chapter ${data.currentChapter.chapter.number}`,
    };
  }
  return {
    href: `/chapter/${slug}/steps`,
    label: `Continue Chapter ${data.currentChapter.chapter.number}`,
  };
}

function heroTitle(data: DashboardData): string {
  if (!data.authenticated) return "Welcome to Calm Commerce OS.";
  if (!("allDone" in data)) return "Welcome back.";
  if (data.allDone) return "Program complete.";
  if (data.currentStatus === "in_progress")
    return `You're on Chapter ${data.currentChapter?.chapter.number}.`;
  if (data.completedCount === 0) return "Ready to start.";
  return `Up next: Chapter ${data.currentChapter?.chapter.number}.`;
}

function heroDescription(data: DashboardData, cta: Cta): string {
  if (!data.authenticated)
    return "Sign in to load your learner progress and pick up where you left off.";
  if (!("currentChapter" in data) || !data.currentChapter)
    return "Browse the full program to choose where to begin.";
  if (data.allDone)
    return "You've completed all chapters. Your Lean Canvas and Metrics capture everything you've built.";
  return data.currentChapter.chapter.title;
}

function lifecycleTone(status: ProductIdeaLifecycleStatus): string {
  if (status === "proceed") return "bg-success-100 text-[#005e3f]";
  if (status === "pivot" || status === "retest") return "bg-[#fff8e6] text-[#835700]";
  if (status === "test_running" || status === "test_reviewed" || status === "test_planned") {
    return "bg-[#eef4ff] text-cobalt-600";
  }
  return "bg-surface-sunken text-ink-500";
}

function ideaActionPriority(status: ProductIdeaLifecycleStatus): number {
  const priority: Record<ProductIdeaLifecycleStatus, number> = {
    test_reviewed: 1,
    test_running: 2,
    test_planned: 3,
    selected: 4,
    retest: 5,
    economics_checked: 6,
    draft: 7,
    proceed: 8,
    pivot: 9,
  };
  return priority[status];
}

function chooseDashboardIdeaAction(ideas: ProductIdeaLifecycle[]): ProductIdeaLifecycle {
  return [...ideas].sort((a, b) => ideaActionPriority(a.status) - ideaActionPriority(b.status))[0];
}

function IdeaPipelinePanel({ ideas }: { ideas: ProductIdeaLifecycle[] }) {
  if (ideas.length === 0) {
    return (
      <section className="rounded-[1.5rem] border border-dashed border-ink-100 bg-surface-raised p-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cobalt-600">
          Idea pipeline
        </p>
        <h3 className="mt-2 font-[Manrope] text-lg font-bold text-ink-900">
          No product ideas yet
        </h3>
        <p className="mt-2 max-w-[620px] text-sm leading-6 text-ink-500">
          Add your first shortlisted ideas in Chapter 3. They will start appearing here as tracked candidates.
        </p>
        <div className="mt-4">
          <SecondaryButton href="/chapter/brainstorm-with-discipline/steps">
            Go to Chapter 3
          </SecondaryButton>
        </div>
      </section>
    );
  }

  const actionIdea = chooseDashboardIdeaAction(ideas);

  return (
    <section className="rounded-[1.5rem] border border-ink-100 bg-surface-raised p-6 shadow-card">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cobalt-600">
            Idea pipeline
          </p>
          <h3 className="mt-2 font-[Manrope] text-lg font-bold text-ink-900">
            Product candidates
          </h3>
        </div>
        <SecondaryButton href="/ideas">View all ideas</SecondaryButton>
      </div>

      <div className="mt-5 rounded-2xl border border-cobalt-100 bg-cobalt-100/50 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cobalt-600">
              Next product action
            </p>
            <h4 className="mt-2 font-[Manrope] text-base font-bold text-ink-900">
              {actionIdea.nextAction.label}: {actionIdea.label}
            </h4>
            <p className="mt-1 text-sm leading-6 text-ink-600">
              {actionIdea.nextAction.note}
            </p>
          </div>
          <PrimaryButton href={actionIdea.nextAction.href} className="shrink-0">
            {actionIdea.nextAction.label}
          </PrimaryButton>
        </div>
      </div>

      <div className="mt-5 divide-y divide-ink-100">
        {ideas.slice(0, 4).map((idea) => (
          <div key={idea.ideaId} className="flex flex-wrap items-start justify-between gap-3 py-4 first:pt-0 last:pb-0">
            <div className="min-w-0">
              <p className="truncate font-[Manrope] text-sm font-bold text-ink-900">
                {idea.label}
              </p>
              <p className="mt-1 text-xs leading-5 text-ink-500">
                {idea.latestSignal}
              </p>
            </div>
            <span className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${lifecycleTone(idea.status)}`}>
              {idea.statusLabel}
            </span>
            <SecondaryButton href={idea.nextAction.href} className="shrink-0 px-4 py-2">
              {idea.nextAction.label}
            </SecondaryButton>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   Page
───────────────────────────────────────────────────────────── */

export default async function DashboardPage() {
  const [data, access] = await Promise.all([
    getDashboardData(),
    getAccessStateForCurrentUser(),
  ]);

  const cta = deriveCta(data);

  return (
    <LearnerShell
      items={[
        { href: "/",            label: "Dashboard", active: true },
        { href: "/program",     label: "Program" },
        { href: "/ideas",       label: "Ideas" },
        { href: "/lean-canvas", label: "Lean Canvas" },
        { href: "/metrics",     label: "Metrics" },
        { href: "/account",     label: "Account" },
      ]}
      title="Dashboard"
    >
      <div className="space-y-10">

        {/* ── Hero ── */}
        <section className="rounded-[1.5rem] border border-ink-100 bg-surface-raised p-8 shadow-card">

          {/* Access badge */}
          <div className="mb-5">
            <AccessStatusBadge
              status={access.entitlementStatus}
              level={access.accessLevel}
              compact
            />
          </div>

          {/* Title + description */}
          <h2 className="font-[Manrope] text-3xl font-bold tracking-tight text-ink-900">
            {heroTitle(data)}
          </h2>
          {"currentChapter" in data && data.currentChapter && !data.allDone && (
            <p className="mt-1 text-base text-ink-500">
              {data.currentChapter.chapter.phaseLabel}
            </p>
          )}
          <p className="mt-3 max-w-[560px] text-sm leading-7 text-ink-700">
            {heroDescription(data, cta)}
          </p>

          {/* Progress bar — overall program completion */}
          {"progressPct" in data && (
            <div className="mt-6">
              <div className="mb-2 flex items-baseline justify-between gap-4">
                <Eyebrow>Program progress</Eyebrow>
                <span className="text-xs text-ink-500">
                  {data.completedCount} of {data.totalChapters} chapters complete
                </span>
              </div>
              <ProgressBar value={data.progressPct} />
              {data.worksheetPct > 0 && !data.allDone && data.currentStatus !== "not_started" && (
                <p className="mt-1.5 text-xs text-ink-500">
                  Current chapter worksheet: {data.worksheetPct}% complete
                </p>
              )}
            </div>
          )}

          {/* Primary CTA */}
          <div className="mt-6">
            <PrimaryButton href={cta.href}>{cta.label} →</PrimaryButton>
          </div>
        </section>

        {"ideaLifecycles" in data && (
          <IdeaPipelinePanel ideas={data.ideaLifecycles} />
        )}

        {/* ── Quick links ── */}
        <section>
          <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.18em] text-ink-500">
            Where to go
          </p>
          <div className="grid gap-4 sm:grid-cols-3">

            <Link
              href="/program"
              className="group flex flex-col rounded-[1.5rem] border border-ink-100 bg-surface-raised p-5 shadow-card transition-[border-color,box-shadow,transform] duration-150 hover:border-cobalt-500 hover:shadow-card-hover motion-safe:hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500"
            >
              <span className="text-xl">📖</span>
              <span className="mt-3 font-[Manrope] text-sm font-semibold text-ink-900 group-hover:text-cobalt-600 transition-colors duration-150">
                Full program
              </span>
              <span className="mt-1 text-xs text-ink-500">
                All chapters in sequence
              </span>
            </Link>

            <Link
              href="/lean-canvas"
              className="group flex flex-col rounded-[1.5rem] border border-ink-100 bg-surface-raised p-5 shadow-card transition-[border-color,box-shadow,transform] duration-150 hover:border-cobalt-500 hover:shadow-card-hover motion-safe:hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500"
            >
              <span className="text-xl">🗺</span>
              <span className="mt-3 font-[Manrope] text-sm font-semibold text-ink-900 group-hover:text-cobalt-600 transition-colors duration-150">
                Lean Canvas
              </span>
              <span className="mt-1 text-xs text-ink-500">
                Your operating model
              </span>
            </Link>

            <Link
              href="/metrics"
              className="group flex flex-col rounded-[1.5rem] border border-ink-100 bg-surface-raised p-5 shadow-card transition-[border-color,box-shadow,transform] duration-150 hover:border-cobalt-500 hover:shadow-card-hover motion-safe:hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500"
            >
              <span className="text-xl">📊</span>
              <span className="mt-3 font-[Manrope] text-sm font-semibold text-ink-900 group-hover:text-cobalt-600 transition-colors duration-150">
                Metrics
              </span>
              <span className="mt-1 text-xs text-ink-500">
                Weekly performance log
              </span>
            </Link>

          </div>
        </section>

      </div>
    </LearnerShell>
  );
}
