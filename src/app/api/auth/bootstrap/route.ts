import { NextResponse } from "next/server";
import { ensureLearnerForCurrentUser } from "@/lib/auth/ensure-learner";

export async function POST() {
  try {
    const { user, learnerId, projectId, entitlementId } = await ensureLearnerForCurrentUser();

    if (!user || !learnerId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    return NextResponse.json({
      ok: true,
      learnerId,
      projectId,
      entitlementId,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to bootstrap learner account" },
      { status: 500 },
    );
  }
}
