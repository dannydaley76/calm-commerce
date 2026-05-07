import Link from "next/link";

type StepShellStep = {
  id: string;
  title: string;
  summary?: string;
  goal?: string;
  sourceSections?: string[];
};

type StepShellProps = {
  chapterTitle: string;
  chapterNumber: number;
  totalSteps: number;
  currentStep: StepShellStep;
  currentIndex: number;
  allSteps: StepShellStep[];
  previousStepId?: string;
  nextStepId?: string;
  worksheetHref?: string;
  children: React.ReactNode;
};

/* Shared button classes — mirror PrimaryButton / SecondaryButton from design-system
   but use <Link> (Next.js) instead of <a> so SPA navigation is preserved.        */
const BTN_PRIMARY =
  "inline-flex items-center justify-center rounded-lg bg-cobalt-600 px-5 py-3 text-[13px] font-medium text-white " +
  "shadow-[0_1px_2px_rgba(11,42,57,0.08)] transition-[background-color,box-shadow,transform] duration-150 " +
  "hover:bg-cobalt-700 motion-safe:hover:-translate-y-px hover:shadow-[0_6px_14px_rgba(0,73,207,0.30)] " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500 focus-visible:ring-offset-2";

const BTN_SECONDARY =
  "inline-flex items-center justify-center rounded-lg border border-ink-100 bg-surface-raised px-5 py-3 " +
  "text-[13px] font-medium text-ink-900 transition-[background-color,border-color,box-shadow,transform] duration-150 " +
  "hover:bg-surface-sunken hover:border-cobalt-500 motion-safe:hover:-translate-y-px " +
  "hover:shadow-[0_4px_10px_rgba(11,42,57,0.08)] " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500 focus-visible:ring-offset-2";

export function StepShell({
  chapterTitle,
  chapterNumber,
  totalSteps,
  currentStep,
  currentIndex,
  allSteps,
  previousStepId,
  nextStepId,
  worksheetHref,
  children,
}: StepShellProps) {
  const progressPercent = Math.round(((currentIndex + 1) / totalSteps) * 100);

  return (
    <div className="space-y-6">

        {/* ── Chapter header ── */}
        <header className="mb-8 rounded-[1.5rem] border border-ink-100 bg-surface-raised p-6 shadow-card lg:p-8">
          <div className="flex flex-wrap items-center gap-3">
            {/* Chapter badge uses "not-started" (gray) — it's a label, not a status */}
            <span className="cc-status-pill" data-state="not-started">
              Chapter {chapterNumber}
            </span>
            {/* Step counter uses "active" (cobalt) — currently in progress */}
            <span className="cc-status-pill" data-state="active">
              Step {currentIndex + 1} of {totalSteps}
            </span>
          </div>

          <h1 className="mt-4 font-[Manrope] text-2xl font-bold tracking-tight text-ink-900 lg:text-3xl">
            {chapterTitle}
          </h1>

          {/* Progress bar */}
          <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-ink-100">
            <div
              className="h-full rounded-full bg-cobalt-600 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </header>

        {/* ── Two-column layout ── */}
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">

          {/* Main content */}
          <section className="rounded-[1.5rem] border border-ink-100 bg-surface-raised p-6 shadow-card lg:p-8">
            {children}
          </section>

          {/* Sidebar */}
          <aside className="space-y-5">

            {/* Current step card */}
            <div className="rounded-[1.5rem] border border-ink-100 bg-surface-raised p-5 shadow-card">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink-500">Current step</p>
              <h2 className="mt-3 font-[Manrope] text-xl font-bold tracking-tight text-ink-900">
                {currentStep.title}
              </h2>
              {currentStep.goal && (
                <p className="mt-3 text-sm leading-6 text-ink-500">{currentStep.goal}</p>
              )}
            </div>

            {/* Chapter map */}
            <div className="rounded-[1.5rem] border border-ink-100 bg-surface-raised p-5 shadow-card">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink-500">Chapter map</p>
              <div className="mt-4 space-y-3">
                {allSteps.map((step, index) => {
                  const isCurrent  = step.id === currentStep.id;
                  const isComplete = index < currentIndex;
                  return (
                    <Link
                      key={step.id}
                      href={`?step=${step.id}`}
                      className={[
                        "block rounded-xl px-4 py-3 transition-colors duration-150",
                        isCurrent
                          ? "border border-cobalt-500/30 bg-cobalt-100"
                          : isComplete
                            ? "bg-success-100 hover:bg-success-100"
                            : "bg-surface-sunken hover:bg-ink-100",
                      ].join(" ")}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-bold uppercase tracking-[0.12em] text-ink-500">
                          Step {index + 1}
                        </span>
                        <span className={`text-xs font-semibold ${
                          isCurrent ? "text-cobalt-600" : isComplete ? "text-success-600" : "text-ink-500"
                        }`}>
                          {isCurrent ? "Current" : isComplete ? "Seen" : "Next"}
                        </span>
                      </div>
                      <p className="mt-2 font-[Manrope] text-base font-bold tracking-tight text-ink-900">
                        {step.title}
                      </p>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Source sections */}
            {currentStep.sourceSections?.length ? (
              <div className="rounded-[1.5rem] border border-ink-100 bg-surface-raised p-5 shadow-card">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink-500">Source</p>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-ink-500">
                  {currentStep.sourceSections.map((section) => (
                    <li key={section}>• {section}</li>
                  ))}
                </ul>
              </div>
            ) : null}

          </aside>
        </div>

        {/* ── Footer navigation ── */}
        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <footer className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              {previousStepId ? (
                <Link href={`?step=${previousStepId}`} className={BTN_SECONDARY}>
                  ← Back
                </Link>
              ) : (
                <Link href="/program" className={BTN_SECONDARY}>
                  ← Back to program
                </Link>
              )}
            </div>
            <div>
              {nextStepId ? (
                <Link href={`?step=${nextStepId}`} className={BTN_PRIMARY}>
                  Next →
                </Link>
              ) : worksheetHref ? (
                <Link href={worksheetHref} className={BTN_PRIMARY}>
                  Review answers →
                </Link>
              ) : (
                <Link href="/program" className={BTN_PRIMARY}>
                  Finish chapter →
                </Link>
              )}
            </div>
          </footer>
        </div>

    </div>
  );
}
