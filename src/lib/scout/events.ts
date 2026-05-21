import { createAdminClient } from "@/lib/supabase/admin";

const ALLOWED_EVENTS = new Set([
  "extension_installed",
  "popup_opened",
  "scan_started",
  "scan_completed",
  "scan_failed",
  "save_to_workspace_clicked",
  "workspace_capture_opened",
  "workspace_auth_prompt_shown",
  "workspace_save_success",
  "workspace_save_failed",
  "upgrade_clicked",
]);

type ScoutEventInput = {
  eventName: string;
  learnerId?: string | null;
  authUserId?: string | null;
  anonymousId?: string | null;
  extensionId?: string | null;
  platform?: string | null;
  pageUrl?: string | null;
  userTier?: string | null;
  metadata?: Record<string, unknown>;
};

function cleanText(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLength);
}

function domainForUrl(pageUrl: string | null): string | null {
  if (!pageUrl) return null;
  try {
    return new URL(pageUrl).hostname.replace(/^www\./, "").slice(0, 255);
  } catch {
    return null;
  }
}

function cleanMetadata(metadata: unknown): Record<string, unknown> {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return {};
  try {
    return JSON.parse(JSON.stringify(metadata)) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export async function recordScoutEvent(input: ScoutEventInput): Promise<void> {
  const eventName = cleanText(input.eventName, 80);
  if (!eventName || !ALLOWED_EVENTS.has(eventName)) return;

  const pageUrl = cleanText(input.pageUrl, 1200);
  const supabase = createAdminClient();
  const { error } = await supabase.from("scout_events").insert({
    learner_id: input.learnerId ?? null,
    auth_user_id: input.authUserId ?? null,
    anonymous_id: cleanText(input.anonymousId, 120),
    extension_id: cleanText(input.extensionId, 120),
    event_name: eventName,
    platform: cleanText(input.platform, 60),
    domain: domainForUrl(pageUrl),
    page_url: pageUrl,
    user_tier: cleanText(input.userTier, 60),
    metadata: cleanMetadata(input.metadata),
  });

  if (error) {
    console.warn("[Scout analytics] Could not record event:", error.message);
  }
}
