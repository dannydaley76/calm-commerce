"use client";

import { useMemo, useState } from "react";
import { ActionMenu, TrashIcon } from "@/components/ActionMenu";
import { PrimaryButton } from "@/components/design-system";
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

function workspaceTone(status: ProductIdeaWorkspaceStatus): string {
  if (status === "shortlist") return "bg-success-100 text-[#005e3f]";
  if (status === "reviewing" || status === "testing") return "bg-[#eef4ff] text-cobalt-600";
  if (status === "archived") return "bg-surface-sunken text-ink-500";
  return "bg-surface-sunken text-ink-700";
}

function scoreTone(score: number | null): string {
  if (score === null) return "bg-surface-sunken text-ink-500";
  if (score >= 70) return "bg-success-100 text-[#005e3f]";
  if (score >= 40) return "bg-[#fff8e6] text-[#835700]";
  return "bg-error-100 text-error-700";
}

function compactScoreLabel(idea: ProductIdeaLifecycle): string {
  if (idea.scannerScore === null) return "Not scored";
  if (idea.scannerScore >= 70) return "Strong";
  if (idea.scannerScore >= 40) return "Moderate";
  return "Weak";
}

function signalLabel(score: number | null): string {
  if (score === null) return "Missing";
  if (score >= 70) return "Strong";
  if (score >= 40) return "Moderate";
  return "Weak";
}

function signalTone(score: number | null): string {
  if (score === null) return "border-ink-100 bg-surface-sunken text-ink-500";
  if (score >= 70) return "border-success-100 bg-success-100 text-[#005e3f]";
  if (score >= 40) return "border-amber-100 bg-[#fff8e6] text-[#835700]";
  return "border-error-100 bg-error-100 text-error-700";
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

function clippedIdeaName(name: string): string {
  return name.length > 90 ? `${name.slice(0, 87).trim()}...` : name;
}

function latestSignalText(idea: ProductIdeaLifecycle, canAccessOsContent: boolean): string {
  if (!canAccessOsContent && idea.status === "draft") {
    return "Imported from Scout.";
  }
  return idea.latestSignal;
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

function formatMarginPercent(value: number | null): string {
  if (value === null) return "";
  return `${value.toFixed(0)}%`;
}

function marginTone(value: number | null): string {
  if (value === null) return "border-ink-100 bg-surface-sunken text-ink-500";
  if (value >= 40) return "border-success-100 bg-success-100 text-[#005e3f]";
  if (value >= 20) return "border-amber-100 bg-[#fff8e6] text-[#835700]";
  return "border-error-100 bg-error-100 text-error-700";
}

function compactNumber(value: string | null): string {
  const parsed = numericValue(value);
  if (!Number.isFinite(parsed)) return value?.trim() || "-";
  return parsed.toLocaleString("en-GB");
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
    <div className={`inline-flex min-w-24 flex-col rounded-xl px-3 py-2 ${scoreTone(idea.scannerScore)}`}>
      <span className="font-[Manrope] text-2xl font-bold leading-none">
        {idea.scannerScore === null ? "-" : idea.scannerScore}
      </span>
      <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em]">
        {compactScoreLabel(idea)}
      </span>
    </div>
  );
}

function SignalChip({
  label,
  value,
  tone = "border-ink-100 bg-surface-sunken text-ink-700",
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className={`rounded-lg border px-2.5 py-2 ${tone}`}>
      <p className="text-[9px] font-bold uppercase tracking-[0.12em] opacity-70">{label}</p>
      <p className="mt-1 text-xs font-bold leading-none">{value}</p>
    </div>
  );
}

function SignalStrip({ idea }: { idea: ProductIdeaLifecycle }) {
  return (
    <div className="grid grid-cols-2 gap-2 xl:grid-cols-3">
      <SignalChip label="Orders" value={compactNumber(idea.observedOrderCount)} />
      <SignalChip label="Reviews" value={compactNumber(idea.observedReviewCount)} />
      <SignalChip label="Rating" value={idea.observedRating ?? "-"} />
      <SignalChip
        label="Demand"
        value={idea.scannerDemandScore === null ? "-" : `${idea.scannerDemandScore} ${signalLabel(idea.scannerDemandScore)}`}
        tone={signalTone(idea.scannerDemandScore)}
      />
      <SignalChip
        label="Competition"
        value={idea.scannerCompetitionScore === null ? "-" : `${idea.scannerCompetitionScore} ${signalLabel(idea.scannerCompetitionScore)}`}
        tone={signalTone(idea.scannerCompetitionScore)}
      />
      <SignalChip
        label="Risk"
        value={idea.seasonality ? "Seasonal" : "None"}
        tone={idea.seasonality ? "border-amber-100 bg-[#fff8e6] text-[#835700]" : "border-success-100 bg-success-100 text-[#005e3f]"}
      />
    </div>
  );
}

function PricingEditor({
  idea,
  saving,
  onSave,
}: {
  idea: ProductIdeaLifecycle;
  saving: boolean;
  onSave: (idea: ProductIdeaLifecycle, values: { sellingPrice: string; productCost: string }) => void;
}) {
  const [sellingPrice, setSellingPrice] = useState(formatMoneyValue(idea.sellingPrice));
  const [productCost, setProductCost] = useState(formatMoneyValue(idea.productCost));
  const [dirty, setDirty] = useState(false);
  const economics = economicsForIdea({ ...idea, sellingPrice, productCost });
  const hasAnyPricing = Boolean(sellingPrice.trim() || productCost.trim());
  const marginLabel = economics.marginPercent === null
    ? hasAnyPricing ? "Need shipping/fees" : "Add pricing"
    : `${formatMarginPercent(economics.marginPercent)} margin`;

  function commit() {
    if (!dirty || saving) return;
    setDirty(false);
    onSave(idea, { sellingPrice, productCost });
  }

  return (
    <div className="space-y-2">
      <div className="grid gap-2">
        <label className="block">
          <span className="sr-only">Selling price for {idea.label}</span>
          <input
            value={sellingPrice}
            disabled={saving}
            onChange={(event) => {
              setSellingPrice(event.target.value);
              setDirty(true);
            }}
            onBlur={commit}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.currentTarget.blur();
              }
            }}
            placeholder="Add sell"
            className="w-full rounded-lg border border-ink-100 bg-white px-2 py-1.5 text-xs font-semibold text-ink-900 outline-none transition placeholder:text-ink-300 focus:border-cobalt-500 focus:ring-2 focus:ring-cobalt-100 disabled:opacity-60"
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
            onBlur={commit}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.currentTarget.blur();
              }
            }}
            placeholder="Add cost"
            className="w-full rounded-lg border border-ink-100 bg-white px-2 py-1.5 text-xs font-semibold text-ink-900 outline-none transition placeholder:text-ink-300 focus:border-cobalt-500 focus:ring-2 focus:ring-cobalt-100 disabled:opacity-60"
          />
        </label>
      </div>
      <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] ${marginTone(economics.marginPercent)}`}>
        {marginLabel}
      </span>
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
  saving,
  onStatusChange,
  onArchive,
  onRestore,
  onDelete,
  onPricingSave,
}: {
  idea: ProductIdeaLifecycle;
  canAccessOsContent: boolean;
  saving: boolean;
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
          <p className="mt-1 text-sm leading-6 text-ink-600">{latestSignalText(idea, canAccessOsContent)}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <ScoreBadge idea={idea} />
        <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${workspaceTone(idea.workspaceStatus)}`}>
          {idea.workspaceStatusLabel}
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <SignalStrip idea={idea} />
        <PricingEditor idea={idea} saving={saving} onSave={onPricingSave} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-500">
          Move to
        </span>
        <select
          aria-label={`Workspace status for ${idea.label}`}
          value={idea.workspaceStatus}
          disabled={saving}
          onChange={(event) => onStatusChange(idea, event.target.value as ProductIdeaWorkspaceStatus)}
          className="rounded-lg border border-ink-100 bg-surface-raised px-3 py-2 text-sm font-semibold text-ink-900 outline-none transition focus:border-cobalt-500 focus:ring-2 focus:ring-cobalt-100 disabled:opacity-60"
        >
          {WORKSPACE_STATUS_OPTIONS.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </select>
        {idea.sourceUrl ? (
          <a
            href={idea.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            title={idea.sourceUrl}
            className="text-sm font-semibold text-ink-500 underline-offset-4 hover:text-cobalt-600 hover:underline"
          >
            View on {idea.sourceLabel || "source"}
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
  highlightedIdeaId,
}: {
  ideas: ProductIdeaLifecycle[];
  canAccessOsContent: boolean;
  highlightedIdeaId?: string;
}) {
  const [localIdeas, setLocalIdeas] = useState(ideas);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<ViewFilter>("new");
  const [sortKey, setSortKey] = useState<SortKey>("newest");
  const [savingIdeaId, setSavingIdeaId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filteredIdeas = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = localIdeas.filter((idea) => {
      const matchesView =
        view === "all" ||
        idea.workspaceStatus === view;
      const matchesQuery = !normalizedQuery || [
        idea.label,
        latestSignalText(idea, canAccessOsContent),
        idea.workspaceStatusLabel,
        idea.sourceLabel ?? "",
        idea.demandEvidence ?? "",
        idea.competitionNotes ?? "",
      ].some((value) => value.toLowerCase().includes(normalizedQuery));
      return matchesView && matchesQuery;
    });
    return sortIdeas(filtered, sortKey);
  }, [canAccessOsContent, localIdeas, query, view, sortKey]);

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
          {VIEW_FILTERS.filter((item) => item.value === "new" || item.value === "all" || counts[item.value] > 0).map((item) => (
            <button
              key={item.value}
              type="button"
              aria-pressed={view === item.value}
              onClick={() => setView(item.value)}
              className={[
                "rounded-lg border px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] transition",
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
              saving={savingIdeaId === idea.ideaId}
              onStatusChange={(target, status) => void mutateIdea(target, "set_status", status)}
              onArchive={(target) => void mutateIdea(target, "archive")}
              onRestore={(target) => void mutateIdea(target, "restore")}
              onDelete={confirmDelete}
              onPricingSave={(target, values) => void savePricing(target, values)}
            />
          ))}
        </div>
        <div className="hidden overflow-x-hidden lg:block">
          <table className="w-full table-fixed border-collapse text-left">
            <thead>
              <tr className="border-b border-ink-100 bg-surface-sunken/60">
                <SortHeader label="Product" sort="name" activeSort={sortKey} onSort={setSortKey} className="w-[24%]" />
                <SortHeader label="Score" sort="scanner_score" activeSort={sortKey} onSort={setSortKey} className="w-[9%]" />
                <th className="w-[11%] px-3 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-500">Status</th>
                <SortHeader label="Pricing" sort="margin" activeSort={sortKey} onSort={setSortKey} className="w-[14%]" />
                <SortHeader label="Signals" sort="orders" activeSort={sortKey} onSort={setSortKey} className="w-[20%]" />
                {canAccessOsContent ? (
                  <th className="w-[10%] px-3 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-500">OS</th>
                ) : null}
                <th className="w-[12%] px-3 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-500">Actions</th>
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
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-ink-500">
                          {latestSignalText(idea, canAccessOsContent)}
                        </p>
                        {idea.sourceUrl ? (
                          <a
                            href={idea.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={idea.sourceUrl}
                            className="mt-2 inline-flex text-[10px] font-bold uppercase tracking-[0.12em] text-cobalt-600 underline-offset-4 hover:underline"
                          >
                            View on {idea.sourceLabel || "source"}
                          </a>
                        ) : null}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-4">
                    <ScoreBadge idea={idea} />
                    {idea.scannerScoredAt ? (
                      <p className="mt-2 text-[10px] leading-4 text-ink-500">Scanned {idea.scannerScoredAt}</p>
                    ) : null}
                  </td>
                  <td className="px-3 py-4">
                    <details className="group relative">
                      <summary className={`inline-flex cursor-pointer list-none rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${workspaceTone(idea.workspaceStatus)}`}>
                        {idea.workspaceStatusLabel}
                      </summary>
                      <div className="absolute left-0 z-30 mt-2 w-36 rounded-lg border border-ink-100 bg-white p-1 shadow-card">
                        {WORKSPACE_STATUS_OPTIONS.map((item) => (
                          <button
                            key={item.value}
                            type="button"
                            disabled={savingIdeaId === idea.ideaId}
                            onClick={() => void mutateIdea(idea, "set_status", item.value)}
                            className="block w-full rounded-md px-3 py-2 text-left text-xs font-semibold text-ink-700 hover:bg-surface-sunken disabled:opacity-60"
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </details>
                  </td>
                  <td className="px-3 py-4">
                    <PricingEditor
                      idea={idea}
                      saving={savingIdeaId === idea.ideaId}
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
