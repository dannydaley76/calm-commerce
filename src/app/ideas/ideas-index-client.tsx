"use client";

import { type FocusEvent, useEffect, useMemo, useState } from "react";
import { ActionMenu, TrashIcon } from "@/components/ActionMenu";
import { PrimaryButton } from "@/components/design-system";
import { formatDate } from "@/lib/format-date";
import { calculateUnitEconomics } from "@/lib/v2/worksheets/review-unit-economics";
import {
  type ProductIdeaLifecycle,
  type ProductIdeaLifecycleStatus,
  type ProductIdeaWorkspaceStatus,
} from "@/lib/v2/worksheets/product-idea-lifecycle";

type SortKey = "newest" | "priority" | "name" | "status" | "scanner_score" | "selling_price" | "margin" | "orders" | "reviews" | "rating" | "metrics";
type ViewFilter = "new" | "shortlist" | "reviewing" | "testing" | "archived" | "all";

const WORKSPACE_STATUS_OPTIONS: Array<{ value: ProductIdeaWorkspaceStatus; label: string }> = [
  { value: "new", label: "New" },
  { value: "reviewing", label: "Reviewing" },
  { value: "shortlist", label: "Shortlist" },
  { value: "testing", label: "Testing" },
  { value: "archived", label: "Archived" },
];

const VIEW_FILTERS: Array<{ value: ViewFilter; label: string }> = [
  { value: "new", label: "New" },
  { value: "shortlist", label: "Shortlist" },
  { value: "reviewing", label: "Reviewing" },
  { value: "testing", label: "Testing" },
  { value: "archived", label: "Archived" },
  { value: "all", label: "All" },
];

function lifecycleTone(status: ProductIdeaLifecycleStatus): string {
  if (status === "proceed") return "bg-success-100 text-[#005e3f]";
  if (status === "pivot" || status === "retest") return "bg-[#fff8e6] text-[#835700]";
  if (status === "test_running" || status === "test_reviewed" || status === "test_planned") {
    return "bg-[#eef4ff] text-cobalt-600";
  }
  return "bg-surface-sunken text-ink-500";
}

function workspaceDotTone(status: ProductIdeaWorkspaceStatus): string {
  if (status === "shortlist") return "bg-[#007a52]";
  if (status === "reviewing") return "bg-cobalt-600";
  if (status === "testing") return "bg-[#b7791f]";
  if (status === "archived") return "bg-ink-300";
  return "bg-ink-400";
}

function workspaceSelectorTone(status: ProductIdeaWorkspaceStatus): string {
  if (status === "shortlist") return "border-success-100 bg-success-100 text-[#005e3f] hover:bg-[#d9f4e8]";
  if (status === "reviewing") return "border-cobalt-100 bg-[#eef4ff] text-cobalt-600 hover:bg-[#e2ecff]";
  if (status === "testing") return "border-amber-100 bg-[#fff8e6] text-[#835700] hover:bg-[#fff0c2]";
  if (status === "archived") return "border-ink-100 bg-surface-sunken text-ink-500 hover:bg-ink-50";
  return "border-ink-100 bg-surface-sunken text-ink-700 hover:bg-ink-50";
}

function scoreTone(score: number | null): string {
  if (score === null) return "border-ink-100 bg-surface-sunken text-ink-500";
  if (score >= 70) return "border-success-100 bg-success-100 text-[#005e3f]";
  if (score > 40) return "border-amber-100 bg-[#fff8e6] text-[#835700]";
  return "border-error-100 bg-error-100 text-error-700";
}

function scoreNumberTone(score: number | null): string {
  if (score === null) return "text-ink-500";
  if (score >= 70) return "text-[#005e3f]";
  if (score > 40) return "text-[#835700]";
  return "text-error-700";
}

function compactScoreLabel(idea: ProductIdeaLifecycle): string {
  if (idea.scannerScore === null) return "Not scored";
  if (idea.scannerScore >= 70) return "Strong";
  if (idea.scannerScore > 40) return "Moderate";
  return "Weak";
}

function demandTone(score: number | null): string {
  if (score === null) return "border-transparent bg-surface-sunken text-ink-500";
  if (score <= 20) return "border-error-100 bg-error-100 text-error-700";
  if (score <= 60) return "border-amber-100 bg-[#fff8e6] text-[#835700]";
  return "border-success-100 bg-success-100 text-[#005e3f]";
}

function competitionTone(score: number | null): string {
  if (score === null) return "border-transparent bg-surface-sunken text-ink-500";
  if (score <= 30) return "border-success-100 bg-success-100 text-[#005e3f]";
  if (score <= 70) return "border-amber-100 bg-[#fff8e6] text-[#835700]";
  return "border-error-100 bg-error-100 text-error-700";
}

function flagParts(value: string | null): string[] {
  return value?.split(/\n|,/).map((flag) => flag.trim()).filter(Boolean) ?? [];
}

function flagsTone(value: string | null): string {
  const flags = flagParts(value);
  if (flags.length === 0) return "border-transparent bg-surface-sunken text-ink-500";
  const hasSevereFlag = flags.some((flag) => /ban|counterfeit|restricted|illegal|prohibited/i.test(flag));
  return hasSevereFlag
    ? "border-error-100 bg-error-100 text-error-700"
    : "border-amber-100 bg-[#fff8e6] text-[#835700]";
}

function flagsLabel(value: string | null): string {
  const labels = flagParts(value).map((flag) => {
    if (/season/i.test(flag)) return "Seasonal";
    if (/trend/i.test(flag)) return "Trending down";
    if (/ban/i.test(flag)) return "Banned";
    if (/counterfeit/i.test(flag)) return "Counterfeit";
    return "Flagged";
  });
  return labels.length > 0 ? labels.join(", ") : "None";
}

function ideaDetailHref(idea: ProductIdeaLifecycle): string {
  return `/ideas/${encodeURIComponent(idea.ideaId)}`;
}

function ideaPrimaryActionHref(idea: ProductIdeaLifecycle): string {
  return idea.nextAction.label === "Define customer"
    ? idea.nextAction.href
    : ideaDetailHref(idea);
}

function compactActionLabel(label: string): string {
  const labels: Record<string, string> = {
    "Add economics": "Add numbers",
    "Review and choose": "Review",
    "Plan marketplace test": "Test",
    "Log test metrics": "Log metrics",
    "Update test results": "Update test",
    "Make test decision": "Decide",
    "Define customer": "Continue",
    "Plan retest": "Retest",
    "Add next idea": "Add idea",
  };
  return labels[label] ?? label;
}

function clippedIdeaName(name: string, max = 58): string {
  return name.length > max ? `${name.slice(0, max - 3).trim()}...` : name;
}

function marketplaceTitle(idea: ProductIdeaLifecycle): string | null {
  const raw = idea.rawProductTitle?.trim();
  if (!raw || raw === idea.label) return null;
  return raw;
}

function ideaActionPriority(status: ProductIdeaLifecycleStatus): number {
  const priority: Record<ProductIdeaLifecycleStatus, number> = {
    test_reviewed: 1,
    test_running: 2,
    test_planned: 3,
    proceed: 4,
    selected: 5,
    retest: 6,
    economics_checked: 7,
    draft: 8,
    pivot: 9,
  };
  return priority[status];
}

function numericValue(value: string | null): number {
  if (!value) return Number.NEGATIVE_INFINITY;
  const parsed = Number.parseFloat(value.replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(parsed) ? parsed : Number.NEGATIVE_INFINITY;
}

function observedNumericValue(value: string | null): number {
  return numericValue(value);
}

function economicsForIdea(idea: ProductIdeaLifecycle) {
  return calculateUnitEconomics({
    selling_price: idea.sellingPrice ?? undefined,
    product_cost: idea.productCost ?? undefined,
    shipping_to_customer: idea.shippingToCustomer ?? undefined,
    platform_fees: idea.platformFees ?? undefined,
  });
}

function formatMoneyValue(value: string | null): string {
  return value?.trim() || "";
}

function displayMoneyValue(value: string, empty = "£ —"): string {
  const trimmed = value.trim();
  if (!trimmed) return empty;
  return /^[£$€]/.test(trimmed) ? trimmed : `${currencySymbol()}${trimmed}`;
}

function observedPriceLabel(idea: ProductIdeaLifecycle): string | null {
  if (!idea.observedPrice) return null;
  if (idea.observedPriceType === "supplier_cost") return `Observed supplier ${idea.observedPrice}`;
  if (idea.observedPriceType === "retail_price") return `Observed retail ${idea.observedPrice}`;
  return `Observed ${idea.observedPrice}`;
}

function formatMarginPercent(value: number | null): string {
  if (value === null) return "";
  return `${value.toFixed(0)}%`;
}

function marginTone(value: number | null): string {
  if (value === null) return "border-ink-100 bg-surface-sunken text-ink-500";
  if (value <= 0) return "border-error-100 bg-error-100 text-error-700";
  if (value >= 40) return "border-success-100 bg-success-100 text-[#005e3f]";
  if (value >= 20) return "border-amber-100 bg-[#fff8e6] text-[#835700]";
  return "border-error-100 bg-error-100 text-error-700";
}

function simpleMarginPercent(sellingPrice: string, productCost: string): number | null {
  const sell = numericValue(sellingPrice);
  const cost = numericValue(productCost);
  if (!Number.isFinite(sell) || !Number.isFinite(cost) || sell <= 0) return null;
  return ((sell - cost) / sell) * 100;
}

function compactNumber(value: string | null): string {
  const parsed = numericValue(value);
  if (!Number.isFinite(parsed)) return value?.trim() || "-";
  return parsed.toLocaleString("en-GB");
}

function ratingText(value: string | null): string {
  return value?.trim() ? ` · ★ ${value.trim()}` : "";
}

function currencySymbol() {
  return "£";
}

function scoreValue(value: number | null): number {
  return value === null ? Number.NEGATIVE_INFINITY : value;
}

function timeValue(value: string | null): number {
  if (!value) return Number.NEGATIVE_INFINITY;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : Number.NEGATIVE_INFINITY;
}

function sortIdeas(ideas: ProductIdeaLifecycle[], sortKey: SortKey): ProductIdeaLifecycle[] {
  return [...ideas].sort((a, b) => {
    if (sortKey === "newest") return timeValue(b.scoutCapturedAt) - timeValue(a.scoutCapturedAt);
    if (sortKey === "name") return a.label.localeCompare(b.label);
    if (sortKey === "status") return a.statusLabel.localeCompare(b.statusLabel);
    if (sortKey === "scanner_score") return scoreValue(b.scannerScore) - scoreValue(a.scannerScore);
    if (sortKey === "selling_price") return numericValue(b.sellingPrice) - numericValue(a.sellingPrice);
    if (sortKey === "margin") return (economicsForIdea(b).marginPercent ?? Number.NEGATIVE_INFINITY) - (economicsForIdea(a).marginPercent ?? Number.NEGATIVE_INFINITY);
    if (sortKey === "orders") return observedNumericValue(b.observedOrderCount) - observedNumericValue(a.observedOrderCount);
    if (sortKey === "reviews") return observedNumericValue(b.observedReviewCount) - observedNumericValue(a.observedReviewCount);
    if (sortKey === "rating") return observedNumericValue(b.observedRating) - observedNumericValue(a.observedRating);
    if (sortKey === "metrics") return b.metricEntries.length - a.metricEntries.length;
    return ideaActionPriority(a.status) - ideaActionPriority(b.status);
  });
}

async function updateWorkspaceIdea(
  ideaId: string,
  action: "set_status" | "archive" | "restore" | "delete" | "update_economics",
  status?: ProductIdeaWorkspaceStatus,
  economics?: { sellingPrice?: string; productCost?: string },
) {
  const response = await fetch("/api/ideas/workspace", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ideaId, action, status, ...economics }),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(payload.error || "Unable to update Scout Workspace.");
  }
}

function IdeaImage({ idea }: { idea: ProductIdeaLifecycle }) {
  if (idea.productImageUrl) {
    return (
      <img
        src={idea.productImageUrl}
        alt=""
        className="h-14 w-14 rounded-lg border border-ink-100 object-cover"
      />
    );
  }

  return (
    <div
      aria-label="No product image"
      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-dashed border-ink-100 bg-surface-sunken text-[9px] font-bold uppercase tracking-[0.08em] text-ink-300"
    >
      Image
    </div>
  );
}

function ScoreBadge({ idea }: { idea: ProductIdeaLifecycle }) {
  return (
    <div className="inline-flex w-full flex-col items-center justify-center text-center">
      <span className={`font-[Manrope] text-[30px] font-bold leading-none ${scoreNumberTone(idea.scannerScore)}`}>
        {idea.scannerScore === null ? "-" : idea.scannerScore}
      </span>
      <span className={`mt-1 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${scoreTone(idea.scannerScore)}`}>
        {compactScoreLabel(idea)}
      </span>
    </div>
  );
}

function SignalChip({
  label,
  value,
  title,
  tone = "bg-surface-sunken text-ink-700",
}: {
  label: string;
  value: string;
  title?: string;
  tone?: string;
}) {
  return (
    <span
      title={title}
      className={`inline-flex h-8 max-w-full items-center gap-2 whitespace-nowrap rounded-full border px-2.5 ${tone}`}
    >
      <span className="flex min-w-0 items-center gap-1.5 leading-none">
        <span className="shrink-0 text-[10px] font-medium leading-none opacity-70">{label}</span>
        <span className="truncate text-[13px] font-bold leading-none">{value}</span>
      </span>
    </span>
  );
}

function SignalStrip({ idea }: { idea: ProductIdeaLifecycle }) {
  const flags = flagsLabel(idea.seasonality);
  return (
    <div className="flex max-w-full flex-wrap items-center gap-2">
      <SignalChip
        label="Demand"
        value={idea.scannerDemandScore === null ? "-" : String(idea.scannerDemandScore)}
        tone={demandTone(idea.scannerDemandScore)}
      />
      <SignalChip
        label="Competition"
        value={idea.scannerCompetitionScore === null ? "-" : String(idea.scannerCompetitionScore)}
        tone={competitionTone(idea.scannerCompetitionScore)}
      />
      <SignalChip
        label="Flags"
        value={flags}
        title={flags === "None" ? undefined : flags}
        tone={flagsTone(idea.seasonality)}
      />
      <SignalChip
        label="Orders"
        value={`${compactNumber(idea.observedOrderCount)}${ratingText(idea.observedRating)}`}
        tone="border-ink-100 bg-surface-sunken text-ink-700"
      />
    </div>
  );
}

function StatusSelector({
  idea,
  saving,
  saved,
  onChange,
}: {
  idea: ProductIdeaLifecycle;
  saving: boolean;
  saved: boolean;
  onChange: (idea: ProductIdeaLifecycle, status: ProductIdeaWorkspaceStatus) => void;
}) {
  return (
    <details className="group relative">
      <summary
        title="Change status"
        className={[
          "inline-flex cursor-pointer list-none items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold tracking-[0.08em] transition",
          "focus:outline-none focus:ring-2 focus:ring-cobalt-100",
          workspaceSelectorTone(idea.workspaceStatus),
          saved ? "ring-2 ring-success-100" : "",
        ].join(" ")}
      >
        <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${workspaceDotTone(idea.workspaceStatus)}`} />
        <span>{idea.workspaceStatusLabel}</span>
        <svg aria-hidden="true" viewBox="0 0 12 12" className="h-3 w-3 opacity-65">
          <path d="M3 4.5 6 7.5l3-3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </summary>
      <div className="absolute left-0 z-30 mt-2 w-40 rounded-lg border border-ink-100 bg-white p-1 shadow-card">
        {WORKSPACE_STATUS_OPTIONS.map((item) => {
          const isCurrent = item.value === idea.workspaceStatus;
          return (
            <button
              key={item.value}
              type="button"
              disabled={saving}
              onClick={(event) => {
                event.currentTarget.closest("details")?.removeAttribute("open");
                if (!isCurrent) onChange(idea, item.value);
              }}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs font-semibold text-ink-700 hover:bg-surface-sunken disabled:opacity-60"
            >
              <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${workspaceDotTone(item.value)}`} />
              <span className="flex-1">{item.label}</span>
              {isCurrent ? (
                <svg aria-hidden="true" viewBox="0 0 12 12" className="h-3.5 w-3.5 text-cobalt-600">
                  <path d="m2.5 6 2 2 5-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : null}
            </button>
          );
        })}
      </div>
    </details>
  );
}

function PricingEditor({
  idea,
  saving,
  saved,
  canUseScannerImport,
  canUseResearchWorkspace,
  onSave,
}: {
  idea: ProductIdeaLifecycle;
  saving: boolean;
  saved: boolean;
  canUseScannerImport: boolean;
  canUseResearchWorkspace: boolean;
  onSave: (idea: ProductIdeaLifecycle, values: { sellingPrice: string; productCost: string }) => void;
}) {
  const [sellingPrice, setSellingPrice] = useState(formatMoneyValue(idea.sellingPrice));
  const [productCost, setProductCost] = useState(formatMoneyValue(idea.productCost));
  const [dirty, setDirty] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const economics = economicsForIdea({ ...idea, sellingPrice, productCost });
  const quickMargin = simpleMarginPercent(sellingPrice, productCost);
  const marginPercent = economics.marginPercent ?? quickMargin;
  const hasAnyPricing = Boolean(sellingPrice.trim() || productCost.trim());
  const hasBothCoreValues = Boolean(sellingPrice.trim() && productCost.trim());
  const observedLabel = observedPriceLabel(idea);
  const marginLabel = marginPercent === null
    ? hasAnyPricing ? "Need sell/cost" : "No pricing"
    : `${formatMarginPercent(marginPercent)} margin`;
  const syncStatus = (idea as ProductIdeaLifecycle & {
    pricingSyncStatus?: "failed" | "pending";
    pricingSyncFailedAt?: string | null;
  }).pricingSyncStatus;

  useEffect(() => {
    if (isEditing) return;
    setSellingPrice(formatMoneyValue(idea.sellingPrice));
    setProductCost(formatMoneyValue(idea.productCost));
    setDirty(false);
  }, [idea.sellingPrice, idea.productCost, isEditing]);

  function commit(exitEditing = true) {
    if (saving) return;
    if (exitEditing) setIsEditing(false);
    if (!dirty) return;
    setDirty(false);
    onSave(idea, { sellingPrice, productCost });
  }

  function cancelEdit() {
    setSellingPrice(formatMoneyValue(idea.sellingPrice));
    setProductCost(formatMoneyValue(idea.productCost));
    setDirty(false);
    setIsEditing(false);
  }

  function handleEditorBlur(event: FocusEvent<HTMLDivElement>) {
    const nextTarget = event.relatedTarget;
    if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) return;
    commit(true);
  }

  const emptyMessage = canUseScannerImport && canUseResearchWorkspace
    ? syncStatus === "failed"
      ? `£ Sync failed${(idea as ProductIdeaLifecycle & { pricingSyncFailedAt?: string | null }).pricingSyncFailedAt ? ` · ${(idea as ProductIdeaLifecycle & { pricingSyncFailedAt?: string | null }).pricingSyncFailedAt}` : ""}`
      : "£ Awaiting sync"
    : "+ Add pricing";

  const editor = (
    <div
      className="space-y-2 rounded-lg bg-white/70 px-2 py-1.5"
      onBlur={handleEditorBlur}
    >
      <label className="block">
        <span className="sr-only">Selling price for {idea.label}</span>
        <input
          value={sellingPrice}
          disabled={saving}
          autoFocus
          onChange={(event) => {
            setSellingPrice(event.target.value);
            setDirty(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur();
            if (event.key === "Escape") cancelEdit();
          }}
          placeholder="£ Sell"
          className="w-full min-w-0 border-b border-ink-100 bg-transparent py-1 text-sm font-semibold text-ink-900 outline-none transition placeholder:text-ink-300 focus:border-cobalt-500 disabled:opacity-60"
        />
      </label>
      <label className="block">
        <span className="sr-only">Product cost for {idea.label}</span>
        <input
          value={productCost}
          disabled={saving}
          onChange={(event) => {
            setProductCost(event.target.value);
            setDirty(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur();
            if (event.key === "Escape") cancelEdit();
          }}
          placeholder="£ Cost"
          className="w-full min-w-0 border-b border-ink-100 bg-transparent py-1 text-sm font-semibold text-ink-900 outline-none transition placeholder:text-ink-300 focus:border-cobalt-500 disabled:opacity-60"
        />
      </label>
    </div>
  );

  return (
    <div className="min-w-0 space-y-2">
      {observedLabel ? (
        <p className="px-2 text-[10px] font-semibold leading-4 text-ink-400">{observedLabel}</p>
      ) : null}
      {isEditing ? editor : (
        <button
          type="button"
          disabled={saving}
          onClick={() => setIsEditing(true)}
          className="group w-full rounded-lg px-2 py-1.5 text-left transition hover:bg-surface-sunken disabled:opacity-60"
        >
          {hasAnyPricing ? (
            <span className="block space-y-1">
              <span className="grid grid-cols-[2.7rem_minmax(0,1fr)] items-baseline gap-2 text-sm leading-5">
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-ink-400">Sell</span>
                <span className="font-semibold tabular-nums text-ink-900">{displayMoneyValue(sellingPrice)}</span>
              </span>
              <span className="grid grid-cols-[2.7rem_minmax(0,1fr)] items-baseline gap-2 text-sm leading-5">
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-ink-400">Cost</span>
                <span className="font-semibold tabular-nums text-ink-700">{displayMoneyValue(productCost)}</span>
              </span>
            </span>
          ) : (
            <span className="block text-sm font-semibold leading-5 text-ink-500">
              {emptyMessage}
            </span>
          )}
          <span className="mt-1 hidden text-[10px] font-semibold text-cobalt-600 group-hover:inline">
            Edit
          </span>
        </button>
      )}
      <div className="flex flex-wrap items-center gap-2">
        {hasBothCoreValues ? (
          <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] ${marginTone(marginPercent)}`}>
            {marginLabel}
          </span>
        ) : null}
        {saved ? <span className="text-[10px] font-bold text-[#005e3f]">Saved</span> : null}
      </div>
    </div>
  );
}

function SortHeader({
  label,
  sort,
  activeSort,
  onSort,
  className = "",
}: {
  label: string;
  sort: SortKey;
  activeSort: SortKey;
  onSort: (sort: SortKey) => void;
  className?: string;
}) {
  return (
    <th className={`px-3 py-3 text-left ${className}`}>
      <button
        type="button"
        onClick={() => onSort(sort)}
        className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-500 underline-offset-4 hover:text-cobalt-600 hover:underline"
      >
        {label}{activeSort === sort ? " ↓" : ""}
      </button>
    </th>
  );
}

function IdeaMobileCard({
  idea,
  canAccessOsContent,
  canUseScannerImport,
  canUseResearchWorkspace,
  saving,
  saved,
  savedStatus,
  onStatusChange,
  onArchive,
  onRestore,
  onDelete,
  onPricingSave,
}: {
  idea: ProductIdeaLifecycle;
  canAccessOsContent: boolean;
  canUseScannerImport: boolean;
  canUseResearchWorkspace: boolean;
  saving: boolean;
  saved: boolean;
  savedStatus: boolean;
  onStatusChange: (idea: ProductIdeaLifecycle, status: ProductIdeaWorkspaceStatus) => void;
  onArchive: (idea: ProductIdeaLifecycle) => void;
  onRestore: (idea: ProductIdeaLifecycle) => void;
  onDelete: (idea: ProductIdeaLifecycle) => void;
  onPricingSave: (idea: ProductIdeaLifecycle, values: { sellingPrice: string; productCost: string }) => void;
}) {
  return (
    <article className="border-b border-ink-100 p-5 last:border-b-0">
      <div className="flex gap-3">
        <IdeaImage idea={idea} />
        <div className="min-w-0 flex-1">
          <a
            href={ideaDetailHref(idea)}
            title={idea.label}
            className="line-clamp-2 font-[Manrope] text-base font-bold leading-6 text-ink-900 underline-offset-4 hover:text-cobalt-600 hover:underline"
          >
            {clippedIdeaName(idea.label)}
          </a>
          {marketplaceTitle(idea) ? (
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-ink-500">{marketplaceTitle(idea)}</p>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <ScoreBadge idea={idea} />
        <div className="flex flex-col items-start gap-1">
          <StatusSelector
            idea={idea}
            saving={saving}
            saved={savedStatus}
            onChange={onStatusChange}
          />
          {idea.scannerScoredAt ? (
            <span className="text-[10px] font-semibold leading-none text-ink-400">Scanned {formatDate(idea.scannerScoredAt, "relative")}</span>
          ) : null}
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <SignalStrip idea={idea} />
        <PricingEditor
          idea={idea}
          saving={saving}
          saved={saved}
          canUseScannerImport={canUseScannerImport}
          canUseResearchWorkspace={canUseResearchWorkspace}
          onSave={onPricingSave}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {idea.sourceUrl ? (
          <a
            href={idea.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            title={idea.sourceUrl}
            className="text-sm font-semibold text-ink-500 underline-offset-4 hover:text-cobalt-600 hover:underline"
          >
            View on {idea.sourceLabel || "source"} ↗
          </a>
        ) : null}
        <ActionMenu
          ariaLabel={`Actions for ${idea.label}`}
          items={[
            idea.workspaceStatus === "archived"
              ? { label: "Restore", onClick: () => onRestore(idea), disabled: saving }
              : { label: "Archive", onClick: () => onArchive(idea), disabled: saving },
            { label: "Delete", icon: <TrashIcon />, onClick: () => onDelete(idea), variant: "destructive", disabled: saving },
          ]}
        />
      </div>
    </article>
  );
}

function EmptyFilteredState() {
  return (
    <div className="rounded-xl border border-dashed border-ink-100 bg-surface-raised p-8 text-center">
      <h2 className="font-[Manrope] text-xl font-bold text-ink-900">No ideas match this view</h2>
      <p className="mt-2 text-sm leading-6 text-ink-600">Clear the search or change the status filter.</p>
    </div>
  );
}

export function IdeasIndexClient({
  ideas,
  canAccessOsContent,
  canUseScannerImport,
  canUseResearchWorkspace,
  highlightedIdeaId,
}: {
  ideas: ProductIdeaLifecycle[];
  canAccessOsContent: boolean;
  canUseScannerImport: boolean;
  canUseResearchWorkspace: boolean;
  highlightedIdeaId?: string;
}) {
  const [localIdeas, setLocalIdeas] = useState(ideas);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<ViewFilter>("new");
  const [sortKey, setSortKey] = useState<SortKey>("newest");
  const [savingIdeaId, setSavingIdeaId] = useState<string | null>(null);
  const [savedPricingIdeaId, setSavedPricingIdeaId] = useState<string | null>(null);
  const [savedStatusIdeaId, setSavedStatusIdeaId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filteredIdeas = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = localIdeas.filter((idea) => {
      const matchesView =
        view === "all" ||
        idea.workspaceStatus === view;
      const matchesQuery = !normalizedQuery || [
        idea.label,
        marketplaceTitle(idea) ?? "",
        idea.workspaceStatusLabel,
        idea.sourceLabel ?? "",
        idea.demandEvidence ?? "",
        idea.competitionNotes ?? "",
      ].some((value) => value.toLowerCase().includes(normalizedQuery));
      return matchesView && matchesQuery;
    });
    return sortIdeas(filtered, sortKey);
  }, [localIdeas, query, view, sortKey]);

  const counts = useMemo(() => ({
    all: localIdeas.length,
    new: localIdeas.filter((idea) => idea.workspaceStatus === "new").length,
    shortlist: localIdeas.filter((idea) => idea.workspaceStatus === "shortlist").length,
    reviewing: localIdeas.filter((idea) => idea.workspaceStatus === "reviewing").length,
    testing: localIdeas.filter((idea) => idea.workspaceStatus === "testing").length,
    archived: localIdeas.filter((idea) => idea.workspaceStatus === "archived").length,
  }), [localIdeas]);

  const hasNoPricing = localIdeas.length > 0 && localIdeas.every((idea) => !idea.sellingPrice && !idea.productCost);

  async function mutateIdea(
    idea: ProductIdeaLifecycle,
    action: "set_status" | "archive" | "restore" | "delete",
    status?: ProductIdeaWorkspaceStatus,
  ) {
    setSavingIdeaId(idea.ideaId);
    setSavedPricingIdeaId(null);
    setSavedStatusIdeaId(null);
    setError(null);
    try {
      await updateWorkspaceIdea(idea.ideaId, action, status);
      if (action === "delete") {
        setLocalIdeas((current) => current.filter((item) => item.ideaId !== idea.ideaId));
      } else {
        const nextStatus = action === "archive" ? "archived" : action === "restore" ? "new" : status ?? idea.workspaceStatus;
        const nextLabel = WORKSPACE_STATUS_OPTIONS.find((item) => item.value === nextStatus)?.label ?? idea.workspaceStatusLabel;
        setLocalIdeas((current) => current.map((item) => (
          item.ideaId === idea.ideaId
            ? { ...item, workspaceStatus: nextStatus, workspaceStatusLabel: nextLabel }
            : item
        )));
        setSavedStatusIdeaId(idea.ideaId);
        window.setTimeout(() => setSavedStatusIdeaId((current) => (
          current === idea.ideaId ? null : current
        )), 1200);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update Scout Workspace.");
    } finally {
      setSavingIdeaId(null);
    }
  }

  async function savePricing(idea: ProductIdeaLifecycle, values: { sellingPrice: string; productCost: string }) {
    setSavingIdeaId(idea.ideaId);
    setError(null);
    setLocalIdeas((current) => current.map((item) => (
      item.ideaId === idea.ideaId
        ? { ...item, sellingPrice: values.sellingPrice, productCost: values.productCost }
        : item
    )));
    try {
      await updateWorkspaceIdea(idea.ideaId, "update_economics", undefined, values);
      setSavedPricingIdeaId(idea.ideaId);
      window.setTimeout(() => setSavedPricingIdeaId((current) => (
        current === idea.ideaId ? null : current
      )), 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update pricing.");
      setLocalIdeas((current) => current.map((item) => (
        item.ideaId === idea.ideaId
          ? { ...item, sellingPrice: idea.sellingPrice, productCost: idea.productCost }
          : item
      )));
    } finally {
      setSavingIdeaId(null);
    }
  }

  function confirmDelete(idea: ProductIdeaLifecycle) {
    const confirmed = window.confirm(`Delete "${idea.label}" from Scout Workspace? This removes its research notes and economics draft.`);
    if (confirmed) void mutateIdea(idea, "delete");
  }

  return (
    <section className="rounded-xl border border-ink-100 bg-surface-raised shadow-card">
      <div className="border-b border-ink-100 p-5">
        <div className="flex flex-wrap gap-2">
          {VIEW_FILTERS.map((item) => (
            <button
              key={item.value}
              type="button"
              aria-pressed={view === item.value}
              onClick={() => setView(item.value)}
              className={[
                "rounded-lg border px-3 py-2 text-sm font-semibold transition",
                view === item.value
                  ? "border-cobalt-600 bg-cobalt-600 !text-white"
                  : "border-ink-100 bg-surface-raised text-ink-600 hover:border-cobalt-500 hover:text-cobalt-600",
              ].join(" ")}
            >
              {item.label} <span className="opacity-70">{counts[item.value]}</span>
            </button>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-end gap-3">
          <label className="min-w-[220px] flex-1">
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-500">Search</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search product ideas"
              className="mt-2 w-full rounded-lg border border-ink-100 bg-surface-raised px-3 py-2 text-sm text-ink-900 outline-none transition focus:border-cobalt-500 focus:ring-2 focus:ring-cobalt-100"
            />
          </label>
          <label>
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-500">Sort</span>
            <select
              value={sortKey}
              onChange={(event) => setSortKey(event.target.value as SortKey)}
              className="mt-2 w-full rounded-lg border border-ink-100 bg-surface-raised px-3 py-2 text-sm text-ink-900 outline-none transition focus:border-cobalt-500 focus:ring-2 focus:ring-cobalt-100"
            >
              <option value="newest">Newest captured</option>
              <option value="priority">Priority action</option>
              <option value="scanner_score">Product score</option>
              <option value="orders">Orders</option>
              <option value="reviews">Reviews</option>
              <option value="rating">Rating</option>
              <option value="margin">Margin</option>
              <option value="name">Product name</option>
              <option value="status">Status</option>
              <option value="selling_price">Selling price</option>
              <option value="metrics">Metric entries</option>
            </select>
          </label>
        </div>
        {error ? (
          <p className="mt-3 rounded-lg border border-error-100 bg-error-100 px-3 py-2 text-xs font-semibold text-error-700">
            {error}
          </p>
        ) : null}
        <p className="mt-3 text-xs leading-5 text-ink-500">
          Showing {filteredIdeas.length} of {localIdeas.length} products.
        </p>
        {hasNoPricing ? (
          <p className="mt-2 rounded-lg bg-surface-sunken px-3 py-2 text-xs leading-5 text-ink-600">
            Add sell price and product cost inline to compare margin across candidates. Scout Pro can pre-fill more of this automatically.
          </p>
        ) : null}
      </div>

      {filteredIdeas.length === 0 ? (
        <div className="p-5">
          <EmptyFilteredState />
        </div>
      ) : (
        <>
        <div className="lg:hidden">
          {filteredIdeas.map((idea) => (
            <IdeaMobileCard
              key={idea.ideaId}
              idea={idea}
              canAccessOsContent={canAccessOsContent}
              canUseScannerImport={canUseScannerImport}
              canUseResearchWorkspace={canUseResearchWorkspace}
              saving={savingIdeaId === idea.ideaId}
              saved={savedPricingIdeaId === idea.ideaId}
              savedStatus={savedStatusIdeaId === idea.ideaId}
              onStatusChange={(target, status) => void mutateIdea(target, "set_status", status)}
              onArchive={(target) => void mutateIdea(target, "archive")}
              onRestore={(target) => void mutateIdea(target, "restore")}
              onDelete={confirmDelete}
              onPricingSave={(target, values) => void savePricing(target, values)}
            />
          ))}
        </div>
        <div className="hidden lg:block">
          <table className="w-full table-fixed border-collapse text-left">
            <thead>
              <tr className="border-b border-ink-100 bg-surface-sunken/60">
                <SortHeader label="Product" sort="name" activeSort={sortKey} onSort={setSortKey} className="w-[30%]" />
                <SortHeader label="Score" sort="scanner_score" activeSort={sortKey} onSort={setSortKey} className="w-[9%]" />
                <SortHeader label="Pricing" sort="margin" activeSort={sortKey} onSort={setSortKey} className="w-[16%]" />
                <SortHeader label="Signals" sort="orders" activeSort={sortKey} onSort={setSortKey} className="w-[27%]" />
                {canAccessOsContent ? (
                  <th className="w-[8%] px-3 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-500">OS</th>
                ) : null}
                <th className="w-[10%] px-3 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredIdeas.map((idea) => (
                <tr
                  key={idea.ideaId}
                  className={[
                    "border-b border-ink-100 align-top last:border-b-0",
                    idea.ideaId === highlightedIdeaId ? "bg-success-100/40" : "",
                  ].join(" ")}
                >
                  <td className="px-3 py-4">
                    <div className="flex gap-3">
                      <IdeaImage idea={idea} />
                      <div className="min-w-0">
                        <a
                          href={ideaDetailHref(idea)}
                          title={idea.label}
                          className="line-clamp-2 font-[Manrope] text-sm font-bold leading-5 text-ink-900 underline-offset-4 hover:text-cobalt-600 hover:underline"
                        >
                          {clippedIdeaName(idea.label)}
                        </a>
                        {marketplaceTitle(idea) ? (
                          <p className="mt-1 line-clamp-2 text-xs leading-5 text-ink-500">
                            {marketplaceTitle(idea)}
                          </p>
                        ) : null}
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <div className="flex flex-col items-start gap-1">
                            <StatusSelector
                              idea={idea}
                              saving={savingIdeaId === idea.ideaId}
                              saved={savedStatusIdeaId === idea.ideaId}
                              onChange={(target, status) => void mutateIdea(target, "set_status", status)}
                            />
                            {idea.scannerScoredAt ? (
                              <span className="text-[10px] font-semibold leading-none text-ink-400">Scanned {formatDate(idea.scannerScoredAt, "relative")}</span>
                            ) : null}
                          </div>
                          {idea.sourceUrl ? (
                            <a
                              href={idea.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={idea.sourceUrl}
                              className="text-[10px] font-bold tracking-[0.08em] text-cobalt-600 underline-offset-4 hover:underline"
                            >
                              View on {idea.sourceLabel || "source"} ↗
                            </a>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-4 text-center">
                    <ScoreBadge idea={idea} />
                  </td>
                  <td className="px-3 py-4">
                    <PricingEditor
                      idea={idea}
                      saving={savingIdeaId === idea.ideaId}
                      saved={savedPricingIdeaId === idea.ideaId}
                      canUseScannerImport={canUseScannerImport}
                      canUseResearchWorkspace={canUseResearchWorkspace}
                      onSave={(target, values) => void savePricing(target, values)}
                    />
                  </td>
                  <td className="px-3 py-4">
                    <SignalStrip idea={idea} />
                  </td>
                  {canAccessOsContent ? (
                    <td className="px-3 py-4">
                      <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${lifecycleTone(idea.status)}`}>
                        {idea.statusLabel}
                      </span>
                      <p className="mt-2 text-xs text-ink-500">{idea.metricEntries.length} metrics</p>
                    </td>
                  ) : null}
                  <td className="px-3 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      {canAccessOsContent ? (
                        <PrimaryButton href={ideaPrimaryActionHref(idea)} className="px-4 py-2">
                          {compactActionLabel(idea.nextAction.label)}
                        </PrimaryButton>
                      ) : null}
                      <ActionMenu
                        ariaLabel={`Actions for ${idea.label}`}
                        items={[
                          idea.workspaceStatus === "archived"
                            ? { label: "Restore", onClick: () => void mutateIdea(idea, "restore"), disabled: savingIdeaId === idea.ideaId }
                            : { label: "Archive", onClick: () => void mutateIdea(idea, "archive"), disabled: savingIdeaId === idea.ideaId },
                          { label: "Delete", icon: <TrashIcon />, onClick: () => confirmDelete(idea), variant: "destructive", disabled: savingIdeaId === idea.ideaId },
                        ]}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}
    </section>
  );
}
