export type StepKind = "intro" | "concept" | "example" | "action" | "recap" | "worksheet-handoff";

export type StepContent = {
  headline?: string;
  paragraphs?: string[];
  bullets?: string[];
  numbered?: string[];
  callout?: {
    title?: string;
    content: string;
  };
};

export type ChapterStep = {
  id: string;
  chapterId: string;
  order: number;
  label: string;
  kind: StepKind;
  sourceSections: string[];
  goal: string;
  summary: string;
  content: StepContent;
  nextStepId?: string;
  previousStepId?: string;
};
