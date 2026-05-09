import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getActiveProjectForCurrentUser } from "@/lib/auth/get-active-project";
import { configuredPriceId, planForCode } from "@/lib/billing/products";

export async function POST(request: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const form = await request.formData().catch(() => null);
  const requestedPlan = form?.get("plan");
  const plan = planForCode(typeof requestedPlan === "string" ? requestedPlan : "calm_commerce_os");
  const priceId = plan ? configuredPriceId(plan) : null;

  if (!plan) {
    return NextResponse.json({ error: "Unknown billing plan." }, { status: 400 });
  }

  if (!secretKey || !priceId || !siteUrl) {
    return NextResponse.json(
      { error: `Stripe checkout is not configured yet. Missing STRIPE_SECRET_KEY, ${plan.priceEnv}, or NEXT_PUBLIC_SITE_URL.` },
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
      mode: plan.mode,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer_email: user.email ?? undefined,
      success_url: `${siteUrl.replace(/\/$/, "")}/ideas?checkout=success&plan=${plan.code}`,
      cancel_url: `${siteUrl.replace(/\/$/, "")}/upgrade?checkout=cancelled`,
      metadata: {
        learner_id: learnerId,
        project_id: projectId ?? "",
        plan_code: plan.code,
        product_code: plan.productCode,
        billing_type: plan.billingType,
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
