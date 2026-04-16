import { NextResponse } from "next/server";
import { getActiveProjectForCurrentUser } from "@/lib/auth/get-active-project";

export async function POST() {
  try {
    const { supabase, learnerId, user } = await getActiveProjectForCurrentUser();

    if (!user || !learnerId) {
      return NextResponse.redirect(new URL('/login', 'http://localhost:3000'), { status: 303 });
    }

    const { data: existing } = await supabase
      .from("account_deletion_requests")
      .select("id")
      .eq("learner_id", learnerId)
      .order("requested_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!existing?.id) {
      const { error } = await supabase.from("account_deletion_requests").insert({
        learner_id: learnerId,
        status: "requested",
      });

      if (error) throw error;

      await supabase.from("learners").update({ deletion_requested_at: new Date().toISOString() }).eq("id", learnerId);
    }

    return NextResponse.redirect(new URL('/account?deletion=requested', 'http://localhost:3000'), { status: 303 });
  } catch {
    return NextResponse.redirect(new URL('/account?deletion=error', 'http://localhost:3000'), { status: 303 });
  }
}
