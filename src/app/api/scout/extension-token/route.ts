import { NextResponse } from "next/server";
import { getAccessStateForCurrentUser } from "@/lib/auth/get-access-state";
import { canIssueScoutExtensionTokens, createScoutExtensionToken } from "@/lib/scout/extension-token";
import { isScoutMcpConfigured } from "@/lib/scout/mcp-proxy";

export async function GET() {
  const access = await getAccessStateForCurrentUser();
  if (!access.authenticated || !access.learnerId) {
    return NextResponse.json({ error: "Sign in to connect Scout Pro." }, { status: 401 });
  }

  if (!access.canUseMcpResearch) {
    return NextResponse.json({ error: "Upgrade to Scout Pro to connect AI research." }, { status: 403 });
  }

  if (!canIssueScoutExtensionTokens() || !isScoutMcpConfigured()) {
    return NextResponse.json(
      { error: "Scout Pro connection is not configured yet." },
      { status: 503 },
    );
  }

  const { token, expiresAt } = createScoutExtensionToken(access.learnerId);
  return NextResponse.json({
    ok: true,
    token,
    expiresAt,
    apiBaseUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://www.calmcommerce.net",
  });
}
