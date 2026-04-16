import { NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";

type WorksheetBody = {
  projectId?: string;
  worksheetId?: string;
  response?: Record<string, unknown>;
};

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as WorksheetBody;

  if (!body?.projectId || !body?.worksheetId) {
    return NextResponse.json(
      { error: "projectId and worksheetId are required" },
      { status: 400 },
    );
  }

  let supabase;
  try {
    supabase = await createClient();
  } catch {
    return NextResponse.json({
      ok: true,
      auth: false,
      savedAt: new Date().toISOString(),
      projectId: body.projectId,
      worksheetId: body.worksheetId,
    });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({
      ok: true,
      auth: false,
      savedAt: new Date().toISOString(),
      projectId: body.projectId,
      worksheetId: body.worksheetId,
    });
  }

  const { error } = await supabase.from("project_worksheet_responses").upsert(
    {
      project_id: body.projectId,
      worksheet_key: body.worksheetId,
      response_json: body.response ?? {},
      updated_at: new Date().toISOString(),
    },
    { onConflict: "project_id,worksheet_key" },
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    auth: true,
    savedAt: new Date().toISOString(),
    projectId: body.projectId,
    worksheetId: body.worksheetId,
  });
}
