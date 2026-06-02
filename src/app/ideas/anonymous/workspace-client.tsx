"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PrimaryButton, SecondaryButton } from "@/components/design-system";

const WORKSPACE_TOKEN_KEY = "scout_workspace_token";

type AnonymousProduct = {
  id: string;
  sourceUrl: string;
  sourcePlatform: string | null;
  productTitle: string;
  productImageUrl: string | null;
  scannerScore: number | null;
  payload: {
    observedPrice?: string;
    observedPriceType?: string;
    observedRating?: string;
    observedReviewCount?: number;
    observedOrderCount?: number;
    missingSignals?: string[];
    demandEvidence?: string;
    competitionNotes?: string;
    estimatedProductCost?: string;
    estimatedSellingPrice?: string;
    platformFees?: string;
  } | null;
  draft: {
    productCost?: string;
    sellingPrice?: string;
    notes?: string;
  } | null;
  createdAt: string;
  updatedAt: string;
};

type WorkspacePayload = {
  products: AnonymousProduct[];
  limit: number;
  remaining: number;
  claimed: boolean;
};

type LoadState = "loading" | "ready" | "empty" | "error" | "claiming" | "claimed";

function scoreTone(score: number | null) {
  if (score === null) return "border-ink-100 bg-surface-sunken text-ink-500";
  if (score >= 70) return "border-success-100 bg-success-100 text-[#005e3f]";
  if (score > 40) return "border-amber-100 bg-[#fff8e6] text-[#835700]";
  return "border-error-100 bg-error-100 text-error-700";
}

function formatDate(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function numberLabel(value: number | undefined) {
  return value === undefined ? "-" : value.toLocaleString("en-GB");
}

function moneyLabel(value: string | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) return "-";
  return /^[£$€]/.test(trimmed) ? trimmed : `£${trimmed}`;
}

function platformLabel(value: string | null) {
  if (value === "aliexpress") return "AliExpress";
  if (value === "amazon") return "Amazon";
  if (value === "shopify") return "Shopify";
  return "Source";
}

function track(eventName: string, metadata?: Record<string, unknown>) {
  void fetch("/api/scout/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ eventName, metadata }),
  }).catch(() => {});
}

function TokenMissing() {
  return (
    <section className="rounded-xl border border-dashed border-ink-100 bg-surface-raised p-8">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cobalt-600">
        Temporary Workspace
      </p>
      <h1 className="mt-2 font-[Manrope] text-2xl font-bold text-ink-900">
        No temporary workspace found
      </h1>
      <p className="mt-3 max-w-[620px] text-sm leading-7 text-ink-600">
        Save a product from Scout and this page will show the shortlist before you create an account.
      </p>
      <div className="mt-5">
        <PrimaryButton href="/scout">Open Scout setup</PrimaryButton>
      </div>
    </section>
  );
}

function LockedValue({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-dashed border-ink-100 bg-surface-sunken p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-500">{title}</p>
      <p className="mt-2 text-sm leading-6 text-ink-600">{body}</p>
    </div>
  );
}

export function AnonymousWorkspaceClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shouldClaim = searchParams.get("claim") === "1";
  const [workspaceToken, setWorkspaceToken] = useState("");
  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState("");
  const [workspace, setWorkspace] = useState<WorkspacePayload | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  const selectedProduct = useMemo(
    () => workspace?.products.find((product) => product.id === selectedProductId) ?? workspace?.products[0] ?? null,
    [selectedProductId, workspace?.products],
  );

  useEffect(() => {
    async function load() {
      const token = window.localStorage.getItem(WORKSPACE_TOKEN_KEY) ?? "";
      await Promise.resolve();
      setWorkspaceToken(token);
      if (!token) {
        setState("empty");
        return;
      }

      try {
        const response = await fetch("/api/ideas/anonymous", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workspaceToken: token }),
        });
        const payload = (await response.json().catch(() => ({}))) as WorkspacePayload & { error?: string };
        if (!response.ok) {
          setError(payload.error || "Temporary workspace could not be loaded.");
          setState("error");
          return;
        }
        setWorkspace(payload);
        setSelectedProductId(payload.products[0]?.id ?? null);
        setState("ready");
        track("anonymous_workspace_preview_viewed", { productCount: payload.products.length });
      } catch {
        setError("Temporary workspace could not be loaded.");
        setState("error");
      }
    }

    void load();
  }, []);

  useEffect(() => {
    if (!shouldClaim || !workspaceToken || state !== "ready") return;

    async function claim() {
      setState("claiming");
      try {
        const response = await fetch("/api/ideas/anonymous/claim", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workspaceToken }),
        });
        const result = (await response.json().catch(() => ({}))) as { code?: string; error?: string; ideaIds?: string[] };
        if (response.status === 401) {
          router.replace(`/signup?next=${encodeURIComponent("/ideas/anonymous?claim=1")}`);
          return;
        }
        if (!response.ok) {
          setError(result.error || "Temporary workspace could not be claimed.");
          setState("error");
          return;
        }
        window.localStorage.removeItem(WORKSPACE_TOKEN_KEY);
        setState("claimed");
        router.replace(`/ideas?importStatus=claimed&imported=${encodeURIComponent(result.ideaIds?.[0] ?? "")}`);
      } catch {
        setError("Temporary workspace could not be claimed.");
        setState("error");
      }
    }

    void claim();
  }, [router, shouldClaim, state, workspaceToken]);

  if (state === "empty") return <main className="min-h-screen bg-surface-canvas px-6 py-10 text-ink-900"><div className="mx-auto max-w-6xl"><TokenMissing /></div></main>;

  return (
    <main className="min-h-screen bg-surface-canvas px-6 py-10 text-ink-900 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-5">
        <section className="rounded-xl border border-ink-100 bg-surface-raised px-5 py-4 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cobalt-600">
                Temporary Scout Workspace
              </p>
              <h1 className="mt-1 font-[Manrope] text-2xl font-bold text-ink-900">
                Your product shortlist
              </h1>
              <p className="mt-1 max-w-[720px] text-sm leading-6 text-ink-600">
                Review what Scout captured before you create an account. Keep the workspace to unlock notes, comparisons, and saved history.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <PrimaryButton href={`/signup?next=${encodeURIComponent("/ideas/anonymous?claim=1")}`}>
                Keep this workspace
              </PrimaryButton>
              <SecondaryButton href="/scout">Scan more</SecondaryButton>
            </div>
          </div>
        </section>

        {state === "loading" || state === "claiming" ? (
          <section className="rounded-xl border border-ink-100 bg-surface-raised p-8 text-center shadow-card">
            <span className="mx-auto block h-6 w-6 animate-spin rounded-full border-2 border-cobalt-600 border-t-transparent" />
            <p className="mt-4 text-sm font-semibold text-ink-700">
              {state === "claiming" ? "Moving products into your account..." : "Loading temporary workspace..."}
            </p>
          </section>
        ) : state === "error" ? (
          <section className="rounded-xl border border-error-100 bg-surface-raised p-6 text-sm leading-6 text-ink-700">
            <h2 className="font-[Manrope] text-lg font-bold text-ink-900">Workspace could not be loaded</h2>
            <p className="mt-2 text-ink-600">{error}</p>
          </section>
        ) : workspace?.products.length === 0 ? (
          <TokenMissing />
        ) : (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
            <section className="overflow-hidden rounded-xl border border-ink-100 bg-surface-raised shadow-card">
              <div className="border-b border-ink-100 px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="font-[Manrope] text-lg font-bold text-ink-900">Captured products</h2>
                    <p className="mt-1 text-sm text-ink-500">
                      {workspace!.products.length} of {workspace!.limit} temporary saves used
                    </p>
                  </div>
                  <span className="rounded-full bg-[#eef4ff] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-cobalt-600">
                    Preview
                  </span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-ink-100 text-sm">
                  <thead className="bg-surface-sunken">
                    <tr>
                      <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.14em] text-ink-500">Product</th>
                      <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-[0.14em] text-ink-500">Score</th>
                      <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-[0.14em] text-ink-500">Price</th>
                      <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-[0.14em] text-ink-500">Signal</th>
                      <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-[0.14em] text-ink-500">Saved</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100">
                    {workspace!.products.map((product) => (
                      <tr
                        key={product.id}
                        className={selectedProduct?.id === product.id ? "bg-[#f7faff]" : "bg-white"}
                      >
                        <td className="px-4 py-4">
                          <button
                            type="button"
                            onClick={() => setSelectedProductId(product.id)}
                            className="flex max-w-[360px] items-center gap-3 text-left"
                          >
                            {product.productImageUrl ? (
                              <img src={product.productImageUrl} alt="" className="h-12 w-12 rounded-lg border border-ink-100 object-cover" />
                            ) : (
                              <span className="flex h-12 w-12 items-center justify-center rounded-lg border border-dashed border-ink-100 bg-surface-sunken text-[9px] font-bold uppercase tracking-[0.08em] text-ink-300">Image</span>
                            )}
                            <span>
                              <span className="line-clamp-2 font-semibold text-ink-900">{product.productTitle}</span>
                              <span className="mt-1 block text-xs text-ink-500">{platformLabel(product.sourcePlatform)}</span>
                            </span>
                          </button>
                        </td>
                        <td className="px-3 py-4">
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${scoreTone(product.scannerScore)}`}>
                            {product.scannerScore === null ? "No score" : product.scannerScore}
                          </span>
                        </td>
                        <td className="px-3 py-4 text-ink-700">{product.payload?.observedPrice || "-"}</td>
                        <td className="px-3 py-4 text-ink-700">
                          {numberLabel(product.payload?.observedOrderCount)} orders · {numberLabel(product.payload?.observedReviewCount)} reviews
                        </td>
                        <td className="px-4 py-4 text-right text-xs text-ink-500">{formatDate(product.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <aside className="space-y-4">
              <section className="rounded-xl border border-ink-100 bg-surface-raised p-5 shadow-card">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cobalt-600">Product preview</p>
                <h2 className="mt-2 font-[Manrope] text-xl font-bold text-ink-900">{selectedProduct?.productTitle ?? "Select a product"}</h2>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg bg-surface-sunken p-3">
                    <dt className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-500">Observed price</dt>
                    <dd className="mt-1 font-semibold text-ink-900">{selectedProduct?.payload?.observedPrice || "-"}</dd>
                  </div>
                  <div className="rounded-lg bg-surface-sunken p-3">
                    <dt className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-500">Est. margin inputs</dt>
                    <dd className="mt-1 font-semibold text-ink-900">
                      {moneyLabel(selectedProduct?.draft?.sellingPrice || selectedProduct?.payload?.estimatedSellingPrice)}
                    </dd>
                  </div>
                  <div className="rounded-lg bg-surface-sunken p-3">
                    <dt className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-500">Rating</dt>
                    <dd className="mt-1 font-semibold text-ink-900">{selectedProduct?.payload?.observedRating || "-"}</dd>
                  </div>
                  <div className="rounded-lg bg-surface-sunken p-3">
                    <dt className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-500">Missing signals</dt>
                    <dd className="mt-1 font-semibold text-ink-900">{selectedProduct?.payload?.missingSignals?.length || 0}</dd>
                  </div>
                </dl>
                {selectedProduct?.sourceUrl ? (
                  <Link
                    href={selectedProduct.sourceUrl}
                    target="_blank"
                    className="mt-4 inline-flex text-sm font-semibold text-cobalt-600 underline-offset-4 hover:underline"
                  >
                    Open source listing
                  </Link>
                ) : null}
              </section>

              <LockedValue
                title="Unlock notes"
                body="Create an account to edit research notes, mark products as shortlist/testing, and keep your decision history."
              />
              <LockedValue
                title="Unlock comparison"
                body="Registered workspaces can compare margin inputs, scores, and testing metrics across product candidates."
              />
              <LockedValue
                title="Keep across devices"
                body="This preview is tied to this browser. Claim it to keep the products in your Calm Commerce account."
              />
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
