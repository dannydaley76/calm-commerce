import { reviewUnitEconomicsIdeas, type IdeaReview, type UnitEconomicsIdeaRow } from "@/lib/v2/worksheets/review-unit-economics";

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
  const sourceRows = parseRows(allValues.product_ideas ?? "");

  return rows.map((row, index) => ({
    ...row,
    idea_name:
      (row.idea_name ?? "").trim() ||
      (sourceRows[index]?.idea_description ?? "").trim() ||
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
