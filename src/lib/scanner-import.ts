export type ScannerImportPayload = {
  source?: "scanner" | "research_workspace";
  sourcePlatform?: "amazon" | "aliexpress" | "shopify" | "other";
  sourceUrl?: string;
  scannedAt?: string;
  productTitle?: string;
  displayTitle?: string;
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
  rawProductTitle: string;
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

export type ScannerImportPayloadResult =
  | { ok: true; payload: ScannerImportPayload }
  | { ok: false; code: "missing" | "too_large" | "invalid" | "expired"; message: string };

const MAX_IMPORT_PAYLOAD_CHARS = 64000;
const MAX_IMPORT_AGE_DAYS = 30;

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function numberValue(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function firstNumberValue(...values: unknown[]): number | undefined {
  for (const value of values) {
    const parsed = numberValue(value);
    if (parsed !== undefined) return parsed;
  }
  return undefined;
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
  const sourceUrl =
    stringValue(raw.sourceUrl) ||
    stringValue(raw.source_url) ||
    stringValue(raw.pageUrl) ||
    stringValue(raw.page_url) ||
    stringValue(raw.url);
  const productImageUrl =
    stringValue(raw.productImageUrl) ||
    stringValue(raw.product_image_url) ||
    stringValue(raw.imageUrl) ||
    stringValue(raw.image_url) ||
    stringValue(raw.product_image) ||
    stringValue(raw.thumbnail) ||
    stringValue(raw.image);

  return {
    source: source === "scanner" || source === "research_workspace" ? source : undefined,
    sourcePlatform: (
      sourcePlatform === "amazon" ||
      sourcePlatform === "aliexpress" ||
      sourcePlatform === "shopify" ||
      sourcePlatform === "other"
    ) ? sourcePlatform : "other",
    sourceUrl,
    scannedAt: stringValue(raw.scannedAt) || stringValue(raw.scanned_at) || stringValue(raw.scan_timestamp),
    productTitle: stringValue(raw.productTitle),
    displayTitle: stringValue(raw.displayTitle),
    productImageUrl,
    observedPrice: stringValue(raw.observedPrice),
    observedRating: stringValue(raw.observedRating),
    observedReviewCount: numberValue(raw.observedReviewCount),
    observedOrderCount: numberValue(raw.observedOrderCount),
    observedBsr: stringValue(raw.observedBsr),
    variantCount: numberValue(raw.variantCount),
    demandScore: firstNumberValue(raw.demandScore, raw.demand_score),
    competitionScore: firstNumberValue(raw.competitionScore, raw.competition_score),
    opportunityScore: firstNumberValue(raw.opportunityScore, raw.opportunity_score, raw.scanner_score),
    confidenceScore: firstNumberValue(raw.confidenceScore, raw.confidence_score),
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
  const result = parseScannerImportPayloadParamDetailed(value);
  return result.ok ? result.payload : null;
}

function isExpiredScan(scannedAt: string | undefined): boolean {
  if (!scannedAt || !/^\d{4}-\d{2}-\d{2}$/.test(scannedAt)) return false;
  const scanned = new Date(`${scannedAt}T12:00:00Z`).getTime();
  if (!Number.isFinite(scanned)) return false;
  const ageDays = (Date.now() - scanned) / (1000 * 60 * 60 * 24);
  return ageDays > MAX_IMPORT_AGE_DAYS || ageDays < -1;
}

export function validateScannerImportPayload(payload: ScannerImportPayload | null): ScannerImportPayloadResult {
  if (!payload) {
    return {
      ok: false,
      code: "invalid",
      message: "The Scout payload could not be read. Open Scout again and send the product to Calm Commerce once more.",
    };
  }
  if (payload.source !== "scanner") {
    return {
      ok: false,
      code: "invalid",
      message: "This import link was not created by Scout.",
    };
  }
  if (!(payload.displayTitle || payload.productTitle)) {
    return {
      ok: false,
      code: "invalid",
      message: "Scout did not include a product title, so this idea cannot be imported yet.",
    };
  }
  if (!payload.sourceUrl) {
    return {
      ok: false,
      code: "invalid",
      message: "Scout did not include the source product URL, so this idea cannot be matched or imported safely.",
    };
  }
  if (isExpiredScan(payload.scannedAt)) {
    return {
      ok: false,
      code: "expired",
      message: "This Scout import link is too old. Scan the product again so Calm Commerce uses fresh marketplace data.",
    };
  }
  return { ok: true, payload };
}

export function parseScannerImportPayloadParamDetailed(value: string | null | undefined): ScannerImportPayloadResult {
  if (!value) {
    return {
      ok: false,
      code: "missing",
      message: "No Scout payload was provided.",
    };
  }
  if (value.length > MAX_IMPORT_PAYLOAD_CHARS) {
    return {
      ok: false,
      code: "too_large",
      message: "This Scout import is too large to open safely. Try scanning the product again.",
    };
  }
  try {
    const decoded = value.trim().startsWith("{") ? value : decodeBase64Url(value);
    if (decoded.length > MAX_IMPORT_PAYLOAD_CHARS) {
      return {
        ok: false,
        code: "too_large",
        message: "This Scout import is too large to open safely. Try scanning the product again.",
      };
    }
    return validateScannerImportPayload(normalizeScannerImportPayload(JSON.parse(decoded)));
  } catch {
    return {
      ok: false,
      code: "invalid",
      message: "The Scout payload could not be read. Open Scout again and send the product to Calm Commerce once more.",
    };
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
    payload?.confidenceScore !== undefined ? `Signal coverage: ${payload.confidenceScore}/100` : "",
    payload?.missingSignals?.length ? `Missing signals: ${payload.missingSignals.join(", ")}` : "",
  ].filter(Boolean);

  return {
    productTitle: payload?.displayTitle || payload?.productTitle || "",
    rawProductTitle: payload?.productTitle || payload?.displayTitle || "",
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
