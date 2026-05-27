import { NextResponse } from "next/server";
import { bearerTokenFromRequest, verifyScoutExtensionToken } from "@/lib/scout/extension-token";
import { proxyScoutMcp } from "@/lib/scout/mcp-proxy";

export async function POST(request: Request) {
  const token = bearerTokenFromRequest(request);
  const verified = token ? verifyScoutExtensionToken(token) : null;
  if (!verified) {
    return NextResponse.json({ success: false, error: "Scout Pro connection expired. Reconnect the extension." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ success: false, error: "Invalid Scout enrichment request." }, { status: 400 });
  }

  return proxyScoutMcp("/enrich", body);
}
