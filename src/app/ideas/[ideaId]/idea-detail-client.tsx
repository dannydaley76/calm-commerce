"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { GhostButton, PageHero, PrimaryButton, SecondaryButton } from "@/components/design-system";
import { writeWorksheetField } from "@/components/lean-canvas/write-worksheet-field";
import {
  ensureProductIdeaIds,
  getProductIdeaId,
  getProductIdeaLabel,
  type ProductIdeaRow,
} from "@/lib/v2/worksheets/product-idea-identity";
import type {
  ProductIdeaLifecycle,
  ProductIdeaLifecycleStatus,
} from "@/lib/v2/worksheets/product-idea-lifecycle";

type ResponseMap = Record<string, string>;
type InstanceRow = Record<string, string | undefined>;
type SaveState = "idle" | "saving" | "saved" | "error";

const inputBase =
  "mt-1.5 block w-full rounded-xl border border-[#e2e4ea] bg-white px-4 py-2.5 text-sm text-ink-900 shadow-sm outline-none transition placeholder:text-[#b0b3be] focus:border-cobalt-600 focus:ring-1 focus:ring-cobalt-600";

const selectBase = `${inputBase} pr-8`;

const variantOptions = ["", "1 SKU: simple", "2–5 SKUs: manageable", "6–15 SKUs: complex", "16+ SKUs: very complex"];
const upfrontRiskOptions = ["", "Low: can test without buying much stock", "Medium: small sample or stock order needed", "High: meaningful stock order needed", "Unknown: need supplier numbers"];
const testSpeedOptions = ["", "Fast: can list this week", "Medium: needs sample, prep, or supplier confirmation", "Slow: needs production, customisation, or more setup", "Unknown"];
const confidenceOptions = ["", "High: real quotes and known fees", "Medium: close estimates", "Low: mostly guesses", "Unknown: missing key costs"];
const viableOptions = ["", "Yes: proceed", "Marginal: possible with adjustments", "No: eliminate"];
const marketplaceOptions = ["", "eBay", "Etsy", "Amazon", "Vinted", "Facebook Marketplace", "Other"];
const resultOptions = ["", "Sold: strong demand", "Interest but no sale", "Views but no engagement", "Very few views", "Still running"];
const decisionOptions = ["", "Proceed: build the store", "Iterate and retest: adjust listing or price", "Pivot: try a different product"];

function parseRows(raw: string | undefined): InstanceRow[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function lifecycleTone(status: ProductIdeaLifecycleStatus): string {
  if (status === "proceed") return "bg-success-100 text-[#005e3f]";
  if (status === "pivot" || status === "retest") return "bg-[#fff8e6] text-[#835700]";
  if (status === "test_running" || status === "test_reviewed" || status === "test_planned") {
    return "bg-[#eef4ff] text-cobalt-600";
  }
  return "bg-surface-sunken text-ink-500";
}

function findEconomicsRow(rows: InstanceRow[], idea: ProductIdeaLifecycle, ideaIndex: number): {
  row: InstanceRow;
  index: number;
} {
  const byId = rows.findIndex((row) => (row.idea_id ?? "").trim() === idea.ideaId);
  if (byId >= 0) return { row: rows[byId], index: byId };
  const byName = rows.findIndex((row) => (row.idea_name ?? "").trim() === idea.label);
  if (byName >= 0) return { row: rows[byName], index: byName };
  const legacyRow = rows[ideaIndex];
  if (legacyRow && !(legacyRow.idea_id ?? "").trim() && !(legacyRow.idea_name ?? "").trim()) {
    return { row: legacyRow, index: ideaIndex };
  }
  return { row: {}, index: rows.length };
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "number";
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-500">{label}</span>
      <input
        type={type}
        className={inputBase}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block md:col-span-2">
      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-500">{label}</span>
      <textarea
        className={`${inputBase} min-h-28`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-500">{label}</span>
      <select className={selectBase} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option || "empty"} value={option}>
            {option || "Not selected"}
          </option>
        ))}
      </select>
    </label>
  );
}

function SaveButton({ state }: { state: SaveState }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <PrimaryButton type="submit" disabled={state === "saving"}>
        {state === "saving" ? "Saving" : "Save changes"}
      </PrimaryButton>
      {state === "saved" ? <span className="text-sm font-semibold text-[#005e3f]">Saved</span> : null}
      {state === "error" ? <span className="text-sm font-semibold text-error-700">Not saved</span> : null}
    </div>
  );
}

function EditableSection({
  title,
  description,
  state,
  onSubmit,
  children,
}: {
  title: string;
  description: string;
  state: SaveState;
  onSubmit: () => Promise<void>;
  children: ReactNode;
}) {
  return (
    <form
      className="rounded-xl border border-ink-100 bg-surface-raised p-6 shadow-card"
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmit();
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-[Manrope] text-lg font-bold text-ink-900">{title}</h2>
          <p className="mt-2 max-w-[620px] text-sm leading-6 text-ink-500">{description}</p>
        </div>
        <SaveButton state={state} />
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">{children}</div>
    </form>
  );
}

function IdeaTimeline({ idea }: { idea: ProductIdeaLifecycle }) {
  return (
    <section className="rounded-xl border border-ink-100 bg-surface-raised p-6 shadow-card">
      <h2 className="font-[Manrope] text-lg font-bold text-ink-900">Timeline</h2>
      <ol className="mt-6 space-y-4 border-l border-ink-100 pl-4">
        {idea.timeline.map((event) => (
          <li key={event.key} className="relative">
            <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-cobalt-600 ring-4 ring-surface-raised" />
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-[Manrope] text-sm font-bold text-ink-900">{event.label}</p>
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-500">
                {event.chapter}
              </span>
            </div>
            <p className="mt-1 text-xs leading-5 text-ink-500">{event.detail}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function MetricsSection({ idea }: { idea: ProductIdeaLifecycle }) {
  return (
    <section className="rounded-xl border border-ink-100 bg-surface-raised p-6 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-[Manrope] text-lg font-bold text-ink-900">Linked metrics</h2>
          <p className="mt-2 max-w-[620px] text-sm leading-6 text-ink-500">
            Metrics logged against this product idea become part of its operating history.
          </p>
        </div>
        <SecondaryButton href="/metrics" className="shrink-0">
          Open metrics
        </SecondaryButton>
      </div>

      {idea.metricEntries.length === 0 ? (
        <p className="mt-5 rounded-xl border border-dashed border-ink-100 bg-surface-sunken p-4 text-sm leading-6 text-ink-500">
          No metrics have been linked to this idea yet.
        </p>
      ) : (
        <div className="mt-5 divide-y divide-ink-100">
          {idea.metricEntries.map((entry) => (
            <div key={entry.id} className="py-4 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-[Manrope] text-sm font-bold text-ink-900">
                  {entry.entryType === "validation" ? "Marketplace metrics" : "Store metrics"}
                </p>
                <span className="text-xs text-ink-500">{entry.weekEnding}</span>
              </div>
              <p className="mt-1 text-sm leading-6 text-ink-600">{entry.summary}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function IdeaDetailClient({
  idea,
  responses,
}: {
  idea: ProductIdeaLifecycle;
  responses: ResponseMap;
}) {
  const router = useRouter();
  const productIdeas = useMemo(
    () => ensureProductIdeaIds(parseRows(responses.product_ideas) as ProductIdeaRow[]),
    [responses.product_ideas],
  );
  const ideaIndex = Math.max(
    0,
    productIdeas.findIndex((row, index) => getProductIdeaId(row, index) === idea.ideaId),
  );
  const sourceIdea = productIdeas[ideaIndex] ?? ({ idea_id: idea.ideaId, idea_description: idea.label } as ProductIdeaRow);
  const economicsRows = parseRows(responses.idea_economics);
  const economicsMatch = findEconomicsRow(economicsRows, idea, ideaIndex);

  const [ideaDraft, setIdeaDraft] = useState({
    idea_description: getProductIdeaLabel(sourceIdea, ideaIndex),
    demand_evidence: sourceIdea.demand_evidence ?? "",
    competition_notes: sourceIdea.competition_notes ?? "",
    seasonality: sourceIdea.seasonality ?? "",
  });
  const [economicsDraft, setEconomicsDraft] = useState({
    product_cost: economicsMatch.row.product_cost ?? "",
    shipping_to_customer: economicsMatch.row.shipping_to_customer ?? "",
    platform_fees: economicsMatch.row.platform_fees ?? "",
    selling_price: economicsMatch.row.selling_price ?? "",
    variant_complexity: economicsMatch.row.variant_complexity ?? "",
    upfront_cost_risk: economicsMatch.row.upfront_cost_risk ?? "",
    test_speed: economicsMatch.row.test_speed ?? "",
    numbers_confidence: economicsMatch.row.numbers_confidence ?? "",
    viable: economicsMatch.row.viable ?? "",
  });
  const [testDraft, setTestDraft] = useState({
    test_marketplace: idea.isTestIdea ? responses.test_marketplace ?? "" : "",
    product_listed: idea.isTestIdea ? responses.product_listed ?? "" : "",
    listing_price: idea.isTestIdea ? responses.listing_price ?? "" : "",
    test_duration: idea.isTestIdea ? responses.test_duration ?? "" : "",
    result: idea.isTestIdea ? responses.result ?? "" : "",
    units_sold: idea.isTestIdea ? responses.units_sold ?? "" : "",
    what_you_learned: idea.isTestIdea ? responses.what_you_learned ?? "" : "",
    decision: idea.isTestIdea ? responses.decision ?? "" : "",
  });
  const [status, setStatus] = useState<Record<string, SaveState>>({
    idea: "idle",
    economics: "idle",
    test: "idle",
  });

  const setSectionStatus = (section: string, value: SaveState) => {
    setStatus((prev) => ({ ...prev, [section]: value }));
  };

  const saveIdea = async () => {
    setSectionStatus("idea", "saving");
    const nextRows = productIdeas.map((row, index) =>
      getProductIdeaId(row, index) === idea.ideaId
        ? { ...row, ...ideaDraft, idea_id: idea.ideaId }
        : row,
    );
    const result = await writeWorksheetField(
      "product_ideas",
      JSON.stringify(nextRows),
      "ideas-worksheet",
    );
    setSectionStatus("idea", result.ok ? "saved" : "error");
    if (result.ok) router.refresh();
  };

  const saveEconomics = async () => {
    setSectionStatus("economics", "saving");
    const nextRows = economicsRows.map((row) => ({ ...row }));
    nextRows[economicsMatch.index] = {
      ...(nextRows[economicsMatch.index] ?? {}),
      ...economicsDraft,
      idea_id: idea.ideaId,
      idea_name: ideaDraft.idea_description || idea.label,
    };
    const result = await writeWorksheetField(
      "idea_economics",
      JSON.stringify(nextRows),
      "unit-economics-worksheet",
    );
    setSectionStatus("economics", result.ok ? "saved" : "error");
    if (result.ok) router.refresh();
  };

  const saveTest = async () => {
    setSectionStatus("test", "saving");
    const updates = [
      ["test_idea", idea.ideaId],
      ...Object.entries(testDraft),
    ] as Array<[string, string]>;
    const results = await Promise.all(
      updates.map(([key, value]) => writeWorksheetField(key, value, "pre-store-test-worksheet")),
    );
    const ok = results.every((result) => result.ok);
    setSectionStatus("test", ok ? "saved" : "error");
    if (ok) router.refresh();
  };

  return (
    <div className="space-y-6">
      <GhostButton href="/ideas">Back to ideas</GhostButton>

      <PageHero
        label="Product candidate"
        title={ideaDraft.idea_description || idea.label}
        description={idea.latestSignal}
      >
        <div className="flex flex-wrap items-center gap-3">
          <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${lifecycleTone(idea.status)}`}>
            {idea.statusLabel}
          </span>
          <PrimaryButton href={idea.nextAction.href}>
            {idea.nextAction.label}
          </PrimaryButton>
        </div>
      </PageHero>

      <section className="rounded-xl border border-cobalt-100 bg-cobalt-100/50 p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-cobalt-600">
          Next best action
        </p>
        <p className="mt-2 text-sm leading-6 text-ink-700">{idea.nextAction.note}</p>
      </section>

      <EditableSection
        title="Idea evidence"
        description="Edit the original demand signals and market notes from Chapter 3 without returning to the lesson."
        state={status.idea}
        onSubmit={saveIdea}
      >
        <Field
          label="Idea name"
          value={ideaDraft.idea_description}
          onChange={(value) => setIdeaDraft((prev) => ({ ...prev, idea_description: value }))}
        />
        <Field
          label="Seasonality"
          value={ideaDraft.seasonality}
          onChange={(value) => setIdeaDraft((prev) => ({ ...prev, seasonality: value }))}
        />
        <TextArea
          label="Demand evidence"
          value={ideaDraft.demand_evidence}
          onChange={(value) => setIdeaDraft((prev) => ({ ...prev, demand_evidence: value }))}
        />
        <TextArea
          label="Competition notes"
          value={ideaDraft.competition_notes}
          onChange={(value) => setIdeaDraft((prev) => ({ ...prev, competition_notes: value }))}
        />
      </EditableSection>

      <EditableSection
        title="Economics"
        description="Edit the Chapter 5 numbers and viability decision for this candidate."
        state={status.economics}
        onSubmit={saveEconomics}
      >
        <Field
          label="Product cost per unit"
          value={economicsDraft.product_cost}
          onChange={(value) => setEconomicsDraft((prev) => ({ ...prev, product_cost: value }))}
        />
        <Field
          label="Shipping to customer"
          value={economicsDraft.shipping_to_customer}
          onChange={(value) => setEconomicsDraft((prev) => ({ ...prev, shipping_to_customer: value }))}
        />
        <Field
          label="Platform fees"
          value={economicsDraft.platform_fees}
          onChange={(value) => setEconomicsDraft((prev) => ({ ...prev, platform_fees: value }))}
        />
        <Field
          label="Selling price"
          value={economicsDraft.selling_price}
          onChange={(value) => setEconomicsDraft((prev) => ({ ...prev, selling_price: value }))}
        />
        <SelectField
          label="Variant complexity"
          value={economicsDraft.variant_complexity}
          options={variantOptions}
          onChange={(value) => setEconomicsDraft((prev) => ({ ...prev, variant_complexity: value }))}
        />
        <SelectField
          label="Upfront cost risk"
          value={economicsDraft.upfront_cost_risk}
          options={upfrontRiskOptions}
          onChange={(value) => setEconomicsDraft((prev) => ({ ...prev, upfront_cost_risk: value }))}
        />
        <SelectField
          label="Test speed"
          value={economicsDraft.test_speed}
          options={testSpeedOptions}
          onChange={(value) => setEconomicsDraft((prev) => ({ ...prev, test_speed: value }))}
        />
        <SelectField
          label="Confidence in numbers"
          value={economicsDraft.numbers_confidence}
          options={confidenceOptions}
          onChange={(value) => setEconomicsDraft((prev) => ({ ...prev, numbers_confidence: value }))}
        />
        <SelectField
          label="Decision"
          value={economicsDraft.viable}
          options={viableOptions}
          onChange={(value) => setEconomicsDraft((prev) => ({ ...prev, viable: value }))}
        />
      </EditableSection>

      <EditableSection
        title="Marketplace test"
        description="Edit the test plan, result, learning, and decision. Saving this section makes this idea the active Chapter 6 test idea."
        state={status.test}
        onSubmit={saveTest}
      >
        <SelectField
          label="Marketplace"
          value={testDraft.test_marketplace}
          options={marketplaceOptions}
          onChange={(value) => setTestDraft((prev) => ({ ...prev, test_marketplace: value }))}
        />
        <Field
          label="Product listed"
          value={testDraft.product_listed}
          onChange={(value) => setTestDraft((prev) => ({ ...prev, product_listed: value }))}
        />
        <Field
          label="Listing price"
          value={testDraft.listing_price}
          onChange={(value) => setTestDraft((prev) => ({ ...prev, listing_price: value }))}
        />
        <Field
          label="Test duration"
          value={testDraft.test_duration}
          onChange={(value) => setTestDraft((prev) => ({ ...prev, test_duration: value }))}
        />
        <SelectField
          label="Result"
          value={testDraft.result}
          options={resultOptions}
          onChange={(value) => setTestDraft((prev) => ({ ...prev, result: value }))}
        />
        <Field
          label="Units sold"
          type="number"
          value={testDraft.units_sold}
          onChange={(value) => setTestDraft((prev) => ({ ...prev, units_sold: value }))}
        />
        <TextArea
          label="What you learned"
          value={testDraft.what_you_learned}
          onChange={(value) => setTestDraft((prev) => ({ ...prev, what_you_learned: value }))}
        />
        <SelectField
          label="Decision"
          value={testDraft.decision}
          options={decisionOptions}
          onChange={(value) => setTestDraft((prev) => ({ ...prev, decision: value }))}
        />
      </EditableSection>

      <MetricsSection idea={idea} />
      <IdeaTimeline idea={idea} />
    </div>
  );
}
