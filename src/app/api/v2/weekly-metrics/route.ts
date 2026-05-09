import { NextResponse } from "next/server";
import { getActiveProjectForCurrentUser } from "@/lib/auth/get-active-project";
import { getAccessStateForCurrentUser } from "@/lib/auth/get-access-state";

/* ── Validation helpers ── */

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

/** Strip currency symbols and parse; returns null if not a valid non-negative number */
function parseOptionalNumber(v: unknown): number | null {
  if (v === undefined || v === null || v === "") return null;
  if (typeof v !== "string" && typeof v !== "number") return null;
  const cleaned = String(v).replace(/[^0-9.]/g, "");
  const n = parseFloat(cleaned);
  if (isNaN(n) || n < 0) return null;
  return n;
}

/* ── GET — load past entries for this project (most recent 104 weeks / ~2 years) ── */

export async function GET() {
  try {
    const { supabase, learnerId, projectId, user } = await getActiveProjectForCurrentUser();

    if (!user || !learnerId || !projectId) {
      return NextResponse.json({ auth: false, entries: [] });
    }
    const access = await getAccessStateForCurrentUser();
    if (!access.canAccessMetrics) {
      return NextResponse.json({ error: "Metrics are part of Calm Commerce OS access." }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("weekly_metrics")
      .select("id, week_ending, data_json, submitted_at")
      .eq("project_id", projectId)
      .order("submitted_at", { ascending: false })
      .limit(104); // ~2 years of weekly entries; add pagination if needed beyond this

    if (error) throw error;

    return NextResponse.json({ auth: true, entries: data ?? [] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load weekly metrics" },
      { status: 500 },
    );
  }
}

/* ── POST — insert a new weekly metric entry ── */

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      week_ending?: unknown;
      entry_type?: unknown;
      data?: unknown;
      chapterId?: unknown;
      chapterSlug?: unknown;
    };

    /* ── Required: week_ending ── */
    if (!isNonEmptyString(body.week_ending)) {
      return NextResponse.json(
        { error: "week_ending is required and must be a non-empty string" },
        { status: 400 },
      );
    }

    const entryType =
      body.entry_type === "validation" ? "validation" : "live_store";

    const data =
      body.data && typeof body.data === "object"
        ? (body.data as Record<string, unknown>)
        : {};

    /* ── Phase-specific required field validation ── */
    if (entryType === "live_store") {
      if (!isNonEmptyString(data.revenue)) {
        return NextResponse.json(
          { error: "revenue is required for live store entries" },
          { status: 400 },
        );
      }

      const liveNumericFields = [
        "orders",
        "traffic",
        "new_email_subscribers",
        "refunds_returns",
      ] as const;

      for (const field of liveNumericFields) {
        const val = data[field];
        if (val !== undefined && val !== "" && parseOptionalNumber(val) === null) {
          return NextResponse.json(
            { error: `${field} must be a non-negative number if provided` },
            { status: 400 },
          );
        }
      }

      if (
        data.ad_spend !== undefined &&
        data.ad_spend !== "" &&
        parseOptionalNumber(data.ad_spend) === null
      ) {
        return NextResponse.json(
          { error: "ad_spend must be a non-negative number if provided" },
          { status: 400 },
        );
      }
    } else {
      /* validation phase — numeric fields are all optional but must be valid if provided */
      const validationNumericFields = ["impressions", "listing_clicks", "orders"] as const;
      for (const field of validationNumericFields) {
        const val = data[field];
        if (val !== undefined && val !== "" && parseOptionalNumber(val) === null) {
          return NextResponse.json(
            { error: `${field} must be a non-negative number if provided` },
            { status: 400 },
          );
        }
      }
    }

    /* ── Auth ── */
    const { supabase, learnerId, projectId, user } = await getActiveProjectForCurrentUser();

    if (!user || !learnerId || !projectId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const access = await getAccessStateForCurrentUser();
    if (!access.canAccessMetrics) {
      return NextResponse.json({ error: "Metrics are part of Calm Commerce OS access." }, { status: 403 });
    }

    /* ── Sanitise data_json: only known keys per phase, strings, capped length ── */
    const allowedKeys =
      entryType === "validation"
        ? ["product_idea_id", "impressions", "listing_clicks", "orders", "profit_per_sale", "noticed"]
        : ["product_idea_id", "revenue", "orders", "traffic", "ad_spend", "new_email_subscribers", "refunds_returns", "what_worked", "what_to_change", "notes"];

    const sanitisedData: Record<string, string> = { entry_type: entryType };
    for (const key of allowedKeys) {
      if (data[key] !== undefined && data[key] !== "") {
        sanitisedData[key] = String(data[key]).slice(0, 2000);
      }
    }

    /* ── Insert ── */
    const { data: inserted, error: insertError } = await supabase
      .from("weekly_metrics")
      .insert({
        project_id: projectId,
        week_ending: body.week_ending.trim().slice(0, 100),
        data_json: sanitisedData,
      })
      .select("id, week_ending, data_json, submitted_at")
      .single();

    if (insertError) throw insertError;

    /* ── Update chapter progress ── */
    const chapterId = isNonEmptyString(body.chapterId) ? body.chapterId : null;
    const chapterSlug = isNonEmptyString(body.chapterSlug) ? body.chapterSlug : null;

    if (chapterId && chapterSlug) {
      await supabase.from("chapter_progress").upsert(
        {
          project_id: projectId,
          chapter_id: chapterId,
          status: "in_progress",
          last_location_type: "chapter",
          last_location_key: null,
          worksheet_completion_percent: 0,
        },
        { onConflict: "project_id,chapter_id" },
      );

      await supabase.from("project_resume_state").upsert(
        {
          project_id: projectId,
          chapter_id: chapterId,
          last_location_type: "chapter",
          last_location_key: null,
          resume_path: `/chapter/${chapterSlug}/steps`,
        },
        { onConflict: "project_id" },
      );
    }

    return NextResponse.json({ ok: true, auth: true, entry: inserted });
  } catch (error) {
    console.error("[weekly-metrics:POST:error]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to save weekly metrics" },
      { status: 500 },
    );
  }
}
