import Link from "next/link";
import { AccessLockedCard } from "@/components/access-locked-card";
import { AccessStatusBadge } from "@/components/access-status-badge";
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

async function getChapterProgress(): Promise<{ authenticated: boolean; progress: ChapterProgress[] }> {
  try {
    const { supabase, user, projectId } = await getActiveProjectForCurrentUser();

    if (!user || !projectId) {
      return { authenticated: !!user, progress: [] };
    }

    const { data } = await supabase
      .from("chapter_progress")
      .select("chapter_id, status, worksheet_completion_percent")
      .eq("project_id", projectId);

    return {
      authenticated: true,
      progress: (data ?? []) as ChapterProgress[],
    };
  } catch {
    return { authenticated: false, progress: [] };
  }
}

function getStatusLabel(status: ChapterStatus) {
  if (status === "completed") return "Completed";
  if (status === "in_progress") return "In progress";
  return "Not started";
}

function getStatusColour(status: ChapterStatus) {
  if (status === "completed") return "bg-[#eefcf5] text-[#005e3f]";
  if (status === "in_progress") return "bg-[#eef4ff] text-[#0053dc]";
  return "bg-[#f4f3fa] text-[#5d5f68]";
}

export default async function ProgramPage() {
  const [{ authenticated, progress }, access] = await Promise.all([
    getChapterProgress(),
    getAccessStateForCurrentUser(),
  ]);

  // Build sorted chapter list from content
  const chapters = Object.values(calmCommerceChapterContent).sort((a, b) => a.chapter.number - b.chapter.number);

  const progressByChapterId = Object.fromEntries(progress.map((p) => [p.chapter_id, p]));

  return (
    <LearnerShell
      items={[
        { href: "/", label: "Dashboard" },
        { href: "/program", label: "Program", active: true },
        { href: "/lean-canvas", label: "Lean Canvas" },
        { href: "/metrics", label: "Metrics" },
        { href: "/account", label: "Account" },
      ]}
      title="Program"
      subtitle="All chapters in sequence. Pick up where you left off or jump to any chapter."
    >
      {!access.canAccessPaidContent ? (
        <div className="mb-8">
          <AccessLockedCard
            title={
              access.entitlementStatus === "expired" || access.entitlementStatus === "cancelled"
                ? "Your paid access is inactive"
                : "Preview access active"
            }
            body={
              access.entitlementStatus === "expired" || access.entitlementStatus === "cancelled"
                ? "You can still use the dashboard, but the full program is locked until you reactivate your access."
                : "You are inside the product with preview access, but the full program view remains part of the paid experience."
            }
          />
        </div>
      ) : null}

      {!authenticated ? (
        <div className="mb-8 rounded-[1.5rem] bg-[#fff7ed] p-5 ring-1 ring-[#f4d7a8]">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9a5a00]">Signed-out mode</p>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#7a4b00]">
            You can browse the program here, but learner progress appears after sign-in.
          </p>
          <div className="mt-4">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-xl bg-[#9a5a00] px-5 py-3 font-semibold !text-white"
            >
              Sign in to continue
            </Link>
          </div>
        </div>
      ) : null}

      <div className="space-y-4">
        {chapters.map((chapter) => {
          const chapterProgress = progressByChapterId[chapter.chapter.id];
          const status: ChapterStatus = (chapterProgress?.status as ChapterStatus | undefined) ?? "not_started";
          const pct = Math.round(chapterProgress?.worksheet_completion_percent ?? 0);
          const hasWorksheet = !!chapter.chapter.worksheetId;

          return (
            <Link
              key={chapter.chapter.slug}
              href={`/chapter/${chapter.chapter.slug}/steps`}
              className="group flex items-start gap-5 rounded-[1.5rem] bg-white p-5 shadow-[0px_4px_16px_rgba(48,50,59,0.06)] ring-1 ring-[#e8e7f1] transition hover:ring-[#0053dc]/30 lg:p-6"
            >
              {/* Chapter number */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f4f3fa] font-[Manrope] text-sm font-extrabold text-[#5d5f68]">
                {chapter.chapter.number}
              </div>

              {/* Main content */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#5d5f68]">
                      Phase {chapter.chapter.phase} · {chapter.chapter.phaseLabel}
                    </p>
                    <h3 className="mt-1 font-[Manrope] text-base font-bold tracking-tight text-[#30323b] group-hover:text-[#0053dc]">
                      {chapter.chapter.title}
                    </h3>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${getStatusColour(status)}`}
                  >
                    {getStatusLabel(status)}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-[#5d5f68]">
                  <span>{chapter.chapter.estimatedReadMinutes} min read</span>
                  <span>{chapter.steps.length} steps</span>
                  {hasWorksheet && <span>Worksheet included</span>}
                </div>

                {hasWorksheet && authenticated && status !== "not_started" ? (
                  <div className="mt-3">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#e8e7f1]">
                      <div
                        className="h-full rounded-full bg-[#0053dc] transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="mt-1.5 text-xs text-[#5d5f68]">{pct}% worksheet complete</p>
                  </div>
                ) : null}
              </div>
            </Link>
          );
        })}
      </div>
    </LearnerShell>
  );
}
