import { NextResponse } from "next/server";
import { getActiveProjectForCurrentUser } from "@/lib/auth/get-active-project";
import { getAccessStateForCurrentUser } from "@/lib/auth/get-access-state";

type LastLocationType = "chapter" | "worksheet" | "completion";

export async function GET() {
  try {
    const { supabase, learnerId, projectId, user } = await getActiveProjectForCurrentUser();
    console.log("[learner-state:GET]", { hasUser: !!user, learnerId, projectId });

    if (!user || !learnerId || !projectId) {
      return NextResponse.json({
        auth: false,
        worksheetResponses: {},
        responsesByWorksheet: {},
        progress: null,
        resume: null,
      });
    }
    const access = await getAccessStateForCurrentUser();

    const [{ data: responses, error: responsesError }, { data: resume, error: resumeError }] = await Promise.all([
      // Load ALL worksheet responses for this project (across all chapters)
      supabase
        .from("worksheet_responses")
        .select("worksheet_id, field_key, value_json")
        .eq("project_id", projectId)
        .in("worksheet_id", access.canAccessOsContent ? [
          "ideas-worksheet",
          "unit-economics-worksheet",
          "pre-store-test-worksheet",
          "customer-profile-worksheet",
          "offer-worksheet",
          "product-listing-worksheet",
          "traffic-plan-worksheet",
          "ad-test-worksheet",
          "email-retention-worksheet",
          "iteration-decision-worksheet",
          "growth-strategy-worksheet",
          "sourcing-model-sheet",
          "founder-rules-sheet",
        ] : ["ideas-worksheet"]),
      supabase.from("project_resume_state").select("*").eq("project_id", projectId).maybeSingle(),
    ]);

    if (responsesError) throw responsesError;
    if (resumeError) throw resumeError;

    // Nested map: worksheet_id → field_key → value. This is the authoritative shape —
    // clients should reach for this since it doesn't collide when two worksheets share a
    // field_key (e.g. `decision`, `test_duration`, `what_to_change`).
    const responsesByWorksheet: Record<string, Record<string, string>> = {};
    for (const row of responses ?? []) {
      const value =
        typeof row.value_json === "string" ? row.value_json : String(row.value_json ?? "");
      const bucket = (responsesByWorksheet[row.worksheet_id] ??= {});
      bucket[row.field_key] = value;
    }

    // Legacy flat map: field_key → value. Kept for backwards compatibility during the
    // transition; colliding keys across worksheets will arbitrarily overwrite, so new code
    // should prefer responsesByWorksheet.
    const worksheetResponses = Object.fromEntries(
      (responses ?? []).map((row) => [
        row.field_key,
        typeof row.value_json === "string" ? row.value_json : String(row.value_json ?? ""),
      ]),
    );

    return NextResponse.json({
      auth: true,
      learnerId,
      projectId,
      worksheetResponses,
      responsesByWorksheet,
      resume,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load learner state" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      worksheetId?: string;
      chapterId?: string;
      chapterSlug?: string;
      responses?: Record<string, string>;
      lastLocationType?: LastLocationType;
      lastLocationKey?: string | null;
      worksheetCompletionPercent?: number;
    };

    const { supabase, learnerId, projectId, user } = await getActiveProjectForCurrentUser();
    console.log("[learner-state:POST]", {
      hasUser: !!user,
      learnerId,
      projectId,
      worksheetId: body.worksheetId,
      fieldCount: Object.keys(body.responses ?? {}).length,
    });

    if (!user || !learnerId || !projectId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const worksheetId = body.worksheetId ?? "founder-rules-sheet";
    const access = await getAccessStateForCurrentUser();
    const canWriteWorksheet =
      access.canAccessOsContent ||
      (access.canUseScannerImport && worksheetId === "ideas-worksheet");
    if (!canWriteWorksheet) {
      return NextResponse.json(
        { error: "This worksheet is part of Calm Commerce OS access." },
        { status: 403 },
      );
    }
    const incomingResponses = body.responses ?? {};

    const entries = Object.entries(incomingResponses)
      .filter(([, value]) => typeof value === "string")
      .map(([field_key, value]) => ({
        project_id: projectId,
        worksheet_id: worksheetId,
        field_key,
        value_json: value,
      }));

    if (entries.length > 0) {
      const { error: responseError } = await supabase
        .from("worksheet_responses")
        .upsert(entries, { onConflict: "project_id,worksheet_id,field_key" });

      if (responseError) throw responseError;
    }

    // Update chapter progress if chapterId provided
    const chapterId = body.chapterId;
    const chapterSlug = body.chapterSlug;
    const lastLocationType: LastLocationType = body.lastLocationType ?? "chapter";
    const worksheetCompletionPercent = typeof body.worksheetCompletionPercent === "number"
      ? Math.min(100, Math.max(0, Math.round(body.worksheetCompletionPercent)))
      : null;
    const isComplete = worksheetCompletionPercent === 100;

    if (chapterId && chapterSlug) {
      const { error: progressError } = await supabase.from("chapter_progress").upsert(
        {
          project_id: projectId,
          chapter_id: chapterId,
          status: isComplete ? "completed" : "in_progress",
          last_location_type: lastLocationType,
          last_location_key: body.lastLocationKey ?? null,
          ...(worksheetCompletionPercent !== null && { worksheet_completion_percent: worksheetCompletionPercent }),
          ...(isComplete && { completed_at: new Date().toISOString() }),
        },
        { onConflict: "project_id,chapter_id" },
      );

      if (progressError) throw progressError;

      const { error: resumeError } = await supabase.from("project_resume_state").upsert(
        {
          project_id: projectId,
          chapter_id: chapterId,
          last_location_type: lastLocationType,
          last_location_key: body.lastLocationKey ?? null,
          resume_path: `/chapter/${chapterSlug}`,
        },
        { onConflict: "project_id" },
      );

      if (resumeError) throw resumeError;
    }

    return NextResponse.json({
      ok: true,
      auth: true,
      learnerId,
      projectId,
    });
  } catch (error) {
    console.error("[learner-state:POST:error]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to save learner state" },
      { status: 500 },
    );
  }
}
