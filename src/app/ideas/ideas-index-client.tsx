"use client";

import { useMemo, useState } from "react";
import { PrimaryButton, SecondaryButton } from "@/components/design-system";
import {
  type ProductIdeaLifecycle,
  type ProductIdeaLifecycleStatus,
} from "@/lib/v2/worksheets/product-idea-lifecycle";

type SortKey = "priority" | "name" | "status" | "selling_price" | "metrics";

const STATUS_FILTERS: Array<{ value: "all" | ProductIdeaLifecycleStatus; label: string }> = [
  { value: "all", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "economics_checked", label: "Economics checked" },
  { value: "selected", label: "Selected" },
  { value: "test_planned", label: "Test planned" },
  { value: "test_running", label: "Test running" },
  { value: "test_reviewed", label: "Test reviewed" },
  { value: "proceed", label: "Proceed" },
  { value: "retest", label: "Retest" },
  { value: "pivot", label: "Pivot" },
];

function lifecycleTone(status: ProductIdeaLifecycleStatus): string {
  if (status === "proceed") return "bg-success-100 text-[#005e3f]";
  if (status === "pivot" || status === "retest") return "bg-[#fff8e6] text-[#835700]";
  if (status === "test_running" || status === "test_reviewed" || status === "test_planned") {
    return "bg-[#eef4ff] text-cobalt-600";
  }
  return "bg-surface-sunken text-ink-500";
}

function ideaDetailHref(idea: ProductIdeaLifecycle): string {
  return `/ideas/${encodeURIComponent(idea.ideaId)}`;
}

function ideaPrimaryActionHref(idea: ProductIdeaLifecycle): string {
  return idea.nextAction.label === "Define customer"
    ? idea.nextAction.href
    : ideaDetailHref(idea);
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

function sortIdeas(ideas: ProductIdeaLifecycle[], sortKey: SortKey): ProductIdeaLifecycle[] {
  return [...ideas].sort((a, b) => {
    if (sortKey === "name") return a.label.localeCompare(b.label);
    if (sortKey === "status") return a.statusLabel.localeCompare(b.statusLabel);
    if (sortKey === "selling_price") return numericValue(b.sellingPrice) - numericValue(a.sellingPrice);
    if (sortKey === "metrics") return b.metricEntries.length - a.metricEntries.length;
    return ideaActionPriority(a.status) - ideaActionPriority(b.status);
  });
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
    <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-ink-100 bg-surface-sunken text-[10px] font-bold uppercase tracking-[0.12em] text-ink-300">
      No image
    </div>
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

export function IdeasIndexClient({ ideas }: { ideas: ProductIdeaLifecycle[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | ProductIdeaLifecycleStatus>("all");
  const [sortKey, setSortKey] = useState<SortKey>("priority");

  const filteredIdeas = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = ideas.filter((idea) => {
      const matchesStatus = status === "all" || idea.status === status;
      const matchesQuery = !normalizedQuery || [
        idea.label,
        idea.latestSignal,
        idea.demandEvidence ?? "",
        idea.competitionNotes ?? "",
      ].some((value) => value.toLowerCase().includes(normalizedQuery));
      return matchesStatus && matchesQuery;
    });
    return sortIdeas(filtered, sortKey);
  }, [ideas, query, status, sortKey]);

  return (
    <section className="rounded-xl border border-ink-100 bg-surface-raised shadow-card">
      <div className="border-b border-ink-100 p-5">
        <div className="flex flex-wrap items-end gap-3">
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
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-500">Status</span>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as "all" | ProductIdeaLifecycleStatus)}
              className="mt-2 w-full rounded-lg border border-ink-100 bg-surface-raised px-3 py-2 text-sm text-ink-900 outline-none transition focus:border-cobalt-500 focus:ring-2 focus:ring-cobalt-100"
            >
              {STATUS_FILTERS.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-500">Sort</span>
            <select
              value={sortKey}
              onChange={(event) => setSortKey(event.target.value as SortKey)}
              className="mt-2 w-full rounded-lg border border-ink-100 bg-surface-raised px-3 py-2 text-sm text-ink-900 outline-none transition focus:border-cobalt-500 focus:ring-2 focus:ring-cobalt-100"
            >
              <option value="priority">Priority action</option>
              <option value="name">Product name</option>
              <option value="status">Status</option>
              <option value="selling_price">Selling price</option>
              <option value="metrics">Metric entries</option>
            </select>
          </label>
        </div>
        <p className="mt-3 text-xs leading-5 text-ink-500">
          Showing {filteredIdeas.length} of {ideas.length} product ideas.
        </p>
      </div>

      {filteredIdeas.length === 0 ? (
        <div className="p-5">
          <EmptyFilteredState />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-left">
            <thead>
              <tr className="border-b border-ink-100 bg-surface-sunken/60">
                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-500">Product</th>
                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-500">Status</th>
                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-500">Economics</th>
                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-500">Evidence</th>
                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-500">Metrics</th>
                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-500">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredIdeas.map((idea) => (
                <tr key={idea.ideaId} className="border-b border-ink-100 align-top last:border-b-0">
                  <td className="px-5 py-4">
                    <div className="flex gap-3">
                      <IdeaImage idea={idea} />
                      <div className="min-w-0">
                        <a
                          href={ideaDetailHref(idea)}
                          className="font-[Manrope] text-sm font-bold leading-5 text-ink-900 underline-offset-4 hover:text-cobalt-600 hover:underline"
                        >
                          {idea.label}
                        </a>
                        <p className="mt-1 line-clamp-2 max-w-[280px] text-xs leading-5 text-ink-500">
                          {idea.latestSignal}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${lifecycleTone(idea.status)}`}>
                      {idea.statusLabel}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm leading-6 text-ink-700">
                    <p><span className="font-semibold text-ink-900">Sell:</span> {idea.sellingPrice ?? "-"}</p>
                    <p><span className="font-semibold text-ink-900">Cost:</span> {idea.productCost ?? "-"}</p>
                    <p className="text-xs text-ink-500">{idea.numbersConfidence ?? "No confidence set"}</p>
                  </td>
                  <td className="px-5 py-4 text-sm leading-6 text-ink-700">
                    <p className="line-clamp-2 max-w-[220px]">{idea.demandEvidence ?? "No demand evidence"}</p>
                    <p className="mt-1 line-clamp-2 max-w-[220px] text-xs text-ink-500">{idea.competitionNotes ?? "No competition notes"}</p>
                  </td>
                  <td className="px-5 py-4 text-sm leading-6 text-ink-700">
                    {idea.metricEntries.length}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col gap-2">
                      <PrimaryButton href={ideaPrimaryActionHref(idea)} className="px-4 py-2">
                        {idea.nextAction.label}
                      </PrimaryButton>
                      <SecondaryButton href={ideaDetailHref(idea)} className="px-4 py-2">
                        Detail
                      </SecondaryButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
