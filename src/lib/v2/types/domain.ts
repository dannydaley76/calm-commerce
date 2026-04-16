export type ProgramPhaseLabel =
  | "Get Started"
  | "Set Your Rules and Test"
  | "Build Your Offer"
  | "Get Your Store Ready"
  | "Get Customers"
  | "Measure, Learn, Grow"
  | "Ongoing Operations";

export type ContentBlock =
  | { type: "heading"; level: 2 | 3; content: string }
  | { type: "paragraph"; content: string }
  | { type: "bullets"; items: string[] }
  | { type: "numbered"; items: string[] }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "quote"; content: string }
  | { type: "callout"; style: "insight" | "example" | "tip"; content: string; title?: string }
  | { type: "image"; brief: string; alt: string; src: string | null }
  | { type: "loop"; message: string; targets: LoopTarget[] }
  | { type: "tooltip"; term: string; definition: string };

export type LoopTarget = {
  chapterSlug: string;
  stepId?: string;
  label: string;
};

export type ChapterStepContent = {
  id: string;
  title: string;
  blocks: ContentBlock[];
  inlineWorksheetFieldKeys?: string[];
  closingStep?: boolean;
};

export type ChapterContent = {
  chapter: {
    id: string;
    number: number;
    slug: string;
    title: string;
    phase: number;
    phaseLabel: ProgramPhaseLabel;
    estimatedReadMinutes: number;
    worksheetId: string | null;
    canvasSections: string[];
  };
  steps: ChapterStepContent[];
};

export type WorksheetFieldCondition = {
  field: string;
  equals?: string | number | boolean;
  notEquals?: string | number | boolean;
  in?: Array<string | number | boolean>;
  notIn?: Array<string | number | boolean>;
};

export type WorksheetOption = {
  value: string;
  label: string;
};

export type WorksheetFieldBase = {
  id: string;
  key: string;
  label: string;
  required?: boolean;
  helpText?: string;
  phase?: "default" | "post-test";
  visibleWhen?: WorksheetFieldCondition;
};

export type WorksheetScalarField = WorksheetFieldBase & {
  type: "text" | "textarea" | "number" | "single-select" | "checkbox";
  options?: WorksheetOption[];
};

export type WorksheetFieldGroup = WorksheetFieldBase & {
  type: "field-group";
  repeatMin: number;
  repeatMax: number;
  summaryField: string;
  fields: WorksheetField[];
};

export type WorksheetField = WorksheetScalarField | WorksheetFieldGroup;

export type WorksheetCompletionRule =
  | {
      kind: "requiredFieldsComplete";
      requiredFieldKeys: string[];
    }
  | {
      kind: "viewedFinalStep";
    }
  | {
      kind: "firstRecurringEntry";
    }
  | {
      kind: "checklistComplete";
      checklistFieldKeys: string[];
    };

export type WorksheetMode = "single" | "recurring";

export type WorksheetModel = {
  worksheet: {
    id: string;
    chapterId: string;
    title: string;
    description: string;
    mode?: WorksheetMode;
    completionRule: WorksheetCompletionRule;
  };
  fields: WorksheetField[];
};

export type ChapterStepBreakGroup = {
  id: string;
  label: string;
  sectionRange: string[];
};

export type ChapterStructureConfig = {
  chapterId: string;
  chapterSlug: string;
  allowRevisitAfterCompletion: true;
  progression: "sequential_locked";
  stepBreaks: ChapterStepBreakGroup[];
  worksheetPlacement: {
    strategy: "penultimateTeachingStep";
    excludeClosingStep: true;
  };
};

export type DependencyImpact = {
  sourceFieldKey: string;
  affectedFieldKeys?: string[];
  affectedCanvasSections?: string[];
  warningMessage: string;
  suggestedActionLabel: string;
};

export type LearnerProgressPolicy = {
  navigation: "hybrid_locked_progression";
  chapterCompletion: "viewed_final_step_and_required_worksheet";
  chapter17Completion: "dashboard_view";
  downstreamUpdates: "warn_then_confirm";
  pivotHistory: "background_version_history";
};

export type LeanCanvasSectionStatus = "empty" | "draft" | "complete";

export type LeanCanvasSection = {
  key: string;
  status: LeanCanvasSectionStatus;
  sourceChapter: string;
  data: Record<string, unknown>;
  updatedAt: string;
};

export type LeanCanvasCrossCheck = {
  id: string;
  type: "warning" | "insight" | "gate";
  sections: string[];
  message: string;
  resolvedAt: string | null;
};

export type LeanCanvasModel = {
  projectId: string;
  version: number;
  sections: Record<string, LeanCanvasSection>;
  crossChecks: LeanCanvasCrossCheck[];
  canvasHistory?: Array<{
    archivedAt: string;
    reason: "pivot" | "upstream_change";
    sections: Record<string, LeanCanvasSection>;
  }>;
  updatedAt: string;
};
