import type { LearnerAccessState } from "@/lib/auth/get-access-state";

export type ScoutWorkspaceLimit = {
  limit: number | null;
  label: "free" | "basic" | "pro" | "os";
};

export function getScoutWorkspaceLimit(access: LearnerAccessState): ScoutWorkspaceLimit {
  if (access.activeProducts.includes("calm_commerce_os")) {
    return { limit: null, label: "os" };
  }
  if (access.activeProducts.includes("research_workspace")) {
    return { limit: null, label: "pro" };
  }
  if (access.activeProducts.includes("scanner_extension")) {
    return { limit: 50, label: "basic" };
  }
  return { limit: 3, label: "free" };
}

export function canSaveMoreScoutProducts(count: number, access: LearnerAccessState): boolean {
  const workspaceLimit = getScoutWorkspaceLimit(access);
  return workspaceLimit.limit === null || count < workspaceLimit.limit;
}

export function scoutLimitMessage(count: number, access: LearnerAccessState): string {
  const workspaceLimit = getScoutWorkspaceLimit(access);
  if (workspaceLimit.limit === null) {
    return "Your plan includes ongoing Scout Workspace saves.";
  }
  const remaining = Math.max(0, workspaceLimit.limit - count);
  if (workspaceLimit.label === "free") {
    return `${remaining} of ${workspaceLimit.limit} free Scout saves remaining.`;
  }
  return `${remaining} of ${workspaceLimit.limit} Scout Basic saves remaining.`;
}
