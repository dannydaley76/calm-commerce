import { NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";
import { sampleProjects } from "../../../lib/data/sample";

async function getAuthedUserId() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return { supabase, userId: user?.id ?? null, configured: true };
  } catch {
    return { supabase: null, userId: null, configured: false };
  }
}

export async function GET() {
  const { supabase, userId, configured } = await getAuthedUserId();

  if (!configured || !supabase || !userId) {
    return NextResponse.json({ projects: sampleProjects, auth: false });
  }

  const { data, error } = await supabase
    .from("projects")
    .select("id,name,status,created_at,updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const projects = (data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    status: p.status,
    progress: 0,
    updated: new Date(p.updated_at).toLocaleDateString(),
  }));

  return NextResponse.json({ projects, auth: true });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const name = typeof body?.name === "string" ? body.name.trim() : "";

  if (!name) {
    return NextResponse.json({ error: "Project name is required" }, { status: 400 });
  }

  const { supabase, userId, configured } = await getAuthedUserId();

  if (!configured || !supabase || !userId) {
    const project = {
      id: crypto.randomUUID(),
      name,
      progress: 0,
      status: "active",
      updated: "Just now",
    };

    return NextResponse.json({ project, auth: false }, { status: 201 });
  }

  const { data, error } = await supabase
    .from("projects")
    .insert({ user_id: userId, name, status: "active" })
    .select("id,name,status,updated_at")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Could not create project" }, { status: 500 });
  }

  return NextResponse.json(
    {
      project: {
        id: data.id,
        name: data.name,
        progress: 0,
        status: data.status,
        updated: "Just now",
      },
      auth: true,
    },
    { status: 201 },
  );
}

export async function PATCH(req: Request) {
  const body = await req.json().catch(() => ({}));
  const projectId = typeof body?.projectId === "string" ? body.projectId : "";
  const action = typeof body?.action === "string" ? body.action : "";

  if (!projectId || !["archive", "unarchive"].includes(action)) {
    return NextResponse.json({ error: "projectId and valid action are required" }, { status: 400 });
  }

  const { supabase, userId, configured } = await getAuthedUserId();

  if (!configured || !supabase || !userId) {
    return NextResponse.json({ ok: true, auth: false, projectId, status: action === "archive" ? "archived" : "active" });
  }

  const status = action === "archive" ? "archived" : "active";

  const { data, error } = await supabase
    .from("projects")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", projectId)
    .eq("user_id", userId)
    .select("id,status")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Could not update project" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, auth: true, projectId: data.id, status: data.status });
}

export async function PUT(req: Request) {
  const body = await req.json().catch(() => ({}));
  const sourceProjectId = typeof body?.sourceProjectId === "string" ? body.sourceProjectId : "";

  if (!sourceProjectId) {
    return NextResponse.json({ error: "sourceProjectId is required" }, { status: 400 });
  }

  const { supabase, userId, configured } = await getAuthedUserId();

  if (!configured || !supabase || !userId) {
    return NextResponse.json({
      auth: false,
      project: {
        id: crypto.randomUUID(),
        name: "Cloned Project (Copy)",
        progress: 0,
        status: "active",
        updated: "Just now",
      },
    });
  }

  const { data: source, error: sourceError } = await supabase
    .from("projects")
    .select("name")
    .eq("id", sourceProjectId)
    .eq("user_id", userId)
    .single();

  if (sourceError || !source) {
    return NextResponse.json({ error: sourceError?.message ?? "Source project not found" }, { status: 404 });
  }

  const { data: created, error: createError } = await supabase
    .from("projects")
    .insert({ user_id: userId, name: `${source.name} (Copy)`, status: "active" })
    .select("id,name,status")
    .single();

  if (createError || !created) {
    return NextResponse.json({ error: createError?.message ?? "Could not clone project" }, { status: 500 });
  }

  return NextResponse.json({
    auth: true,
    project: {
      id: created.id,
      name: created.name,
      progress: 0,
      status: created.status,
      updated: "Just now",
    },
  });
}
