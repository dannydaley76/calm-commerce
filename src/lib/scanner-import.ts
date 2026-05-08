export type ScannerImportPayload = {
  source?: "scanner" | "research_workspace";
  sourcePlatform?: "amazon" | "aliexpress" | "shopify" | "other";
  sourceUrl?: string;
  scannedAt?: string;
  productTitle?: string;
  productImageUrl?: string;
  observedPrice?: string;
  observedRating?: string;
  observedReviewCount?: number;
  observedOrderCount?: number;
  observedBsr?: string;
  variantCount?: number;
  demandScore?: number;
  competitionScore?: number;
  opportunityScore?: number;
  confidenceScore?: number;
  missingSignals?: string[];
  demandEvidence?: string;
  competitionNotes?: string;
  differentiationAngle?: string;
  seasonality?: string;
  estimatedProductCost?: string;
  estimatedShippingToCustomer?: string;
  estimatedSellingPrice?: string;
  platformFees?: string;
  variantComplexity?: string;
  upfrontCostRisk?: string;
  testSpeed?: string;
  numbersConfidence?: string;
  notes?: string;
};

export type ScannerImportDraft = {
  productTitle: string;
  productImageUrl: string;
  sourcePlatform: string;
  sourceUrl: string;
  scannedAt: string;
  demandEvidence: string;
  competitionNotes: string;
  seasonality: string;
  productCost: string;
  shippingToCustomer: string;
  platformFees: string;
  sellingPrice: string;
  variantComplexity: string;
  upfrontCostRisk: string;
  testSpeed: string;
  numbersConfidence: string;
  notes: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function numberValue(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function stringArrayValue(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean)
    : [];
}

export function normalizeScannerImportPayload(raw: unknown): ScannerImportPayload | null {
  if (!isRecord(raw)) return null;
  const sourcePlatform = stringValue(raw.sourcePlatform);
  const source = stringValue(raw.source);
  return {
    source: source === "research_workspace" ? "research_workspace" : "scanner",
    sourcePlatform: (
      sourcePlatform === "amazon" ||
      sourcePlatform === "aliexpress" ||
      sourcePlatform === "shopify" ||
      sourcePlatform === "other"
    ) ? sourcePlatform : "other",
    sourceUrl: stringValue(raw.sourceUrl),
    scannedAt: stringValue(raw.scannedAt),
    productTitle: stringValue(raw.productTitle),
    productImageUrl: stringValue(raw.productImageUrl),
    observedPrice: stringValue(raw.observedPrice),
    observedRating: stringValue(raw.observedRating),
    observedReviewCount: numberValue(raw.observedReviewCount),
    observedOrderCount: numberValue(raw.observedOrderCount),
    observedBsr: stringValue(raw.observedBsr),
    variantCount: numberValue(raw.variantCount),
    demandScore: numberValue(raw.demandScore),
    competitionScore: numberValue(raw.competitionScore),
    opportunityScore: numberValue(raw.opportunityScore),
    confidenceScore: numberValue(raw.confidenceScore),
    missingSignals: stringArrayValue(raw.missingSignals),
    demandEvidence: stringValue(raw.demandEvidence),
    competitionNotes: stringValue(raw.competitionNotes),
    differentiationAngle: stringValue(raw.differentiationAngle),
    seasonality: stringValue(raw.seasonality),
    estimatedProductCost: stringValue(raw.estimatedProductCost),
    estimatedShippingToCustomer: stringValue(raw.estimatedShippingToCustomer),
    estimatedSellingPrice: stringValue(raw.estimatedSellingPrice),
    platformFees: stringValue(raw.platformFees),
    variantComplexity: stringValue(raw.variantComplexity),
    upfrontCostRisk: stringValue(raw.upfrontCostRisk),
    testSpeed: stringValue(raw.testSpeed),
    numbersConfidence: stringValue(raw.numbersConfidence),
    notes: stringValue(raw.notes),
  };
}

function decodeBase64Url(value: string): string {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  if (typeof atob === "function") {
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }
  throw new Error("Base64 decoding is unavailable in this runtime.");
}

export function parseScannerImportPayloadParam(value: string | null | undefined): ScannerImportPayload | null {
  if (!value) return null;
  try {
    const decoded = value.trim().startsWith("{") ? value : decodeBase64Url(value);
    return normalizeScannerImportPayload(JSON.parse(decoded));
  } catch {
    return null;
  }
}

function evidenceLine(label: string, value: string | number | undefined): string | null {
  if (value === undefined || value === "") return null;
  return `${label}: ${value}`;
}

export function sourceLabelForUrl(value: string | undefined, fallback = "Source product"): string {
  if (!value) return fallback;
  try {
    const host = new URL(value).hostname.replace(/^www\./, "");
    if (host.includes("aliexpress")) return "AliExpress";
    if (host.includes("amazon")) return "Amazon";
    return host;
  } catch {
    return fallback;
  }
}

export function buildScannerImportDraft(payload: ScannerImportPayload | null): ScannerImportDraft {
  const scannedAt = payload?.scannedAt || new Date().toISOString().slice(0, 10);
  const observed = [
    evidenceLine("Demand score", payload?.demandScore !== undefined ? `${payload.demandScore}/100` : undefined),
    evidenceLine("Observed orders", payload?.observedOrderCount),
    evidenceLine("Observed rating", payload?.observedRating),
    evidenceLine("Observed reviews", payload?.observedReviewCount),
    evidenceLine("Observed BSR", payload?.observedBsr),
    evidenceLine("Source", sourceLabelForUrl(payload?.sourceUrl, payload?.sourcePlatform || "Product page")),
  ].filter((line): line is string => !!line);
  const competition = [
    evidenceLine("Competition score", payload?.competitionScore !== undefined ? `${payload.competitionScore}/100` : undefined),
    payload?.competitionNotes,
  ].filter((line): line is string => !!line);
  const noteParts = [
    payload?.notes,
    payload?.differentiationAngle ? `Differentiation angle: ${payload.differentiationAngle}` : "",
    payload?.confidenceScore !== undefined ? `Confidence score: ${payload.confidenceScore}/100` : "",
    payload?.missingSignals?.length ? `Missing signals: ${payload.missingSignals.join(", ")}` : "",
  ].filter(Boolean);

  return {
    productTitle: payload?.productTitle || "",
    productImageUrl: payload?.productImageUrl || "",
    sourcePlatform: payload?.sourcePlatform || "other",
    sourceUrl: payload?.sourceUrl || "",
    scannedAt,
    demandEvidence: [
      `Scanner import from ${payload?.sourcePlatform || "product page"} on ${scannedAt}.`,
      ...observed,
      payload?.demandEvidence || "",
    ].filter(Boolean).join("\n"),
    competitionNotes: competition.join("\n"),
    seasonality: payload?.seasonality || "",
    productCost: payload?.estimatedProductCost || "",
    shippingToCustomer: payload?.estimatedShippingToCustomer || "",
    platformFees: payload?.platformFees || "",
    sellingPrice: payload?.estimatedSellingPrice || payload?.observedPrice || "",
    variantComplexity: payload?.variantComplexity || (
      payload?.variantCount === undefined
        ? ""
        : payload.variantCount <= 1
          ? "1 SKU: simple"
          : payload.variantCount <= 5
            ? "2-5 SKUs: manageable"
            : payload.variantCount <= 15
              ? "6-15 SKUs: complex"
              : "16+ SKUs: very complex"
    ),
    upfrontCostRisk: payload?.upfrontCostRisk || "",
    testSpeed: payload?.testSpeed || "",
    numbersConfidence: payload?.numbersConfidence || "Low: mostly guesses",
    notes: noteParts.join("\n"),
  };
}
