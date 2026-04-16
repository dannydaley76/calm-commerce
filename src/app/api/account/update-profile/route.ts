import { NextResponse } from "next/server";
import { getActiveProjectForCurrentUser } from "@/lib/auth/get-active-project";
import { isSupportedCurrencyCode } from "@/lib/profile/currency";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const fullName = String(formData.get("full_name") ?? "").trim();
    const submittedCurrency = String(formData.get("currency_code") ?? "").trim().toUpperCase();
    void (isSupportedCurrencyCode(submittedCurrency) ? submittedCurrency : "GBP");

    const { supabase, learnerId, user } = await getActiveProjectForCurrentUser();

    if (!user || !learnerId) {
      return NextResponse.redirect(new URL('/login', request.url), { status: 303 });
    }

    const { error } = await supabase.from("learners").update({ full_name: fullName || null }).eq("id", learnerId);
    if (error) throw error;

    return NextResponse.redirect(new URL('/account?profile=updated', request.url), { status: 303 });
  } catch {
    return NextResponse.redirect(new URL('/account?profile=error', request.url), { status: 303 });
  }
}
