"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PrimaryButton, SecondaryButton } from "@/components/design-system";
import { parseScannerImportPayloadParamDetailed } from "@/lib/scanner-import";

type CaptureState = "saving" | "error";

function trackScoutEvent(eventName: string, payload?: unknown, metadata?: Record<string, unknown>) {
  const sourcePayload = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
  void fetch("/api/scout/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      eventName,
      platform: typeof sourcePayload.sourcePlatform === "string" ? sourcePayload.sourcePlatform : undefined,
      pageUrl: typeof sourcePayload.sourceUrl === "string" ? sourcePayload.sourceUrl : undefined,
      metadata,
    }),
  }).catch(() => {});
}

export function CaptureIdeaClient({ payloadParam }: { payloadParam?: string }) {
  const router = useRouter();
  const started = useRef(false);
  const [state, setState] = useState<CaptureState>("saving");
  const [message, setMessage] = useState("Saving product to Scout Workspace...");

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    async function saveCapture() {
      const parsed = parseScannerImportPayloadParamDetailed(payloadParam);
      if (!parsed.ok) {
        trackScoutEvent("workspace_save_failed", undefined, { code: parsed.code, stage: "payload_parse" });
        router.replace(`/ideas?importError=${encodeURIComponent(parsed.code)}`);
        return;
      }

      trackScoutEvent("workspace_capture_opened", parsed.payload, { stage: "capture_page" });

      try {
        const response = await fetch("/api/ideas/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ payload: parsed.payload, autoUpdateDuplicate: true }),
        });
        const result = (await response.json().catch(() => ({}))) as {
          code?: string;
          duplicateUpdated?: boolean;
          error?: string;
          ideaId?: string;
        };

        if (response.status === 401) {
          trackScoutEvent("workspace_auth_prompt_shown", parsed.payload, { stage: "capture_page" });
          router.replace(`/login?next=${encodeURIComponent(`/ideas/capture?payload=${payloadParam ?? ""}`)}`);
          return;
        }

        if (!response.ok || !result.ideaId) {
          router.replace(`/ideas?importError=${encodeURIComponent(result.code || "failed")}`);
          return;
        }

        router.replace(`/ideas?imported=${encodeURIComponent(result.ideaId)}&importStatus=${result.duplicateUpdated ? "updated" : "added"}`);
      } catch {
        trackScoutEvent("workspace_save_failed", parsed.payload, { code: "network_error" });
        setState("error");
        setMessage("Scout could not save this product. Try again from the extension.");
      }
    }

    void saveCapture();
  }, [payloadParam, router]);

  return (
    <section className="mx-auto max-w-2xl rounded-xl border border-ink-100 bg-surface-raised p-8 text-center shadow-card">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-cobalt-100">
        {state === "saving" ? (
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-cobalt-600 border-t-transparent" />
        ) : (
          <span className="text-lg font-bold text-error-700">!</span>
        )}
      </div>
      <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.18em] text-cobalt-600">
        Scout Workspace
      </p>
      <h1 className="mt-2 font-[Manrope] text-2xl font-bold text-ink-900">
        {state === "saving" ? "Adding product" : "Could not save product"}
      </h1>
      <p className="mt-3 text-sm leading-6 text-ink-600">{message}</p>
      {state === "error" ? (
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <PrimaryButton href="/ideas">Open Workspace</PrimaryButton>
          <SecondaryButton href="/scout">Scout setup</SecondaryButton>
        </div>
      ) : null}
    </section>
  );
}
