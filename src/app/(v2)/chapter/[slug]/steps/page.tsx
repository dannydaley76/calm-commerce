import { notFound } from "next/navigation";
import { StepShell } from "../step-shell";
import { LearnerShell } from "@/components/learner-shell";
import { getActiveProjectForCurrentUser } from "@/lib/auth/get-active-project";
import { calmCommerceChapterContent } from "@/lib/v2/content";
import { ContentBlockRenderer } from "@/components/v2/content-block-renderer";
import { InlineWorksheetCard } from "@/components/v2/inline-worksheet-card";
import { WeeklyMetricsCard } from "@/components/v2/weekly-metrics-card";
import { WORKSHEET_REGISTRY as WORKSHEET_DEFINITIONS } from "@/lib/v2/worksheets/registry";

async function syncStepState(stepId: string, chapterSlug: string, chapterId: string) {
  try {
    const { supabase, user, projectId } = await getActiveProjectForCurrentUser();

    if (!user || !projectId) return;

    await supabase.from("chapter_progress").upsert(
      {
        project_id: projectId,
        chapter_id: chapterId,
        status: "in_progress",
        last_location_type: "chapter",
        last_location_key: stepId,
        worksheet_completion_percent: 0,
        completed_at: null,
      },
      { onConflict: "project_id,chapter_id" },
    );

    await supabase.from("project_resume_state").upsert(
      {
        project_id: projectId,
        chapter_id: chapterId,
        last_location_type: "chapter",
        last_location_key: stepId,
        resume_path: `/chapter/${chapterSlug}/steps?step=${stepId}`,
      },
      { onConflict: "project_id" },
    );
  } catch {
    // Non-blocking for scaffold phase.
  }
}

export default async function ChapterStepsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ step?: string }>;
}) {
  const { slug } = await params;
  const { step } = await searchParams;

  const chapter = calmCommerceChapterContent[slug];
  if (!chapter) notFound();

  const currentIndex = step ? chapter.steps.findIndex((item) => item.id === step) : 0;
  const resolvedIndex = currentIndex >= 0 ? currentIndex : 0;
  const currentStep = chapter.steps[resolvedIndex];
  const previousStep = resolvedIndex > 0 ? chapter.steps[resolvedIndex - 1] : null;
  const nextStep = resolvedIndex < chapter.steps.length - 1 ? chapter.steps[resolvedIndex + 1] : null;

  await syncStepState(currentStep.id, slug, chapter.chapter.id);

  return (
    <LearnerShell
      items={[
        { href: "/", label: "Dashboard" },
        { href: "/program", label: "Program" },
        { href: "/lean-canvas", label: "Lean Canvas" },
        { href: "/metrics", label: "Metrics" },
        { href: "/account", label: "Account" },
        { href: `/chapter/${slug}`, label: `Chapter ${chapter.chapter.number}`, active: true },
      ]}
      title={chapter.chapter.title}
      subtitle="Read through each step at your own pace. You can jump to any step using the chapter map."
    >
      <StepShell
        chapterTitle={chapter.chapter.title}
        chapterNumber={chapter.chapter.number}
        totalSteps={chapter.steps.length}
        currentStep={{
          id: currentStep.id,
          title: currentStep.title,
          summary: currentStep.blocks.find((block) => block.type === "paragraph")?.content,
        }}
        currentIndex={resolvedIndex}
        allSteps={chapter.steps.map((item) => ({ id: item.id, title: item.title }))}
        previousStepId={previousStep?.id}
        nextStepId={nextStep?.id}
        stepKindLabel={currentStep.closingStep ? "closing" : currentStep.inlineWorksheetFieldKeys?.length ? "action" : "lesson"}
      >
        <div className="space-y-8">
          {currentStep.blocks.map((block, index) => (
            <ContentBlockRenderer key={`${currentStep.id}-${block.type}-${index}`} block={block} />
          ))}
          {currentStep.inlineWorksheetFieldKeys?.length ? (
            chapter.chapter.worksheetId === "weekly-metrics" ? (
              <WeeklyMetricsCard
                chapterSlug={slug}
                chapterId={chapter.chapter.id}
                worksheetDefinition={WORKSHEET_DEFINITIONS["weekly-metrics"] ?? null}
              />
            ) : (
              <InlineWorksheetCard
                chapterSlug={slug}
                chapterId={chapter.chapter.id}
                worksheetId={chapter.chapter.worksheetId}
                fieldKeys={currentStep.inlineWorksheetFieldKeys}
                worksheetDefinition={chapter.chapter.worksheetId ? (WORKSHEET_DEFINITIONS[chapter.chapter.worksheetId] ?? null) : null}
              />
            )
          ) : null}
        </div>
      </StepShell>
    </LearnerShell>
  );
}
