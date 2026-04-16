import { ensureLearnerForCurrentUser } from "@/lib/auth/ensure-learner";

export async function getActiveProjectForCurrentUser() {
  const result = await ensureLearnerForCurrentUser();

  return {
    supabase: result.supabase,
    user: result.user,
    learnerId: result.learnerId,
    projectId: result.projectId,
    entitlementId: result.entitlementId,
  };
}
