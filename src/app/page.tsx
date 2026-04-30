import Link from "next/link";
import { AccessStatusBadge } from "@/components/access-status-badge";
import { LearnerShell } from "@/components/learner-shell";
import { PrimaryButton, SecondaryButton, ProgressBar, Eyebrow } from "@/components/design-system";
import { getActiveProjectForCurrentUser } from "@/lib/auth/get-active-project";
import { getAccessStateForCurrentUser } from "@/lib/auth/get-access-state";
import { calmCommerceChapterContent } from "@/lib/v2/content";

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
      };
    }

    const { data: rows } = await supabase
      .from("chapter_progress")
      .select("chapter_id, status, worksheet_completion_percent")
      .eq("project_id", projectId);

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

    return {
      authenticated: true,
      completedCount,
      totalChapters: chapters.length,
      progressPct: Math.round((completedCount / chapters.length) * 100),
      currentChapter: current,
      currentStatus: (currentRow?.status as ChapterStatus | undefined) ?? "not_started",
      worksheetPct: Math.round(currentRow?.worksheet_completion_percent ?? 0),
      allDone: completedCount === chapters.length,
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
