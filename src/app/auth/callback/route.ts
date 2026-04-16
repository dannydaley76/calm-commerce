import { NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/";
  const redirectTo = `${origin}${next.startsWith("/") ? next : "/"}`;
  const loginWithError = (message: string) =>
    NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(message)}`);

  if (!code) {
    return loginWithError("Missing auth code in callback URL.");
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return loginWithError(error.message || "Unable to create session from magic link.");
    }

    return NextResponse.redirect(redirectTo);
  } catch (error) {
    return loginWithError(error instanceof Error ? error.message : "Unexpected auth callback error.");
  }
}
