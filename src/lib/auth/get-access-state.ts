import { getActiveProjectForCurrentUser } from "@/lib/auth/get-active-project";

export type LearnerAccessState = {
  authenticated: boolean;
  learnerId: string | null;
  projectId: string | null;
  entitlementStatus: "preview" | "active" | "expired" | "cancelled" | null;
  accessLevel: "preview" | "full" | null;
  activeProducts: ProductCode[];
  canAccessDashboard: boolean;
  canAccessPaidContent: boolean;
  canUseScannerImport: boolean;
  canUseResearchWorkspace: boolean;
  canUseMcpResearch: boolean;
  canAccessOsContent: boolean;
  canAccessLeanCanvas: boolean;
  canAccessMetrics: boolean;
};

export type ProductCode = "scanner_extension" | "research_workspace" | "calm_commerce_os";

type EntitlementRow = {
  status: LearnerAccessState["entitlementStatus"];
  access_level: LearnerAccessState["accessLevel"];
  product_code?: ProductCode | null;
  billing_type?: "one_time" | "subscription" | "bundled" | "preview" | null;
  created_at?: string | null;
  updated_at?: string | null;
};

function baseState(overrides: Partial<LearnerAccessState>): LearnerAccessState {
  return {
    authenticated: false,
    learnerId: null,
    projectId: null,
    entitlementStatus: null,
    accessLevel: null,
    activeProducts: [],
    canAccessDashboard: false,
    canAccessPaidContent: false,
    canUseScannerImport: false,
    canUseResearchWorkspace: false,
    canUseMcpResearch: false,
    canAccessOsContent: false,
    canAccessLeanCanvas: false,
    canAccessMetrics: false,
    ...overrides,
  };
}

function productForEntitlement(row: EntitlementRow): ProductCode {
  if (row.product_code) return row.product_code;
  return row.status === "active" && row.access_level === "full" ? "calm_commerce_os" : "scanner_extension";
}

function deriveCapabilities(rows: EntitlementRow[]) {
  const activeProducts = Array.from(
    new Set(
      rows
        .filter((row) => row.status === "active")
        .map(productForEntitlement),
    ),
  );
  const hasScanner = activeProducts.includes("scanner_extension");
  const hasResearch = activeProducts.includes("research_workspace");
  const hasOs = activeProducts.includes("calm_commerce_os");

  return {
    activeProducts,
    canUseScannerImport: hasScanner || hasResearch || hasOs,
    canUseResearchWorkspace: hasResearch || hasOs,
    canUseMcpResearch: hasResearch || hasOs,
    canAccessOsContent: hasOs,
    canAccessLeanCanvas: hasOs,
    canAccessMetrics: hasOs,
    canAccessPaidContent: hasOs,
  };
}

export async function getAccessStateForCurrentUser(): Promise<LearnerAccessState> {
  const { supabase, user, learnerId, projectId } = await getActiveProjectForCurrentUser();

  if (!user) {
    return baseState({
      authenticated: false,
    });
  }

  if (!learnerId) {
    return baseState({
      authenticated: true,
      canAccessDashboard: true,
    });
  }

  const { data } = await supabase
    .from("learner_entitlements")
    .select("status, access_level, product_code, billing_type, created_at, updated_at")
    .eq("learner_id", learnerId)
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(20);

  const entitlements = (data ?? []) as EntitlementRow[];
  const primary = entitlements[0];
  const entitlementStatus = primary?.status ?? "preview";
  const accessLevel = primary?.access_level ?? "preview";
  const capabilities = deriveCapabilities(entitlements);

  return {
    authenticated: true,
    learnerId,
    projectId,
    entitlementStatus,
    accessLevel,
    canAccessDashboard: true,
    ...capabilities,
  };
}
