export type UnitEconomicsIdeaRow = Record<string, string | undefined>;

export type IdeaReviewLabel =
  | "Strongest first test"
  | "Good margin, low complexity"
  | "Promising but risky"
  | "Needs better numbers"
  | "Margin too thin"
  | "Operationally complex";

export type IdeaReview = {
  ideaName: string;
  label: IdeaReviewLabel;
  score: number;
  sellingPrice: number | null;
  margin: number | null;
  marginPercent: number | null;
  missingNumbers: boolean;
  strengths: string[];
  cautions: string[];
  nextStep: string;
};

function parseMoney(value: string | undefined): number | null {
  if (!value) return null;
  const cleaned = value.replace(/[^0-9.\-]/g, "");
  if (!cleaned) return null;
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseFee(value: string | undefined, sellingPrice: number): number | null {
  if (!value) return null;
  const parsed = parseMoney(value);
  if (parsed === null) return null;
  return value.includes("%") ? sellingPrice * (parsed / 100) : parsed;
}

function optionIncludes(value: string | undefined, needle: string): boolean {
  return (value ?? "").toLowerCase().includes(needle.toLowerCase());
}

export function calculateUnitEconomics(row: UnitEconomicsIdeaRow): {
  sellingPrice: number | null;
  margin: number | null;
  marginPercent: number | null;
  missingNumbers: boolean;
} {
  const sellingPrice = parseMoney(row.selling_price);
  const productCost = parseMoney(row.product_cost);
  const shippingToCustomer = parseMoney(row.shipping_to_customer);

  if (sellingPrice === null || productCost === null || shippingToCustomer === null) {
    return { sellingPrice, margin: null, marginPercent: null, missingNumbers: true };
  }

  const platformFee = parseFee(row.platform_fees, sellingPrice);
  if (platformFee === null) {
    return { sellingPrice, margin: null, marginPercent: null, missingNumbers: true };
  }

  const margin = sellingPrice - productCost - shippingToCustomer - platformFee;
  return {
    sellingPrice,
    margin,
    marginPercent: sellingPrice > 0 ? (margin / sellingPrice) * 100 : null,
    missingNumbers: false,
  };
}

function reviewIdea(row: UnitEconomicsIdeaRow, index: number): IdeaReview {
  const ideaName = (row.idea_name ?? "").trim() || `Idea ${index + 1}`;
  const strengths: string[] = [];
  const cautions: string[] = [];
  let score = 0;

  const economics = calculateUnitEconomics(row);
  const { marginPercent, missingNumbers } = economics;

  if (missingNumbers) {
    cautions.push("Some core numbers are missing, so the recommendation is provisional.");
    score -= 30;
  } else if (marginPercent !== null && marginPercent >= 40) {
    strengths.push("Margin looks strong enough to leave room for fees, mistakes, and testing.");
    score += 35;
  } else if (marginPercent !== null && marginPercent >= 25) {
    strengths.push("Margin looks workable, but it needs careful control.");
    score += 20;
  } else if (marginPercent !== null && marginPercent >= 10) {
    cautions.push("Margin is thin. A small cost increase or return could remove most of the profit.");
    score -= 20;
  } else {
    cautions.push("Margin appears too thin for a calm first test.");
    score -= 45;
  }

  if (optionIncludes(row.variant_complexity, "1 SKU")) {
    strengths.push("Operationally simple: one SKU is easier to source, list, and manage.");
    score += 20;
  } else if (optionIncludes(row.variant_complexity, "2") || optionIncludes(row.variant_complexity, "5")) {
    score += 5;
  } else if (optionIncludes(row.variant_complexity, "6") || optionIncludes(row.variant_complexity, "15")) {
    cautions.push("Several variants may make stock and fulfilment harder than a first test needs to be.");
    score -= 15;
  } else if (optionIncludes(row.variant_complexity, "16+")) {
    cautions.push("Variant complexity is high. This could become expensive before you learn much.");
    score -= 30;
  }

  if (optionIncludes(row.upfront_cost_risk, "Low")) {
    strengths.push("Low upfront risk makes this safer to test.");
    score += 20;
  } else if (optionIncludes(row.upfront_cost_risk, "Medium")) {
    score += 5;
  } else if (optionIncludes(row.upfront_cost_risk, "High")) {
    cautions.push("Upfront cost risk is high. Be careful before committing to stock.");
    score -= 25;
  } else if (optionIncludes(row.upfront_cost_risk, "Unknown")) {
    cautions.push("Upfront cost risk is unknown. Get supplier numbers before choosing this.");
    score -= 15;
  }

  if (optionIncludes(row.test_speed, "Fast")) {
    strengths.push("Fast to test, which helps you learn quickly.");
    score += 15;
  } else if (optionIncludes(row.test_speed, "Medium")) {
    score += 5;
  } else if (optionIncludes(row.test_speed, "Slow")) {
    cautions.push("Slow to test. That may delay learning and tie up attention.");
    score -= 15;
  } else if (optionIncludes(row.test_speed, "Unknown")) {
    cautions.push("Test speed is unclear.");
    score -= 10;
  }

  if (optionIncludes(row.numbers_confidence, "High")) {
    strengths.push("Numbers are based on real quotes or known fees.");
    score += 15;
  } else if (optionIncludes(row.numbers_confidence, "Medium")) {
    score += 5;
  } else if (optionIncludes(row.numbers_confidence, "Low")) {
    cautions.push("Numbers are mostly guesses. Treat the result as tentative.");
    score -= 15;
  } else if (optionIncludes(row.numbers_confidence, "Unknown")) {
    cautions.push("Key costs are still unknown.");
    score -= 20;
  }

  if (optionIncludes(row.viable, "Yes")) {
    score += 10;
  } else if (optionIncludes(row.viable, "Marginal")) {
    cautions.push("You marked this as marginal, so it may need changes before testing.");
    score -= 10;
  } else if (optionIncludes(row.viable, "No")) {
    cautions.push("You marked this as not viable.");
    score -= 35;
  }

  let label: IdeaReviewLabel = "Promising but risky";
  if (missingNumbers || optionIncludes(row.numbers_confidence, "Unknown")) {
    label = "Needs better numbers";
  } else if ((marginPercent ?? 0) < 10) {
    label = "Margin too thin";
  } else if (optionIncludes(row.variant_complexity, "16+")) {
    label = "Operationally complex";
  } else if (score >= 75) {
    label = "Strongest first test";
  } else if (score >= 55) {
    label = "Good margin, low complexity";
  }

  const nextStep =
    label === "Needs better numbers"
      ? "Get real supplier, shipping, and fee numbers before choosing this idea."
      : label === "Margin too thin"
        ? "Revisit price, supplier cost, shipping, or fees before testing."
        : label === "Operationally complex"
          ? "Look for a simpler first version with fewer variants."
          : label === "Strongest first test"
            ? "This is the strongest candidate to test first, based on the information entered."
            : "Review the cautions, then decide whether this is still the calmest first test.";

  return {
    ideaName,
    label,
    score,
    sellingPrice: economics.sellingPrice,
    margin: economics.margin,
    marginPercent: economics.marginPercent,
    missingNumbers: economics.missingNumbers,
    strengths: strengths.slice(0, 3),
    cautions: cautions.slice(0, 3),
    nextStep,
  };
}

export function reviewUnitEconomicsIdea(row: UnitEconomicsIdeaRow, index = 0): IdeaReview | null {
  if (!Object.values(row).some((value) => (value ?? "").trim().length > 0)) return null;
  return reviewIdea(row, index);
}

export function reviewUnitEconomicsIdeas(rows: UnitEconomicsIdeaRow[]): IdeaReview[] {
  return rows
    .filter((row) => Object.values(row).some((value) => (value ?? "").trim().length > 0))
    .map(reviewIdea)
    .sort((a, b) => b.score - a.score);
}
