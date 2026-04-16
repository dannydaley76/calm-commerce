import { createClient } from "@/lib/supabase/server";

type LearnerBootstrapResult = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  user: { id: string; email?: string | null } | null;
  learnerId: string | null;
  projectId: string | null;
  entitlementId: string | null;
};

async function ensureDefaultProject(
  supabase: Awaited<ReturnType<typeof createClient>>,
  learnerId: string,
) {
  const { data: existingProject, error: projectLookupError } = await supabase
    .from("projects")
    .select("id, status")
    .eq("learner_id", learnerId)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (projectLookupError) throw projectLookupError;

  if (existingProject?.id) return existingProject.id as string;

  const { data: createdProject, error: createProjectError } = await supabase
    .from("projects")
    .insert({ learner_id: learnerId, name: "My first store", status: "active" })
    .select("id")
    .single();

  if (createProjectError) throw createProjectError;

  return createdProject.id as string;
}

async function ensurePreviewEntitlement(
  supabase: Awaited<ReturnType<typeof createClient>>,
  learnerId: string,
) {
  const { data: existingEntitlement, error: entitlementLookupError } = await supabase
    .from("learner_entitlements")
    .select("id, status, access_level")
    .eq("learner_id", learnerId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (entitlementLookupError) throw entitlementLookupError;

  if (existingEntitlement?.id) return existingEntitlement.id as string;

  const { data: createdEntitlement, error: createEntitlementError } = await supabase
    .from("learner_entitlements")
    .insert({
      learner_id: learnerId,
      status: "preview",
      access_level: "preview",
      provider: "stripe",
    })
    .select("id")
    .single();

  if (createEntitlementError) throw createEntitlementError;

  return createdEntitlement.id as string;
}

export async function ensureLearnerForCurrentUser(): Promise<LearnerBootstrapResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, learnerId: null, projectId: null, entitlementId: null, user: null };
  }

  const { data: existing, error: selectError } = await supabase
    .from("learners")
    .select("id, email")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (selectError) throw selectError;

  let learnerId: string | null = existing?.id ? (existing.id as string) : null;

  if (!learnerId && user.email) {
    const { data: existingByEmail, error: emailLookupError } = await supabase
      .from("learners")
      .select("id, auth_user_id")
      .eq("email", user.email)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (emailLookupError) throw emailLookupError;

    if (existingByEmail?.id) {
      const { error: relinkError } = await supabase
        .from("learners")
        .update({ auth_user_id: user.id, email: user.email })
        .eq("id", existingByEmail.id);

      if (relinkError) throw relinkError;

      learnerId = existingByEmail.id as string;
    }
  }

  if (!learnerId) {
    const { data: created, error: insertError } = await supabase
      .from("learners")
      .insert({ auth_user_id: user.id, email: user.email ?? null })
      .select("id")
      .single();

    if (insertError) throw insertError;
    learnerId = created.id as string;
  }

  const projectId = await ensureDefaultProject(supabase, learnerId);
  const entitlementId = await ensurePreviewEntitlement(supabase, learnerId);

  return { supabase, learnerId, projectId, entitlementId, user };
}
