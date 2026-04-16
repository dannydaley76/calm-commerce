import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      message:
        "Stripe webhook handler not implemented yet. This route is reserved for webhook-driven entitlement updates in the next pass.",
    },
    { status: 501 },
  );
}
