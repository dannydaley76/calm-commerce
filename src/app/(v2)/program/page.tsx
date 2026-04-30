import Link from "next/link";
import { AccessLockedCard } from "@/components/access-locked-card";
import { LearnerShell } from "@/components/learner-shell";
import { getActiveProjectForCurrentUser } from "@/lib/auth/get-active-project";
import { getAccessStateForCurrentUser } from "@/lib/auth/get-access-state";
import { calmCommerceChapterContent } from "@/lib/v2/content";

type ChapterStatus = "not_started" | "in_progress" | "completed";

type ChapterProgress = {
  chapter_id: string;
  status: ChapterStatus;
  worksheet_completion_percent: number;
};

async function getChapterProgress(): Promise<{
  authenticated: boolean;
  progress: ChapterProgress[];
}> {
  try {
    const { supabase, user, projectId } = await getActiveProjectForCurrentUser();
    if (!user || !projectId) return { authenticated: !!user, progress: [] };

    const { data } = await supabase
      .from("chapter_progress")
      .select("chapter_id, status, worksheet_completion_percent")
      .eq("project_id", projectId);

    return { authenticated: true, progress: (data ?? []) as ChapterProgress[] };
  } catch {
    return { authenticated: false, progress: [] };
  }
}

/** Maps ChapterStatus → cc-status-pill data-state. */
function statusPillState(status: ChapterStatus): string {
  if (status === "completed")   return "complete";
  if (status === "in_progress") return "active";   // cobalt — learning progress, not a warning
  return "not-started";
}

function statusPillLabel(status: ChapterStatus): string {
  if (status === "completed")   return "Completed";
  if (status === "in_progress") return "In progress";
  return "Not started";
}

export default async function ProgramPage() {
  const [{ authenticated, progress }, access] = await Promise.all([
    getChapterProgress(),
    getAccessStateForCurrentUser(),
  ]);

  const chapters = Object.values(calmCommerceChapterContent).sort(
    (a, b) => a.chapter.number - b.chapter.number,
  );

  const progressByChapterId = Object.fromEntries(
    progress.map((p) => [p.chapter_id, p]),
  );

  return (
    <LearnerShell
      items={[
        { href: "/",            label: "Dashboard" },
        { href: "/program",     label: "Program", active: true },
        { href: "/lean-canvas", label: "Lean Canvas" },
        { href: "/metrics",     label: "Metrics" },
        { href: "/account",     label: "Account" },
      ]}
      title="Program"
      subtitle="All chapters in sequence. Pick up where you left off or jump to any chapter."
    >

      {/* Access gate */}
      {!access.canAccessPaidContent && (
        <div className="mb-8">
          <AccessLockedCard
            title={
              access.entitlementStatus === "expired" ||
              access.entitlementStatus === "cancelled"
                ? "Your paid access is inactive"
                : "Preview access active"
            }
            body={
              access.entitlementStatus === "expired" ||
              access.entitlementStatus === "cancelled"
                ? "You can still use the dashboard, but the full program is locked until you reactivate your access."
                : "You are inside the product with preview access, but the full program view remains part of the paid experience."
            }
          />
        </div>
      )}

      {/* Signed-out notice */}
      {!authenticated && (
        <div className="mb-8 rounded-[1.5rem] bg-amber-100 p-5 ring-1 ring-amber-100">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-700">
            Signed-out mode
          </p>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-amber-700">
            You can browse the program here, but learner progress appears after sign-in.
          </p>
          <div className="mt-4">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-xl bg-amber-700 px-5 py-3 font-semibold !text-white"
            >
              Sign in to continue
            </Link>
          </div>
        </div>
      )}

      {/* Chapter list */}
      <div className="space-y-4">
        {chapters.map((chapter) => {
          const chapterProgress = progressByChapterId[chapter.chapter.id];
          const status: ChapterStatus =
            (chapterProgress?.status as ChapterStatus | undefined) ?? "not_started";
          const pct = Math.round(chapterProgress?.worksheet_completion_percent ?? 0);
          const hasWorksheet = !!chapter.chapter.worksheetId;

          return (
            <Link
              key={chapter.chapter.slug}
              href={`/chapter/${chapter.chapter.slug}/steps`}
              className={[
                "group flex items-start gap-5",
                "rounded-[1.5rem] bg-surface-raised",
                "border border-ink-100 shadow-card",
                "p-5 lg:p-6",
                "transition-[border-color,box-shadow,transform] duration-150",
                "hover:border-cobalt-500 hover:shadow-card-hover",
                "motion-safe:hover:-translate-y-px",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500",
              ].join(" ")}
            >
              {/* Chapter number badge */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-sunken font-[Manrope] text-sm font-extrabold text-ink-500">
                {chapter.chapter.number}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-500">
                      Phase {chapter.chapter.phase} · {chapter.chapter.phaseLabel}
                    </p>
                    <h3 className="mt-1 font-[Manrope] text-base font-bold tracking-tight text-ink-900 transition-colors duration-150 group-hover:text-cobalt-600">
                      {chapter.chapter.title}
                    </h3>
                  </div>

                  {/* Status pill — uses cc-status-pill token system */}
                  <span
                    className="cc-status-pill shrink-0"
                    data-state={statusPillState(status)}
                  >
                    {statusPillLabel(status)}
                  </span>
                </div>

                {/* Metadata */}
                <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-ink-500">
                  <span>{chapter.chapter.estimatedReadMinutes} min read</span>
                  <span>{chapter.steps.length} steps</span>
                  {hasWorksheet && <span>Worksheet included</span>}
                </div>

                {/* Worksheet progress bar */}
                {hasWorksheet && authenticated && status !== "not_started" && (
                  <div className="mt-3">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
                      <div
                        className="h-full rounded-full bg-cobalt-600 transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="mt-1.5 text-xs text-ink-500">
                      {pct}% worksheet complete
                    </p>
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>

    </LearnerShell>
  );
}
