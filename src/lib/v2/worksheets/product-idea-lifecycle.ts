import {
  ensureProductIdeaIds,
  findProductIdeaByIdOrLabel,
  getProductIdeaId,
  getProductIdeaLabel,
  type ProductIdeaRow,
} from "./product-idea-identity";

export type ProductIdeaLifecycleStatus =
  | "draft"
  | "economics_checked"
  | "selected"
  | "test_planned"
  | "test_running"
  | "test_reviewed"
  | "proceed"
  | "retest"
  | "pivot";

export type ProductIdeaWorkspaceStatus =
  | "new"
  | "reviewing"
  | "shortlist"
  | "testing"
  | "archived";

export type ProductIdeaLifecycle = {
  ideaId: string;
  label: string;
  productImageUrl: string | null;
  sourceUrl: string | null;
  sourceLabel: string | null;
  scannerScore: number | null;
  scannerVerdict: string | null;
  scannerConfidenceScore: number | null;
  scannerDemandScore: number | null;
  scannerCompetitionScore: number | null;
  scannerScoredAt: string | null;
  scoutCapturedAt: string | null;
  workspaceStatus: ProductIdeaWorkspaceStatus;
  workspaceStatusLabel: string;
  archivedAt: string | null;
  status: ProductIdeaLifecycleStatus;
  statusLabel: string;
  latestSignal: string;
  nextAction: ProductIdeaNextAction;
  isChosen: boolean;
  isTestIdea: boolean;
  demandEvidence: string | null;
  competitionNotes: string | null;
  seasonality: string | null;
  economicsDecision: string | null;
  productCost: string | null;
  shippingToCustomer: string | null;
  platformFees: string | null;
  sellingPrice: string | null;
  variantComplexity: string | null;
  numbersConfidence: string | null;
  testMarketplace: string | null;
  testResult: string | null;
  testDecision: string | null;
  unitsSold: string | null;
  testLearning: string | null;
  metricEntries: ProductIdeaMetricEntry[];
  notes: ProductIdeaNote[];
  timeline: ProductIdeaTimelineEvent[];
};

export type ProductIdeaMetricEntry = {
  id: string;
  weekEnding: string;
  entryType: "validation" | "live_store";
  summary: string;
  orders: number | null;
  profitPerSale: number | null;
  revenue: number | null;
  revenuePerOrder: number | null;
};

export type ProductIdeaNextAction = {
  label: string;
  href: string;
  note: string;
};

export type ProductIdeaNote = {
  id: string;
  ideaId: string;
  createdAt: string;
  note: string;
};

type RawMetricEntry = {
  id: string;
  week_ending: string;
  data_json: Record<string, string>;
};

export type ProductIdeaTimelineEvent = {
  key: string;
  label: string;
  detail: string;
  chapter: string;
  href: string;
};

type EconomicsRow = ProductIdeaRow & {
  idea_name?: string;
  viable?: string;
};

type NoteRow = {
  note_id?: string;
  idea_id?: string;
  created_at?: string;
  note?: string;
};

type LifecycleResponses = Record<string, string | undefined>;

const CHAPTER_3_IDEAS_HREF = "/chapter/brainstorm-with-discipline/steps?step=chapter-3-step-4-score-and-shortlist";
const CHAPTER_5_ECONOMICS_HREF = "/chapter/know-your-numbers/steps?step=chapter-5-step-4-score-with-real-numbers";
const CHAPTER_6_PLAN_HREF = "/chapter/test-before-you-build/steps?step=chapter-6-step-1-your-first-sale-and-choose-marketplace";
const CHAPTER_6_RESULTS_HREF = "/chapter/test-before-you-build/steps?step=chapter-6-step-4-read-results-and-decide";
const CHAPTER_7_CUSTOMER_HREF = "/chapter/pick-your-customer/steps?step=chapter-7-step-2-define-niche-customer";

function parseRows(raw: string | undefined): ProductIdeaRow[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalize(value: string | undefined): string {
  return (value ?? "").trim();
}

function scoreNumber(value: string | undefined): number | null {
  const parsed = Number.parseFloat(normalize(value));
  return Number.isFinite(parsed) ? parsed : null;
}

function scoreFromNotes(notes: ProductIdeaNote[]): number | null {
  for (const note of notes) {
    const match = note.note.match(/Scout score:\s*([0-9]+(?:\.[0-9]+)?)\/10/i);
    if (match?.[1]) {
      const parsed = Number.parseFloat(match[1]);
      if (Number.isFinite(parsed)) return Math.round(parsed * 10);
    }
  }
  return null;
}

function scannerVerdictForScore(score: number | null): string | null {
  if (score === null) return null;
  if (score >= 70) return "Strong opportunity";
  if (score >= 40) return "Worth investigating";
  return "Hard to make work";
}

function formatDisplayDate(raw: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const date = new Date(`${raw}T12:00:00`);
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  }
  return raw;
}

function statusLabel(status: ProductIdeaLifecycleStatus): string {
  switch (status) {
    case "draft":
      return "Draft idea";
    case "economics_checked":
      return "Economics checked";
    case "selected":
      return "Selected";
    case "test_planned":
      return "Test planned";
    case "test_running":
      return "Test running";
    case "test_reviewed":
      return "Test reviewed";
    case "proceed":
      return "Proceed";
    case "retest":
      return "Retest";
    case "pivot":
      return "Pivot";
  }
}

function workspaceStatusLabel(status: ProductIdeaWorkspaceStatus): string {
  switch (status) {
    case "new":
      return "New";
    case "reviewing":
      return "Reviewing";
    case "shortlist":
      return "Shortlist";
    case "testing":
      return "Testing";
    case "archived":
      return "Archived";
  }
}

function parseWorkspaceStatus(value: string | undefined): ProductIdeaWorkspaceStatus | null {
  const normalised = normalize(value);
  if (normalised === "captured") return "new";
  if (normalised === "promising") return "shortlist";
  if (normalised === "rejected") return "archived";
  if (
    normalised === "new" ||
    normalised === "reviewing" ||
    normalised === "shortlist" ||
    normalised === "testing" ||
    normalised === "archived"
  ) {
    return normalised;
  }
  return null;
}

function deriveWorkspaceStatus({
  idea,
  lifecycleStatus,
  scannerScore,
}: {
  idea: ProductIdeaRow;
  lifecycleStatus: ProductIdeaLifecycleStatus;
  scannerScore: number | null;
}): ProductIdeaWorkspaceStatus {
  const explicit = parseWorkspaceStatus(idea.scout_workspace_status);
  if (explicit) return explicit;
  if (normalize(idea.archived_at)) return "archived";
  if (
    lifecycleStatus === "test_planned" ||
    lifecycleStatus === "test_running" ||
    lifecycleStatus === "test_reviewed" ||
    lifecycleStatus === "proceed" ||
    lifecycleStatus === "retest"
  ) {
    return "testing";
  }
  if (lifecycleStatus === "pivot") return "archived";
  if (scannerScore !== null && scannerScore >= 70) return "shortlist";
  return "new";
}

function findEconomicsForIdea(
  economicsRows: EconomicsRow[],
  idea: ProductIdeaRow,
  ideaIndex: number,
): EconomicsRow | null {
  const ideaId = getProductIdeaId(idea, ideaIndex);
  const label = getProductIdeaLabel(idea, ideaIndex);
  const legacyRowAtSameIndex = economicsRows[ideaIndex];
  return (
    economicsRows.find((row) => normalize(row.idea_id) === ideaId) ??
    economicsRows.find((row) => normalize(row.idea_name) === label) ??
    (legacyRowAtSameIndex &&
    !normalize(legacyRowAtSameIndex.idea_id) &&
    !normalize(legacyRowAtSameIndex.idea_name)
      ? legacyRowAtSameIndex
      : null) ??
    null
  );
}

function deriveTestStatus(responses: LifecycleResponses): ProductIdeaLifecycleStatus {
  const result = normalize(responses.result);
  const decision = normalize(responses.decision);

  if (decision.startsWith("Proceed")) return "proceed";
  if (decision.startsWith("Iterate")) return "retest";
  if (decision.startsWith("Pivot")) return "pivot";
  if (result && result !== "Still running") return "test_reviewed";
  if (result === "Still running") return "test_running";
  return "test_planned";
}

function deriveLatestSignal({
  status,
  economics,
  responses,
}: {
  status: ProductIdeaLifecycleStatus;
  economics: EconomicsRow | null;
  responses: LifecycleResponses;
}): string {
  if (status === "draft") return "Captured in Chapter 3. Run the numbers when ready.";
  if (status === "economics_checked") {
    return economics?.viable
      ? `Chapter 5 decision: ${economics.viable}.`
      : "Numbers added in Chapter 5.";
  }
  if (status === "selected") return "Chosen after the Chapter 5 economics check.";
  if (status === "test_planned") {
    return responses.test_marketplace
      ? `Marketplace test planned on ${responses.test_marketplace}.`
      : "Selected for a marketplace test.";
  }
  if (status === "test_running") return "Marketplace test is still running.";
  if (status === "test_reviewed") return responses.result ? `Test result: ${responses.result}.` : "Marketplace test reviewed.";
  if (status === "proceed") return "Decision: build the store.";
  if (status === "retest") return "Decision: adjust and retest.";
  return "Decision: try a different product.";
}

function nextActionForStatus(status: ProductIdeaLifecycleStatus): ProductIdeaNextAction {
  switch (status) {
    case "draft":
      return {
        label: "Add economics",
        href: CHAPTER_5_ECONOMICS_HREF,
        note: "Check margin, costs, and first-test risk before committing.",
      };
    case "economics_checked":
      return {
        label: "Review and choose",
        href: CHAPTER_5_ECONOMICS_HREF,
        note: "Compare the economics and select the idea to test first.",
      };
    case "selected":
      return {
        label: "Plan marketplace test",
        href: CHAPTER_6_PLAN_HREF,
        note: "Turn the selected idea into a simple real-world test.",
      };
    case "test_planned":
      return {
        label: "Log test metrics",
        href: "/metrics",
        note: "Track impressions, clicks, and orders while the test is running.",
      };
    case "test_running":
      return {
        label: "Update test results",
        href: CHAPTER_6_RESULTS_HREF,
        note: "Record what happened when the test period ends.",
      };
    case "test_reviewed":
      return {
        label: "Make test decision",
        href: CHAPTER_6_RESULTS_HREF,
        note: "Choose whether to proceed, adjust and retest, or pivot.",
      };
    case "proceed":
      return {
        label: "Define customer",
        href: CHAPTER_7_CUSTOMER_HREF,
        note: "Move the validated idea into customer, offer, and store planning.",
      };
    case "retest":
      return {
        label: "Plan retest",
        href: CHAPTER_6_PLAN_HREF,
        note: "Adjust the listing, price, or offer and run another evidence loop.",
      };
    case "pivot":
      return {
        label: "Add next idea",
        href: CHAPTER_3_IDEAS_HREF,
        note: "Use what you learned to shortlist another candidate.",
      };
  }
}

function buildTimeline({
  idea,
  label,
  economics,
  isChosen,
  isTestIdea,
  responses,
  metricEntries,
  notes,
}: {
  idea: ProductIdeaRow;
  label: string;
  economics: EconomicsRow | null;
  isChosen: boolean;
  isTestIdea: boolean;
  responses: LifecycleResponses;
  metricEntries: ProductIdeaMetricEntry[];
  notes: ProductIdeaNote[];
}): ProductIdeaTimelineEvent[] {
  const events: ProductIdeaTimelineEvent[] = [
    {
      key: "captured",
      label: "Idea captured",
      detail: normalize(idea.demand_evidence)
        ? "Demand evidence was added in Chapter 3."
        : "Added to the Chapter 3 shortlist.",
      chapter: "Chapter 3",
      href: CHAPTER_3_IDEAS_HREF,
    },
  ];

  if (economics) {
    events.push({
      key: "economics",
      label: "Economics checked",
      detail: normalize(economics.viable)
        ? `Decision: ${economics.viable}.`
        : "Unit economics were entered in Chapter 5.",
      chapter: "Chapter 5",
      href: CHAPTER_5_ECONOMICS_HREF,
    });
  }

  if (isChosen) {
    events.push({
      key: "selected",
      label: "Selected candidate",
      detail: `${label} was chosen as the strongest candidate to progress.`,
      chapter: "Chapter 5",
      href: CHAPTER_5_ECONOMICS_HREF,
    });
  }

  if (isTestIdea) {
    events.push({
      key: "test-planned",
      label: "Marketplace test planned",
      detail: normalize(responses.test_marketplace)
        ? `Marketplace: ${responses.test_marketplace}.`
        : "Selected for the Chapter 6 marketplace test.",
      chapter: "Chapter 6",
      href: CHAPTER_6_PLAN_HREF,
    });

    if (normalize(responses.result)) {
      events.push({
        key: "test-result",
        label: "Test result recorded",
        detail: normalize(responses.units_sold)
          ? `${responses.result}. Units sold: ${responses.units_sold}.`
          : normalize(responses.result),
        chapter: "Chapter 6",
        href: CHAPTER_6_RESULTS_HREF,
      });
    }

    if (normalize(responses.decision)) {
      events.push({
        key: "test-decision",
        label: "Next decision made",
        detail: normalize(responses.decision),
        chapter: "Chapter 6",
        href: CHAPTER_6_RESULTS_HREF,
      });
    }
  }

  for (const entry of metricEntries.slice(0, 4)) {
    events.push({
      key: `metric-${entry.id}`,
      label: entry.entryType === "validation" ? "Marketplace metrics logged" : "Store metrics logged",
      detail: `${entry.weekEnding}: ${entry.summary}.`,
      chapter: entry.entryType === "validation" ? "Metrics" : "Dashboard",
      href: entry.entryType === "validation" ? "/metrics" : "/",
    });
  }

  for (const note of notes.slice(0, 4).reverse()) {
    events.push({
      key: `note-${note.id}`,
      label: "Decision note added",
      detail: `${formatDisplayDate(note.createdAt)}: ${note.note}`,
      chapter: "Idea notes",
      href: "#notes",
    });
  }

  return events;
}

function metricSummary(entry: RawMetricEntry): string {
  const data = entry.data_json;
  if (data.entry_type === "validation") {
    const parts = [
      data.impressions ? `${data.impressions} impressions` : "",
      data.listing_clicks ? `${data.listing_clicks} clicks` : "",
      data.orders ? `${data.orders} orders` : "",
    ].filter(Boolean);
    return parts.join(", ") || "validation metrics added";
  }

  const parts = [
    data.revenue ? `${data.revenue} revenue` : "",
    data.orders ? `${data.orders} orders` : "",
    data.traffic ? `${data.traffic} visitors` : "",
  ].filter(Boolean);
  return parts.join(", ") || "store metrics added";
}

function parseMetricNumber(value: string | undefined): number | null {
  if (!value) return null;
  const cleaned = value.replace(/[^0-9.\-]/g, "");
  if (!cleaned) return null;
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function metricsForIdea(metrics: RawMetricEntry[], ideaId: string): ProductIdeaMetricEntry[] {
  return metrics
    .filter((entry) => normalize(entry.data_json.product_idea_id) === ideaId)
    .map((entry) => {
      const entryType = entry.data_json.entry_type === "validation" ? "validation" : "live_store";
      const orders = parseMetricNumber(entry.data_json.orders);
      const revenue = entryType === "live_store" ? parseMetricNumber(entry.data_json.revenue) : null;
      return {
        id: entry.id,
        weekEnding: formatDisplayDate(entry.week_ending),
        entryType,
        summary: metricSummary(entry),
        orders,
        profitPerSale: entryType === "validation" ? parseMetricNumber(entry.data_json.profit_per_sale) : null,
        revenue,
        revenuePerOrder: revenue !== null && orders !== null && orders > 0 ? revenue / orders : null,
      };
    });
}

function notesForIdea(notes: NoteRow[], ideaId: string): ProductIdeaNote[] {
  return notes
    .filter((note) => normalize(note.idea_id) === ideaId && normalize(note.note))
    .map((note, index) => ({
      id: normalize(note.note_id) || `note-${index}`,
      ideaId,
      createdAt: normalize(note.created_at) || "Undated",
      note: normalize(note.note),
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getProductIdeaLifecycles(
  responses: LifecycleResponses,
  metrics: RawMetricEntry[] = [],
): ProductIdeaLifecycle[] {
  const ideas = ensureProductIdeaIds(parseRows(responses.product_ideas));
  const economicsRows = parseRows(responses.idea_economics) as EconomicsRow[];
  const noteRows = parseRows(responses.product_idea_notes) as NoteRow[];
  const chosenIdea = findProductIdeaByIdOrLabel(ideas, responses.chosen_idea);
  const testIdea = findProductIdeaByIdOrLabel(ideas, responses.test_idea);

  return ideas.map((idea, index) => {
    const ideaId = getProductIdeaId(idea, index);
    const label = getProductIdeaLabel(idea, index);
    const economics = findEconomicsForIdea(economicsRows, idea, index);
    const isChosen = chosenIdea ? getProductIdeaId(chosenIdea, ideas.indexOf(chosenIdea)) === ideaId : false;
    const isTestIdea = testIdea ? getProductIdeaId(testIdea, ideas.indexOf(testIdea)) === ideaId : false;

    let status: ProductIdeaLifecycleStatus = "draft";
    if (economics) status = "economics_checked";
    if (isChosen) status = "selected";
    if (isTestIdea) status = deriveTestStatus(responses);
    const metricEntries = metricsForIdea(metrics, ideaId);
    const notes = notesForIdea(noteRows, ideaId);
    const scannerScore = scoreNumber(idea.scanner_score) ?? scoreFromNotes(notes);

    return {
      ideaId,
      label,
      productImageUrl: normalize(idea.product_image_url) || null,
      sourceUrl: normalize(idea.source_url) || null,
      sourceLabel: normalize(idea.source_label) || null,
      scannerScore,
      scannerVerdict: normalize(idea.scanner_verdict) || scannerVerdictForScore(scannerScore),
      scannerConfidenceScore: scoreNumber(idea.scanner_confidence_score),
      scannerDemandScore: scoreNumber(idea.scanner_demand_score),
      scannerCompetitionScore: scoreNumber(idea.scanner_competition_score),
      scannerScoredAt: normalize(idea.scanner_scored_at) || null,
      scoutCapturedAt: normalize(idea.scout_captured_at) || normalize(idea.scanner_scored_at) || null,
      workspaceStatus: deriveWorkspaceStatus({ idea, lifecycleStatus: status, scannerScore }),
      workspaceStatusLabel: workspaceStatusLabel(deriveWorkspaceStatus({ idea, lifecycleStatus: status, scannerScore })),
      archivedAt: normalize(idea.archived_at) || null,
      status,
      statusLabel: statusLabel(status),
      latestSignal: deriveLatestSignal({ status, economics, responses }),
      nextAction: nextActionForStatus(status),
      isChosen,
      isTestIdea,
      demandEvidence: normalize(idea.demand_evidence) || null,
      competitionNotes: normalize(idea.competition_notes) || null,
      seasonality: normalize(idea.seasonality) || null,
      economicsDecision: normalize(economics?.viable) || null,
      productCost: normalize(economics?.product_cost) || null,
      shippingToCustomer: normalize(economics?.shipping_to_customer) || null,
      platformFees: normalize(economics?.platform_fees) || null,
      sellingPrice: normalize(economics?.selling_price) || null,
      variantComplexity: normalize(economics?.variant_complexity) || null,
      numbersConfidence: normalize(economics?.numbers_confidence) || null,
      testMarketplace: isTestIdea ? normalize(responses.test_marketplace) || null : null,
      testResult: isTestIdea ? normalize(responses.result) || null : null,
      testDecision: isTestIdea ? normalize(responses.decision) || null : null,
      unitsSold: isTestIdea ? normalize(responses.units_sold) || null : null,
      testLearning: isTestIdea ? normalize(responses.what_you_learned) || null : null,
      metricEntries,
      notes,
      timeline: buildTimeline({ idea, label, economics, isChosen, isTestIdea, responses, metricEntries, notes }),
    };
  });
}
