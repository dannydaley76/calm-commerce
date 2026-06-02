import { createHash } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import type { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import {
  buildScannerImportDraft,
  normalizeScannerImportPayload,
  sourceLabelForUrl,
  type ScannerImportDraft,
  type ScannerImportPayload,
} from "@/lib/scanner-import";
import { ensureProductIdeaIds, getProductIdeaId, type ProductIdeaRow } from "@/lib/v2/worksheets/product-idea-identity";

const MAX_ANONYMOUS_PRODUCTS = 10;
const TOKEN_MIN_LENGTH = 32;
const TOKEN_MAX_LENGTH = 256;

export type AnonymousWorkspaceInput = {
  payload: ScannerImportPayload;
  draft?: ScannerImportDraft;
  workspaceToken?: string;
  anonymousId?: string;
  extensionId?: string;
};

export type AnonymousWorkspaceResult =
  | {
      ok: true;
      productId: string;
      productTitle: string;
      duplicateUpdated: boolean;
      anonymousId?: string;
      extensionId?: string;
    }
  | {
      ok: false;
      status: number;
      error: string;
      code: string;
      limitMessage?: string;
      anonymousId?: string;
      extensionId?: string;
    };

export type AnonymousScoutProduct = {
  id: string;
  sourceUrl: string;
  sourcePlatform: string | null;
  productTitle: string;
  productImageUrl: string | null;
  scannerScore: number | null;
  payload: ScannerImportPayload | null;
  draft: Partial<ScannerImportDraft> | null;
  createdAt: string;
  updatedAt: string;
};

export type AnonymousWorkspaceReadResult =
  | {
      ok: true;
      workspaceId: string;
      products: AnonymousScoutProduct[];
      limit: number;
      remaining: number;
      claimed: boolean;
    }
  | {
      ok: false;
      status: number;
      error: string;
      code: string;
    };

export type AnonymousWorkspaceClaimResult =
  | {
      ok: true;
      claimedCount: number;
      skippedCount: number;
      ideaIds: string[];
    }
  | {
      ok: false;
      status: number;
      error: string;
      code: string;
    };

type WorksheetRow = {
  worksheet_id: string;
  field_key: string;
  value_json: string | null;
};

type UpsertRow = {
  project_id: string;
  worksheet_id: string;
  field_key: string;
  value_json: string;
};

type WorkspaceRow = {
  id: string;
};

type ProductRow = {
  id: string;
  product_title: string;
  created_at: string;
};

type AnonymousProductRow = {
  id: string;
  source_url: string;
  source_platform: string | null;
  product_title: string;
  product_image_url: string | null;
  scanner_score: number | null;
  payload_json: unknown;
  draft_json: unknown;
  created_at: string;
  updated_at: string;
  claimed_product_idea_id?: string | null;
};

function cleanText(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxLength) : null;
}

export function anonymousScoutWorkspaceEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ANONYMOUS_SCOUT_WORKSPACE !== "false";
}

export function anonymousScoutWorkspaceLimit(): number {
  const parsed = Number.parseInt(process.env.SCOUT_ANONYMOUS_WORKSPACE_LIMIT ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : MAX_ANONYMOUS_PRODUCTS;
}

export function workspaceTokenHash(workspaceToken: string): string {
  return createHash("sha256").update(workspaceToken).digest("hex");
}

function validWorkspaceToken(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  return trimmed.length >= TOKEN_MIN_LENGTH && trimmed.length <= TOKEN_MAX_LENGTH;
}

function scoreValue(score: number | undefined): number | null {
  return score === undefined ? null : Math.round(score);
}

function scannerVerdictForScore(score: number | null | undefined): string {
  if (score === null || score === undefined) return "";
  if (score >= 70) return "Strong opportunity";
  if (score >= 40) return "Worth investigating";
  return "Hard to make work";
}

function parseRows<T extends Record<string, string | undefined>>(raw: string): T[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function valueFor(rows: WorksheetRow[], worksheetId: string, fieldKey: string): string {
  const row = rows.find((item) => item.worksheet_id === worksheetId && item.field_key === fieldKey);
  return typeof row?.value_json === "string" ? row.value_json : String(row?.value_json ?? "");
}

function createIdeaId(): string {
  return `idea_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function draftFromUnknown(value: unknown): Partial<ScannerImportDraft> | null {
  if (!isRecord(value)) return null;
  return value as Partial<ScannerImportDraft>;
}

function productFromRow(row: AnonymousProductRow): AnonymousScoutProduct {
  return {
    id: row.id,
    sourceUrl: row.source_url,
    sourcePlatform: row.source_platform,
    productTitle: row.product_title,
    productImageUrl: row.product_image_url,
    scannerScore: row.scanner_score,
    payload: normalizeScannerImportPayload(row.payload_json),
    draft: draftFromUnknown(row.draft_json),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function findWorkspace(workspaceToken: unknown): Promise<WorkspaceRow | null> {
  if (!validWorkspaceToken(workspaceToken)) return null;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("anonymous_scout_workspaces")
    .select("id")
    .eq("workspace_token_hash", workspaceTokenHash(workspaceToken))
    .maybeSingle<WorkspaceRow>();

  if (error) throw error;
  return data ?? null;
}

function mergeDraftWithPayload(
  payloadDraft: ScannerImportDraft,
  requestDraft: ScannerImportDraft | undefined,
): ScannerImportDraft {
  if (!requestDraft) return payloadDraft;
  return Object.fromEntries(
    (Object.keys(payloadDraft) as Array<keyof ScannerImportDraft>).map((key) => [
      key,
      requestDraft[key]?.trim() ? requestDraft[key] : payloadDraft[key],
    ]),
  ) as ScannerImportDraft;
}

export async function saveAnonymousScoutProduct(
  input: AnonymousWorkspaceInput,
): Promise<AnonymousWorkspaceResult> {
  const anonymousId = cleanText(input.anonymousId, 120) ?? undefined;
  const extensionId = cleanText(input.extensionId, 120) ?? undefined;

  if (!anonymousScoutWorkspaceEnabled()) {
    return {
      ok: false,
      status: 401,
      error: "Anonymous Scout Workspace is not enabled.",
      code: "anonymous_workspace_disabled",
      anonymousId,
      extensionId,
    };
  }

  const workspaceToken = input.workspaceToken?.trim();
  if (!validWorkspaceToken(workspaceToken)) {
    return {
      ok: false,
      status: 400,
      error: "Scout did not include a valid workspace token.",
      code: "invalid_workspace_token",
      anonymousId,
      extensionId,
    };
  }

  const draft = mergeDraftWithPayload(buildScannerImportDraft(input.payload), input.draft);
  const title = draft.productTitle.trim();
  const sourceUrl = draft.sourceUrl.trim();
  if (!title || !sourceUrl) {
    return {
      ok: false,
      status: 400,
      error: "Product title and source URL are required.",
      code: "invalid_payload",
      anonymousId,
      extensionId,
    };
  }

  const supabase = createAdminClient();
  const tokenHash = workspaceTokenHash(workspaceToken);
  const now = new Date().toISOString();

  const { data: workspace, error: workspaceError } = await supabase
    .from("anonymous_scout_workspaces")
    .upsert(
      {
        workspace_token_hash: tokenHash,
        anonymous_id: anonymousId ?? null,
        extension_id: extensionId ?? null,
        last_seen_at: now,
      },
      { onConflict: "workspace_token_hash" },
    )
    .select("id")
    .single<WorkspaceRow>();

  if (workspaceError) throw workspaceError;

  const { data: existingProduct, error: existingError } = await supabase
    .from("anonymous_scout_products")
    .select("id, product_title, created_at")
    .eq("workspace_id", workspace.id)
    .eq("source_url", sourceUrl)
    .maybeSingle<ProductRow>();

  if (existingError) throw existingError;

  if (!existingProduct) {
    const { count, error: countError } = await supabase
      .from("anonymous_scout_products")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspace.id);

    if (countError) throw countError;

    const limit = anonymousScoutWorkspaceLimit();
    if ((count ?? 0) >= limit) {
      return {
        ok: false,
        status: 402,
        error: "You have reached your anonymous Scout Workspace save limit.",
        code: "anonymous_workspace_limit_reached",
        limitMessage: `You can save up to ${limit} products before creating an account.`,
        anonymousId,
        extensionId,
      };
    }
  }

  const productPayload = {
    workspace_id: workspace.id,
    source_url: sourceUrl,
    source_platform: input.payload.sourcePlatform ?? null,
    product_title: title,
    product_image_url: draft.productImageUrl.trim() || null,
    scanner_score: scoreValue(input.payload.opportunityScore),
    payload_json: input.payload,
    draft_json: {
      ...draft,
      sourceLabel: sourceLabelForUrl(draft.sourceUrl, draft.sourcePlatform || "Source product"),
    },
    updated_at: now,
  };

  const { data: product, error: productError } = await supabase
    .from("anonymous_scout_products")
    .upsert(productPayload, { onConflict: "workspace_id,source_url" })
    .select("id, product_title, created_at")
    .single<ProductRow>();

  if (productError) throw productError;

  return {
    ok: true,
    productId: product.id,
    productTitle: product.product_title,
    duplicateUpdated: Boolean(existingProduct),
    anonymousId,
    extensionId,
  };
}

export async function getAnonymousScoutWorkspace(
  workspaceToken: unknown,
): Promise<AnonymousWorkspaceReadResult> {
  if (!validWorkspaceToken(workspaceToken)) {
    return {
      ok: false,
      status: 400,
      error: "Scout did not include a valid workspace token.",
      code: "invalid_workspace_token",
    };
  }

  const workspace = await findWorkspace(workspaceToken);
  if (!workspace) {
    return {
      ok: false,
      status: 404,
      error: "This temporary Scout Workspace was not found.",
      code: "anonymous_workspace_not_found",
    };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("anonymous_scout_products")
    .select("id, source_url, source_platform, product_title, product_image_url, scanner_score, payload_json, draft_json, created_at, updated_at, claimed_product_idea_id")
    .eq("workspace_id", workspace.id)
    .order("updated_at", { ascending: false });

  if (error) throw error;

  const products = ((data ?? []) as AnonymousProductRow[]).map(productFromRow);
  const limit = anonymousScoutWorkspaceLimit();

  return {
    ok: true,
    workspaceId: workspace.id,
    products,
    limit,
    remaining: Math.max(0, limit - products.length),
    claimed: ((data ?? []) as AnonymousProductRow[]).some((row) => Boolean(row.claimed_product_idea_id)),
  };
}

export async function claimAnonymousScoutWorkspace(input: {
  workspaceToken: unknown;
  userSupabase: Awaited<ReturnType<typeof createServerSupabaseClient>>;
  learnerId: string;
  projectId: string;
}): Promise<AnonymousWorkspaceClaimResult> {
  if (!validWorkspaceToken(input.workspaceToken)) {
    return {
      ok: false,
      status: 400,
      error: "Scout did not include a valid workspace token.",
      code: "invalid_workspace_token",
    };
  }

  const workspace = await findWorkspace(input.workspaceToken);
  if (!workspace) {
    return {
      ok: false,
      status: 404,
      error: "This temporary Scout Workspace was not found.",
      code: "anonymous_workspace_not_found",
    };
  }

  const admin = createAdminClient();
  const { data: productRows, error: productError } = await admin
    .from("anonymous_scout_products")
    .select("id, source_url, source_platform, product_title, product_image_url, scanner_score, payload_json, draft_json, created_at, updated_at, claimed_product_idea_id")
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: true });

  if (productError) throw productError;

  const products = ((productRows ?? []) as AnonymousProductRow[]).map(productFromRow);
  if (products.length === 0) {
    return { ok: true, claimedCount: 0, skippedCount: 0, ideaIds: [] };
  }

  const { data: worksheetRows, error: worksheetError } = await input.userSupabase
    .from("worksheet_responses")
    .select("worksheet_id, field_key, value_json")
    .eq("project_id", input.projectId);

  if (worksheetError) throw worksheetError;

  const rows = (worksheetRows ?? []) as WorksheetRow[];
  const existingIdeas = ensureProductIdeaIds(
    parseRows<ProductIdeaRow>(valueFor(rows, "ideas-worksheet", "product_ideas")),
  );
  const ideaEconomics = parseRows(valueFor(rows, "unit-economics-worksheet", "idea_economics"));
  const nextIdeas = [...existingIdeas];
  const nextEconomics = [...ideaEconomics];
  const claimedProductUpdates: Array<{ productId: string; ideaId: string }> = [];
  let skippedCount = 0;

  for (const product of products) {
    const sourceUrl = product.sourceUrl.trim();
    const existingIndex = sourceUrl
      ? nextIdeas.findIndex((idea) => (idea.source_url ?? "").trim() === sourceUrl)
      : -1;
    const draft = product.draft ?? {};
    const payload = product.payload;
    const title = (draft.productTitle ?? product.productTitle).trim();
    const ideaId = existingIndex >= 0 ? getProductIdeaId(nextIdeas[existingIndex], existingIndex) : createIdeaId();

    if (existingIndex >= 0) {
      skippedCount += 1;
      claimedProductUpdates.push({ productId: product.id, ideaId });
      continue;
    }

    nextIdeas.unshift({
      idea_id: ideaId,
      idea_description: title,
      raw_product_title: draft.rawProductTitle ?? product.productTitle,
      product_image_url: draft.productImageUrl ?? product.productImageUrl ?? "",
      source_url: sourceUrl,
      source_label: sourceLabelForUrl(sourceUrl, product.sourcePlatform || "Source product"),
      source_attribution: "Imported from temporary Scout Workspace",
      observed_price: payload?.observedPrice ?? "",
      observed_price_type: payload?.observedPriceType ?? "",
      observed_rating: payload?.observedRating ?? "",
      observed_review_count: payload?.observedReviewCount === undefined ? "" : String(payload.observedReviewCount),
      observed_order_count: payload?.observedOrderCount === undefined ? "" : String(payload.observedOrderCount),
      observed_bsr: payload?.observedBsr ?? "",
      variant_count: payload?.variantCount === undefined ? "" : String(payload.variantCount),
      scanner_score: product.scannerScore === null ? "" : String(product.scannerScore),
      scanner_verdict: scannerVerdictForScore(product.scannerScore),
      scanner_confidence_score: payload?.confidenceScore === undefined ? "" : String(Math.round(payload.confidenceScore)),
      missing_signals: payload?.missingSignals?.join(", ") ?? "",
      scanner_demand_score: payload?.demandScore === undefined ? "" : String(Math.round(payload.demandScore)),
      scanner_competition_score: payload?.competitionScore === undefined ? "" : String(Math.round(payload.competitionScore)),
      scanner_scored_at: draft.scannedAt ?? payload?.scannedAt ?? "",
      scout_captured_at: product.createdAt,
      demand_evidence: draft.demandEvidence ?? payload?.demandEvidence ?? "",
      competition_notes: draft.competitionNotes ?? payload?.competitionNotes ?? "",
      seasonality: draft.seasonality ?? payload?.seasonality ?? "",
      scout_workspace_status: "new",
      market_context_status: "",
      market_context_note: "",
      market_context_requested_at: "",
    });

    if (
      draft.productCost ||
      draft.shippingToCustomer ||
      draft.platformFees ||
      draft.sellingPrice ||
      payload?.estimatedProductCost ||
      payload?.estimatedShippingToCustomer ||
      payload?.platformFees ||
      payload?.estimatedSellingPrice
    ) {
      nextEconomics.push({
        idea_id: ideaId,
        idea_name: title,
        product_cost: draft.productCost ?? payload?.estimatedProductCost ?? "",
        shipping_to_customer: draft.shippingToCustomer ?? payload?.estimatedShippingToCustomer ?? "",
        platform_fees: draft.platformFees ?? payload?.platformFees ?? "",
        selling_price: draft.sellingPrice ?? payload?.estimatedSellingPrice ?? "",
        variant_complexity: draft.variantComplexity ?? payload?.variantComplexity ?? "",
        upfront_cost_risk: draft.upfrontCostRisk ?? payload?.upfrontCostRisk ?? "",
        test_speed: draft.testSpeed ?? payload?.testSpeed ?? "",
        numbers_confidence: draft.numbersConfidence ?? payload?.numbersConfidence ?? "",
      });
    }

    claimedProductUpdates.push({ productId: product.id, ideaId });
  }

  const upserts: UpsertRow[] = [
    {
      project_id: input.projectId,
      worksheet_id: "ideas-worksheet",
      field_key: "product_ideas",
      value_json: JSON.stringify(nextIdeas),
    },
    {
      project_id: input.projectId,
      worksheet_id: "unit-economics-worksheet",
      field_key: "idea_economics",
      value_json: JSON.stringify(nextEconomics),
    },
  ];

  const { error: upsertError } = await input.userSupabase
    .from("worksheet_responses")
    .upsert(upserts, { onConflict: "project_id,worksheet_id,field_key" });

  if (upsertError) throw upsertError;

  const claimedAt = new Date().toISOString();
  await Promise.all(
    claimedProductUpdates.map(({ productId, ideaId }) =>
      admin
        .from("anonymous_scout_products")
        .update({ claimed_product_idea_id: ideaId, claimed_at: claimedAt })
        .eq("id", productId),
    ),
  );

  const { error: workspaceClaimError } = await admin
    .from("anonymous_scout_workspaces")
    .update({ claimed_learner_id: input.learnerId, claimed_at: claimedAt })
    .eq("id", workspace.id);

  if (workspaceClaimError) throw workspaceClaimError;

  return {
    ok: true,
    claimedCount: claimedProductUpdates.length - skippedCount,
    skippedCount,
    ideaIds: claimedProductUpdates.map((update) => update.ideaId),
  };
}
