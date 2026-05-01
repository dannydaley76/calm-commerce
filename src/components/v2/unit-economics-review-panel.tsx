import {
  reviewUnitEconomicsIdea,
  reviewUnitEconomicsIdeas,
  type IdeaReview,
  type UnitEconomicsIdeaRow,
} from "@/lib/v2/worksheets/review-unit-economics";
import {
  PRODUCT_ID_FIELD,
  ensureProductIdeaIds,
  getProductIdeaId,
} from "@/lib/v2/worksheets/product-idea-identity";

type InstanceRow = Record<string, string>;

function parseRows(rawValue: string): InstanceRow[] {
  try {
    const parsed = JSON.parse(rawValue);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function hydrateLinkedIdeaNames(rawValue: string, allValues: Record<string, string>): UnitEconomicsIdeaRow[] {
  const rows = parseRows(rawValue);
  const sourceRows = ensureProductIdeaIds(parseRows(allValues.product_ideas ?? ""));

  return rows.map((row, index) => ({
    ...row,
    idea_name:
      (row.idea_name ?? "").trim() ||
      (
        sourceRows.find((sourceRow, sourceIndex) =>
          getProductIdeaId(sourceRow, sourceIndex) === row[PRODUCT_ID_FIELD],
        )?.idea_description ?? sourceRows[index]?.idea_description ?? ""
      ).trim() ||
      `Idea ${index + 1}`,
  }));
}

function labelClasses(label: IdeaReview["label"]): string {
  if (label === "Strongest first test" || label === "Good margin, low complexity") {
    return "bg-success-100 text-[#005e3f]";
  }
  if (label === "Needs better numbers" || label === "Promising but risky") {
    return "bg-[#fff8e6] text-[#835700]";
  }
  return "bg-[#fff1f1] text-error-700";
}

function formatCurrency(value: number | null): string {
  if (value === null) return "Not calculated yet";
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPercent(value: number | null): string {
  if (value === null) return "Not calculated yet";
  return `${Math.round(value)}%`;
}

export function UnitEconomicsViabilityCard({
  row,
}: {
  row: UnitEconomicsIdeaRow;
}) {
  const review = reviewUnitEconomicsIdea(row);

  if (!review) {
    return (
      <div className="rounded-xl border border-dashed border-[#bfc4d9] bg-[#fbfcff] px-4 py-3 text-xs leading-5 text-ink-500">
        Add the price, cost, shipping, and fee numbers above. The margin and viability signal will appear here before you make the decision.
      </div>
    );
  }

  const primaryFeedback = review.cautions[0] ?? review.strengths[0] ?? review.nextStep;

  return (
    <div className="rounded-xl border border-[#d9def2] bg-[#fbfcff] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-cobalt-600">
            Economic viability
          </p>
          <p className="mt-1 text-sm font-semibold text-ink-900">
            {review.missingNumbers ? "Needs better numbers" : review.label}
          </p>
        </div>
        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] ${labelClasses(review.label)}`}>
          {review.label}
        </span>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <div className="rounded-lg bg-white px-3 py-2 ring-1 ring-[#eef0f7]">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-500">Margin per unit</p>
          <p className="mt-1 font-[Manrope] text-base font-bold text-ink-900">{formatCurrency(review.margin)}</p>
        </div>
        <div className="rounded-lg bg-white px-3 py-2 ring-1 ring-[#eef0f7]">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-500">Margin percentage</p>
          <p className="mt-1 font-[Manrope] text-base font-bold text-ink-900">{formatPercent(review.marginPercent)}</p>
        </div>
      </div>

      <p className="mt-3 text-xs leading-5 text-ink-500">
        {primaryFeedback} Use this signal before choosing the decision below.
      </p>
    </div>
  );
}

export function UnitEconomicsReviewPanel({
  rawValue,
  allValues,
}: {
  rawValue: string;
  allValues: Record<string, string>;
}) {
  const reviews = reviewUnitEconomicsIdeas(hydrateLinkedIdeaNames(rawValue, allValues));

  if (reviews.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#bfc4d9] bg-white px-5 py-4 text-sm leading-6 text-ink-500">
        Add numbers for at least one idea and this review will highlight the strongest first test.
      </div>
    );
  }

  const recommended = reviews[0];

  return (
    <div className="rounded-2xl border border-[#d9def2] bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-cobalt-600">
            Idea review
          </p>
          <h3 className="mt-2 font-[Manrope] text-lg font-bold text-ink-900">
            Recommended first test: {recommended.ideaName}
          </h3>
        </div>
        <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${labelClasses(recommended.label)}`}>
          {recommended.label}
        </span>
      </div>

      <p className="mt-3 text-sm leading-6 text-ink-500">{recommended.nextStep}</p>

      <div className="mt-5 space-y-3">
        {reviews.map((review) => (
          <div key={review.ideaName} className="rounded-xl border border-[#eef0f7] bg-[#fbfcff] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-[Manrope] text-sm font-bold text-ink-900">{review.ideaName}</p>
              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] ${labelClasses(review.label)}`}>
                {review.label}
              </span>
            </div>
            {review.strengths.length > 0 && (
              <ul className="mt-3 list-disc space-y-1 pl-5 text-xs leading-5 text-[#005e3f]">
                {review.strengths.map((strength) => (
                  <li key={strength}>{strength}</li>
                ))}
              </ul>
            )}
            {review.cautions.length > 0 && (
              <ul className="mt-3 list-disc space-y-1 pl-5 text-xs leading-5 text-[#835700]">
                {review.cautions.map((caution) => (
                  <li key={caution}>{caution}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs leading-5 text-ink-500">
        This is a guide, not an automatic decision. Use it to spot the calmest first test, then make the final choice yourself.
      </p>
    </div>
  );
}
