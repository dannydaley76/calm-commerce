import { NextResponse } from "next/server";
import { getActiveProjectForCurrentUser } from "@/lib/auth/get-active-project";
import { getAccessStateForCurrentUser } from "@/lib/auth/get-access-state";
import {
  buildScannerImportDraft,
  normalizeScannerImportPayload,
  sourceLabelForUrl,
  validateScannerImportPayload,
  type ScannerImportDraft,
} from "@/lib/scanner-import";
import { getProductIdeaId } from "@/lib/v2/worksheets/product-idea-identity";
import { canSaveMoreScoutProducts, scoutLimitMessage } from "@/lib/scout-workspace-limits";

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

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
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

function createNoteId(): string {
  return `note_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
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
    draft.variantComplexity,
    draft.upfrontCostRisk,
    draft.testSpeed,
    draft.numbersConfidence,
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

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      payload?: unknown;
      draft?: ScannerImportDraft;
      updateExistingIdeaId?: string;
    };
    const { supabase, user, projectId } = await getActiveProjectForCurrentUser();

    if (!user || !projectId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const access = await getAccessStateForCurrentUser();
    const normalizedPayload = normalizeScannerImportPayload(body.payload);
    const validation = validateScannerImportPayload(normalizedPayload);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.message, code: validation.code }, { status: 400 });
    }

    const draft = mergeDraftWithPayload(buildScannerImportDraft(normalizedPayload), body.draft);
    const title = draft.productTitle.trim();

    if (!title) {
      return NextResponse.json({ error: "Product title is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("worksheet_responses")
      .select("worksheet_id, field_key, value_json")
      .eq("project_id", projectId);

    if (error) throw error;

    const rows = (data ?? []) as WorksheetRow[];
    const productIdeas = parseRows(valueFor(rows, "ideas-worksheet", "product_ideas"));
    const ideaEconomics = parseRows(valueFor(rows, "unit-economics-worksheet", "idea_economics"));
    const ideaNotes = parseRows(valueFor(rows, "ideas-worksheet", "product_idea_notes"));
    const sourceUrl = draft.sourceUrl.trim();
    const duplicateIndex = sourceUrl
      ? productIdeas.findIndex((idea) => (idea.source_url ?? "").trim() === sourceUrl)
      : -1;
    const duplicateIdea =
      duplicateIndex >= 0 ? productIdeas[duplicateIndex] : null;
    const duplicateIdeaId =
      duplicateIdea ? getProductIdeaId(duplicateIdea, duplicateIndex) : null;
    const isUpdatingDuplicate =
      !!duplicateIdeaId && body.updateExistingIdeaId === duplicateIdeaId;

    if (duplicateIdeaId && !isUpdatingDuplicate) {
      return NextResponse.json(
        {
          error: "This product already exists in your ideas.",
          duplicate: true,
          ideaId: duplicateIdeaId,
          ideaHref: `/ideas/${encodeURIComponent(duplicateIdeaId)}`,
          ideaTitle: duplicateIdea?.idea_description ?? title,
        },
        { status: 409 },
      );
    }

    if (!isUpdatingDuplicate && !canSaveMoreScoutProducts(productIdeas.length, access)) {
      return NextResponse.json(
        {
          error: "You have reached your Scout Workspace save limit.",
          code: "scout_save_limit",
          limitMessage: scoutLimitMessage(productIdeas.length, access),
        },
        { status: 402 },
      );
    }

    const ideaId = isUpdatingDuplicate && duplicateIdeaId ? duplicateIdeaId : createIdeaId();
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
      observed_rating: normalizedPayload?.observedRating ?? "",
      observed_review_count: normalizedPayload?.observedReviewCount === undefined ? "" : String(normalizedPayload.observedReviewCount),
      observed_order_count: normalizedPayload?.observedOrderCount === undefined ? "" : String(normalizedPayload.observedOrderCount),
      observed_bsr: normalizedPayload?.observedBsr ?? "",
      variant_count: normalizedPayload?.variantCount === undefined ? "" : String(normalizedPayload.variantCount),
      scanner_score: scoreValue(normalizedPayload?.opportunityScore),
      scanner_verdict: scannerVerdictForScore(normalizedPayload?.opportunityScore),
      scanner_confidence_score: scoreValue(normalizedPayload?.confidenceScore),
      scanner_demand_score: scoreValue(normalizedPayload?.demandScore),
      scanner_competition_score: scoreValue(normalizedPayload?.competitionScore),
      scanner_scored_at: draft.scannedAt,
      demand_evidence: draft.demandEvidence,
      competition_notes: draft.competitionNotes,
      seasonality: draft.seasonality,
    };

    const nextProductIdeas = isUpdatingDuplicate && duplicateIndex >= 0
      ? productIdeas.map((idea, index) => (index === duplicateIndex ? ideaRow : idea))
      : [...productIdeas, ideaRow];

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

    const sourceLines = [
      `Imported from Scout on ${draft.scannedAt || todayISO()}.`,
      draft.rawProductTitle && draft.rawProductTitle !== title ? `Raw product title: ${draft.rawProductTitle}` : "",
      draft.sourceUrl ? `Source: ${sourceLabelForUrl(draft.sourceUrl, draft.sourcePlatform || "Source product")}` : "",
      draft.notes,
    ].filter(Boolean);

    if (sourceLines.length > 0) {
      upserts.push({
        project_id: projectId,
        worksheet_id: "ideas-worksheet",
        field_key: "product_idea_notes",
        value_json: JSON.stringify([
          {
            note_id: createNoteId(),
            idea_id: ideaId,
            created_at: todayISO(),
            note: sourceLines.join("\n"),
          },
          ...ideaNotes,
        ]),
      });
    }

    const { error: upsertError } = await supabase
      .from("worksheet_responses")
      .upsert(upserts, { onConflict: "project_id,worksheet_id,field_key" });

    if (upsertError) throw upsertError;

    return NextResponse.json({
      ok: true,
      ideaId,
      ideaHref: `/ideas/${encodeURIComponent(ideaId)}`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to import idea" },
      { status: 500 },
    );
  }
}
