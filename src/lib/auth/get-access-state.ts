import { getActiveProjectForCurrentUser } from "@/lib/auth/get-active-project";

export type LearnerAccessState = {
  authenticated: boolean;
  learnerId: string | null;
  projectId: string | null;
  entitlementStatus: "preview" | "active" | "expired" | "cancelled" | null;
  accessLevel: "preview" | "full" | null;
  canAccessDashboard: boolean;
  canAccessPaidContent: boolean;
};

export async function getAccessStateForCurrentUser(): Promise<LearnerAccessState> {
  const { supabase, user, learnerId, projectId } = await getActiveProjectForCurrentUser();

  if (!user) {
    return {
      authenticated: false,
      learnerId: null,
      projectId: null,
      entitlementStatus: null,
      accessLevel: null,
      canAccessDashboard: false,
      canAccessPaidContent: false,
    };
  }

  if (!learnerId) {
    return {
      authenticated: true,
      learnerId: null,
      projectId: null,
      entitlementStatus: null,
      accessLevel: null,
      canAccessDashboard: true,
      canAccessPaidContent: false,
    };
  }

  const { data: entitlement } = await supabase
    .from("learner_entitlements")
    .select("status, access_level, created_at, updated_at")
    .eq("learner_id", learnerId)
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const entitlementStatus = (entitlement?.status as LearnerAccessState["entitlementStatus"]) ?? "preview";
  const accessLevel = (entitlement?.access_level as LearnerAccessState["accessLevel"]) ?? "preview";
  const canAccessPaidContent = entitlementStatus === "active" && accessLevel === "full";

  return {
    authenticated: true,
    learnerId,
    projectId,
    entitlementStatus,
    accessLevel,
    canAccessDashboard: true,
    canAccessPaidContent,
  };
}
