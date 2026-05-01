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

export type ProductIdeaLifecycle = {
  ideaId: string;
  label: string;
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
  testMarketplace: string | null;
  testResult: string | null;
  testDecision: string | null;
  unitsSold: string | null;
  testLearning: string | null;
  metricEntries: ProductIdeaMetricEntry[];
  timeline: ProductIdeaTimelineEvent[];
};

export type ProductIdeaMetricEntry = {
  id: string;
  weekEnding: string;
  entryType: "validation" | "live_store";
  summary: string;
};

export type ProductIdeaNextAction = {
  label: string;
  href: string;
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
};

type EconomicsRow = ProductIdeaRow & {
  idea_name?: string;
  viable?: string;
};

type LifecycleResponses = Record<string, string | undefined>;

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

function findEconomicsForIdea(
  economicsRows: EconomicsRow[],
  idea: ProductIdeaRow,
  ideaIndex: number,
): EconomicsRow | null {
  const ideaId = getProductIdeaId(idea, ideaIndex);
  const label = getProductIdeaLabel(idea, ideaIndex);
  return (
    economicsRows.find((row) => normalize(row.idea_id) === ideaId) ??
    economicsRows.find((row) => normalize(row.idea_name) === label) ??
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
        label: "Run the numbers",
        href: "/chapter/know-your-numbers/steps",
        note: "Check margin, costs, and first-test risk before committing.",
      };
    case "economics_checked":
      return {
        label: "Choose candidate",
        href: "/chapter/know-your-numbers/steps",
        note: "Compare the economics and select the idea to test first.",
      };
    case "selected":
      return {
        label: "Plan marketplace test",
        href: "/chapter/test-before-you-build/steps",
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
        href: "/chapter/test-before-you-build/steps",
        note: "Record what happened when the test period ends.",
      };
    case "test_reviewed":
      return {
        label: "Make test decision",
        href: "/chapter/test-before-you-build/steps",
        note: "Choose whether to proceed, adjust and retest, or pivot.",
      };
    case "proceed":
      return {
        label: "Shape the offer",
        href: "/chapter/pick-your-customer/steps",
        note: "Move the validated idea into customer, offer, and store planning.",
      };
    case "retest":
      return {
        label: "Plan retest",
        href: "/chapter/test-before-you-build/steps",
        note: "Adjust the listing, price, or offer and run another evidence loop.",
      };
    case "pivot":
      return {
        label: "Add next idea",
        href: "/chapter/brainstorm-with-discipline/steps",
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
}: {
  idea: ProductIdeaRow;
  label: string;
  economics: EconomicsRow | null;
  isChosen: boolean;
  isTestIdea: boolean;
  responses: LifecycleResponses;
  metricEntries: ProductIdeaMetricEntry[];
}): ProductIdeaTimelineEvent[] {
  const events: ProductIdeaTimelineEvent[] = [
    {
      key: "captured",
      label: "Idea captured",
      detail: normalize(idea.demand_evidence)
        ? "Demand evidence was added in Chapter 3."
        : "Added to the Chapter 3 shortlist.",
      chapter: "Chapter 3",
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
    });
  }

  if (isChosen) {
    events.push({
      key: "selected",
      label: "Selected candidate",
      detail: `${label} was chosen as the strongest candidate to progress.`,
      chapter: "Chapter 5",
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
    });

    if (normalize(responses.result)) {
      events.push({
        key: "test-result",
        label: "Test result recorded",
        detail: normalize(responses.units_sold)
          ? `${responses.result}. Units sold: ${responses.units_sold}.`
          : normalize(responses.result),
        chapter: "Chapter 6",
      });
    }

    if (normalize(responses.decision)) {
      events.push({
        key: "test-decision",
        label: "Next decision made",
        detail: normalize(responses.decision),
        chapter: "Chapter 6",
      });
    }
  }

  for (const entry of metricEntries.slice(0, 4)) {
    events.push({
      key: `metric-${entry.id}`,
      label: entry.entryType === "validation" ? "Marketplace metrics logged" : "Store metrics logged",
      detail: `${entry.weekEnding}: ${entry.summary}.`,
      chapter: entry.entryType === "validation" ? "Metrics" : "Dashboard",
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

function metricsForIdea(metrics: RawMetricEntry[], ideaId: string): ProductIdeaMetricEntry[] {
  return metrics
    .filter((entry) => normalize(entry.data_json.product_idea_id) === ideaId)
    .map((entry) => ({
      id: entry.id,
      weekEnding: entry.week_ending,
      entryType: entry.data_json.entry_type === "validation" ? "validation" : "live_store",
      summary: metricSummary(entry),
    }));
}

export function getProductIdeaLifecycles(
  responses: LifecycleResponses,
  metrics: RawMetricEntry[] = [],
): ProductIdeaLifecycle[] {
  const ideas = ensureProductIdeaIds(parseRows(responses.product_ideas));
  const economicsRows = parseRows(responses.idea_economics) as EconomicsRow[];
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

    return {
      ideaId,
      label,
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
      testMarketplace: isTestIdea ? normalize(responses.test_marketplace) || null : null,
      testResult: isTestIdea ? normalize(responses.result) || null : null,
      testDecision: isTestIdea ? normalize(responses.decision) || null : null,
      unitsSold: isTestIdea ? normalize(responses.units_sold) || null : null,
      testLearning: isTestIdea ? normalize(responses.what_you_learned) || null : null,
      metricEntries,
      timeline: buildTimeline({ idea, label, economics, isChosen, isTestIdea, responses, metricEntries }),
    };
  });
}
