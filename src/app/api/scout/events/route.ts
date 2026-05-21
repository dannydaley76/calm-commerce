import { NextResponse } from "next/server";
import { recordScoutEvent } from "@/lib/scout/events";
import { createClient } from "@/lib/supabase/server";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

type ScoutEventBody = {
  eventName?: string;
  anonymousId?: string;
  extensionId?: string;
  platform?: string;
  pageUrl?: string;
  userTier?: string;
  metadata?: Record<string, unknown>;
};

async function getCurrentIds(): Promise<{ authUserId: string | null; learnerId: string | null }> {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const authUserId = userData.user?.id ?? null;
    if (!authUserId) return { authUserId: null, learnerId: null };

    const { data: learner } = await supabase
      .from("learners")
      .select("id")
      .eq("auth_user_id", authUserId)
      .maybeSingle();

    return { authUserId, learnerId: learner?.id ?? null };
  } catch {
    return { authUserId: null, learnerId: null };
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as ScoutEventBody;
    const { authUserId, learnerId } = await getCurrentIds();

    await recordScoutEvent({
      eventName: body.eventName ?? "",
      authUserId,
      learnerId,
      anonymousId: body.anonymousId,
      extensionId: body.extensionId,
      platform: body.platform,
      pageUrl: body.pageUrl,
      userTier: body.userTier,
      metadata: body.metadata,
    });

    return NextResponse.json({ ok: true }, { headers: CORS_HEADERS });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200, headers: CORS_HEADERS });
  }
}
