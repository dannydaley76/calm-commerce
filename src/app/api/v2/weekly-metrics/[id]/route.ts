import { NextResponse } from "next/server";
import { getActiveProjectForCurrentUser } from "@/lib/auth/get-active-project";
import { getAccessStateForCurrentUser } from "@/lib/auth/get-access-state";

type RouteContext = { params: Promise<{ id: string }> };

/* ── Validation helpers (mirrored from parent route) ── */

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function parseOptionalNumber(v: unknown): number | null {
  if (v === undefined || v === null || v === "") return null;
  if (typeof v !== "string" && typeof v !== "number") return null;
  const cleaned = String(v).replace(/[^0-9.]/g, "");
  const n = parseFloat(cleaned);
  if (isNaN(n) || n < 0) return null;
  return n;
}

/* ── DELETE — remove a single entry (must belong to this project) ── */

export async function DELETE(_req: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const { supabase, user, projectId } = await getActiveProjectForCurrentUser();
    if (!user || !projectId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const access = await getAccessStateForCurrentUser();
    if (!access.canAccessMetrics) {
      return NextResponse.json({ error: "Metrics are part of Calm Commerce OS access." }, { status: 403 });
    }

    // Delete only if it belongs to this project (row-level ownership check)
    const { error } = await supabase
      .from("weekly_metrics")
      .delete()
      .eq("id", id)
      .eq("project_id", projectId);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to delete entry" },
      { status: 500 },
    );
  }
}

/* ── PATCH — update an existing entry in place ── */

export async function PATCH(req: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const body = (await req.json().catch(() => ({}))) as {
      week_ending?: unknown;
      data?: unknown;
    };

    if (!isNonEmptyString(body.week_ending)) {
      return NextResponse.json(
        { error: "week_ending is required and must be a non-empty string" },
        { status: 400 },
      );
    }

    const { supabase, user, projectId } = await getActiveProjectForCurrentUser();
    if (!user || !projectId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const access = await getAccessStateForCurrentUser();
    if (!access.canAccessMetrics) {
      return NextResponse.json({ error: "Metrics are part of Calm Commerce OS access." }, { status: 403 });
    }

    // Fetch the existing entry to verify ownership and read entry_type.
    // maybeSingle() returns null without error when no row matches.
    const { data: existing, error: fetchError } = await supabase
      .from("weekly_metrics")
      .select("id, data_json")
      .eq("id", id)
      .eq("project_id", projectId)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!existing) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    const existingDataJson = (existing.data_json ?? {}) as Record<string, string>;
    const entryType = existingDataJson.entry_type ?? "live_store";

    const data =
      body.data && typeof body.data === "object"
        ? (body.data as Record<string, unknown>)
        : {};

    // Phase-specific allowed keys (same as POST)
    const allowedKeys =
      entryType === "validation"
        ? ["product_idea_id", "impressions", "listing_clicks", "orders", "profit_per_sale", "noticed"]
        : ["product_idea_id", "revenue", "orders", "traffic", "ad_spend", "new_email_subscribers", "refunds_returns", "what_worked", "what_to_change", "notes"];

    // Validate numeric fields
    if (entryType === "validation") {
      for (const field of ["impressions", "listing_clicks", "orders"] as const) {
        const val = data[field];
        if (val !== undefined && val !== "" && parseOptionalNumber(val) === null) {
          return NextResponse.json({ error: `${field} must be a non-negative number if provided` }, { status: 400 });
        }
      }
    } else {
      if (isNonEmptyString(data.revenue) && parseOptionalNumber(data.revenue) === null) {
        return NextResponse.json({ error: "revenue must be a valid number" }, { status: 400 });
      }
    }

    const sanitisedData: Record<string, string> = { entry_type: entryType };
    for (const key of allowedKeys) {
      if (data[key] !== undefined && data[key] !== "") {
        sanitisedData[key] = String(data[key]).slice(0, 2000);
      }
    }

    // Update in place. Relies on the weekly_metrics_update_own RLS policy
    // (see weekly-metrics-rls-update-delete.sql). submitted_at is left
    // untouched so sort order is preserved.
    const { data: updated, error: updateError } = await supabase
      .from("weekly_metrics")
      .update({
        week_ending: body.week_ending.trim().slice(0, 100),
        data_json: sanitisedData,
      })
      .eq("id", id)
      .eq("project_id", projectId)
      .select("id")
      .maybeSingle();

    if (updateError) throw updateError;
    if (!updated) {
      // RLS blocked the update, or the row vanished between fetch and update.
      return NextResponse.json({ error: "Unable to update entry" }, { status: 403 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update entry" },
      { status: 500 },
    );
  }
}
