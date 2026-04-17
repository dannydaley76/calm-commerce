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
  stepKindLabel?: string;
  children: React.ReactNode;
};

export function StepShell({
  chapterTitle,
  chapterNumber,
  totalSteps,
  currentStep,
  currentIndex,
  allSteps,
  previousStepId,
  nextStepId,
  stepKindLabel,
  children,
}: StepShellProps) {
  const progressPercent = Math.round(((currentIndex + 1) / totalSteps) * 100);

  return (
    <div className="min-h-screen bg-[#f4faff] px-6 py-8 text-[#003748] lg:px-8 lg:py-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 rounded-[2rem] bg-white p-6 shadow-[0px_24px_48px_rgba(48,50,59,0.04)] lg:p-8">
          <div className="flex flex-wrap items-center gap-4">
            <span className="rounded-full bg-[#f4f3fa] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#5d5f68]">
              Chapter {chapterNumber}
            </span>
            <span className="rounded-full bg-[#eef4ff] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#0053dc]">
              Step {currentIndex + 1} of {totalSteps}
            </span>
            {stepKindLabel ? (
              <span className="rounded-full bg-[#eefcf5] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#005e3f]">
                {stepKindLabel}
              </span>
            ) : null}
          </div>
          <h1 className="mt-4 font-[Manrope] text-3xl font-extrabold tracking-tight lg:text-4xl">{chapterTitle}</h1>
          {currentStep.summary ? <p className="mt-3 max-w-3xl text-base leading-7 text-[#5d5f68]">{currentStep.summary}</p> : null}
          <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-[#e8e7f1]">
            <div className="h-full rounded-full bg-[#0053dc]" style={{ width: `${progressPercent}%` }}></div>
          </div>
        </header>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="rounded-[2rem] bg-white p-6 shadow-[0px_24px_48px_rgba(48,50,59,0.04)] lg:p-8">{children}</section>

          <aside className="space-y-5">
            <div className="rounded-[2rem] bg-white p-5 shadow-[0px_24px_48px_rgba(48,50,59,0.04)]">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#5d5f68]">Current step</p>
              <h2 className="mt-3 font-[Manrope] text-2xl font-bold tracking-tight">{currentStep.title}</h2>
              {currentStep.goal ? <p className="mt-3 text-sm leading-6 text-[#5d5f68]">{currentStep.goal}</p> : null}
            </div>

            <div className="rounded-[2rem] bg-white p-5 shadow-[0px_24px_48px_rgba(48,50,59,0.04)]">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#5d5f68]">Chapter map</p>
              <div className="mt-4 space-y-3">
                {allSteps.map((step, index) => {
                  const isCurrent = step.id === currentStep.id;
                  const isComplete = index < currentIndex;
                  return (
                    <Link
                      key={step.id}
                      href={`?step=${step.id}`}
                      className={`block rounded-2xl px-4 py-3 transition ${
                        isCurrent ? "bg-[#eef4ff] ring-1 ring-[#0053dc]/20" : isComplete ? "bg-[#eefcf5]" : "bg-[#f8f8fb]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#5d5f68]">Step {index + 1}</span>
                        <span className={`text-xs font-semibold ${isCurrent ? "text-[#0053dc]" : isComplete ? "text-[#005e3f]" : "text-[#5d5f68]"}`}>
                          {isCurrent ? "Current" : isComplete ? "Seen" : "Next"}
                        </span>
                      </div>
                      <p className="mt-2 font-[Manrope] text-base font-bold tracking-tight text-[#30323b]">{step.title}</p>
                    </Link>
                  );
                })}
              </div>
            </div>

            {currentStep.sourceSections?.length ? (
              <div className="rounded-[2rem] bg-white p-5 shadow-[0px_24px_48px_rgba(48,50,59,0.04)]">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#5d5f68]">Source</p>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-[#5d5f68]">
                  {currentStep.sourceSections.map((section) => (
                    <li key={section}>• {section}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </aside>
        </div>

        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <footer className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              {previousStepId ? (
                <Link href={`?step=${previousStepId}`} className="inline-flex items-center justify-center rounded-xl border border-[#d7d9e6] bg-white px-5 py-3 font-semibold text-[#30323b]">
                  Back
                </Link>
              ) : (
                <Link href="/program" className="inline-flex items-center justify-center rounded-xl border border-[#d7d9e6] bg-white px-5 py-3 font-semibold text-[#30323b]">
                  Back to program
                </Link>
              )}
            </div>
            <div>
              {nextStepId ? (
                <Link href={`?step=${nextStepId}`} className="inline-flex items-center justify-center rounded-xl bg-[#0053dc] px-5 py-3 font-semibold !text-white">
                  Next
                </Link>
              ) : (
                <Link href="/program" className="inline-flex items-center justify-center rounded-xl bg-[#005e3f] px-5 py-3 font-semibold !text-white">
                  Finish chapter
                </Link>
              )}
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
