import { NextResponse } from "next/server";
import { getActiveProjectForCurrentUser } from "@/lib/auth/get-active-project";
import { getAccessStateForCurrentUser } from "@/lib/auth/get-access-state";
import {
  ensureProductIdeaIds,
  getProductIdeaId,
  type ProductIdeaRow,
} from "@/lib/v2/worksheets/product-idea-identity";
import type { ProductIdeaWorkspaceStatus } from "@/lib/v2/worksheets/product-idea-lifecycle";

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

type Action = "set_status" | "archive" | "restore" | "delete" | "update_economics";

const WORKSPACE_STATUSES = new Set<ProductIdeaWorkspaceStatus>([
  "new",
  "reviewing",
  "shortlist",
  "testing",
  "archived",
]);

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

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function normalize(value: string | undefined): string {
  return (value ?? "").trim();
}

function findEconomicsIndex(
  rows: Array<Record<string, string | undefined>>,
  idea: ProductIdeaRow,
  ideaId: string,
): number {
  const byId = rows.findIndex((row) => normalize(row.idea_id) === ideaId);
  if (byId >= 0) return byId;
  const ideaName = normalize(idea.idea_description);
  if (!ideaName) return -1;
  return rows.findIndex((row) => normalize(row.idea_name) === ideaName);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      action?: Action;
      ideaId?: string;
      status?: ProductIdeaWorkspaceStatus;
      sellingPrice?: string;
      productCost?: string;
      shippingToCustomer?: string;
      platformFees?: string;
    };

    const { supabase, user, projectId } = await getActiveProjectForCurrentUser();
    if (!user || !projectId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const access = await getAccessStateForCurrentUser();
    if (!access.authenticated) {
      return NextResponse.json(
        { error: "Sign in to use Scout Workspace." },
        { status: 403 },
      );
    }

    const action = body.action;
    const targetIdeaId = normalize(body.ideaId);
    if (!action || !targetIdeaId) {
      return NextResponse.json({ error: "Missing workspace action or product idea." }, { status: 400 });
    }

    if (action === "set_status" && (!body.status || !WORKSPACE_STATUSES.has(body.status))) {
      return NextResponse.json({ error: "Choose a valid workspace status." }, { status: 400 });
    }

    if (
      action === "update_economics" &&
      body.sellingPrice === undefined &&
      body.productCost === undefined &&
      body.shippingToCustomer === undefined &&
      body.platformFees === undefined
    ) {
      return NextResponse.json({ error: "Add at least one economics value to save." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("worksheet_responses")
      .select("worksheet_id, field_key, value_json")
      .eq("project_id", projectId);

    if (error) throw error;

    const rows = (data ?? []) as WorksheetRow[];
    const productIdeas = ensureProductIdeaIds(
      parseRows<ProductIdeaRow>(valueFor(rows, "ideas-worksheet", "product_ideas")),
    );
    const targetIndex = productIdeas.findIndex((idea, index) => getProductIdeaId(idea, index) === targetIdeaId);
    if (targetIndex < 0) {
      return NextResponse.json({ error: "Product idea not found." }, { status: 404 });
    }

    const upserts: UpsertRow[] = [];

    if (action === "delete") {
      const nextIdeas = productIdeas.filter((_, index) => index !== targetIndex);
      const ideaEconomics = parseRows(valueFor(rows, "unit-economics-worksheet", "idea_economics"));
      const ideaNotes = parseRows(valueFor(rows, "ideas-worksheet", "product_idea_notes"));
      const nextEconomics = ideaEconomics.filter((row) => normalize(row.idea_id) !== targetIdeaId);
      const nextNotes = ideaNotes.filter((row) => normalize(row.idea_id) !== targetIdeaId);
      const chosenIdea = valueFor(rows, "unit-economics-worksheet", "chosen_idea");
      const testIdea = valueFor(rows, "pre-store-test-worksheet", "test_idea");

      upserts.push(
        {
          project_id: projectId,
          worksheet_id: "ideas-worksheet",
          field_key: "product_ideas",
          value_json: JSON.stringify(nextIdeas),
        },
        {
          project_id: projectId,
          worksheet_id: "ideas-worksheet",
          field_key: "product_idea_notes",
          value_json: JSON.stringify(nextNotes),
        },
        {
          project_id: projectId,
          worksheet_id: "unit-economics-worksheet",
          field_key: "idea_economics",
          value_json: JSON.stringify(nextEconomics),
        },
      );

      if (normalize(chosenIdea) === targetIdeaId) {
        upserts.push({
          project_id: projectId,
          worksheet_id: "unit-economics-worksheet",
          field_key: "chosen_idea",
          value_json: "",
        });
      }
      if (normalize(testIdea) === targetIdeaId) {
        upserts.push({
          project_id: projectId,
          worksheet_id: "pre-store-test-worksheet",
          field_key: "test_idea",
          value_json: "",
        });
      }
    } else if (action === "update_economics") {
      const ideaEconomics = parseRows(valueFor(rows, "unit-economics-worksheet", "idea_economics"));
      const economicsIndex = findEconomicsIndex(ideaEconomics, productIdeas[targetIndex], targetIdeaId);
      const existing = economicsIndex >= 0 ? ideaEconomics[economicsIndex] : {};
      const nextRow = {
        ...existing,
        idea_id: targetIdeaId,
        idea_name: normalize(productIdeas[targetIndex].idea_description) || `Idea ${targetIndex + 1}`,
        selling_price: body.sellingPrice === undefined ? existing.selling_price ?? "" : normalize(body.sellingPrice),
        product_cost: body.productCost === undefined ? existing.product_cost ?? "" : normalize(body.productCost),
        shipping_to_customer: body.shippingToCustomer === undefined ? existing.shipping_to_customer ?? "" : normalize(body.shippingToCustomer),
        platform_fees: body.platformFees === undefined ? existing.platform_fees ?? "" : normalize(body.platformFees),
      };
      const nextEconomics = economicsIndex >= 0
        ? ideaEconomics.map((row, index) => (index === economicsIndex ? nextRow : row))
        : [...ideaEconomics, nextRow];

      upserts.push({
        project_id: projectId,
        worksheet_id: "unit-economics-worksheet",
        field_key: "idea_economics",
        value_json: JSON.stringify(nextEconomics),
      });
    } else {
      const nextIdeas = productIdeas.map((idea, index) => {
        if (index !== targetIndex) return idea;
        const nextStatus: ProductIdeaWorkspaceStatus =
          action === "archive" ? "archived" : action === "restore" ? "new" : body.status ?? "new";
        return {
          ...idea,
          scout_workspace_status: nextStatus,
          archived_at: nextStatus === "archived" ? todayISO() : "",
        };
      });

      upserts.push({
        project_id: projectId,
        worksheet_id: "ideas-worksheet",
        field_key: "product_ideas",
        value_json: JSON.stringify(nextIdeas),
      });
    }

    const { error: upsertError } = await supabase
      .from("worksheet_responses")
      .upsert(upserts, { onConflict: "project_id,worksheet_id,field_key" });

    if (upsertError) throw upsertError;

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update Scout Workspace." },
      { status: 500 },
    );
  }
}
