import { NextResponse } from "next/server";
import { getAnonymousScoutWorkspace } from "@/lib/scout/anonymous-workspace";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { workspaceToken?: string };
    const result = await getAnonymousScoutWorkspace(body.workspaceToken);

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error, code: result.code },
        { status: result.status },
      );
    }

    return NextResponse.json({
      ok: true,
      workspaceId: result.workspaceId,
      products: result.products,
      limit: result.limit,
      remaining: result.remaining,
      claimed: result.claimed,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load temporary Scout Workspace." },
      { status: 500 },
    );
  }
}
