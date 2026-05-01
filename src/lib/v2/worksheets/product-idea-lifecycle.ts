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
  isChosen: boolean;
  isTestIdea: boolean;
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

export function getProductIdeaLifecycles(responses: LifecycleResponses): ProductIdeaLifecycle[] {
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

    return {
      ideaId,
      label,
      status,
      statusLabel: statusLabel(status),
      latestSignal: deriveLatestSignal({ status, economics, responses }),
      isChosen,
      isTestIdea,
    };
  });
}
