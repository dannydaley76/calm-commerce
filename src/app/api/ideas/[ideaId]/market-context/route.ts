import { NextResponse } from "next/server";
import { getActiveProjectForCurrentUser } from "@/lib/auth/get-active-project";
import { getAccessStateForCurrentUser } from "@/lib/auth/get-access-state";
import { proxyScoutMcp } from "@/lib/scout/mcp-proxy";
import { ensureProductIdeaIds, getProductIdeaId, type ProductIdeaRow } from "@/lib/v2/worksheets/product-idea-identity";

type WorksheetRow = {
  worksheet_id: string;
  field_key: string;
  value_json: string | null;
};

type MarketContextResponse = {
  success?: boolean;
  error?: string;
  data?: {
    trend_direction?: "up" | "stable" | "down" | null;
    google_shopping?: {
      available?: boolean;
      keyword?: string | null;
      productCount?: number | null;
      sellerDomains?: string[];
      priceMin?: number | null;
      priceMedian?: number | null;
      priceMax?: number | null;
      currency?: string | null;
      averageRating?: number | null;
      averageReviews?: number | null;
      notes?: string[];
    };
    decision_signals?: {
      competition_score?: number | null;
      price_spread_score?: number | null;
      confidence_score?: number | null;
      notes?: string[];
    };
  };
};

function parseRows(raw: string | null | undefined): ProductIdeaRow[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ProductIdeaRow[]) : [];
  } catch {
    return [];
  }
}

function valueFor(rows: WorksheetRow[], worksheetId: string, fieldKey: string): string {
  const row = rows.find((item) => item.worksheet_id === worksheetId && item.field_key === fieldKey);
  return typeof row?.value_json === "string" ? row.value_json : String(row?.value_json ?? "");
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function numberValue(value: unknown): string {
  return typeof value === "number" && Number.isFinite(value) ? String(Math.round(value)) : "";
}

function decimalValue(value: unknown): string {
  return typeof value === "number" && Number.isFinite(value) ? String(Math.round(value * 100) / 100) : "";
}

async function mcpJson(response: Response): Promise<MarketContextResponse | null> {
  try {
    return (await response.json()) as MarketContextResponse;
  } catch {
    return null;
  }
}

async function persistIdeas(projectId: string, supabase: Awaited<ReturnType<typeof getActiveProjectForCurrentUser>>["supabase"], rows: ProductIdeaRow[]) {
  return supabase
    .from("worksheet_responses")
    .upsert({
      project_id: projectId,
      worksheet_id: "ideas-worksheet",
      field_key: "product_ideas",
      value_json: JSON.stringify(rows),
    }, { onConflict: "project_id,worksheet_id,field_key" });
}

export async function POST(_request: Request, context: { params: Promise<{ ideaId: string }> }) {
  const { ideaId } = await context.params;
  const { supabase, user, projectId } = await getActiveProjectForCurrentUser();

  if (!user || !projectId) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const access = await getAccessStateForCurrentUser();
  if (!access.canUseResearchWorkspace) {
    return NextResponse.json({ error: "Scout Pro is required for market context." }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("worksheet_responses")
    .select("worksheet_id, field_key, value_json")
    .eq("project_id", projectId);

  if (error) throw error;

  const rows = (data ?? []) as WorksheetRow[];
  const productIdeas = ensureProductIdeaIds(parseRows(valueFor(rows, "ideas-worksheet", "product_ideas")));
  const ideaIndex = productIdeas.findIndex((row, index) => getProductIdeaId(row, index) === ideaId);
  const idea = ideaIndex >= 0 ? productIdeas[ideaIndex] : null;

  if (!idea) {
    return NextResponse.json({ error: "Product idea not found." }, { status: 404 });
  }

  const title = stringValue(idea.raw_product_title) || stringValue(idea.idea_description);
  if (!title) {
    return NextResponse.json({ error: "This product does not have enough title data to check market context." }, { status: 400 });
  }

  const checkedAt = new Date().toISOString();
  const enrichResponse = await proxyScoutMcp("/enrich", {
    title,
    url: stringValue(idea.source_url) || undefined,
    platform: stringValue(idea.source_label).toLowerCase() || undefined,
  });
  const body = await mcpJson(enrichResponse);

  if (!enrichResponse.ok || !body?.success || !body.data) {
    const nextIdeas = productIdeas.map((row, index) =>
      index === ideaIndex
        ? {
            ...row,
            market_context_status: "failed",
            market_context_note: body?.error ?? "Scout could not check market context right now.",
            market_context_checked_at: checkedAt,
          }
        : row,
    );

    const { error: upsertError } = await persistIdeas(projectId, supabase, nextIdeas);
    if (upsertError) throw upsertError;

    return NextResponse.json({ error: "Scout could not check market context right now." }, { status: 502 });
  }

  const shopping = body.data.google_shopping;
  const signals = body.data.decision_signals;
  const notes = [...(shopping?.notes ?? []), ...(signals?.notes ?? [])].filter(Boolean);
  const hasAnyResult = Boolean(
    shopping?.available ||
      body.data.trend_direction ||
      typeof signals?.competition_score === "number" ||
      typeof signals?.price_spread_score === "number",
  );
  const status = hasAnyResult ? "ready" : "failed";

  const nextIdeas = productIdeas.map((row, index) =>
    index === ideaIndex
      ? {
          ...row,
          market_context_status: status,
          market_context_note: notes[0] ?? (status === "ready" ? "Scout Pro market context checked." : "Scout did not find enough wider-market data yet."),
          market_context_checked_at: checkedAt,
          market_context_requested_at: row.market_context_requested_at || checkedAt,
          market_trend_direction: body.data?.trend_direction ?? "",
          market_keyword: shopping?.keyword ?? "",
          market_similar_count: shopping?.productCount === null || shopping?.productCount === undefined ? "" : String(shopping.productCount),
          market_seller_domains: shopping?.sellerDomains?.join(", ") ?? "",
          market_price_min: decimalValue(shopping?.priceMin),
          market_price_median: decimalValue(shopping?.priceMedian),
          market_price_max: decimalValue(shopping?.priceMax),
          market_currency: shopping?.currency ?? "",
          market_average_rating: decimalValue(shopping?.averageRating),
          market_average_reviews: decimalValue(shopping?.averageReviews),
          market_competition_score: numberValue(signals?.competition_score),
          market_price_spread_score: numberValue(signals?.price_spread_score),
          market_confidence_score: numberValue(signals?.confidence_score),
        }
      : row,
  );

  const { error: upsertError } = await persistIdeas(projectId, supabase, nextIdeas);
  if (upsertError) throw upsertError;

  return NextResponse.json({
    ok: true,
    status,
    checkedAt,
    note: nextIdeas[ideaIndex].market_context_note ?? "",
  });
}
