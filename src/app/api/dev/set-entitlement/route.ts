import { NextResponse } from "next/server";
import { getActiveProjectForCurrentUser } from "@/lib/auth/get-active-project";

const ALLOWED = new Set(["preview", "active", "expired", "cancelled"]);
const PRODUCTS = new Set(["scanner_extension", "research_workspace", "calm_commerce_os"]);
const BILLING_TYPES = new Set(["one_time", "subscription", "bundled", "preview"]);

function getAccessLevel(status: string) {
  return status === "active" ? "full" : "preview";
}

function defaultBillingType(status: string, productCode: string) {
  if (status !== "active") return "preview";
  if (productCode === "scanner_extension") return "one_time";
  return "subscription";
}

export async function POST(request: Request) {
  if (process.env.ALLOW_DEV_MOCK_BILLING !== "true") {
    return NextResponse.json({ error: "Mock billing is disabled." }, { status: 403 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      status?: string;
      productCode?: string;
      billingType?: string;
    };
    const status = body.status ?? "preview";
    const productCode = body.productCode ?? "calm_commerce_os";
    const billingType = body.billingType ?? defaultBillingType(status, productCode);

    if (!ALLOWED.has(status)) {
      return NextResponse.json({ error: "Invalid entitlement status." }, { status: 400 });
    }
    if (!PRODUCTS.has(productCode)) {
      return NextResponse.json({ error: "Invalid product code." }, { status: 400 });
    }
    if (!BILLING_TYPES.has(billingType)) {
      return NextResponse.json({ error: "Invalid billing type." }, { status: 400 });
    }

    const { supabase, learnerId, user } = await getActiveProjectForCurrentUser();

    if (!user || !learnerId) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const payload = {
      learner_id: learnerId,
      status,
      access_level: getAccessLevel(status),
      product_code: productCode,
      billing_type: billingType,
      provider: "mock",
      starts_at: new Date().toISOString(),
      ends_at: status === "active" ? new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString() : null,
      updated_at: new Date().toISOString(),
    };

    const { data: existing } = await supabase
      .from("learner_entitlements")
      .select("id, created_at, updated_at")
      .eq("learner_id", learnerId)
      .eq("product_code", productCode)
      .order("updated_at", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let error = null;

    if (existing?.id) {
      ({ error } = await supabase.from("learner_entitlements").update(payload).eq("id", existing.id));
    } else {
      ({ error } = await supabase.from("learner_entitlements").insert(payload));
    }

    if (error) throw error;

    return NextResponse.json({ ok: true, status, accessLevel: payload.access_level, productCode, billingType });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update mock entitlement." },
      { status: 500 },
    );
  }
}
