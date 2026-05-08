import { NextResponse } from "next/server";
import { getActiveProjectForCurrentUser } from "@/lib/auth/get-active-project";
import {
  buildScannerImportDraft,
  normalizeScannerImportPayload,
  sourceLabelForUrl,
  type ScannerImportDraft,
} from "@/lib/scanner-import";

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
    };
    const { supabase, user, projectId } = await getActiveProjectForCurrentUser();

    if (!user || !projectId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const normalizedPayload = normalizeScannerImportPayload(body.payload);
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
    const ideaId = createIdeaId();
    const productIdeas = parseRows(valueFor(rows, "ideas-worksheet", "product_ideas"));
    const ideaEconomics = parseRows(valueFor(rows, "unit-economics-worksheet", "idea_economics"));
    const ideaNotes = parseRows(valueFor(rows, "ideas-worksheet", "product_idea_notes"));

    const nextProductIdeas = [
      ...productIdeas,
      {
        idea_id: ideaId,
        idea_description: title,
        product_image_url: draft.productImageUrl,
        source_url: draft.sourceUrl,
        source_label: sourceLabelForUrl(draft.sourceUrl, draft.sourcePlatform || "Source product"),
        demand_evidence: draft.demandEvidence,
        competition_notes: draft.competitionNotes,
        seasonality: draft.seasonality,
      },
    ];

    const upserts: UpsertRow[] = [
      {
        project_id: projectId,
        worksheet_id: "ideas-worksheet",
        field_key: "product_ideas",
        value_json: JSON.stringify(nextProductIdeas),
      },
    ];

    if (hasEconomicsDraft(draft)) {
      upserts.push({
        project_id: projectId,
        worksheet_id: "unit-economics-worksheet",
        field_key: "idea_economics",
        value_json: JSON.stringify([
          ...ideaEconomics,
          {
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
          },
        ]),
      });
    }

    const sourceLines = [
      `Imported from ${draft.sourcePlatform || "scanner"} on ${draft.scannedAt || todayISO()}.`,
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
