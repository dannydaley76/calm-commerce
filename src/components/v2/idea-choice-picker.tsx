"use client";

import {
  PRODUCT_ID_FIELD,
  ensureProductIdeaIds,
  getProductIdeaId,
  getProductIdeaLabel,
} from "@/lib/v2/worksheets/product-idea-identity";
import {
  reviewUnitEconomicsIdea,
  type IdeaReview,
} from "@/lib/v2/worksheets/review-unit-economics";

type InstanceRow = Record<string, string>;

type IdeaChoiceOption = {
  id: string;
  label: string;
  review: IdeaReview | null;
};

function parseRows(raw: string | undefined): InstanceRow[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed as InstanceRow[] : [];
  } catch {
    return [];
  }
}

function buildIdeaChoiceOptions(allValues: Record<string, string> | undefined): IdeaChoiceOption[] {
  if (!allValues) return [];
  const sourceRows = ensureProductIdeaIds(parseRows(allValues.product_ideas));
  const economicsRows = parseRows(allValues.idea_economics);

  return sourceRows.map((sourceRow, index) => {
    const id = getProductIdeaId(sourceRow, index);
    const label = getProductIdeaLabel(sourceRow, index);
    const economicsRow =
      economicsRows.find((row) => row[PRODUCT_ID_FIELD] === id) ?? economicsRows[index] ?? {};
    const hydratedRow = {
      ...economicsRow,
      [PRODUCT_ID_FIELD]: id,
      idea_name: (economicsRow.idea_name ?? "").trim() || label,
    };

    return {
      id,
      label,
      review: reviewUnitEconomicsIdea(hydratedRow, index),
    };
  });
}

function formatMoney(value: number | null): string {
  if (value === null) return "Not calculated";
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatMarginPercent(value: number | null): string {
  if (value === null) return "Margin pending";
  return `${Math.round(value)}% margin`;
}

function ideaReviewClasses(label: IdeaReview["label"] | null): string {
  if (label === "Strongest first test" || label === "Good margin, low complexity") {
    return "bg-success-100 text-[#005e3f]";
  }
  if (label === "Needs better numbers" || label === "Promising but risky" || label === null) {
    return "bg-[#fff8e6] text-[#835700]";
  }
  return "bg-[#fff1f1] text-error-700";
}

export function IdeaChoicePicker({
  label,
  helpText,
  value,
  allValues,
  disabled,
  onChange,
  labelSize = "sm",
  required = false,
}: {
  label: string;
  helpText?: string;
  value: string;
  allValues?: Record<string, string>;
  disabled: boolean;
  onChange: (value: string) => void;
  labelSize?: "sm" | "base";
  required?: boolean;
}) {
  const ideaOptions = buildIdeaChoiceOptions(allValues);
  const bestScore = ideaOptions.reduce<number | null>((best, option) => {
    if (!option.review) return best;
    return best === null ? option.review.score : Math.max(best, option.review.score);
  }, null);

  const labelClass =
    labelSize === "base"
      ? "font-[Manrope] text-base font-bold text-ink-900"
      : "block font-[Manrope] text-sm font-semibold text-ink-900";

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <span className={labelClass}>{label}</span>
        {required && (
          <span className="shrink-0 rounded-full bg-[#eef4ff] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-cobalt-600">
            Required
          </span>
        )}
      </div>
      {helpText && (
        <span className="mt-0.5 block text-xs leading-5 text-ink-500">{helpText}</span>
      )}

      {ideaOptions.length > 0 ? (
        <div className="mt-3 space-y-3">
          {ideaOptions.map((option) => {
            const isSelected = value === option.id || value === option.label;
            const isRecommended =
              bestScore !== null && option.review?.score === bestScore && option.review.score > 0;
            const badgeLabel = isRecommended
              ? "Recommended"
              : option.review?.label ?? "Numbers pending";

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onChange(option.id)}
                disabled={disabled}
                aria-pressed={isSelected}
                className={[
                  "w-full rounded-2xl border bg-white p-4 text-left transition",
                  "hover:border-cobalt-600 hover:bg-[#f7f9ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500 focus-visible:ring-offset-2",
                  disabled ? "cursor-not-allowed opacity-60" : "",
                  isSelected ? "border-cobalt-600 ring-2 ring-cobalt-100" : "border-[#e2e6f5]",
                ].join(" ")}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-[Manrope] text-sm font-bold text-ink-900">
                      {option.label}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-ink-500">
                      {option.review
                        ? `${formatMoney(option.review.margin)} per unit · ${formatMarginPercent(option.review.marginPercent)}`
                        : "Add the core numbers above to calculate margin."}
                    </p>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] ${ideaReviewClasses(isRecommended ? "Strongest first test" : option.review?.label ?? null)}`}>
                    {badgeLabel}
                  </span>
                </div>
                {option.review?.nextStep ? (
                  <p className="mt-3 text-xs leading-5 text-ink-500">
                    {option.review.nextStep}
                  </p>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : disabled ? (
        <div className="mt-2 rounded-xl border border-dashed border-ink-100 bg-surface-sunken px-4 py-3 text-sm text-ink-500">
          Loading your shortlisted ideas…
        </div>
      ) : (
        <div className="mt-2 rounded-xl border border-dashed border-ink-100 bg-surface-sunken px-4 py-3 text-sm text-ink-500">
          Add your product ideas in Chapter 3 first. Your shortlisted ideas will appear here as options.
        </div>
      )}
    </div>
  );
}
