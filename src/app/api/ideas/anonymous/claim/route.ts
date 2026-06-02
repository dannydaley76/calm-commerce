import { NextResponse } from "next/server";
import { getActiveProjectForCurrentUser } from "@/lib/auth/get-active-project";
import { claimAnonymousScoutWorkspace } from "@/lib/scout/anonymous-workspace";
import { recordScoutEvent } from "@/lib/scout/events";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { workspaceToken?: string };
    const { supabase, user, learnerId, projectId } = await getActiveProjectForCurrentUser();

    if (!user || !learnerId || !projectId) {
      return NextResponse.json({ error: "Not authenticated", code: "not_authenticated" }, { status: 401 });
    }

    const result = await claimAnonymousScoutWorkspace({
      workspaceToken: body.workspaceToken,
      userSupabase: supabase,
      learnerId,
      projectId,
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error, code: result.code },
        { status: result.status },
      );
    }

    await recordScoutEvent({
      eventName: "anonymous_workspace_claimed",
      authUserId: user.id,
      learnerId,
      metadata: {
        claimedCount: result.claimedCount,
        skippedCount: result.skippedCount,
        ideaIds: result.ideaIds,
      },
    });

    return NextResponse.json({
      ok: true,
      claimedCount: result.claimedCount,
      skippedCount: result.skippedCount,
      ideaIds: result.ideaIds,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to claim temporary Scout Workspace." },
      { status: 500 },
    );
  }
}
