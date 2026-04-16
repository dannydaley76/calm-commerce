import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getActiveProjectForCurrentUser } from "@/lib/auth/get-active-project";

export async function POST(request: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_6_MONTH_PRICE_ID;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!secretKey || !priceId || !siteUrl) {
    return NextResponse.json(
      { error: "Stripe checkout is not configured yet. Missing STRIPE_SECRET_KEY, STRIPE_6_MONTH_PRICE_ID, or NEXT_PUBLIC_SITE_URL." },
      { status: 500 },
    );
  }

  try {
    const { learnerId, projectId, user } = await getActiveProjectForCurrentUser();

    if (!user || !learnerId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const stripe = new Stripe(secretKey, {
      apiVersion: "2026-02-25.clover",
    });

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer_email: user.email ?? undefined,
      success_url: `${siteUrl.replace(/\/$/, "")}/?checkout=success`,
      cancel_url: `${siteUrl.replace(/\/$/, "")}/upgrade?checkout=cancelled`,
      metadata: {
        learner_id: learnerId,
        project_id: projectId ?? "",
        product_slug: "ecom-learning",
      },
    });

    if (!session.url) {
      return NextResponse.json({ error: "Stripe checkout session did not return a URL." }, { status: 500 });
    }

    return NextResponse.redirect(session.url, { status: 303 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create checkout session." },
      { status: 500 },
    );
  }
}
