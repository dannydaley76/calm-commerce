import { NextResponse } from "next/server";
import Stripe from "stripe";
import { planForCode, planForPriceId } from "@/lib/billing/products";
import { createAdminClient } from "@/lib/supabase/admin";

function timestampToIso(value: number | null | undefined): string | null {
  return value ? new Date(value * 1000).toISOString() : null;
}

async function upsertEntitlementFromSession(session: Stripe.Checkout.Session) {
  const learnerId = session.metadata?.learner_id;
  if (!learnerId) throw new Error("Checkout session missing learner_id metadata.");

  const lineItems = await getStripe().checkout.sessions.listLineItems(session.id, {
    limit: 1,
    expand: ["data.price"],
  });
  const price = lineItems.data[0]?.price;
  const plan =
    planForCode(session.metadata?.plan_code) ??
    planForPriceId(price?.id ?? null);
  if (!plan) throw new Error("Checkout session did not match a known billing plan.");

  const supabase = createAdminClient();
  const now = new Date().toISOString();
  const payload = {
    learner_id: learnerId,
    status: "active",
    access_level: "full",
    product_code: plan.productCode,
    billing_type: plan.billingType,
    provider: "stripe",
    stripe_customer_id: typeof session.customer === "string" ? session.customer : session.customer?.id ?? null,
    stripe_subscription_id: typeof session.subscription === "string" ? session.subscription : session.subscription?.id ?? null,
    stripe_price_id: price?.id ?? null,
    starts_at: now,
    ends_at: null,
    updated_at: now,
  };

  const { data: existing, error: lookupError } = await supabase
    .from("learner_entitlements")
    .select("id")
    .eq("learner_id", learnerId)
    .eq("product_code", plan.productCode)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lookupError) throw lookupError;

  const result = existing?.id
    ? await supabase.from("learner_entitlements").update(payload).eq("id", existing.id)
    : await supabase.from("learner_entitlements").insert(payload);

  if (result.error) throw result.error;
}

async function updateSubscriptionEntitlement(subscription: Stripe.Subscription, status: "active" | "cancelled" | "expired") {
  const priceId = subscription.items.data[0]?.price.id ?? null;
  const plan = planForPriceId(priceId);
  if (!plan) return;

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("learner_entitlements")
    .update({
      status,
      access_level: status === "active" ? "full" : "preview",
      ends_at: timestampToIso(subscription.cancel_at ?? subscription.canceled_at ?? subscription.ended_at),
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id)
    .eq("product_code", plan.productCode);

  if (error) throw error;
}

function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error("Missing STRIPE_SECRET_KEY");
  return new Stripe(secretKey, {
    apiVersion: "2026-02-25.clover",
  });
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Missing STRIPE_WEBHOOK_SECRET" }, { status: 500 });
  }

  const stripe = getStripe();
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await request.text(), signature, webhookSecret);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid Stripe webhook signature." },
      { status: 400 },
    );
  }

  try {
    if (event.type === "checkout.session.completed") {
      await upsertEntitlementFromSession(event.data.object as Stripe.Checkout.Session);
    }

    if (event.type === "customer.subscription.deleted") {
      await updateSubscriptionEntitlement(event.data.object as Stripe.Subscription, "cancelled");
    }

    if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object as Stripe.Subscription;
      const status = subscription.status === "active" || subscription.status === "trialing" ? "active" : "expired";
      await updateSubscriptionEntitlement(subscription, status);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to process Stripe webhook." },
      { status: 500 },
    );
  }
}
