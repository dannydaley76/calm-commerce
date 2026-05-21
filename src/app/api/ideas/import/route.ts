import { NextResponse } from "next/server";
import { getActiveProjectForCurrentUser } from "@/lib/auth/get-active-project";
import { getAccessStateForCurrentUser } from "@/lib/auth/get-access-state";
import {
  buildScannerImportDraft,
  normalizeScannerImportPayload,
  parseScannerImportPayloadParamDetailed,
  sourceLabelForUrl,
  validateScannerImportPayload,
  type ScannerImportDraft,
} from "@/lib/scanner-import";
import { getProductIdeaId } from "@/lib/v2/worksheets/product-idea-identity";
import { canSaveMoreScoutProducts, scoutLimitMessage } from "@/lib/scout-workspace-limits";
import { recordScoutEvent } from "@/lib/scout/events";

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

function parseRows<T extends Record<string, string | undefined>>(raw: string): T[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function nowISO(): string {
  return new Date().toISOString();
}

function scannerVerdictForScore(score: number | undefined): string {
  if (score === undefined) return "";
  if (score >= 70) return "Strong opportunity";
  if (score >= 40) return "Worth investigating";
  return "Hard to make work";
}

function scoreValue(score: number | undefined): string {
  return score === undefined ? "" : String(Math.round(score));
}

function createIdeaId(): string {
  return `idea_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

function valueFor(rows: WorksheetRow[], worksheetId: string, fieldKey: string): string {
  const row = rows.find((item) => item.worksheet_id === worksheetId && item.field_key === fieldKey);
  return typeof row?.value_json === "string" ? row.value_json : String(row?.value_json ?? "");
}

function hasEconomicsDraft(draft: ScannerImportDraft): boolean {
  return [
    draft.productCost,
    draft.shippingToCustomer,
    draft.platformFees,
    draft.sellingPrice,
  ].some((value) => value.trim().length > 0);
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

type ImportIdeaInput = {
  payload?: unknown;
  draft?: ScannerImportDraft;
  updateExistingIdeaId?: string;
  autoUpdateDuplicate?: boolean;
};

function payloadText(input: ImportIdeaInput, key: "sourcePlatform" | "sourceUrl"): string | undefined {
  const payload = input.payload;
  if (!payload || typeof payload !== "object" || !(key in payload)) return undefined;
  const value = (payload as Record<string, unknown>)[key];
  return typeof value === "string" ? value : undefined;
}

type ImportIdeaResult =
  | { ok: true; ideaId: string; ideaHref: string; duplicateUpdated: boolean; authUserId: string }
  | {
      ok: false;
      status: number;
      error: string;
      authUserId?: string;
      code?: string;
      limitMessage?: string;
      duplicate?: boolean;
      ideaId?: string;
      ideaHref?: string;
      ideaTitle?: string;
    };

async function importIdea(input: ImportIdeaInput): Promise<ImportIdeaResult> {
  const { supabase, user, projectId } = await getActiveProjectForCurrentUser();

  if (!user || !projectId) {
    return { ok: false, status: 401, error: "Not authenticated", code: "not_authenticated" };
  }

  const access = await getAccessStateForCurrentUser();
  const normalizedPayload = normalizeScannerImportPayload(input.payload);
  const validation = validateScannerImportPayload(normalizedPayload);
  if (!validation.ok) {
    return { ok: false, status: 400, error: validation.message, code: validation.code, authUserId: user.id };
  }

  const draft = mergeDraftWithPayload(buildScannerImportDraft(normalizedPayload), input.draft);
  const title = draft.productTitle.trim();

  if (!title) {
    return { ok: false, status: 400, error: "Product title is required", authUserId: user.id };
  }

  const { data, error } = await supabase
    .from("worksheet_responses")
    .select("worksheet_id, field_key, value_json")
    .eq("project_id", projectId);

  if (error) throw error;

  const rows = (data ?? []) as WorksheetRow[];
  const productIdeas = parseRows(valueFor(rows, "ideas-worksheet", "product_ideas"));
  const ideaEconomics = parseRows(valueFor(rows, "unit-economics-worksheet", "idea_economics"));
  const sourceUrl = draft.sourceUrl.trim();
  const duplicateIndex = sourceUrl
    ? productIdeas.findIndex((idea) => (idea.source_url ?? "").trim() === sourceUrl)
    : -1;
  const duplicateIdea =
    duplicateIndex >= 0 ? productIdeas[duplicateIndex] : null;
  const duplicateIdeaId =
    duplicateIdea ? getProductIdeaId(duplicateIdea, duplicateIndex) : null;
  const isUpdatingDuplicate =
    !!duplicateIdeaId && (input.updateExistingIdeaId === duplicateIdeaId || input.autoUpdateDuplicate);

  if (duplicateIdeaId && !isUpdatingDuplicate) {
    return {
      ok: false,
      status: 409,
      error: "This product already exists in your ideas.",
      authUserId: user.id,
      duplicate: true,
      ideaId: duplicateIdeaId,
      ideaHref: `/ideas/${encodeURIComponent(duplicateIdeaId)}`,
      ideaTitle: duplicateIdea?.idea_description ?? title,
    };
  }

  if (!isUpdatingDuplicate && !canSaveMoreScoutProducts(productIdeas.length, access)) {
    return {
      ok: false,
      status: 402,
      error: "You have reached your Scout Workspace save limit.",
      authUserId: user.id,
      code: "scout_save_limit",
      limitMessage: scoutLimitMessage(productIdeas.length, access),
    };
  }

  const ideaId = isUpdatingDuplicate && duplicateIdeaId ? duplicateIdeaId : createIdeaId();
  const capturedAt = nowISO();
  const ideaRow = {
    ...(duplicateIdea ?? {}),
    idea_id: ideaId,
    idea_description: title,
    raw_product_title: draft.rawProductTitle,
    product_image_url: draft.productImageUrl,
    source_url: draft.sourceUrl,
    source_label: sourceLabelForUrl(draft.sourceUrl, draft.sourcePlatform || "Source product"),
    source_attribution: "Imported from Scout",
    observed_price: normalizedPayload?.observedPrice ?? "",
    observed_price_type: normalizedPayload?.observedPriceType ?? "",
    observed_rating: normalizedPayload?.observedRating ?? "",
    observed_review_count: normalizedPayload?.observedReviewCount === undefined ? "" : String(normalizedPayload.observedReviewCount),
    observed_order_count: normalizedPayload?.observedOrderCount === undefined ? "" : String(normalizedPayload.observedOrderCount),
    observed_bsr: normalizedPayload?.observedBsr ?? "",
    variant_count: normalizedPayload?.variantCount === undefined ? "" : String(normalizedPayload.variantCount),
    scanner_score: scoreValue(normalizedPayload?.opportunityScore),
    scanner_verdict: scannerVerdictForScore(normalizedPayload?.opportunityScore),
    scanner_confidence_score: scoreValue(normalizedPayload?.confidenceScore),
    missing_signals: normalizedPayload?.missingSignals?.join(", ") ?? "",
    scanner_demand_score: scoreValue(normalizedPayload?.demandScore),
    scanner_competition_score: scoreValue(normalizedPayload?.competitionScore),
    scanner_scored_at: draft.scannedAt,
    scout_captured_at: capturedAt,
    demand_evidence: draft.demandEvidence,
    competition_notes: draft.competitionNotes,
    seasonality: draft.seasonality,
  };

  const nextProductIdeas = isUpdatingDuplicate && duplicateIndex >= 0
    ? [ideaRow, ...productIdeas.filter((_, index) => index !== duplicateIndex)]
    : [ideaRow, ...productIdeas];

  const upserts: UpsertRow[] = [
    {
      project_id: projectId,
      worksheet_id: "ideas-worksheet",
      field_key: "product_ideas",
      value_json: JSON.stringify(nextProductIdeas),
    },
  ];

  if (hasEconomicsDraft(draft)) {
    const economicsIndex = ideaEconomics.findIndex((row) => (row.idea_id ?? "").trim() === ideaId);
    const economicsRow = {
      ...(economicsIndex >= 0 ? ideaEconomics[economicsIndex] : {}),
      idea_id: ideaId,
      idea_name: title,
      product_cost: draft.productCost,
      shipping_to_customer: draft.shippingToCustomer,
      platform_fees: draft.platformFees,
      selling_price: draft.sellingPrice,
      variant_complexity: draft.variantComplexity,
      upfront_cost_risk: draft.upfrontCostRisk,
      test_speed: draft.testSpeed,
      numbers_confidence: draft.numbersConfidence,
    };
    const nextEconomics = economicsIndex >= 0
      ? ideaEconomics.map((row, index) => (index === economicsIndex ? economicsRow : row))
      : [...ideaEconomics, economicsRow];

    upserts.push({
      project_id: projectId,
      worksheet_id: "unit-economics-worksheet",
      field_key: "idea_economics",
      value_json: JSON.stringify(nextEconomics),
    });
  }

  const { error: upsertError } = await supabase
    .from("worksheet_responses")
    .upsert(upserts, { onConflict: "project_id,worksheet_id,field_key" });

  if (upsertError) throw upsertError;

  return {
    ok: true,
    ideaId,
    ideaHref: `/ideas/${encodeURIComponent(ideaId)}`,
    duplicateUpdated: Boolean(isUpdatingDuplicate),
    authUserId: user.id,
  };
}

function workspaceRedirect(request: Request, params: Record<string, string>): NextResponse {
  const url = new URL("/ideas", request.url);
  Object.entries(params).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value);
  });
  return NextResponse.redirect(url);
}

function loginRedirect(request: Request): NextResponse {
  const requestUrl = new URL(request.url);
  const next = `${requestUrl.pathname}${requestUrl.search}`;
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", next);
  return NextResponse.redirect(loginUrl);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const payloadParam = searchParams.get("payload");
    const parsed = parseScannerImportPayloadParamDetailed(payloadParam);
    if (!parsed.ok) {
      return workspaceRedirect(request, { importError: parsed.code });
    }

    const result = await importIdea({
      payload: parsed.payload,
      autoUpdateDuplicate: true,
    });

    if (!result.ok) {
      if (result.status === 401) return loginRedirect(request);
      return workspaceRedirect(request, {
        importError: result.code || "failed",
      });
    }

    return workspaceRedirect(request, {
      imported: result.ideaId,
      importStatus: result.duplicateUpdated ? "updated" : "added",
    });
  } catch {
    return workspaceRedirect(request, { importError: "failed" });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as ImportIdeaInput;
    const result = await importIdea(body);

    if (!result.ok) {
      await recordScoutEvent({
        eventName: "workspace_save_failed",
        authUserId: result.authUserId,
        platform: payloadText(body, "sourcePlatform"),
        pageUrl: payloadText(body, "sourceUrl"),
        metadata: {
          code: result.code ?? null,
          status: result.status,
          duplicate: result.duplicate ?? false,
        },
      });

      return NextResponse.json(
        {
          error: result.error,
          code: result.code,
          limitMessage: result.limitMessage,
          duplicate: result.duplicate,
          ideaId: result.ideaId,
          ideaHref: result.ideaHref,
          ideaTitle: result.ideaTitle,
        },
        { status: result.status },
      );
    }

    await recordScoutEvent({
      eventName: "workspace_save_success",
      authUserId: result.authUserId,
      platform: payloadText(body, "sourcePlatform"),
      pageUrl: payloadText(body, "sourceUrl"),
      metadata: {
        ideaId: result.ideaId,
        duplicateUpdated: result.duplicateUpdated,
      },
    });

    return NextResponse.json({
      ok: true,
      ideaId: result.ideaId,
      ideaHref: result.ideaHref,
      duplicateUpdated: result.duplicateUpdated,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to import idea" },
      { status: 500 },
    );
  }
}
