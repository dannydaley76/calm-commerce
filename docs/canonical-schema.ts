// ============================================================
// Calm Commerce — Canonical Schema (v1)
// Single source of truth for content, worksheets, canvas,
// progress, and metrics.
// ============================================================

// ────────────────────────────────────────────────────────────
// 1. CONTENT LAYER — Static JSON, checked into repo
// ────────────────────────────────────────────────────────────

/** Top-level chapter file: /lib/v2/content/chapters/{slug}.json */
export interface ChapterFile {
  chapter: ChapterMeta;
  steps: StepDefinition[];
}

export interface ChapterMeta {
  id: string;                   // "chapter-2"
  number: number;               // 2
  slug: string;                 // "choose-how-youll-sell"
  title: string;                // "Choose How You'll Sell"
  phase: number;                // 1
  phaseLabel: string;           // "Get Started"
  estimatedReadMinutes: number; // 8
  worksheetId: string | null;   // "sourcing-model-sheet" or null for Ch1
  canvasSections: string[];     // ["sourcing_model"]
}

export interface StepDefinition {
  id: string;                         // "chapter-2-step-1-the-question"
  title: string;                      // "The question before the question"
  blocks: ContentBlock[];
  /** Field keys from the worksheet to render inline. Only on one step per chapter. */
  inlineWorksheetFieldKeys?: string[];
}

// ── Content blocks ──

export type ContentBlock =
  | HeadingBlock
  | ParagraphBlock
  | BulletsBlock
  | NumberedBlock
  | TableBlock
  | QuoteBlock
  | ImageBlock
  | LoopBlock
  | CalloutBlock;

export interface HeadingBlock {
  type: "heading";
  level: 2 | 3;
  content: string;
}

export interface ParagraphBlock {
  type: "paragraph";
  /** Raw text. May contain inline tooltip markers: [TOOLTIP: term | definition] */
  content: string;
}

export interface BulletsBlock {
  type: "bullets";
  items: string[];
}

export interface NumberedBlock {
  type: "numbered";
  items: string[];
}

export interface TableBlock {
  type: "table";
  headers: string[];
  rows: string[][];
}

export interface QuoteBlock {
  type: "quote";
  content: string;
}

export interface ImageBlock {
  type: "image";
  /** Full generation brief from manuscript */
  brief: string;
  /** Short accessible description, derived from brief */
  alt: string;
  /** null in v1 (placeholder), populated when image is created */
  src: string | null;
}

export interface LoopBlock {
  type: "loop";
  /** Encouraging message shown to learner */
  message: string;
  /** One or more navigation targets */
  targets: LoopTarget[];
}

export interface LoopTarget {
  chapterSlug: string;
  stepId?: string;
  label: string;            // button text, e.g. "Back to Brainstorming"
}

export interface CalloutBlock {
  type: "callout";
  style: "insight" | "example" | "tip";
  title?: string;
  content: string;
}

// ── Tooltip (resolved at render time, not a block type) ──

export interface TooltipDefinition {
  term: string;              // "CPA"
  termNormalised: string;    // "cpa" — for dedup within a chapter
  definition: string;
  firstChapter: string;      // chapter ID where it first appears
}

/** Global glossary: /lib/v2/content/glossary.json */
export type Glossary = TooltipDefinition[];


// ────────────────────────────────────────────────────────────
// 2. WORKSHEET LAYER — Static JSON definitions + Supabase state
// ────────────────────────────────────────────────────────────

/** Worksheet definition file: /lib/v2/worksheets/{worksheet-id}.json */
export interface WorksheetFile {
  worksheet: WorksheetMeta;
  fields: (WorksheetField | FieldGroup)[];
}

export interface WorksheetMeta {
  id: string;                     // "sourcing-model-sheet"
  chapterId: string;              // "chapter-2"
  title: string;
  description: string;
  mode: "single" | "recurring";   // "single" for most, "recurring" for Ch17
  completionRule: CompletionRule;
}

export type CompletionRule =
  | { kind: "requiredFieldsComplete"; requiredFieldKeys: string[] }
  | { kind: "viewedFinalStep" }
  | { kind: "firstRecurringEntry" }
  | { kind: "checklistComplete"; checklistFieldKeys: string[] };

// ── Fields ──

export interface WorksheetField {
  type: "field";
  id: string;                     // "sm-1"
  key: string;                    // "sourcing_model"
  label: string;
  fieldType: FieldType;
  required: boolean;
  helpText: string;
  /** Options for single-select and multi-select */
  options?: string[];
  /** Currency-aware fields adapt symbol to learner profile */
  currencyAware?: boolean;
  /** Field only visible when condition is met */
  visibleWhen?: VisibilityCondition;
  /** Default value, if any */
  defaultValue?: string | number | boolean;
}

export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "single-select"
  | "multi-select"
  | "checkbox"
  | "date";

export interface VisibilityCondition {
  field: string;                  // key of the controlling field
  operator: "equals" | "notEquals" | "isNotEmpty";
  value?: string | number | boolean;
}

// ── Repeating field groups (e.g. product ideas in Ch5) ──

export interface FieldGroup {
  type: "field-group";
  key: string;                    // "product_ideas"
  label: string;                  // "Product Idea"
  repeatMin: number;              // 2
  repeatMax: number;              // 3
  /** Which child field's value to display as the group label in summaries */
  summaryFieldKey: string;        // "idea_description"
  fields: WorksheetField[];
}

// ── Supabase: worksheet_responses ──

/**
 * One row per project per worksheet.
 * `data` is a JSONB column holding all field values.
 * For field groups, the value is an array of objects.
 *
 * Table: worksheet_responses
 * PK: (project_id, worksheet_id)
 */
export interface WorksheetResponseRow {
  project_id: string;
  worksheet_id: string;
  data: Record<string, any>;
  /**
   * For field groups, data shape is:
   * {
   *   "product_ideas": [
   *     { "idea_description": "...", "demand_evidence": "...", ... },
   *     { "idea_description": "...", "demand_evidence": "...", ... }
   *   ],
   *   "chosen_idea": "...",
   *   "reason_for_choice": "..."
   * }
   */
  updated_at: string;
}


// ────────────────────────────────────────────────────────────
// 3. LEAN CANVAS — Supabase JSONB
// ────────────────────────────────────────────────────────────

/**
 * One row per project.
 *
 * Table: lean_canvas
 * PK: project_id
 */
export interface LeanCanvasRow {
  project_id: string;
  version: number;                  // optimistic locking — increment on every write
  sections: Record<string, CanvasSection>;
  cross_checks: CrossCheck[];
  /** Archived snapshots from pivots */
  history: CanvasSnapshot[];
  updated_at: string;
}

export interface CanvasSection {
  key: string;                      // e.g. "sourcing_model"
  label: string;                    // "Sourcing Model"
  status: "empty" | "draft" | "complete";
  sourceChapterId: string;          // "chapter-2"
  sourceWorksheetId: string;        // "sourcing-model-sheet"
  /** Mapped values from the worksheet, not raw field data */
  data: Record<string, any>;
  updated_at: string;
}

/** All canvas section keys used in the app */
export type CanvasSectionKey =
  | "sourcing_model"          // Ch2
  | "product_candidates"      // Ch3
  | "operating_constraints"   // Ch4
  | "decision_framework"      // Ch4
  | "boundaries"              // Ch4
  | "product_economics"       // Ch5
  | "pre_store_validation"    // Ch6
  | "customer"                // Ch7
  | "problem"                 // Ch7
  | "value_proposition"       // Ch8
  | "solution"                // Ch8, enriched in Ch9
  | "store_readiness"         // Ch10
  | "channels_free"           // Ch11
  | "channels_paid"           // Ch12
  | "revenue_streams"         // Ch13
  | "health_check"            // Ch14
  | "trajectory"              // Ch15
  | "growth_plan";            // Ch16

// ── Cross-checks ──

export interface CrossCheck {
  id: string;                       // "budget-vs-startup-cost"
  type: "warning" | "insight" | "gate";
  /** Canvas section keys involved */
  inputSections: CanvasSectionKey[];
  message: string;
  resolved: boolean;
  updated_at: string;
}

/** Deterministic cross-check rules evaluated on canvas write */
export interface CrossCheckRule {
  id: string;
  type: "warning" | "insight" | "gate";
  inputSections: CanvasSectionKey[];
  /** Pure function: (sections) => message | null */
  evaluate: (sections: Record<string, CanvasSection>) => string | null;
}

// ── Pivot history ──

export interface CanvasSnapshot {
  snapshotId: string;
  reason: string;                   // e.g. "Product pivot from Chapter 15"
  sections: Record<string, CanvasSection>;
  created_at: string;
}


// ────────────────────────────────────────────────────────────
// 4. PROGRESS & NAVIGATION — Supabase
// ────────────────────────────────────────────────────────────

/**
 * One row per project per chapter.
 *
 * Table: chapter_progress
 * PK: (project_id, chapter_id)
 */
export interface ChapterProgressRow {
  project_id: string;
  chapter_id: string;
  status: "not_started" | "in_progress" | "complete";
  /** IDs of steps the learner has viewed */
  viewed_steps: string[];
  /** Percentage of required worksheet fields filled (0–100) */
  worksheet_completion_pct: number;
  /** Set when both conditions met: final step viewed + worksheet complete */
  completed_at: string | null;
  last_viewed_step: string;
  updated_at: string;
}

/**
 * One row per project. Drives the "Resume" button.
 *
 * Table: project_resume_state
 * PK: project_id
 */
export interface ResumeStateRow {
  project_id: string;
  chapter_id: string;
  last_location_type: "chapter" | "worksheet";
  last_location_key: string;        // step ID or worksheet ID
  resume_path: string;              // full URL path
  updated_at: string;
}


// ────────────────────────────────────────────────────────────
// 5. WEEKLY METRICS — Supabase (time-series, Ch17)
// ────────────────────────────────────────────────────────────

/**
 * One row per project per week.
 *
 * Table: weekly_metrics
 * PK: (project_id, week_ending)
 */
export interface WeeklyMetricsRow {
  project_id: string;
  week_ending: string;              // ISO date, always a Sunday
  revenue: number | null;
  orders: number | null;
  traffic: number | null;
  ad_spend: number | null;
  new_email_subscribers: number | null;
  refunds_returns: number | null;
  /** Computed or manual */
  conversion_rate: number | null;
  /** Computed or manual */
  cpa: number | null;
  margin_per_order: number | null;
  what_worked: string | null;
  what_to_change: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}


// ────────────────────────────────────────────────────────────
// 6. RENDERING CONTRACTS — React component props
// ────────────────────────────────────────────────────────────

/** StepReader receives the full chapter file and current step index */
export interface StepReaderProps {
  chapter: ChapterFile;
  currentStepIndex: number;
  /** Worksheet data for inline fields (null if chapter has no worksheet) */
  worksheetData: Record<string, any> | null;
  onWorksheetChange: (partial: Record<string, any>) => void;
  onStepViewed: (stepId: string) => void;
}

/** ContentBlockRenderer handles one block at a time */
export interface ContentBlockRendererProps {
  block: ContentBlock;
  /** Tracks which tooltips have been shown in this chapter render */
  tooltipsSeen: Set<string>;
}

/** InlineWorksheetFields renders a subset of worksheet fields within a step */
export interface InlineWorksheetFieldsProps {
  worksheetId: string;
  fieldKeys: string[];
  worksheetDefinition: WorksheetFile;
  data: Record<string, any>;
  onChange: (partial: Record<string, any>) => void;
}

/** LoopCard renders a redirect callout with navigation */
export interface LoopCardProps {
  message: string;
  targets: LoopTarget[];
}

/** CanvasView renders the full lean canvas */
export interface CanvasViewProps {
  canvas: LeanCanvasRow;
  /** Chapter metadata for "go to chapter" links */
  chapters: ChapterMeta[];
}

/** CrossCheckAlert renders a single alert card */
export interface CrossCheckAlertProps {
  check: CrossCheck;
}

/** DashboardView renders the Ch17 ongoing operations dashboard */
export interface DashboardViewProps {
  metrics: WeeklyMetricsRow[];
  canvas: LeanCanvasRow;
  /** Subscription status for AI advisory gating */
  isSubscriber: boolean;
}


// ────────────────────────────────────────────────────────────
// 7. SUPABASE TABLE SUMMARY
// ────────────────────────────────────────────────────────────

/**
 * Tables (all scoped to project_id):
 *
 * chapter_progress        — per chapter status and step tracking
 *   PK: (project_id, chapter_id)
 *
 * worksheet_responses     — JSONB field values per worksheet
 *   PK: (project_id, worksheet_id)
 *
 * lean_canvas             — single JSONB canvas per project
 *   PK: project_id
 *   Includes: version (int), sections (jsonb), cross_checks (jsonb), history (jsonb)
 *
 * weekly_metrics          — time-series metric entries
 *   PK: (project_id, week_ending)
 *
 * project_resume_state    — last location for resume flow
 *   PK: project_id
 *
 * Existing tables (already in codebase):
 *   profiles, projects, etc. — unchanged
 */


// ────────────────────────────────────────────────────────────
// 8. CROSS-CHECK RULES (v1 implementation)
// ────────────────────────────────────────────────────────────

/**
 * These are pure functions. Run them after any canvas section update.
 * Return a message string if the check fires, null if it doesn't.
 */

export const CROSS_CHECK_RULES: CrossCheckRule[] = [
  {
    id: "budget-vs-startup-cost",
    type: "warning",
    inputSections: ["sourcing_model", "operating_constraints"],
    evaluate: (s) => {
      const startup = s.sourcing_model?.data?.estimated_startup_cost;
      const cap = s.operating_constraints?.data?.money_cap_per_month;
      if (startup && cap && Number(startup) > Number(cap)) {
        return `Your estimated startup cost (${startup}) exceeds your monthly budget cap (${cap}). Consider a simpler sourcing model or adjusting your budget.`;
      }
      return null;
    },
  },
  {
    id: "stock-investment-vs-budget",
    type: "warning",
    inputSections: ["product_economics", "operating_constraints"],
    evaluate: (s) => {
      const stock = s.product_economics?.data?.minimum_stock_investment;
      const cap = s.operating_constraints?.data?.money_cap_per_month;
      if (stock && cap && Number(stock) > Number(cap)) {
        return `Your minimum stock investment (${stock}) exceeds your monthly budget cap (${cap}). Consider starting with fewer variants or a different sourcing model.`;
      }
      return null;
    },
  },
  {
    id: "margin-viability",
    type: "warning",
    inputSections: ["product_economics", "value_proposition"],
    evaluate: (s) => {
      const margin = s.product_economics?.data?.margin_per_unit;
      const price = s.value_proposition?.data?.final_price;
      if (margin && price && Number(margin) / Number(price) < 0.25) {
        return `Your margin (${margin}) is less than 25% of your selling price (${price}). This may make profitable advertising difficult. Consider reducing costs or increasing your price.`;
      }
      return null;
    },
  },
  {
    id: "cpa-vs-margin",
    type: "warning",
    inputSections: ["channels_paid", "product_economics"],
    evaluate: (s) => {
      const cpa = s.channels_paid?.data?.cpa_after_test;
      const margin = s.product_economics?.data?.margin_per_unit;
      if (cpa && margin && Number(cpa) > Number(margin)) {
        return `Your cost per acquisition (${cpa}) exceeds your margin per sale (${margin}). You are currently losing money on every ad-driven sale. Either reduce CPA or increase margin.`;
      }
      return null;
    },
  },
  {
    id: "cpa-vs-ltv",
    type: "insight",
    inputSections: ["channels_paid", "revenue_streams"],
    evaluate: (s) => {
      const cpa = s.channels_paid?.data?.cpa_after_test;
      const ltv = s.revenue_streams?.data?.estimated_ltv;
      if (cpa && ltv && Number(ltv) > Number(cpa)) {
        return `Your estimated customer lifetime value (${ltv}) exceeds your acquisition cost (${cpa}). Each customer generates net positive value over time. This is a strong signal.`;
      }
      return null;
    },
  },
  {
    id: "time-budget-vs-channels",
    type: "warning",
    inputSections: ["operating_constraints", "channels_free", "channels_paid"],
    evaluate: (s) => {
      const hours = Number(s.operating_constraints?.data?.hours_per_week || 0);
      const freeChannels = (s.channels_free?.data?.free_channels_chosen || "").split(",").filter(Boolean).length;
      const hasPaidAds = s.channels_paid?.status !== "empty";
      const estimatedHours = (freeChannels * 2) + (hasPaidAds ? 2 : 0) + 1; // rough: 2hr/free channel + 2hr ads + 1hr review
      if (hours > 0 && estimatedHours > hours) {
        return `Your active channels may require ~${estimatedHours} hours/week, but your time budget is ${hours} hours. Consider reducing channels or increasing your time commitment.`;
      }
      return null;
    },
  },
  {
    id: "store-readiness-gate",
    type: "gate",
    inputSections: ["store_readiness"],
    evaluate: (s) => {
      if (s.store_readiness?.status !== "complete") {
        return `Your store setup is not yet complete. Finish the store readiness checklist (Chapter 10) before driving traffic.`;
      }
      return null;
    },
  },
];
