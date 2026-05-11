import type { ProductCode } from "@/lib/auth/get-access-state";

export type BillingType = "one_time" | "subscription" | "bundled" | "preview";

export type BillingPlanCode = "scout_basic" | "scout_pro" | "calm_commerce_os";

export type BillingPlan = {
  code: BillingPlanCode;
  productCode: ProductCode;
  billingType: BillingType;
  mode: "payment" | "subscription";
  priceEnv: string;
  name: string;
  priceLabel: string;
  description: string;
  cta: string;
  features: string[];
};

export const BILLING_PLANS: Record<BillingPlanCode, BillingPlan> = {
  scout_basic: {
    code: "scout_basic",
    productCode: "scanner_extension",
    billingType: "one_time",
    mode: "payment",
    priceEnv: "STRIPE_SCOUT_BASIC_PRICE_ID",
    name: "Scout Basic",
    priceLabel: "$5 one-time",
    description: "Amazon and AliExpress scanning with saved products in Scout Workspace.",
    cta: "Buy Scout Basic",
    features: [
      "Scan Amazon and AliExpress product pages",
      "Save up to 50 products to Scout Workspace",
      "Sort, filter, archive, and delete product candidates",
    ],
  },
  scout_pro: {
    code: "scout_pro",
    productCode: "research_workspace",
    billingType: "subscription",
    mode: "subscription",
    priceEnv: "STRIPE_SCOUT_PRO_PRICE_ID",
    name: "Scout Pro",
    priceLabel: "$9/month",
    description: "Any-product-page scanning, richer research, and the Pro research workspace.",
    cta: "Start Scout Pro",
    features: [
      "Scan any product website via the MCP research layer",
      "Get deeper demand, competition, and risk analysis",
      "Use Scout Workspace with fair-use research limits",
    ],
  },
  calm_commerce_os: {
    code: "calm_commerce_os",
    productCode: "calm_commerce_os",
    billingType: "subscription",
    mode: "subscription",
    priceEnv: "STRIPE_CALM_COMMERCE_OS_PRICE_ID",
    name: "Calm Commerce OS",
    priceLabel: "Full OS subscription",
    description: "The full programme, Lean Canvas, metrics, and Scout bundled in.",
    cta: "Upgrade to OS",
    features: [
      "Everything in Scout Pro",
      "Full Calm Commerce chapter programme and inline worksheets",
      "Lean Canvas, metrics, and product testing workflow",
    ],
  },
};

export function planForCode(value: string | null | undefined): BillingPlan | null {
  if (!value) return null;
  return BILLING_PLANS[value as BillingPlanCode] ?? null;
}

export function planForPriceId(priceId: string | null | undefined): BillingPlan | null {
  if (!priceId) return null;
  return Object.values(BILLING_PLANS).find((plan) => process.env[plan.priceEnv] === priceId) ?? null;
}

export function configuredPriceId(plan: BillingPlan): string | null {
  return process.env[plan.priceEnv] || null;
}
