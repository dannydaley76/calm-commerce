import Link from "next/link";
import { Eyebrow, PageHero, Panel, PrimaryButton, ProgressBar, SecondaryButton } from "@/components/design-system";
import { LearnerShell } from "@/components/learner-shell";
import { getActiveProjectForCurrentUser } from "@/lib/auth/get-active-project";
import { getAccessStateForCurrentUser } from "@/lib/auth/get-access-state";
import { getCurrencyMeta } from "@/lib/profile/currency";
import { calmCommerceChapterContent } from "@/lib/v2/content";
import {
  findProductIdeaByIdOrLabel,
  getProductIdeaId,
  getProductIdeaLabel,
} from "@/lib/v2/worksheets/product-idea-identity";
import { calculateUnitEconomics } from "@/lib/v2/worksheets/review-unit-economics";
import {
  CanvasCard,
  CanvasTabs,
  CanvasTabPanel,
  CanvasHeroOperatingAction,
  InlineEditCard,
  BusinessModelCard,
  getSectionState,
} from "@/components/lean-canvas";
import type { SubField, CardVariant } from "@/components/lean-canvas";

/* ─────────────────────────────────────────────────────────────────────
   Operating canvas (Chapter 4) — static definitions
   ───────────────────────────────────────────────────────────────────── */

const OPERATING_SECTIONS = [
  { title: "Time budget",           key: "time_budget_hours_per_week" },
  { title: "Money cap",             key: "money_cap_per_month" },
  { title: "Experiment duration",   key: "minimum_experiment_duration" },
  { title: "Success metrics",       key: "success_metrics" },
  { title: "Continue criteria",     key: "continue_criteria" },
  { title: "Escalation criteria",   key: "escalation_criteria" },
  { title: "Kill criteria",         key: "kill_criteria" },
  { title: "Red-line rules",        key: "red_line_rules" },
] as const;

/**
 * Maps each canvas field key to the worksheetId it should be written to.
 * Derived from the worksheet JSON files — a field key is globally unique.
 */
const FIELD_WORKSHEET_MAP: Record<string, string> = {
  ad_platform:              "ad-test-worksheet",
  chosen_idea:              "unit-economics-worksheet",
  core_problem:             "customer-profile-worksheet",
  customer_description:     "customer-profile-worksheet",
  email_collection_method:  "email-retention-worksheet",
  estimated_startup_cost:   "sourcing-model-sheet",
  final_price:              "offer-worksheet",
  first_week_actions:       "traffic-plan-worksheet",
  free_channels_chosen:     "traffic-plan-worksheet",
  key_differentiator:       "offer-worksheet",
  margin_after_all_costs:   "offer-worksheet",
  minimum_viable_version:   "offer-worksheet",
  offer_summary:            "offer-worksheet",
  positioning_statement:    "offer-worksheet",
  product_title:            "product-listing-worksheet",
  repeat_purchase_strategy: "email-retention-worksheet",
  sourcing_model:           "sourcing-model-sheet",
  what_builds_trust:        "customer-profile-worksheet",
  what_they_value_most:     "customer-profile-worksheet",
  where_they_gather:        "customer-profile-worksheet",
};

/**
 * Maps each Business model section ID to its CSS grid area and internal
 * density variant.  Grid placement and card density are decoupled: the area
 * class controls where the card sits in the 12-col template-areas grid, and
 * the variant controls padding / body clamping / CTA layout.
 */
const SECTION_CONFIG: Record<string, { area: string; variant: CardVariant }> = {
  problem:           { area: "prob", variant: "tall" },
  uvp:               { area: "uvp",  variant: "tall" },
  customer_segments: { area: "cseg", variant: "tall" },
  channels:          { area: "chan", variant: "tall" },
  solution:          { area: "sol",  variant: "compact" },
  unfair_advantage:  { area: "uadv", variant: "compact" },
  cost_structure:    { area: "cost", variant: "footer-wide" },
  revenue_streams:   { area: "rev",  variant: "footer-wide" },
};

/**
 * Scalar fields that support inline editing directly on the canvas.
 * Long-form fields are excluded — they route to the full Chapter 4 worksheet.
 */
const INLINE_EDITABLE_KEYS = new Set([
  "time_budget_hours_per_week",
  "money_cap_per_month",
  "minimum_experiment_duration",
] as const);

const OPERATING_GROUPS = [
  {
    title: "Constraints",
    description: "The limits that keep the business realistic and survivable while you learn.",
    keys: ["time_budget_hours_per_week", "money_cap_per_month", "minimum_experiment_duration"],
  },
  {
    title: "Success signals",
    description: "The evidence that tells you whether to continue, invest further, or stay patient.",
    keys: ["success_metrics", "continue_criteria", "escalation_criteria"],
  },
  {
    title: "Stop and risk rules",
    description: "The lines that protect you from forcing a weak idea or making pressure-driven decisions.",
    keys: ["kill_criteria", "red_line_rules"],
  },
] as const;

/* ─────────────────────────────────────────────────────────────────────
   Lean canvas sections (Chapters 2–13) — static definitions
   ───────────────────────────────────────────────────────────────────── */

type LeanCanvasFieldDef = { key: string; label: string };

type LeanCanvasSectionDef = {
  id: string;
  title: string;
  description: string;
  chapterLabel: string;
  chapterHref: string;
  fields: LeanCanvasFieldDef[];
};

const LEAN_CANVAS_SECTIONS: LeanCanvasSectionDef[] = [
  {
    id: "problem",
    title: "Problem",
    description: "The real problem your customer has that your product solves.",
    chapterLabel: "Chapter 7: Pick Your Customer",
    chapterHref: "/chapter/pick-your-customer/worksheet",
    fields: [
      { key: "core_problem",       label: "Core problem" },
      { key: "what_they_value_most", label: "What they value most" },
    ],
  },
  {
    id: "customer_segments",
    title: "Customer segments",
    description: "Who you are selling to, and where to find them.",
    chapterLabel: "Chapter 7: Pick Your Customer",
    chapterHref: "/chapter/pick-your-customer/worksheet",
    fields: [
      { key: "customer_description", label: "Niche customer" },
      { key: "where_they_gather",    label: "Where they gather" },
      { key: "what_builds_trust",    label: "What builds trust" },
    ],
  },
  {
    id: "uvp",
    title: "Unique value proposition",
    description: "Why your customer should buy from you instead of the alternative.",
    chapterLabel: "Chapter 8: Shape Your Offer",
    chapterHref: "/chapter/shape-your-offer/worksheet",
    fields: [
      { key: "positioning_statement", label: "Positioning statement" },
      { key: "key_differentiator",    label: "Key differentiator" },
    ],
  },
  {
    id: "solution",
    title: "Solution",
    description: "The product or offer you are taking to market.",
    chapterLabel: "Chapters 5, 8–9",
    chapterHref: "/chapter/shape-your-offer/worksheet",
    fields: [
      { key: "chosen_idea",              label: "Chosen product idea" },
      { key: "offer_summary",            label: "Offer summary" },
      { key: "minimum_viable_version",   label: "Minimum viable version" },
      { key: "product_title",            label: "Listing title" },
    ],
  },
  {
    id: "channels",
    title: "Channels",
    description: "How customers discover and buy from you.",
    chapterLabel: "Chapters 11–12",
    chapterHref: "/chapter/free-traffic/worksheet",
    fields: [
      { key: "free_channels_chosen", label: "Free channels" },
      { key: "ad_platform",          label: "Paid channel" },
      { key: "first_week_actions",   label: "First week actions" },
    ],
  },
  {
    id: "revenue_streams",
    title: "Revenue streams",
    description: "How you make money now and build customer lifetime value.",
    chapterLabel: "Chapters 8 & 13",
    chapterHref: "/chapter/email-and-repeat-customers/worksheet",
    fields: [
      { key: "final_price",              label: "Selling price" },
      { key: "margin_after_all_costs",   label: "Margin per sale" },
      { key: "repeat_purchase_strategy", label: "Repeat purchase strategy" },
      { key: "email_collection_method",  label: "Email collection" },
    ],
  },
  {
    id: "cost_structure",
    title: "Cost structure",
    description: "The fixed and variable costs your business model depends on.",
    chapterLabel: "Chapters 2 & 5",
    chapterHref: "/chapter/choose-how-youll-sell/worksheet",
    fields: [
      { key: "sourcing_model",          label: "Sourcing model" },
      { key: "estimated_startup_cost",  label: "Startup cost estimate" },
    ],
  },
  {
    id: "unfair_advantage",
    title: "Unfair advantage",
    description: "What makes this offer genuinely hard for a competitor to copy.",
    chapterLabel: "Chapters 7–8",
    chapterHref: "/chapter/shape-your-offer/worksheet",
    fields: [
      { key: "key_differentiator", label: "Differentiator" },
      { key: "what_builds_trust",  label: "Trust signals" },
    ],
  },
];

/* ─────────────────────────────────────────────────────────────────────
   Types
   ───────────────────────────────────────────────────────────────────── */

type ResponseMap = Record<string, string>;
type OperatingSectionKey = (typeof OPERATING_SECTIONS)[number]["key"];

type CanvasInsight = {
  title: string;
  body: string;
  tone: "good" | "warn" | "neutral";
};

type FieldData = { key: string; label: string; value: string | undefined; filled: boolean };
type CanvasSectionData = LeanCanvasSectionDef & {
  fieldData: FieldData[];
  hasSomeData: boolean;
  filledCount: number;
};

type UnitEconomicsRow = {
  idea_id?: string;
  idea_name?: string;
  product_cost?: string;
  shipping_to_customer?: string;
  platform_fees?: string;
  selling_price?: string;
};

type MetricRow = {
  id: string;
  week_ending: string;
  data_json: Record<string, string>;
};

type ChosenIdeaMeta = {
  id: string;
  label: string;
};

type IdeaMetricSummary = {
  latestMetricDate: string | null;
  actualProfitPerSale: number | null;
  actualRevenuePerOrder: number | null;
  latestOrders: number | null;
};

/* ─────────────────────────────────────────────────────────────────────
   Text helpers (unchanged from original)
   ───────────────────────────────────────────────────────────────────── */

function normalizeText(value: string | undefined) {
  return (value ?? "").trim();
}

function toBulletList(value: string | undefined) {
  const text = normalizeText(value);
  if (!text) return [] as string[];
  const pieces = text
    .split(/\n+|•|•|;+/)
    .map((item) => item.replace(/^[-*\d.)\s]+/, "").trim())
    .filter(Boolean);
  return pieces.length > 1 ? pieces : [];
}

function formatValue(value: string | undefined) {
  const text = normalizeText(value);
  if (!text) return null;
  const bullets = toBulletList(text);
  if (bullets.length > 1) {
    return { kind: "bullets" as const, bullets, text };
  }
  return { kind: "text" as const, text };
}


function getSectionEmptyState(key: OperatingSectionKey) {
  if (key === "time_budget_hours_per_week")  return "Your realistic weekly time limit is not defined yet.";
  if (key === "money_cap_per_month")         return "Your safe monthly spend cap is not defined yet.";
  if (key === "minimum_experiment_duration") return "You have not set the minimum time you will give a test before judging it.";
  if (key === "success_metrics")             return "You have not yet defined the signals that would count as genuine progress.";
  if (key === "continue_criteria")           return "You have not yet defined what evidence is strong enough to justify continuing.";
  if (key === "escalation_criteria")         return "You have not yet defined what result would justify investing more time or money.";
  if (key === "kill_criteria")               return "You have not yet defined the result that would tell you to stop.";
  return "You have not yet defined the rules you refuse to break under pressure.";
}

function getOperatingFilledCount(responses: ResponseMap) {
  return OPERATING_SECTIONS.filter((s) => normalizeText(responses[s.key])).length;
}

function getCompletionSummary(filledCount: number) {
  if (filledCount === 0)                      return "No operating rules captured yet.";
  if (filledCount < 3)                        return "The canvas has started, but it is still too thin to guide real decisions.";
  if (filledCount < OPERATING_SECTIONS.length) return "The canvas is partially useful, but some decision rules are still missing.";
  return "The operating canvas is complete enough to guide your next stage of decision-making.";
}

/* ─────────────────────────────────────────────────────────────────────
   Insight builders
   ───────────────────────────────────────────────────────────────────── */

/**
 * Normalises a duration value so appending " week(s)" is always safe.
 *
 * Rules
 * ─────
 * • Strip trailing "weeks?" / "wks?" (case-insensitive) if present.
 * • Parse the remainder as a number and re-append the correct singular or
 *   plural suffix, preventing the "4 weeks weeks" double-unit bug.
 * • If the value contains a non-week unit (e.g. "2 months") or is
 *   non-numeric freeform text, return it unchanged so we don't mangle it.
 */
function formatExperimentDuration(raw: string): string {
  const stripped = raw.trim().replace(/\s*(weeks?|wks?)\s*$/i, "").trim();
  const n = parseFloat(stripped);
  if (!isNaN(n) && String(n) === stripped) {
    // Bare number (with or without a trailing "weeks" that was stripped)
    return `${stripped} ${n === 1 ? "week" : "weeks"}`;
  }
  if (stripped !== raw.trim()) {
    // Had a "weeks" suffix but the remainder isn't a clean number —
    // e.g. "a few weeks". Return the stripped version (no double suffix).
    return stripped || raw.trim();
  }
  // Contains its own unit ("2 months") or freeform text — leave untouched.
  return raw.trim();
}

/**
 * Template helper: `verb + lower-cased value` → one decision clause.
 * Returns null when value is empty so callers can filter cleanly.
 */
function decisionClause(verb: string, value: string): string | null {
  const v = normalizeText(value);
  if (!v) return null;
  // Lower-case the first character for smooth mid-sentence flow.
  const lowered = v.charAt(0).toLowerCase() + v.slice(1);
  return `${verb} ${lowered}`;
}

function buildOperatingSummary(responses: ResponseMap, currencySymbol: string) {
  const timeBudget         = normalizeText(responses.time_budget_hours_per_week);
  const moneyCap           = normalizeText(responses.money_cap_per_month);
  const experimentDuration = normalizeText(responses.minimum_experiment_duration);

  const normalizedMoneyCap = moneyCap
    ? moneyCap.replaceAll("£", "").replaceAll("$", "").replaceAll("€", "").trim() || moneyCap
    : "";

  const parts = [
    timeBudget         ? `work within ${timeBudget} hrs/week` : null,
    moneyCap           ? `keep spend within ${normalizedMoneyCap} ${currencySymbol}/month` : null,
    experimentDuration ? `judge experiments for at least ${formatExperimentDuration(experimentDuration)}` : null,
  ].filter(Boolean);

  if (parts.length === 0) return "You have not yet defined the basic operating constraints for this idea.";
  return `Right now, your operating rule is to ${parts.join(", ")}.`;
}

function buildDecisionSummary(responses: ResponseMap) {
  const clauses = [
    decisionClause("watch for",     responses.success_metrics),
    decisionClause("continue if",   responses.continue_criteria),
    decisionClause("escalate when", responses.escalation_criteria),
    decisionClause("stop when",     responses.kill_criteria),
  ].filter((c): c is string => c !== null);

  if (clauses.length === 0) {
    return "You have not yet defined enough decision signals to make this canvas genuinely actionable.";
  }
  return `Your decision model: ${clauses.join("; ")}.`;
}

function buildRiskSummary(responses: ResponseMap) {
  const redLines   = normalizeText(responses.red_line_rules);
  const killCriteria = normalizeText(responses.kill_criteria);
  if (!redLines && !killCriteria) return "You have not yet defined the boundaries that stop emotion or sunk-cost thinking from taking over.";
  if (redLines && killCriteria)   return "You have both hard stop signals and explicit non-negotiables, which makes the operating model more disciplined under pressure.";
  if (redLines) return "You have defined non-negotiables, but your stop signals could still be clearer.";
  return "You have defined a stop condition, but your non-negotiables could still be clearer.";
}

function buildCanvasInsights(responses: ResponseMap, currencySymbol: string): CanvasInsight[] {
  const filledCount = getOperatingFilledCount(responses);
  return [
    {
      title: "Operating summary",
      body:  buildOperatingSummary(responses, currencySymbol),
      tone:  filledCount >= 3 ? "good" : "neutral",
    },
    {
      title: "Decision summary",
      body:  buildDecisionSummary(responses),
      tone:  normalizeText(responses.success_metrics) && normalizeText(responses.kill_criteria) ? "good" : "warn",
    },
    {
      title: "Risk posture",
      body:  buildRiskSummary(responses),
      tone:  normalizeText(responses.red_line_rules) ? "good" : "warn",
    },
  ];
}

/* ─────────────────────────────────────────────────────────────────────
   Field-group parsing
   ───────────────────────────────────────────────────────────────────── */

function parseFieldGroup<T extends Record<string, string | undefined>>(raw: string | undefined): T[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as T[];
  } catch {
    return [];
  }
}

function getChosenIdeaEconomics(responses: ResponseMap): UnitEconomicsRow | null {
  const instances = parseFieldGroup<UnitEconomicsRow>(responses.idea_economics);
  if (!instances.length) return null;
  const chosenIdea = normalizeText(responses.chosen_idea);
  const ideas = parseFieldGroup<Record<string, string | undefined>>(responses.product_ideas);
  const chosenIdeaRow = findProductIdeaByIdOrLabel(ideas, chosenIdea);
  const chosenIdeaId = chosenIdeaRow ? getProductIdeaId(chosenIdeaRow, ideas.indexOf(chosenIdeaRow)) : "";
  const match = chosenIdea
    ? instances.find((e) =>
        normalizeText(e.idea_id) === chosenIdea ||
        (chosenIdeaId && normalizeText(e.idea_id) === chosenIdeaId) ||
        normalizeText(e.idea_name) === chosenIdea,
      )
    : undefined;
  const row        = match ?? instances[0];
  return row && Object.keys(row).length > 0 ? row : null;
}

function getChosenIdeaMeta(responses: ResponseMap): ChosenIdeaMeta | null {
  const chosenIdea = normalizeText(responses.chosen_idea);
  if (!chosenIdea) return null;
  const ideas = parseFieldGroup<Record<string, string | undefined>>(responses.product_ideas);
  const chosenIdeaRow = findProductIdeaByIdOrLabel(ideas, chosenIdea);
  if (!chosenIdeaRow) return { id: chosenIdea, label: chosenIdea };
  const index = ideas.findIndex((row, rowIndex) => getProductIdeaId(row, rowIndex) === chosenIdeaRow.idea_id);
  return {
    id: getProductIdeaId(chosenIdeaRow, Math.max(0, index)),
    label: getProductIdeaLabel(chosenIdeaRow, Math.max(0, index)),
  };
}

function formatCalculatedMoney(value: number | null, symbol: string): string | null {
  if (value === null) return null;
  return `${symbol}${value.toFixed(2)}`;
}

function parseMetricNumber(value: string | undefined): number | null {
  if (!value) return null;
  const cleaned = value.replace(/[^0-9.\-]/g, "");
  if (!cleaned) return null;
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function getIdeaMetricSummary(metrics: MetricRow[], ideaId: string | null): IdeaMetricSummary {
  const linked = ideaId
    ? metrics.filter((entry) => normalizeText(entry.data_json.product_idea_id) === ideaId)
    : [];

  let actualProfitPerSale: number | null = null;
  let actualRevenuePerOrder: number | null = null;
  let latestOrders: number | null = null;

  for (const entry of linked) {
    const entryType = entry.data_json.entry_type;
    if (actualProfitPerSale === null && entryType === "validation") {
      actualProfitPerSale = parseMetricNumber(entry.data_json.profit_per_sale);
    }
    if (actualRevenuePerOrder === null && entryType === "live_store") {
      const revenue = parseMetricNumber(entry.data_json.revenue);
      const orders = parseMetricNumber(entry.data_json.orders);
      if (revenue !== null && orders !== null && orders > 0) {
        actualRevenuePerOrder = revenue / orders;
        latestOrders = orders;
      }
    }
  }

  return {
    latestMetricDate: linked[0]?.week_ending ?? null,
    actualProfitPerSale,
    actualRevenuePerOrder,
    latestOrders,
  };
}

/* ─────────────────────────────────────────────────────────────────────
   Lean canvas section building
   ───────────────────────────────────────────────────────────────────── */

function buildLeanCanvasSections(responses: ResponseMap): CanvasSectionData[] {
  const ideaRows = parseFieldGroup<Record<string, string | undefined>>(responses.product_ideas);
  const chosenIdeaRow = findProductIdeaByIdOrLabel(ideaRows, responses.chosen_idea);
  const chosenIdeaLabel = chosenIdeaRow ? normalizeText(chosenIdeaRow.idea_description) : "";
  return LEAN_CANVAS_SECTIONS.map((def) => {
    const fieldData  = def.fields.map((f) => ({
      ...f,
      value:  f.key === "chosen_idea" && chosenIdeaLabel ? chosenIdeaLabel : responses[f.key],
      filled: !!normalizeText(responses[f.key]),
    }));
    const filledCount = fieldData.filter((f) => f.filled).length;
    return { ...def, fieldData, filledCount, hasSomeData: filledCount > 0 };
  });
}

function getLeanCanvasFilledSectionCount(sections: CanvasSectionData[]) {
  return sections.filter((s) => s.hasSomeData).length;
}

/* ─────────────────────────────────────────────────────────────────────
   Field → step index (deep-linking)
   ───────────────────────────────────────────────────────────────────── */

type FieldStepInfo = {
  chapterSlug: string;
  stepId: string;
  chapterNumber: number;
  stepTitle: string;
};

function buildFieldStepIndex(): Record<string, FieldStepInfo> {
  const index: Record<string, FieldStepInfo> = {};
  for (const [slug, entry] of Object.entries(calmCommerceChapterContent)) {
    const chapterNumber = entry.chapter.number;
    for (const step of entry.steps) {
      const keys = step.inlineWorksheetFieldKeys;
      if (!keys?.length) continue;
      for (const key of keys) {
        if (!index[key]) {
          index[key] = { chapterSlug: slug, stepId: step.id, chapterNumber, stepTitle: step.title };
        }
      }
    }
  }
  return index;
}

/** Returns the best available deep-link for a canvas section. */
function getSectionEditHref(
  fields: readonly { key: string }[],
  fallbackHref: string,
  fieldStepIndex: Record<string, FieldStepInfo>,
): string {
  for (const f of fields) {
    const info = fieldStepIndex[f.key];
    if (info) return `/chapter/${info.chapterSlug}/steps?step=${info.stepId}`;
  }
  return fallbackHref;
}

/* ─────────────────────────────────────────────────────────────────────
   Data fetching
   ───────────────────────────────────────────────────────────────────── */

async function getCanvasData(): Promise<{
  authenticated: boolean;
  responses: ResponseMap;
  metrics: MetricRow[];
  currencyCode: string;
}> {
  try {
    const { supabase, user, projectId } = await getActiveProjectForCurrentUser();
    if (!user || !projectId) return { authenticated: false, responses: {}, metrics: [], currencyCode: "GBP" };
    const [{ data }, { data: metricRows }] = await Promise.all([
      supabase
        .from("worksheet_responses")
        .select("field_key, value_json")
        .eq("project_id", projectId),
      supabase
        .from("weekly_metrics")
        .select("id, week_ending, data_json")
        .eq("project_id", projectId)
        .order("week_ending", { ascending: false }),
    ]);
    const responses = Object.fromEntries(
      (data ?? []).map((row) => [
        row.field_key,
        typeof row.value_json === "string" ? row.value_json : String(row.value_json ?? ""),
      ]),
    );
    return { authenticated: true, responses, metrics: (metricRows ?? []) as MetricRow[], currencyCode: "GBP" };
  } catch {
    return { authenticated: false, responses: {}, metrics: [], currencyCode: "GBP" };
  }
}

function getAccessBadge(status: string | null, level: string | null) {
  if (status === "active" && level === "full") return { label: "Paid access active", pillState: "paid" };
  if (status === "expired" || status === "cancelled") return { label: "Access inactive", pillState: "not-started" };
  return { label: "Preview access", pillState: "in-progress" };
}

/* ─────────────────────────────────────────────────────────────────────
   Shared sub-components (server-side, inline)
   ───────────────────────────────────────────────────────────────────── */

/** Formats a field value into bullet list or paragraph JSX. */
function FieldValue({ value }: { value: string | undefined }) {
  const formatted = formatValue(value);
  if (!formatted) return null;
  if (formatted.kind === "bullets") {
    return (
      <ul className="space-y-1 text-sm leading-6 text-ink-900">
        {formatted.bullets.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-[0.55rem] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-cobalt-600" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    );
  }
  return <p className="text-sm leading-6 text-ink-900">{formatted.text}</p>;
}

/* ─────────────────────────────────────────────────────────────────────
   Page
   ───────────────────────────────────────────────────────────────────── */

export default async function LeanCanvasPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const [{ authenticated, responses, metrics, currencyCode }, access, { tab }] = await Promise.all([
    getCanvasData(),
    getAccessStateForCurrentUser(),
    searchParams,
  ]);

  const initialTab: "operating" | "business" = tab === "business" ? "business" : "operating";

  /* Aggregated counts */
  const operatingFilledCount = getOperatingFilledCount(responses);
  const accessBadge          = getAccessBadge(access.entitlementStatus, access.accessLevel);
  const currency             = getCurrencyMeta(currencyCode);
  const insights             = buildCanvasInsights(responses, currency.symbol);
  const canvasSections       = buildLeanCanvasSections(responses);
  const canvasFilledCount    = getLeanCanvasFilledSectionCount(canvasSections);
  const chosenIdeaEconomics  = getChosenIdeaEconomics(responses);
  const chosenIdeaMeta       = getChosenIdeaMeta(responses);
  const chosenIdea           = chosenIdeaMeta?.label ?? "";
  const chosenIdeaMetrics    = getIdeaMetricSummary(metrics, chosenIdeaMeta?.id ?? null);
  const fieldStepIndex       = buildFieldStepIndex();

  /* Combined canvas progress (both layers together) */
  const TOTAL_SECTION_COUNT = OPERATING_SECTIONS.length + LEAN_CANVAS_SECTIONS.length; // 16
  const totalFilledCount    = operatingFilledCount + canvasFilledCount;
  const totalPercent        = (totalFilledCount / TOTAL_SECTION_COUNT) * 100;

  /* Tab definitions for <CanvasTabs> */
  const tabs = [
    {
      id:          "operating",
      label:       "Operating layer",
      filledCount: operatingFilledCount,
      totalCount:  OPERATING_SECTIONS.length,
    },
    {
      id:          "business",
      label:       "Business model layer",
      filledCount: canvasFilledCount,
      totalCount:  LEAN_CANVAS_SECTIONS.length,
    },
  ];

  return (
    <LearnerShell
      items={[
        { href: "/",           label: "Dashboard" },
        { href: "/program",    label: "Program" },
        { href: "/ideas",      label: "Ideas" },
        { href: "/lean-canvas", label: "Lean Canvas", active: true },
        { href: "/metrics",    label: "Metrics" },
        { href: "/account",    label: "Account" },
      ]}
      title="Lean Canvas"
      subtitle={
        initialTab === "operating"
          ? "How you'll run the business: your founder rules from Chapter 4."
          : "What you'll sell: your offer taking shape across Chapters 2–13."
      }
      contentWidth="1180px"
    >
      <div className="space-y-8">
        {/* ── Page hero ── */}
        <PageHero
          label="Lean Canvas"
          title={initialTab === "operating" ? "Operating rules" : "Business model"}
          description={
            initialTab === "operating"
              ? "The founder rules from Chapter 4: your time, money, and decision limits. These keep the business survivable while you learn."
              : "How the product and offer take shape, pulled from the worksheets across Chapters 2–13. This view is anchored on your chosen idea from Chapter 5."
          }
        >
          <div className="flex flex-wrap items-center gap-3">
            <span className="cc-status-pill" data-state={accessBadge.pillState}>
              {accessBadge.label}
            </span>
          </div>

          {/* Canvas-level progress — one bar covering both layers */}
          <div className="mt-4">
            <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <p className="text-[11px] font-medium text-ink-700">
                Canvas progress: {totalFilledCount} of {TOTAL_SECTION_COUNT} sections complete
              </p>
              <p className="text-[10px] text-ink-500">
                Operating {operatingFilledCount}/{OPERATING_SECTIONS.length} · Business {canvasFilledCount}/{LEAN_CANVAS_SECTIONS.length}
              </p>
            </div>
            <ProgressBar value={totalPercent} />
          </div>

          {/* Edit shortcut — only visible when the Operating tab is active */}
          <CanvasHeroOperatingAction initialTab={initialTab} />
        </PageHero>

        {/* ── Tab navigation + panels ── */}
        <CanvasTabs tabs={tabs} initialTab={initialTab} paramName="tab">

          {/* ═══ Operating layer ════════════════════════════════════════ */}
          <CanvasTabPanel id="operating">
            <section className="space-y-6">
              <div>
                <h3 className="font-[Manrope] text-2xl font-bold tracking-tight">Operating canvas</h3>
                <p className="mt-2 text-sm text-ink-500">
                  Your business operating constraints and decision rules from Chapter 4.
                </p>
              </div>

              {operatingFilledCount === 0 ? (
                /* ── Empty-canvas CTA ── */
                <div className="rounded-[1.75rem] bg-surface-sunken p-6">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cobalt-600">Start here</p>
                  <h3 className="mt-3 font-[Manrope] text-2xl font-bold tracking-tight">
                    Complete Founder Rules before using the canvas
                  </h3>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-ink-500">
                    The Lean Canvas becomes genuinely useful once you have defined your time limits, money limits,
                    success signals, and stop rules. Until then, this page is just showing the shape of what will
                    be generated later.
                  </p>
                  <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <Link
                      href="/chapter/set-your-founder-rules/worksheet"
                      className="inline-flex items-center justify-center rounded-xl bg-cobalt-600 px-5 py-3 font-semibold !text-white"
                    >
                      Go to Founder Rules Sheet
                    </Link>
                    <Link
                      href="/program"
                      className="inline-flex items-center justify-center rounded-xl border border-ink-100 bg-white px-5 py-3 font-semibold text-ink-900"
                    >
                      Back to Program
                    </Link>
                  </div>
                </div>
              ) : (
                <>
                  {/* ── Insights strip ── */}
                  <div className="grid gap-4 lg:grid-cols-3">
                    {insights.map((insight) => (
                      <div
                        key={insight.title}
                        className={`rounded-[1.5rem] p-5 ${
                          insight.tone === "good"
                            ? "bg-surface-raised text-ink-900"
                            : insight.tone === "warn"
                              ? "bg-amber-100 text-[#7a4b00]"
                              : "bg-surface-sunken text-ink-900"
                        }`}
                      >
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em]">{insight.title}</p>
                        <p className="mt-3 text-sm leading-7">{insight.body}</p>
                      </div>
                    ))}
                  </div>

                  {/* ── Grouped operating cards ── */}
                  <div className="space-y-6">
                    {OPERATING_GROUPS.map((group) => (
                      <div
                        key={group.title}
                        className="rounded-[1.75rem] bg-surface-sunken p-6"
                      >
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cobalt-600">
                          {group.title}
                        </p>
                        <p className="mt-2 mb-4 text-sm text-ink-500">{group.description}</p>

                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                          {group.keys.map((key) => {
                            const section  = OPERATING_SECTIONS.find((s) => s.key === key)!;
                            const rawValue = responses[section.key];
                            const filled   = !!normalizeText(rawValue);

                            /* Try a step-level deep link; fall back to the full worksheet */
                            const stepInfo = fieldStepIndex[section.key];
                            const editHref = stepInfo
                              ? `/chapter/${stepInfo.chapterSlug}/steps?step=${stepInfo.stepId}`
                              : "/chapter/set-your-founder-rules/worksheet";

                            const opState = getSectionState({
                              filledCount: filled ? 1 : 0,
                              totalCount:  1,
                              editHref,
                              sourceLabel: "Chapter 4: Founder Rules",
                            });

                            /* ── Scalar fields → inline edit ── */
                            if (INLINE_EDITABLE_KEYS.has(section.key as "time_budget_hours_per_week" | "money_cap_per_month" | "minimum_experiment_duration")) {
                              const isMoneyField = section.key === "money_cap_per_month";
                              const isDurationField = section.key === "minimum_experiment_duration";
                              return (
                                <InlineEditCard
                                  key={section.key}
                                  title={section.title}
                                  description={getSectionEmptyState(section.key)}
                                  initialState={opState}
                                  initialValue={rawValue ?? ""}
                                  fieldKey={section.key}
                                  fieldConfig={{
                                    inputType: "number",
                                    unitPrefix: isMoneyField ? currency.symbol : undefined,
                                    unitSuffix: isMoneyField
                                      ? `${currency.code} / month`
                                      : isDurationField
                                        ? "weeks"
                                        : "hrs / week",
                                    placeholder: "0",
                                  }}
                                />
                              );
                            }

                            /* ── Long-form fields → route to worksheet ── */
                            return (
                              <CanvasCard
                                key={section.key}
                                title={section.title}
                                description={filled ? undefined : getSectionEmptyState(section.key)}
                                state={opState}
                                actionLabel="Edit"
                              >
                                {filled && <FieldValue value={rawValue} />}
                              </CanvasCard>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </section>
          </CanvasTabPanel>

          {/* ═══ Business model layer ═══════════════════════════════════ */}
          <CanvasTabPanel id="business">
            <section className="space-y-6">
              <div>
                <h3 className="font-[Manrope] text-2xl font-bold tracking-tight">Business model canvas</h3>
                <p className="mt-2 text-sm text-ink-500">
                  These sections are populated from worksheets across Chapters 2–13. Each card links directly
                  to the specific step if you need to fill or update it.
                </p>
              </div>

              {/* ── Idea-scope banner ── */}
              <div
                className={`rounded-[1.25rem] p-5 ring-1 ${
                  chosenIdea
                    ? "bg-surface-raised ring-[rgba(212,222,227,0.4)]"
                    : "bg-amber-100 ring-amber-100"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className={`text-[10px] font-bold uppercase tracking-[0.18em] ${
                      chosenIdea ? "text-cobalt-600" : "text-[#7a4b00]"
                    }`}>
                      {chosenIdea ? "Anchored on idea" : "No chosen idea yet"}
                    </p>
                    <p className={`mt-2 text-sm leading-6 ${
                      chosenIdea ? "text-ink-900" : "text-[#7a4b00]"
                    }`}>
                      {chosenIdea ? (
                        <>This business model view is built around <strong>{chosenIdea}</strong>. Change your chosen idea in Chapter 5 and this canvas will update.</>
                      ) : (
                        <>Several sections of the business model depend on picking a specific idea. Until you choose one in Chapter 5, parts of this canvas will stay empty or generic.</>
                      )}
                    </p>
                  </div>
                  <Link
                    href={
                      fieldStepIndex.chosen_idea
                        ? `/chapter/${fieldStepIndex.chosen_idea.chapterSlug}/steps?step=${fieldStepIndex.chosen_idea.stepId}`
                        : "/program"
                    }
                    className={`inline-flex shrink-0 items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold ${
                      chosenIdea
                        ? "bg-white text-cobalt-600 ring-1 ring-[rgba(212,222,227,0.4)]"
                        : "bg-white text-[#7a4b00] ring-1 ring-amber-100"
                    }`}
                  >
                    {chosenIdea ? "Change chosen idea" : "Pick a chosen idea"} →
                  </Link>
                </div>
              </div>

              {/* canvas-grid: inherits the 1180px width from LearnerShell's contentWidth prop */}
              <div className="canvas-grid">
                {canvasSections.map((section) => {
                  const isCostStructure = section.id === "cost_structure";
                  const isRevenueStreams = section.id === "revenue_streams";
                  const hasEconomics    = isCostStructure && chosenIdeaEconomics !== null;
                  const hasRevenueEconomics = isRevenueStreams && chosenIdeaEconomics !== null;

                  /* Area + variant from the section config map */
                  const cfg = SECTION_CONFIG[section.id] ?? { area: "prob", variant: "tall" as CardVariant };

                  const editHref = getSectionEditHref(
                    section.fields,
                    section.chapterHref,
                    fieldStepIndex,
                  );

                  const sectionState = getSectionState({
                    filledCount: section.filledCount,
                    totalCount:  section.fields.length,
                    editHref,
                    sourceLabel: section.chapterLabel,
                  });

                  const subFields: SubField[] = section.fieldData.map((f) => ({
                    label: f.label,
                    value: f.filled ? (f.value ?? null) : null,
                    fieldKey:    f.key,
                    worksheetId: FIELD_WORKSHEET_MAP[f.key],
                  }));
                  const calculatedEconomics = chosenIdeaEconomics
                    ? calculateUnitEconomics(chosenIdeaEconomics as Record<string, string | undefined>)
                    : null;
                  const calculatedMargin = calculatedEconomics
                    ? formatCalculatedMoney(calculatedEconomics.margin, currency.symbol)
                    : null;
                  const calculatedPrice = calculatedEconomics
                    ? formatCalculatedMoney(calculatedEconomics.sellingPrice, currency.symbol)
                    : null;
                  const actualProfitPerSale = formatCalculatedMoney(
                    chosenIdeaMetrics.actualProfitPerSale,
                    currency.symbol,
                  );
                  const actualRevenuePerOrder = formatCalculatedMoney(
                    chosenIdeaMetrics.actualRevenuePerOrder,
                    currency.symbol,
                  );

                  /* Cost structure gets unit-economics block as children */
                  const costEconomicsBlock =
                    isCostStructure && chosenIdeaEconomics ? (
                      <div className="rounded-[0.75rem] bg-surface-sunken p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#5b48d6]">
                          {chosenIdeaEconomics.idea_name
                            ? `Unit costs: ${
                                chosenIdeaEconomics.idea_name.length > 30
                                  ? chosenIdeaEconomics.idea_name.slice(0, 30) + "…"
                                  : chosenIdeaEconomics.idea_name
                              }`
                            : "Unit costs"}
                        </p>
                        <dl className="mt-2 space-y-1">
                          {(
                            [
                              { key: "product_cost",         label: "Product cost" },
                              { key: "shipping_to_customer", label: "Shipping" },
                              { key: "platform_fees",        label: "Platform fees" },
                            ] as const
                          )
                            .filter(({ key }) =>
                              normalizeText(
                                (chosenIdeaEconomics as Record<string, string | undefined>)[key],
                              ),
                            )
                            .map(({ key, label }) => (
                              <div key={key} className="flex items-baseline justify-between gap-2">
                                <dt className="text-xs text-ink-500">{label}</dt>
                                <dd className="text-xs font-semibold text-ink-900">
                                  {(chosenIdeaEconomics as Record<string, string | undefined>)[key]}
                                </dd>
                              </div>
                            ))}
                          {calculatedMargin ? (
                            <div className="flex items-baseline justify-between gap-2">
                              <dt className="text-xs text-ink-500">Margin / unit</dt>
                              <dd className="text-xs font-semibold text-ink-900">
                                {calculatedMargin}
                              </dd>
                            </div>
                          ) : null}
                        </dl>
                      </div>
                    ) : null;

                  const revenueEconomicsBlock =
                    isRevenueStreams && chosenIdeaEconomics ? (
                      <div className="rounded-[0.75rem] bg-surface-sunken p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#5b48d6]">
                          Projected vs actual
                        </p>
                        <dl className="mt-2 space-y-1">
                          {calculatedPrice ? (
                            <div className="flex items-baseline justify-between gap-2">
                              <dt className="text-xs text-ink-500">Planned price</dt>
                              <dd className="text-xs font-semibold text-ink-900">{calculatedPrice}</dd>
                            </div>
                          ) : null}
                          {calculatedMargin ? (
                            <div className="flex items-baseline justify-between gap-2">
                              <dt className="text-xs text-ink-500">Projected margin</dt>
                              <dd className="text-xs font-semibold text-ink-900">{calculatedMargin}</dd>
                            </div>
                          ) : null}
                          {actualProfitPerSale ? (
                            <div className="flex items-baseline justify-between gap-2">
                              <dt className="text-xs text-ink-500">Actual profit / sale</dt>
                              <dd className="text-xs font-semibold text-ink-900">{actualProfitPerSale}</dd>
                            </div>
                          ) : null}
                          {actualRevenuePerOrder ? (
                            <div className="flex items-baseline justify-between gap-2">
                              <dt className="text-xs text-ink-500">Actual revenue / order</dt>
                              <dd className="text-xs font-semibold text-ink-900">{actualRevenuePerOrder}</dd>
                            </div>
                          ) : null}
                        </dl>
                        {chosenIdeaMetrics.latestMetricDate ? (
                          <p className="mt-2 text-[11px] leading-5 text-ink-500">
                            Latest linked metric: {chosenIdeaMetrics.latestMetricDate}
                            {chosenIdeaMetrics.latestOrders !== null ? ` · ${chosenIdeaMetrics.latestOrders} orders` : ""}
                          </p>
                        ) : (
                          <p className="mt-2 text-[11px] leading-5 text-ink-500">
                            Link marketplace or store metrics to this idea to compare actuals.
                          </p>
                        )}
                      </div>
                    ) : null;

                  return (
                    <BusinessModelCard
                      key={section.id}
                      sectionId={section.id}
                      title={section.title}
                      description={section.description}
                      state={sectionState}
                      subFields={section.hasSomeData || hasEconomics || hasRevenueEconomics ? subFields : undefined}
                      variant={cfg.variant}
                      className={`area-${cfg.area}`}
                    >
                      {costEconomicsBlock}
                      {revenueEconomicsBlock}
                    </BusinessModelCard>
                  );
                })}
              </div>{/* canvas-grid */}
            </section>
          </CanvasTabPanel>

        </CanvasTabs>

        {/* ── About this page ── */}
        <details className="group rounded-[1.75rem] bg-surface-sunken p-6">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold text-ink-900">
            <span>About this page</span>
            <span className="text-xs text-ink-300 group-open:hidden">Open</span>
            <span className="hidden text-xs text-ink-300 group-open:inline">Close</span>
          </summary>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-[1.5rem] bg-surface-raised border border-ink-100 shadow-card p-6">
              <Eyebrow>Current payoff</Eyebrow>
              <p className="mt-3 text-sm leading-7 text-ink-900">{getCompletionSummary(operatingFilledCount)}</p>
            </div>
            <div className="rounded-[1.5rem] bg-surface-raised border border-ink-100 shadow-card p-6">
              <Eyebrow>What this helps with</Eyebrow>
              <p className="mt-3 text-sm leading-7 text-ink-900">
                Use it to judge whether the current idea fits your real limits, signals, and stop rules, and to see how your business model is taking shape.
              </p>
            </div>
            <div className="rounded-[1.5rem] bg-surface-raised border border-ink-100 shadow-card p-6">
              <Eyebrow>How it fills in</Eyebrow>
              <p className="mt-3 text-sm leading-7 text-ink-900">
                Each chapter&apos;s worksheet contributes to a different section. The canvas grows as you complete each chapter.
              </p>
            </div>
          </div>
          {!authenticated && (
            <Panel className="mt-6 bg-amber-100">
              <Eyebrow>Nothing to show yet</Eyebrow>
              <p className="mt-3 text-sm leading-7 text-[#7a4b00]">
                Your Lean Canvas becomes useful after you complete the Founder Rules Sheet. Right now there is no saved worksheet data to turn into an operating model.
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <PrimaryButton href="/chapter/set-your-founder-rules/worksheet">Complete Founder Rules Sheet</PrimaryButton>
                <SecondaryButton href="/chapter/set-your-founder-rules">Back to Chapter 4</SecondaryButton>
              </div>
            </Panel>
          )}
        </details>
      </div>
    </LearnerShell>
  );
}
