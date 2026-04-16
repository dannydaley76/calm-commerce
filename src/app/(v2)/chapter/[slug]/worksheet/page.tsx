import { notFound, redirect } from "next/navigation";
import { LearnerShell } from "@/components/learner-shell";
import { Card, Eyebrow, PageHero, Panel, SecondaryButton, SectionShell } from "@/components/design-system";
import { calmCommerceChapterContent } from "@/lib/v2/content";
import { WORKSHEET_REGISTRY } from "@/lib/v2/worksheets/registry";
import { WorksheetClient } from "./worksheet-client";
import { GenericWorksheetClient } from "./generic-worksheet-client";

export default async function WorksheetPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // Look up chapter by slug
  const chapterEntry = calmCommerceChapterContent[slug];
  if (!chapterEntry) return notFound();

  const { chapter } = chapterEntry;
  if (!chapter.worksheetId) return notFound();

  const worksheetDefinition = WORKSHEET_REGISTRY[chapter.worksheetId] ?? null;
  if (!worksheetDefinition) return notFound();

  // Chapter 17 uses a recurring metrics log — the entry form lives in the steps reader
  if (chapter.worksheetId === "weekly-metrics") {
    const metricsStep = chapterEntry.steps.find((s) => s.inlineWorksheetFieldKeys?.length);
    const stepId = metricsStep?.id;
    redirect(`/chapter/${slug}/steps${stepId ? `?step=${stepId}` : ""}`);
  }

  // Chapter 4 has a bespoke, hand-crafted worksheet page
  const isFounderRules = slug === "set-your-founder-rules";

  const breadcrumbs = [
    { href: "/", label: "Dashboard" },
    { href: "/program", label: "Program" },
    { href: `/chapter/${slug}`, label: `Chapter ${chapter.number}` },
    { href: `/chapter/${slug}/worksheet`, label: "Worksheet", active: true },
  ];

  return (
    <LearnerShell
      items={breadcrumbs}
      title={worksheetDefinition.worksheet.title}
      subtitle="Complete the worksheet and return here at any time to update your answers."
    >
      <div className="mx-auto max-w-[960px] space-y-10">
        <PageHero
          label="Worksheet"
          title={worksheetDefinition.worksheet.title}
          description={worksheetDefinition.worksheet.description}
        >
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-[rgba(84,90,149,0.1)] px-[10px] py-[3px] text-[11px] font-medium text-[#545a95]">
              Chapter {chapter.number} work
            </span>
            <span className="rounded-full bg-[rgba(84,90,149,0.1)] px-[10px] py-[3px] text-[11px] font-medium text-[#545a95]">
              {chapter.phaseLabel}
            </span>
          </div>
        </PageHero>

        <SectionShell>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <Eyebrow>What this work does</Eyebrow>
              <p className="mt-3 text-sm leading-7 text-[#003748]">
                Turns Chapter {chapter.number} from reading into decisions you can act on.
              </p>
            </Card>
            <Card>
              <Eyebrow>How to approach it</Eyebrow>
              <p className="mt-3 text-sm leading-7 text-[#003748]">
                Be specific and honest. Answers that reflect your actual situation are more useful than answers that sound good.
              </p>
            </Card>
            <Card>
              <Eyebrow>Saving your work</Eyebrow>
              <p className="mt-3 text-sm leading-7 text-[#003748]">
                Your answers save automatically as you type. Return here any time to review or update them.
              </p>
            </Card>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <SecondaryButton href={`/chapter/${slug}`}>Back to Chapter {chapter.number}</SecondaryButton>
            <SecondaryButton href="/program">Back to Program</SecondaryButton>
          </div>
        </SectionShell>

        <Panel>
          {isFounderRules ? (
            <WorksheetClient
              worksheetModel={worksheetDefinition}
              currencyCode="GBP"
              currencySymbol="£"
            />
          ) : (
            <GenericWorksheetClient
              worksheetDefinition={worksheetDefinition}
              chapterId={chapter.id}
              chapterSlug={slug}
              chapterNumber={chapter.number}
            />
          )}
        </Panel>
      </div>
    </LearnerShell>
  );
}
