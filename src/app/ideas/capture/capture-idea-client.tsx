"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PrimaryButton, SecondaryButton } from "@/components/design-system";
import { parseScannerImportPayloadParamDetailed } from "@/lib/scanner-import";

type CaptureState = "saving" | "saved" | "error";

const WORKSPACE_TOKEN_KEY = "scout_workspace_token";

type AnonymousProduct = {
  id: string;
  sourcePlatform: string | null;
  productTitle: string;
  productImageUrl: string | null;
  scannerScore: number | null;
  payload: {
    observedPrice?: string;
    observedReviewCount?: number;
    observedOrderCount?: number;
  } | null;
  createdAt: string;
};

type AnonymousWorkspaceSummary = {
  products: AnonymousProduct[];
  limit: number;
};

function trackScoutEvent(eventName: string, payload?: unknown, metadata?: Record<string, unknown>) {
  const sourcePayload = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
  void fetch("/api/scout/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      eventName,
      anonymousId: typeof metadata?.anonymousId === "string" ? metadata.anonymousId : undefined,
      extensionId: typeof metadata?.extensionId === "string" ? metadata.extensionId : undefined,
      platform: typeof sourcePayload.sourcePlatform === "string" ? sourcePayload.sourcePlatform : undefined,
      pageUrl: typeof sourcePayload.sourceUrl === "string" ? sourcePayload.sourceUrl : undefined,
      metadata,
    }),
  }).catch(() => {});
}

type CaptureIdeaClientProps = {
  payloadParam?: string;
  workspaceTokenParam?: string;
  anonymousIdParam?: string;
  extensionIdParam?: string;
};

function captureNextPath(payloadParam?: string, workspaceTokenParam?: string, anonymousIdParam?: string, extensionIdParam?: string) {
  const params = new URLSearchParams();
  if (payloadParam) params.set("payload", payloadParam);
  if (workspaceTokenParam) params.set("workspaceToken", workspaceTokenParam);
  if (anonymousIdParam) params.set("anonymousId", anonymousIdParam);
  if (extensionIdParam) params.set("extensionId", extensionIdParam);
  const query = params.toString();
  return `/ideas/capture${query ? `?${query}` : ""}`;
}

function scoreTone(score: number | null) {
  if (score === null) return "border-ink-100 bg-surface-sunken text-ink-500";
  if (score >= 70) return "border-success-100 bg-success-100 text-[#005e3f]";
  if (score > 40) return "border-amber-100 bg-[#fff8e6] text-[#835700]";
  return "border-error-100 bg-error-100 text-error-700";
}

function platformLabel(value: string | null) {
  if (value === "aliexpress") return "AliExpress";
  if (value === "amazon") return "Amazon";
  if (value === "shopify") return "Shopify";
  return "Source";
}

function compactNumber(value: number | undefined) {
  return value === undefined ? "-" : value.toLocaleString("en-GB");
}

export function CaptureIdeaClient({
  anonymousIdParam,
  extensionIdParam,
  payloadParam,
  workspaceTokenParam,
}: CaptureIdeaClientProps) {
  const router = useRouter();
  const started = useRef(false);
  const [state, setState] = useState<CaptureState>("saving");
  const [message, setMessage] = useState("Saving product to Scout Workspace...");
  const [savedTitle, setSavedTitle] = useState("");
  const [workspaceSummary, setWorkspaceSummary] = useState<AnonymousWorkspaceSummary | null>(null);

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

      const hasAnonymousWorkspace = Boolean(workspaceTokenParam);
      trackScoutEvent(
        hasAnonymousWorkspace ? "anonymous_workspace_capture_opened" : "workspace_capture_opened",
        parsed.payload,
        {
          stage: "capture_page",
          anonymousId: anonymousIdParam,
          extensionId: extensionIdParam,
        },
      );

      try {
        const response = await fetch("/api/ideas/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            payload: parsed.payload,
            autoUpdateDuplicate: true,
            workspaceToken: workspaceTokenParam,
            anonymousId: anonymousIdParam,
            extensionId: extensionIdParam,
          }),
        });
        const result = (await response.json().catch(() => ({}))) as {
          anonymous?: boolean;
          code?: string;
          duplicateUpdated?: boolean;
          error?: string;
          ideaId?: string;
          limitMessage?: string;
          productId?: string;
          productTitle?: string;
        };

        if (response.status === 401) {
          trackScoutEvent("workspace_auth_prompt_shown", parsed.payload, { stage: "capture_page" });
          router.replace(`/login?next=${encodeURIComponent(captureNextPath(payloadParam, workspaceTokenParam, anonymousIdParam, extensionIdParam))}`);
          return;
        }

        if (!response.ok) {
          if (workspaceTokenParam) {
            setState("error");
            setMessage(result.limitMessage || result.error || "Scout could not save this product. Try again from the extension.");
            return;
          }
          router.replace(`/ideas?importError=${encodeURIComponent(result.code || "failed")}`);
          return;
        }

        if (result.anonymous && result.productId) {
          const title = result.productTitle || parsed.payload.displayTitle || parsed.payload.productTitle || "Product";
          if (workspaceTokenParam) {
            window.localStorage.setItem(WORKSPACE_TOKEN_KEY, workspaceTokenParam);
            const workspaceResponse = await fetch("/api/ideas/anonymous", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ workspaceToken: workspaceTokenParam }),
            });
            const workspacePayload = (await workspaceResponse.json().catch(() => null)) as AnonymousWorkspaceSummary | null;
            if (workspaceResponse.ok && workspacePayload?.products) {
              setWorkspaceSummary(workspacePayload);
            }
          }
          trackScoutEvent("anonymous_workspace_signup_prompt_shown", parsed.payload, {
            anonymousId: anonymousIdParam,
            extensionId: extensionIdParam,
            stage: "capture_page",
            productId: result.productId,
          });
          setSavedTitle(title);
          setMessage(result.duplicateUpdated
            ? "This product is already in your temporary Scout Workspace."
            : "Saved to your temporary Scout Workspace.");
          setState("saved");
          return;
        }

        if (!result.ideaId) {
          router.replace(`/ideas?importError=${encodeURIComponent(result.code || "failed")}`);
          return;
        }

        router.replace(`/ideas?imported=${encodeURIComponent(result.ideaId)}&importStatus=${result.duplicateUpdated ? "updated" : "added"}`);
      } catch {
        trackScoutEvent(workspaceTokenParam ? "anonymous_workspace_save_failed" : "workspace_save_failed", parsed.payload, { code: "network_error" });
        setState("error");
        setMessage("Scout could not save this product. Try again from the extension.");
      }
    }

    void saveCapture();
  }, [anonymousIdParam, extensionIdParam, payloadParam, router, workspaceTokenParam]);

  return (
    <section className="mx-auto max-w-4xl rounded-xl border border-ink-100 bg-surface-raised p-8 text-center shadow-card">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-cobalt-100">
        {state === "saving" ? (
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-cobalt-600 border-t-transparent" />
        ) : state === "saved" ? (
          <span className="text-lg font-bold text-success-700">✓</span>
        ) : (
          <span className="text-lg font-bold text-error-700">!</span>
        )}
      </div>
      <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.18em] text-cobalt-600">
        Scout Workspace
      </p>
      <h1 className="mt-2 font-[Manrope] text-2xl font-bold text-ink-900">
        {state === "saving" ? "Adding product" : state === "saved" ? "Product saved" : "Could not save product"}
      </h1>
      {state === "saved" && savedTitle ? (
        <p className="mt-3 rounded-lg bg-surface-sunken px-4 py-3 text-sm font-semibold text-ink-800">
          {savedTitle}
        </p>
      ) : null}
      <p className="mt-3 text-sm leading-6 text-ink-600">{message}</p>
      {state === "saved" && workspaceSummary?.products.length ? (
        <div className="mt-6 overflow-hidden rounded-xl border border-ink-100 text-left">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 bg-surface-sunken px-4 py-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-cobalt-600">
                Temporary shortlist
              </p>
              <p className="mt-1 text-sm text-ink-600">
                {workspaceSummary.products.length} of {workspaceSummary.limit} products saved before account setup
              </p>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-ink-500">
              Preview
            </span>
          </div>
          <div className="divide-y divide-ink-100">
            {workspaceSummary.products.slice(0, 5).map((product) => (
              <div key={product.id} className="grid gap-3 bg-white px-4 py-4 sm:grid-cols-[minmax(0,1fr)_96px_120px] sm:items-center">
                <div className="flex min-w-0 items-center gap-3">
                  {product.productImageUrl ? (
                    <img
                      src={product.productImageUrl}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded-lg border border-ink-100 object-cover"
                    />
                  ) : (
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-dashed border-ink-100 bg-surface-sunken text-[9px] font-bold uppercase tracking-[0.08em] text-ink-300">
                      Image
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-sm font-semibold text-ink-900">{product.productTitle}</p>
                    <p className="mt-1 text-xs text-ink-500">
                      {platformLabel(product.sourcePlatform)} · {product.payload?.observedPrice || "Price not found"}
                    </p>
                  </div>
                </div>
                <div>
                  <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${scoreTone(product.scannerScore)}`}>
                    {product.scannerScore === null ? "No score" : `${product.scannerScore} score`}
                  </span>
                </div>
                <p className="text-xs font-semibold text-ink-500">
                  {compactNumber(product.payload?.observedOrderCount)} orders · {compactNumber(product.payload?.observedReviewCount)} reviews
                </p>
              </div>
            ))}
          </div>
          {workspaceSummary.products.length > 5 ? (
            <p className="border-t border-ink-100 bg-surface-sunken px-4 py-3 text-sm text-ink-600">
              {workspaceSummary.products.length - 5} more saved products are waiting in the full preview.
            </p>
          ) : null}
        </div>
      ) : null}
      {state === "saved" ? (
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <PrimaryButton href={`/signup?next=${encodeURIComponent("/ideas/anonymous?claim=1")}`}>
            Keep this workspace
          </PrimaryButton>
          <SecondaryButton href="/ideas/anonymous">Open full preview</SecondaryButton>
        </div>
      ) : state === "error" ? (
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <PrimaryButton href="/ideas">Open Workspace</PrimaryButton>
          <SecondaryButton href="/scout">Scout setup</SecondaryButton>
        </div>
      ) : null}
    </section>
  );
}
