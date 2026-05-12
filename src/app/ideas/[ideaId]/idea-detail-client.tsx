"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { GhostButton, PrimaryButton, SecondaryButton } from "@/components/design-system";
import { writeWorksheetField } from "@/components/lean-canvas/write-worksheet-field";
import { ActionMenu, TrashIcon } from "@/components/ActionMenu";
import { formatDate } from "@/lib/format-date";
import { pageSignalsSummary } from "@/lib/scout-signals";
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
import {
  calculateFeeRowAmount,
  calculateFeeRowsTotal,
  parseFeeRows,
  serializeFeeRows,
  type EconomicsFeeRow,
  type EconomicsFeeType,
} from "@/lib/v2/worksheets/economics-fees";
import { calculateUnitEconomics } from "@/lib/v2/worksheets/review-unit-economics";

type ResponseMap = Record<string, string>;
type InstanceRow = Record<string, string | undefined>;
type SaveState = "idle" | "saving" | "saved" | "error";
type EditSection = "idea" | "economics" | "test" | null;
type EconomicsField = "sell" | "cost" | "shipping" | "fees";
type LocalActivityEvent = {
  key: string;
  label: string;
  detail: string;
  createdAt: string;
  sourceLabel: string;
  href: string;
};
type IdeaDraft = {
  idea_description: string;
  raw_product_title: string;
  product_image_url: string;
  source_url: string;
  source_label: string;
  demand_evidence: string;
  competition_notes: string;
  seasonality: string;
};
type EconomicsDraft = {
  product_cost: string;
  shipping_to_customer: string;
  platform_fees: string;
  selling_price: string;
  variant_complexity: string;
  upfront_cost_risk: string;
  test_speed: string;
  numbers_confidence: string;
  viable: string;
};
type NoteRow = {
  note_id?: string;
  idea_id?: string;
  created_at?: string;
  note?: string;
};

const inputBase =
  "mt-1.5 block w-full rounded-xl border border-[#e2e4ea] bg-white px-4 py-2.5 text-sm text-ink-900 shadow-sm outline-none transition placeholder:text-[#b0b3be] focus:border-cobalt-600 focus:ring-1 focus:ring-cobalt-600";

const selectBase = `${inputBase} pr-8`;

const variantOptions = ["", "1 SKU: simple", "2–5 SKUs: manageable", "6–15 SKUs: complex", "16+ SKUs: very complex"];
const upfrontRiskOptions = ["", "Low: can test without buying much stock", "Medium: small sample or stock order needed", "High: meaningful stock order needed", "Unknown: need supplier numbers"];
const testSpeedOptions = ["", "Fast: can list this week", "Medium: needs sample, prep, or supplier confirmation", "Slow: needs production, customisation, or more setup", "Unknown"];
const confidenceOptions = ["", "High: real quotes and known fees", "Medium: close estimates", "Low: mostly guesses", "Unknown: missing key costs"];
const viableOptions = ["", "Yes: proceed", "Marginal: possible with adjustments", "No: eliminate"];
const seasonalityEvidenceOptions = ["", "Seasonal", "Possibly seasonal", "Evergreen", "Trend unknown"];
const marketplaceOptions = ["", "eBay", "Etsy", "Amazon", "Vinted", "Facebook Marketplace", "Other"];
const resultOptions = ["", "Sold: strong demand", "Interest but no sale", "Views but no engagement", "Very few views", "Still running"];
const decisionOptions = ["", "Proceed: build the store", "Iterate and retest: adjust listing or price", "Pivot: try a different product"];

const CHAPTER_5_ECONOMICS_HREF = "/chapter/know-your-numbers/steps?step=chapter-5-step-4-score-with-real-numbers";
const CHAPTER_6_PLAN_HREF = "/chapter/test-before-you-build/steps?step=chapter-6-step-1-your-first-sale-and-choose-marketplace";
const CHAPTER_6_RESULTS_HREF = "/chapter/test-before-you-build/steps?step=chapter-6-step-4-read-results-and-decide";
const CHAPTER_7_CUSTOMER_HREF = "/chapter/pick-your-customer/steps?step=chapter-7-step-2-define-niche-customer";

function parseRows(raw: string | undefined): InstanceRow[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function todayISO(): string {
  return new Date().toISOString();
}

function createNoteId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `note_${Date.now()}`;
}

function lifecycleTone(status: ProductIdeaLifecycleStatus): string {
  if (status === "proceed") return "bg-success-100 text-[#005e3f]";
  if (status === "pivot" || status === "retest") return "bg-[#fff8e6] text-[#835700]";
  if (status === "test_running" || status === "test_reviewed" || status === "test_planned") {
    return "bg-[#eef4ff] text-cobalt-600";
  }
  return "bg-surface-sunken text-ink-500";
}

function scoreTone(score: number | null): string {
  if (score === null) return "bg-surface-sunken text-ink-500";
  if (score >= 70) return "bg-success-100 text-[#005e3f]";
  if (score >= 40) return "bg-[#fff8e6] text-[#835700]";
  return "bg-error-100 text-error-700";
}

function compactScoreLabel(score: number | null): string {
  if (score === null) return "Not scored";
  if (score >= 70) return "Strong";
  if (score >= 40) return "Moderate";
  return "Weak";
}

function scoreOutOfTen(score: number | null): string {
  if (score === null) return "-";
  return `${(score / 10).toFixed(1)}/10`;
}

function scoreOutOfHundred(score: number | null): string {
  if (score === null) return "-";
  return `${score}/100`;
}

function scoreBorderTone(score: number | null): string {
  if (score === null) return "border-ink-100 bg-surface-sunken text-ink-600";
  if (score >= 70) return "border-success-100 bg-success-100 text-[#005e3f]";
  if (score >= 40) return "border-amber-100 bg-[#fff8e6] text-[#835700]";
  return "border-error-100 bg-error-100 text-error-700";
}

function demandBorderTone(score: number | null): string {
  if (score === null) return "border-ink-100 bg-surface-sunken text-ink-600";
  if (score <= 20) return "border-error-100 bg-error-100 text-error-700";
  if (score <= 60) return "border-amber-100 bg-[#fff8e6] text-[#835700]";
  return "border-success-100 bg-success-100 text-[#005e3f]";
}

function competitionBorderTone(score: number | null): string {
  if (score === null) return "border-ink-100 bg-surface-sunken text-ink-600";
  if (score <= 30) return "border-success-100 bg-success-100 text-[#005e3f]";
  if (score <= 70) return "border-amber-100 bg-[#fff8e6] text-[#835700]";
  return "border-error-100 bg-error-100 text-error-700";
}

function seasonalityTone(value: string | null | undefined): string {
  const normalised = (value ?? "").trim().toLowerCase();
  if (!normalised) return "border-ink-100 bg-surface-sunken text-ink-600";
  if (normalised.includes("season") || normalised.includes("risk") || normalised.includes("spike")) {
    return "border-amber-100 bg-[#fff8e6] text-[#835700]";
  }
  return "border-success-100 bg-success-100 text-[#005e3f]";
}

function compactNumber(value: string | null | undefined): string {
  const parsed = Number.parseFloat((value ?? "").replace(/,/g, ""));
  if (!Number.isFinite(parsed)) return value?.trim() || "Not captured";
  return parsed.toLocaleString("en-GB");
}

function parsedNumber(value: string | null | undefined): number | null {
  const parsed = Number.parseFloat((value ?? "").replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function parsedMoney(value: string | null | undefined): number | null {
  const parsed = Number.parseFloat((value ?? "").replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function formatMoneyInput(value: string): string {
  return value.trim() || "Not added";
}

function formatMoneyDisplay(value: string | null | undefined): string {
  const parsed = parsedMoney(value);
  if (parsed === null) return "Not added";
  return formatCurrency(parsed);
}

function createFeeId(): string {
  return `fee_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function feeRowsFromStorage(value: string | null | undefined): EconomicsFeeRow[] {
  const rows = parseFeeRows(value ?? undefined);
  if (rows.length > 0) return rows;

  const trimmed = (value ?? "").trim();
  if (!trimmed || trimmed === "[]") return [];

  return [
    {
      id: "fee_legacy",
      name: "Platform fee",
      type: trimmed.includes("%") ? "percent" : "fixed",
      value: trimmed.replace(/[^0-9.\-]/g, ""),
    },
  ];
}

function feeTotalFromStorage(value: string | null | undefined, sellingPrice: number | null): number | null {
  if (sellingPrice === null) return null;
  const rows = feeRowsFromStorage(value);
  if (rows.length === 0) return null;
  return calculateFeeRowsTotal(rows, sellingPrice);
}

function formatFeeSummary(value: string | null | undefined, sellingPrice: number | null): string {
  const rows = feeRowsFromStorage(value);
  if (rows.length === 0) return "";

  return rows
    .map((row) => {
      const label = row.name.trim() || "Fee";
      const amount = sellingPrice === null ? null : calculateFeeRowAmount(row, sellingPrice);
      const rawValue = row.type === "percent"
        ? `${row.value || "0"}%`
        : formatCurrency(parsedMoney(row.value), "GBP");
      return amount === null ? `${label}: ${rawValue}` : `${label}: ${rawValue} (${formatCurrency(amount)})`;
    })
    .join("\n");
}

function projectedEconomics(row: InstanceRow): {
  sellingPrice: number | null;
  margin: number | null;
  marginPercent: number | null;
  missingNumbers: boolean;
} {
  const full = calculateUnitEconomics(row);
  if (full.margin !== null) return full;
  const sellingPrice = full.sellingPrice ?? parsedMoney(row.selling_price);
  const productCost = parsedMoney(row.product_cost);
  if (sellingPrice === null || productCost === null || sellingPrice <= 0) return full;
  const margin = sellingPrice - productCost;
  return {
    sellingPrice,
    margin,
    marginPercent: (margin / sellingPrice) * 100,
    missingNumbers: true,
  };
}

function marginTone(value: number | null): string {
  if (value === null) return "border-ink-100 bg-surface-sunken text-ink-600";
  if (value <= 0) return "border-error-100 bg-error-100 text-error-700";
  if (value >= 40) return "border-success-100 bg-success-100 text-[#005e3f]";
  if (value >= 20) return "border-amber-100 bg-[#fff8e6] text-[#835700]";
  return "border-error-100 bg-error-100 text-error-700";
}

function isScoutImportNote(note: ProductIdeaLifecycle["notes"][number]): boolean {
  return note.note.trim().startsWith("Imported from Scout on");
}

function cleanEvidenceText(value: string | null | undefined): string {
  const seen = new Set<string>();
  return (value ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^(observed orders|observed reviews|observed rating|observed price|scout score|demand score|competition score|preview margin):/i.test(line))
    .filter((line) => {
      const key = line
        .replace(/Observed reviews:\s*([0-9,]+)/i, (_, count) => `Observed reviews:${String(count).replace(/,/g, "")}`)
        .replace(/Observed orders:\s*([0-9,]+)/i, (_, count) => `Observed orders:${String(count).replace(/,/g, "")}`)
        .toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .join("\n");
}

function formatCurrency(value: number | null, currency = "GBP"): string {
  if (value === null) return "Not logged";
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatSignedCurrencyDelta(value: number): string {
  const normalised = Math.abs(value) < 0.005 ? 0 : value;
  return `${normalised > 0 ? "+" : ""}${formatCurrency(normalised)} vs projection`;
}

function formatPercent(value: number | null): string {
  if (value === null) return "Not known";
  return `${value.toFixed(1)}%`;
}

function optionLabel(value: string): string {
  if (!value) return "Not selected";
  return value.split(":")[0]?.trim() || value;
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
        aria-label={label}
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
        aria-label={label}
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
      <select
        aria-label={label}
        className={selectBase}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option || "empty"} value={option}>
            {optionLabel(option)}
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
      {state === "saved" ? <span className="text-sm font-semibold text-[#005e3f]">✓</span> : null}
      {state === "error" ? <span className="text-sm font-semibold text-error-700">Not saved</span> : null}
    </div>
  );
}

function NoteSaveButton({ state, disabled }: { state: SaveState; disabled: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <PrimaryButton type="submit" disabled={disabled || state === "saving"}>
        {state === "saving" ? "Saving" : "Save note"}
      </PrimaryButton>
      {state === "saved" ? <span className="text-sm font-semibold text-[#005e3f]">✓</span> : null}
      {state === "error" ? <span className="text-sm font-semibold text-error-700">Not saved</span> : null}
    </div>
  );
}

function InlineValue({
  label,
  value,
  caption,
  placeholder = "Add value",
  multiline = false,
  onSave,
}: {
  label: string;
  value: string;
  caption?: string;
  placeholder?: string;
  multiline?: boolean;
  onSave: (value: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [state, setState] = useState<SaveState>("idle");

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [editing, value]);

  async function commit() {
    const trimmed = draft.trim();
    if (trimmed === value.trim()) {
      setEditing(false);
      return;
    }
    setState("saving");
    await onSave(trimmed);
    setState("saved");
    setEditing(false);
    window.setTimeout(() => setState("idle"), 1600);
  }

  function cancel() {
    setDraft(value);
    setEditing(false);
  }

  return (
    <div className="grid gap-2 sm:grid-cols-[150px_minmax(0,1fr)] sm:items-start">
      <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-500">{label}</dt>
      <dd className="min-w-0">
        {editing ? (
          multiline ? (
            <textarea
              autoFocus
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onBlur={() => void commit()}
              onKeyDown={(event) => {
                if (event.key === "Escape") cancel();
              }}
              className="block min-h-20 w-full rounded-lg border border-cobalt-200 bg-white px-3 py-2 text-sm leading-6 text-ink-900 outline-none focus:border-cobalt-500 focus:ring-2 focus:ring-cobalt-100"
            />
          ) : (
            <input
              autoFocus
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onBlur={() => void commit()}
              onKeyDown={(event) => {
                if (event.key === "Enter") event.currentTarget.blur();
                if (event.key === "Escape") cancel();
              }}
              className="block w-full border-b border-cobalt-400 bg-transparent py-0.5 text-sm text-ink-900 outline-none"
            />
          )
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="group flex max-w-full items-center gap-2 text-left text-sm text-ink-800 underline-offset-4 hover:text-cobalt-600"
          >
            <span className={multiline ? "line-clamp-2" : "truncate"}>{value || placeholder}</span>
            <span aria-hidden="true" className="text-ink-300 opacity-0 transition group-hover:opacity-100">Edit</span>
            {state === "saved" ? <span className="text-[#005e3f]">Saved</span> : null}
          </button>
        )}
        {caption ? <p className="mt-1 text-xs italic leading-5 text-ink-500">{caption}</p> : null}
      </dd>
    </div>
  );
}

function EvidenceValue({
  label,
  value,
  caption,
}: {
  label: string;
  value: string;
  caption?: string;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-[150px_minmax(0,1fr)] sm:items-start">
      <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-500">{label}</dt>
      <dd className="min-w-0">
        <p className="text-sm leading-6 text-ink-800">{value || "Not captured"}</p>
        {caption ? <p className="mt-1 text-xs italic leading-5 text-ink-500">{caption}</p> : null}
      </dd>
    </div>
  );
}

function EvidenceSelectValue({
  label,
  value,
  options,
  onSave,
}: {
  label: string;
  value: string;
  options: string[];
  onSave: (value: string) => Promise<void>;
}) {
  const [state, setState] = useState<SaveState>("idle");

  async function save(value: string) {
    setState("saving");
    await onSave(value);
    setState("saved");
    window.setTimeout(() => setState("idle"), 1600);
  }

  return (
    <div className="grid gap-2 sm:grid-cols-[150px_minmax(0,1fr)] sm:items-start">
      <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-500">{label}</dt>
      <dd className="min-w-0">
        <select
          value={value}
          onChange={(event) => void save(event.target.value)}
          className="block max-w-xs rounded-lg border border-ink-100 bg-white px-3 py-2 text-sm font-medium text-ink-900 outline-none transition focus:border-cobalt-500 focus:ring-2 focus:ring-cobalt-100"
        >
          <option value="">None</option>
          {options.filter(Boolean).map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        {state === "saving" ? <p className="mt-1 text-xs font-semibold text-ink-500">Saving...</p> : null}
        {state === "saved" ? <p className="mt-1 text-xs font-semibold text-[#005e3f]">Saved</p> : null}
      </dd>
    </div>
  );
}

function EditableMoney({
  label,
  value,
  onSave,
}: {
  label: string;
  value: string | undefined;
  onSave: (value: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");

  useEffect(() => {
    if (!editing) setDraft(value ?? "");
  }, [editing, value]);

  async function commit() {
    if (draft.trim() !== (value ?? "").trim()) await onSave(draft.trim());
    setEditing(false);
  }

  return (
    <span className="group inline-flex items-baseline gap-2">
      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-500">{label}</span>
      {editing ? (
        <input
          autoFocus
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={() => void commit()}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur();
            if (event.key === "Escape") setEditing(false);
          }}
          className="w-24 border-b border-cobalt-400 bg-transparent py-0.5 font-[Manrope] text-xl font-bold text-ink-900 outline-none"
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="font-[Manrope] text-xl font-bold text-ink-900 underline-offset-4 hover:text-cobalt-600"
        >
          {formatMoneyDisplay(value)}
          <span aria-hidden="true" className="ml-1 text-xs text-ink-300 opacity-0 group-hover:opacity-100">Edit</span>
        </button>
      )}
    </span>
  );
}

function EditableSection({
  id,
  title,
  description,
  state,
  onSubmit,
  onCancel,
  children,
}: {
  id: string;
  title: string;
  description: string;
  state: SaveState;
  onSubmit: () => Promise<void>;
  onCancel: () => void;
  children: ReactNode;
}) {
  return (
    <form
      id={id}
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
        <div className="flex flex-wrap items-center gap-3">
          <SaveButton state={state} />
          <SecondaryButton type="button" onClick={onCancel} className="px-4 py-2">
            Cancel
          </SecondaryButton>
        </div>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">{children}</div>
      <div className="mt-5 border-t border-ink-100 pt-5">
        <div className="flex flex-wrap items-center gap-3">
          <SaveButton state={state} />
          <SecondaryButton type="button" onClick={onCancel} className="px-4 py-2">
            Cancel
          </SecondaryButton>
        </div>
      </div>
    </form>
  );
}

function ReviewValue({
  label,
  value,
  wide = false,
}: {
  label: string;
  value: string | null | undefined;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "md:col-span-2" : undefined}>
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-500">{label}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-ink-800">{value?.trim() || "Not added"}</p>
    </div>
  );
}

function ReviewSection({
  id,
  title,
  description,
  onEdit,
  children,
}: {
  id: string;
  title: string;
  description: string;
  onEdit: () => void;
  children: ReactNode;
}) {
  return (
    <section id={id} className="rounded-xl border border-ink-100 bg-surface-raised p-6 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-[Manrope] text-lg font-bold text-ink-900">{title}</h2>
          <p className="mt-2 max-w-[620px] text-sm leading-6 text-ink-500">{description}</p>
        </div>
        <SecondaryButton type="button" onClick={onEdit} className="px-4 py-2">
          Edit
        </SecondaryButton>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}

function EvidencePanel({
  idea,
  sourceIdea,
  ideaDraft,
  onSaveField,
}: {
  idea: ProductIdeaLifecycle;
  sourceIdea: ProductIdeaRow;
  ideaDraft: IdeaDraft;
  onSaveField: (key: keyof IdeaDraft, value: string) => Promise<void>;
}) {
  const source = ideaDraft.source_label || idea.sourceLabel || "Scout";
  const scanned = formatDate(idea.scannerScoredAt || idea.scoutCapturedAt, "long");
  const imported = idea.scoutCapturedAt ? formatDate(idea.scoutCapturedAt, "long") : "";
  const observedPriceLabel = idea.observedPriceType === "supplier_cost"
    ? "Observed supplier price"
    : idea.observedPriceType === "retail_price"
      ? "Observed retail price"
      : "Observed price";
  const seasonality = ideaDraft.seasonality.trim();
  const seasonalityValue = seasonality || "";
  const competition = idea.scannerCompetitionScore === null
    ? ideaDraft.competition_notes.trim()
    : `${idea.scannerCompetitionScore}/100${ideaDraft.competition_notes.trim() ? ` · ${ideaDraft.competition_notes.trim().replace(/^Competition score:\s*/i, "").replace(/^Competition signal:\s*/i, "")}` : ""}`;
  const pageSignals = pageSignalsSummary(sourceIdea);
  const missingSignals = sourceIdea.missing_signals?.trim();

  return (
    <section id="idea-evidence" className="rounded-xl border border-ink-100 bg-surface-raised p-6 shadow-card">
      <h2 className="font-[Manrope] text-lg font-bold text-ink-900">Idea evidence</h2>

      <div className="mt-5 divide-y divide-ink-100">
        <section className="pb-5">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-500">Source</h3>
          <dl className="mt-4 space-y-3">
            <InlineValue label="Idea name" value={ideaDraft.idea_description} onSave={(value) => onSaveField("idea_description", value)} />
            <EvidenceValue label="Imported from" value={source} />
            <EvidenceValue label="Scanned" value={scanned} />
            {imported ? <EvidenceValue label="Imported" value={imported} /> : null}
            {ideaDraft.raw_product_title ? (
              <EvidenceValue label="Marketplace title" value={ideaDraft.raw_product_title} />
            ) : null}
          </dl>
        </section>

        <section className="py-5">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-500">Listing</h3>
          <dl className="mt-4 space-y-3">
            {idea.observedPrice ? (
              <EvidenceValue label={observedPriceLabel} value={idea.observedPrice} />
            ) : null}
            {sourceIdea.variant_count?.trim() ? (
              <EvidenceValue label="Variant count" value={sourceIdea.variant_count.trim()} />
            ) : null}
            <EvidenceSelectValue
              label="Seasonality"
              value={seasonalityValue}
              options={seasonalityEvidenceOptions}
              onSave={(value) => onSaveField("seasonality", value)}
            />
            {competition.trim() ? (
              <EvidenceValue label="Competition" value={competition} />
            ) : null}
          </dl>
        </section>

        <section className="pt-5">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-500">Page facts</h3>
          <dl className="mt-4 space-y-3">
            <EvidenceValue label="Captured" value={pageSignals.label} caption={pageSignals.detail} />
            <EvidenceValue label="Calculated signal gaps" value={missingSignals || "None"} />
          </dl>
        </section>
      </div>
    </section>
  );
}

function SummaryCard({
  label,
  value,
  detail,
  tone = "bg-white text-ink-900",
}: {
  label: string;
  value: string;
  detail: string;
  tone?: string;
}) {
  return (
    <div className={`rounded-xl border border-ink-100 p-4 ${tone}`}>
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] opacity-75">{label}</p>
      <p className="mt-2 font-[Manrope] text-xl font-bold leading-tight">{value}</p>
      <p className="mt-1 text-xs leading-5 opacity-80">{detail}</p>
    </div>
  );
}

function SignalCard({
  label,
  value,
  detail,
  tone,
  meta = "Calculated",
}: {
  label: string;
  value: string;
  detail: string;
  tone: string;
  meta?: "Calculated" | "Captured" | "Locked";
}) {
  return (
    <div className={`rounded-xl border px-4 py-3 ${tone}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] opacity-75">{label}</p>
        <span className="rounded-full bg-white/60 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] opacity-75">
          {meta}
        </span>
      </div>
      <p className="mt-2 font-[Manrope] text-2xl font-bold leading-none">{value}</p>
      <p className="mt-2 text-xs font-semibold leading-5 opacity-85">{detail}</p>
    </div>
  );
}

function CapturedFactCard({
  label,
  value,
  badge,
}: {
  label: string;
  value: string;
  badge?: string;
}) {
  return (
    <div className="rounded-lg bg-surface-sunken px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-500">{label}</p>
        <span className="rounded-full bg-white px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-ink-400">
          Captured
        </span>
      </div>
      <p className="mt-1 text-sm font-bold text-ink-900">{value}</p>
      {badge ? (
        <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.1em] text-amber-700">{badge}</p>
      ) : null}
    </div>
  );
}

function LockedSignalCard({
  label,
  detail,
}: {
  label: string;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-ink-200 bg-surface-sunken px-4 py-3 text-ink-500">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em]">{label}</p>
        <span className="rounded-full bg-white px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-cobalt-600">
          Pro
        </span>
      </div>
      <p className="mt-2 font-[Manrope] text-lg font-bold text-ink-700">Locked</p>
      <p className="mt-1 text-xs leading-5">{detail}</p>
    </div>
  );
}

function ScoutSignalSummary({
  idea,
  sourceIdea,
  canUseResearchWorkspace,
}: {
  idea: ProductIdeaLifecycle;
  sourceIdea: ProductIdeaRow;
  canUseResearchWorkspace: boolean;
}) {
  const orders = parsedNumber(sourceIdea.observed_order_count);
  const reviews = parsedNumber(sourceIdea.observed_review_count);
  const hasUnusualRatio = orders !== null && reviews !== null && orders <= 5 && reviews >= 500;
  const pageSignals = pageSignalsSummary(sourceIdea);
  const observed = [
    sourceIdea.observed_price?.trim() ? ["Listing price", sourceIdea.observed_price.trim(), ""] : null,
    ["Orders", compactNumber(sourceIdea.observed_order_count), hasUnusualRatio ? "Unusual ratio" : ""],
    ["Reviews", compactNumber(sourceIdea.observed_review_count), ""],
    sourceIdea.observed_rating?.trim() ? ["Rating", sourceIdea.observed_rating.trim(), ""] : null,
    sourceIdea.variant_count?.trim() ? ["Variants", sourceIdea.variant_count.trim(), ""] : null,
    sourceIdea.observed_bsr?.trim() ? ["BSR", sourceIdea.observed_bsr.trim(), ""] : null,
  ].filter(Boolean) as Array<[string, string, string]>;

  return (
    <section className="rounded-xl border border-ink-100 bg-surface-raised p-5 shadow-card">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-cobalt-600">Scout verdict</p>
          <h2 className="mt-2 font-[Manrope] text-xl font-bold text-ink-900">
            {idea.scannerVerdict || compactScoreLabel(idea.scannerScore)}
          </h2>
          <p className="mt-1 text-sm text-ink-500">Calculated from captured page facts and Scout rules.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-ink-500">
          {idea.scannerScoredAt ? <span>Scanned {formatDate(idea.scannerScoredAt, "relative")}</span> : null}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-500">Calculated scores</h3>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SignalCard
          label="Scout score"
          value={scoreOutOfTen(idea.scannerScore)}
          detail={compactScoreLabel(idea.scannerScore)}
          tone={scoreBorderTone(idea.scannerScore)}
        />
        <SignalCard
          label="Demand"
          value={scoreOutOfHundred(idea.scannerDemandScore)}
          detail={compactScoreLabel(idea.scannerDemandScore)}
          tone={demandBorderTone(idea.scannerDemandScore)}
        />
        <SignalCard
          label="Competition"
          value={scoreOutOfHundred(idea.scannerCompetitionScore)}
          detail={compactScoreLabel(idea.scannerCompetitionScore)}
          tone={competitionBorderTone(idea.scannerCompetitionScore)}
        />
        <SignalCard
          label="Seasonality"
          value={idea.seasonality ? "Flagged" : "None"}
          detail={idea.seasonality ? "Review timing risk" : ""}
          tone={seasonalityTone(idea.seasonality)}
        />
      </div>

      <div className="mt-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-500">Captured page facts</h3>
          <p className="mt-1 text-xs text-ink-500" title={pageSignals.detail}>{pageSignals.label}</p>
        </div>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        {observed.map(([label, value, badge]) => (
          <CapturedFactCard key={label} label={label} value={value} badge={badge} />
        ))}
      </div>

      {!canUseResearchWorkspace ? (
        <>
          <div className="mt-6">
            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-500">Pro research signals</h3>
              <p className="mt-1 text-xs text-ink-500">Extra decision support available in Scout Pro.</p>
            </div>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <LockedSignalCard label="Trend direction" detail="See whether interest is rising, stable, or falling." />
            <LockedSignalCard label="AI evidence summary" detail="Turn noisy page data into a clearer opportunity read." />
            <LockedSignalCard label="Any-site analysis" detail="Scan product pages beyond Amazon and AliExpress." />
          </div>
          <p className="mt-3 text-sm text-ink-500">
            <a href="/upgrade?plan=scout_pro" className="font-semibold !text-cobalt-600 underline-offset-4 hover:!text-cobalt-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500 focus-visible:ring-offset-2">
              Upgrade Scout to Pro
            </a>{" "}
            to unlock AI research features.
          </p>
        </>
      ) : null}
    </section>
  );
}

function EconomicsSnapshot({
  economics,
  onSave,
  saving,
}: {
  economics: InstanceRow;
  onSave: (values: Partial<EconomicsDraft>) => Promise<boolean>;
  saving: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    selling_price: economics.selling_price ?? "",
    product_cost: economics.product_cost ?? "",
    shipping_to_customer: economics.shipping_to_customer ?? "",
    platform_fees: economics.platform_fees ?? "",
  });
  const [displayEconomics, setDisplayEconomics] = useState({
    ...economics,
    selling_price: economics.selling_price ?? "",
    product_cost: economics.product_cost ?? "",
    shipping_to_customer: economics.shipping_to_customer ?? "",
    platform_fees: economics.platform_fees ?? "",
  });

  useEffect(() => {
    if (editing) return;
    setDraft({
      selling_price: economics.selling_price ?? "",
      product_cost: economics.product_cost ?? "",
      shipping_to_customer: economics.shipping_to_customer ?? "",
      platform_fees: economics.platform_fees ?? "",
    });
    setDisplayEconomics({
      ...economics,
      selling_price: economics.selling_price ?? "",
      product_cost: economics.product_cost ?? "",
      shipping_to_customer: economics.shipping_to_customer ?? "",
      platform_fees: economics.platform_fees ?? "",
    });
  }, [editing, economics.platform_fees, economics.product_cost, economics.selling_price, economics.shipping_to_customer]);

  async function saveDraft() {
    const saved = await onSave(draft);
    if (saved) {
      setDisplayEconomics((prev) => ({ ...prev, ...draft }));
      setEditing(false);
    }
  }

  function cancelDraft() {
    setDraft({
      selling_price: economics.selling_price ?? "",
      product_cost: economics.product_cost ?? "",
      shipping_to_customer: economics.shipping_to_customer ?? "",
      platform_fees: economics.platform_fees ?? "",
    });
    setEditing(false);
  }

  const displaySell = parsedMoney(displayEconomics.selling_price);
  const displayFees = feeTotalFromStorage(displayEconomics.platform_fees, displaySell);

  return (
    <section className="rounded-xl border border-ink-100 bg-surface-raised p-5 shadow-card">
      {editing ? (
        <>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="font-[Manrope] text-lg font-bold text-ink-900">Economics</h2>
              <p className="mt-1 text-sm text-ink-500">Projected margin</p>
            </div>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <Field
              label="Sell price"
              value={draft.selling_price}
              onChange={(value) => setDraft((prev) => ({ ...prev, selling_price: value }))}
            />
            <Field
              label="Product cost"
              value={draft.product_cost}
              onChange={(value) => setDraft((prev) => ({ ...prev, product_cost: value }))}
            />
            <Field
              label="Shipping"
              value={draft.shipping_to_customer}
              onChange={(value) => setDraft((prev) => ({ ...prev, shipping_to_customer: value }))}
            />
          </div>
          <FeeRowsEditor
            value={draft.platform_fees}
            sellingPrice={parsedMoney(draft.selling_price)}
            currency="GBP"
            onChange={(rows) => setDraft((prev) => ({ ...prev, platform_fees: serializeFeeRows(rows) }))}
          />
          <div className="mt-5 border-t border-ink-100 pt-5">
            <div className="flex flex-wrap items-center gap-2">
              <PrimaryButton type="button" disabled={saving} onClick={() => void saveDraft()} className="px-4 py-2">
                {saving ? "Saving" : "Save"}
              </PrimaryButton>
              <SecondaryButton type="button" disabled={saving} onClick={cancelDraft} className="px-4 py-2">
                Cancel
              </SecondaryButton>
            </div>
          </div>
        </>
      ) : (
        <EconomicsSection
          sell={displaySell}
          cost={parsedMoney(displayEconomics.product_cost)}
          shipping={parsedMoney(displayEconomics.shipping_to_customer)}
          fees={displayFees}
          currency="GBP"
          onEdit={() => setEditing(true)}
        />
      )}

      {saving ? <p className="mt-3 text-xs font-semibold text-ink-500">Saving economics...</p> : null}
    </section>
  );
}

function FeeRowsEditor({
  value,
  sellingPrice,
  currency,
  onChange,
}: {
  value: string;
  sellingPrice: number | null;
  currency: string;
  onChange: (rows: EconomicsFeeRow[]) => void;
}) {
  const rows = feeRowsFromStorage(value);

  function updateRows(nextRows: EconomicsFeeRow[]) {
    onChange(nextRows);
  }

  function updateRow(id: string, patch: Partial<EconomicsFeeRow>) {
    updateRows(rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  function addRow() {
    updateRows([
      ...rows,
      {
        id: createFeeId(),
        name: "",
        type: "percent",
        value: "",
      },
    ]);
  }

  function removeRow(id: string) {
    updateRows(rows.filter((row) => row.id !== id));
  }

  return (
    <div className="mt-5 rounded-xl border border-ink-100 bg-surface-sunken/50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-[Manrope] text-sm font-bold text-ink-900">Fees</h3>
          <p className="mt-1 text-xs leading-5 text-ink-500">
            Add payment, marketplace, or platform fees as percentages or fixed per-order costs.
          </p>
        </div>
        <SecondaryButton type="button" onClick={addRow} className="px-3 py-2 text-sm">
          Add fee
        </SecondaryButton>
      </div>

      {rows.length > 0 ? (
        <div className="mt-4 space-y-3">
          {rows.map((row, index) => {
            const amount = sellingPrice === null ? null : calculateFeeRowAmount(row, sellingPrice);
            const typeId = `fee-type-${row.id}`;
            return (
              <div key={row.id} className="grid gap-3 rounded-lg border border-ink-100 bg-white p-3 md:grid-cols-[minmax(0,1fr)_120px_120px_110px_auto] md:items-end">
                <label className="block">
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-500">Fee name</span>
                  <input
                    value={row.name}
                    onChange={(event) => updateRow(row.id, { name: event.target.value })}
                    placeholder={index === 0 ? "Stripe" : "Marketplace fee"}
                    className={inputBase}
                  />
                </label>
                <label className="block" htmlFor={typeId}>
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-500">Type</span>
                  <select
                    id={typeId}
                    value={row.type}
                    onChange={(event) => updateRow(row.id, { type: event.target.value as EconomicsFeeType })}
                    className={selectBase}
                  >
                    <option value="percent">Percent</option>
                    <option value="fixed">Fixed</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-500">
                    {row.type === "percent" ? "Percent" : "Amount"}
                  </span>
                  <input
                    value={row.value}
                    onChange={(event) => updateRow(row.id, { value: event.target.value })}
                    placeholder={row.type === "percent" ? "2.9" : "0.30"}
                    inputMode="decimal"
                    className={inputBase}
                  />
                </label>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-500">Per sale</p>
                  <p className="mt-2 font-[Manrope] text-sm font-semibold text-ink-900">
                    {amount === null ? "Needs sell price" : formatCurrency(amount, currency)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeRow(row.id)}
                  className="rounded-md px-2 py-2 text-sm font-semibold text-error-700 transition hover:bg-error-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500 focus-visible:ring-offset-2"
                >
                  Remove
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <button
          type="button"
          onClick={addRow}
          className="mt-4 w-full rounded-lg border border-dashed border-ink-300 px-4 py-4 text-left text-sm font-semibold text-ink-500 transition hover:border-cobalt-500 hover:text-cobalt-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500 focus-visible:ring-offset-2"
        >
          + Add your first fee
        </button>
      )}
    </div>
  );
}

type EconomicsProps = {
  sell: number | null;
  cost: number | null;
  shipping: number | null;
  fees: number | null;
  currency: string;
  onEdit: (field?: EconomicsField) => void;
};

function EconomicsSection({ sell, cost, shipping, fees, currency, onEdit }: EconomicsProps) {
  const margin = sell !== null && cost !== null ? sell - cost - (shipping ?? 0) - (fees ?? 0) : null;
  const percent = margin !== null && sell !== null && sell > 0 ? (margin / sell) * 100 : null;
  const hasMissingFields = shipping === null || fees === null;

  return (
    <>
      <SectionHeader hasMissingFields={hasMissingFields} onEdit={onEdit} />
      <div className="mt-5">
        <MarginFormula
          sell={sell}
          cost={cost}
          shipping={shipping}
          fees={fees}
          margin={margin}
          percent={percent}
          currency={currency}
          incomplete={hasMissingFields}
          onEdit={onEdit}
        />
      </div>
      <div className="mt-3">
        <MarginBadge percent={percent} complete={!hasMissingFields} />
      </div>
      <MarginDisclaimer shipping={shipping} fees={fees} onEdit={onEdit} />
    </>
  );
}

function SectionHeader({
  hasMissingFields,
  onEdit,
}: {
  hasMissingFields: boolean;
  onEdit: (field?: EconomicsField) => void;
}) {
  const Button = hasMissingFields ? PrimaryButton : SecondaryButton;

  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2 className="font-[Manrope] text-lg font-bold text-ink-900">Economics</h2>
        <p className="mt-1 text-sm text-ink-500">Projected margin</p>
      </div>
      <Button type="button" onClick={() => onEdit()} className="px-4 py-2">
        Edit economics
      </Button>
    </div>
  );
}

function MarginFormula({
  sell,
  cost,
  shipping,
  fees,
  margin,
  percent,
  currency,
  incomplete,
  onEdit,
}: EconomicsProps & {
  margin: number | null;
  percent: number | null;
  incomplete: boolean;
}) {
  return (
    <>
      <div className="hidden flex-wrap items-baseline gap-x-3 gap-y-2 md:flex md:flex-nowrap">
        <FormulaTerm label="Sell" value={sell} currency={currency} onEdit={() => onEdit("sell")} />
        <Operator>−</Operator>
        <FormulaTerm label="Cost" value={cost} currency={currency} onEdit={() => onEdit("cost")} />
        <Operator>−</Operator>
        <FormulaTerm label="Shipping" value={shipping} currency={currency} onEdit={() => onEdit("shipping")} />
        <Operator>−</Operator>
        <FormulaTerm label="Fees" value={fees} currency={currency} onEdit={() => onEdit("fees")} />
        <Operator>=</Operator>
        <MarginResult margin={margin} percent={percent} currency={currency} incomplete={incomplete} />
      </div>
      <StackedMarginFormula
        sell={sell}
        cost={cost}
        shipping={shipping}
        fees={fees}
        margin={margin}
        percent={percent}
        currency={currency}
        incomplete={incomplete}
        onEdit={onEdit}
      />
    </>
  );
}

function FormulaTerm({
  label,
  value,
  currency,
  onEdit,
}: {
  label: string;
  value: number | null;
  currency: string;
  onEdit: () => void;
}) {
  return (
    <span className="inline-flex items-baseline">
      <span className="mr-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-500">{label}</span>
      {value !== null ? (
        <button
          type="button"
          onClick={onEdit}
          className="rounded-md px-1 py-0.5 font-[Manrope] text-base font-medium text-ink-900 transition hover:bg-surface-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500 focus-visible:ring-offset-2"
        >
          <CurrencyValue value={value} currency={currency} />
        </button>
      ) : (
        <button
          type="button"
          onClick={onEdit}
          className="rounded-md border border-dashed border-ink-300 px-2 py-0.5 text-sm font-medium text-ink-500 transition hover:border-ink-700 hover:text-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500 focus-visible:ring-offset-2"
        >
          + Add {label.toLowerCase()}
        </button>
      )}
    </span>
  );
}

function Operator({ children }: { children: ReactNode }) {
  return <span className="text-lg font-light text-ink-300">{children}</span>;
}

function MarginResult({
  margin,
  percent,
  currency,
  incomplete,
}: {
  margin: number | null;
  percent: number | null;
  currency: string;
  incomplete: boolean;
}) {
  const tier = getMarginTier(percent, !incomplete);
  const formatted = formatCurrency(margin, currency);
  const percentLabel = percent === null ? "not known" : formatPercent(percent);

  return (
    <span
      className="inline-flex items-center gap-1.5"
      aria-label={`Projected margin ${formatted}, ${percentLabel}, ${tier.label}`}
    >
      <span className="mr-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-500">Margin</span>
      <span className="rounded-md bg-success-100 px-2 py-1 font-[Manrope] text-xl font-semibold text-[#005e3f]">
        {formatted}
      </span>
      <span className="ml-1 text-sm font-semibold text-[#005e3f] opacity-80">
        ({percent === null ? "—" : formatPercent(percent)})
      </span>
      {incomplete ? (
        <button
          type="button"
          aria-label="Margin is estimated because shipping or fees are not yet added."
          title="Margin is estimated. Add shipping and platform fees for a complete picture."
          className="inline-flex h-6 w-6 items-center justify-center rounded-full text-amber-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500 focus-visible:ring-offset-2"
        >
          !
        </button>
      ) : null}
    </span>
  );
}

function MarginBadge({ percent, complete }: { percent: number | null; complete: boolean }) {
  const tier = getMarginTier(percent, complete);

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${tier.className}`}>
      {tier.label}
    </span>
  );
}

function getMarginTier(
  pct: number | null,
  complete: boolean,
): {
  label: string;
  className: string;
} {
  const suffix = complete ? "" : " (est.)";
  if (pct === null) return { label: "Incomplete", className: "bg-surface-sunken text-ink-600" };
  if (pct >= 60) return { label: `Strong${suffix}`, className: "bg-success-100 text-[#005e3f]" };
  if (pct >= 30) return { label: `Healthy${suffix}`, className: "bg-[#ecfdf3] text-[#006b4a]" };
  if (pct >= 10) return { label: `Thin${suffix}`, className: "bg-amber-100 text-amber-800" };
  return { label: `Risky${suffix}`, className: "bg-error-100 text-error-700" };
}

function MarginDisclaimer({
  shipping,
  fees,
  onEdit,
}: {
  shipping: number | null;
  fees: number | null;
  onEdit: (field?: EconomicsField) => void;
}) {
  if (fees === null) {
    return (
      <p className="mt-3 text-sm leading-6 text-ink-500">
        Margin includes product cost{shipping !== null ? " and shipping" : ""}. Add fees for a complete picture.
        <button
          type="button"
          onClick={() => onEdit("fees")}
          className="ml-1 text-ink-900 underline underline-offset-2 transition hover:text-cobalt-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500 focus-visible:ring-offset-2"
        >
          Add fees
        </button>
      </p>
    );
  }

  return <p className="mt-3 text-sm text-ink-500">Full economics: sell price minus all costs.</p>;
}

function StackedMarginFormula({
  sell,
  cost,
  shipping,
  fees,
  margin,
  percent,
  currency,
  incomplete,
  onEdit,
}: EconomicsProps & {
  margin: number | null;
  percent: number | null;
  incomplete: boolean;
}) {
  return (
    <dl className="divide-y divide-ink-100 md:hidden">
      <FormulaRow label="Sell" value={sell} currency={currency} onEdit={() => onEdit("sell")} />
      <FormulaRow label="Cost" value={cost} currency={currency} sign="−" onEdit={() => onEdit("cost")} />
      <FormulaRow label="Shipping" value={shipping} currency={currency} sign="−" onEdit={() => onEdit("shipping")} />
      <FormulaRow label="Fees" value={fees} currency={currency} sign="−" onEdit={() => onEdit("fees")} />
      <FormulaRow
        label="Margin"
        value={margin}
        currency={currency}
        sign="="
        percent={percent}
        emphasized
        incomplete={incomplete}
      />
    </dl>
  );
}

function FormulaRow({
  label,
  value,
  currency,
  sign,
  percent,
  emphasized = false,
  incomplete = false,
  onEdit,
}: {
  label: string;
  value: number | null;
  currency: string;
  sign?: string;
  percent?: number | null;
  emphasized?: boolean;
  incomplete?: boolean;
  onEdit?: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <dt className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-ink-500">
        {sign ? <span className="text-ink-300">{sign}</span> : null}
        {label}
      </dt>
      <dd className={emphasized ? "font-[Manrope] text-lg font-bold text-[#005e3f]" : "font-[Manrope] font-semibold text-ink-900"}>
        {onEdit ? (
          <button
            type="button"
            onClick={onEdit}
            className="rounded-md px-1 py-0.5 transition hover:bg-surface-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500 focus-visible:ring-offset-2"
          >
            {value === null ? `+ Add ${label.toLowerCase()}` : <CurrencyValue value={value} currency={currency} />}
          </button>
        ) : (
          <>
            {formatCurrency(value, currency)}
            {percent !== undefined ? (
              <span className="ml-1 text-sm font-semibold opacity-80">
                ({percent === null ? "—" : formatPercent(percent)})
              </span>
            ) : null}
            {incomplete ? (
              <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                est.
              </span>
            ) : null}
          </>
        )}
      </dd>
    </div>
  );
}

function CurrencyValue({ value, currency }: { value: number; currency: string }) {
  const parts = new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).formatToParts(value);

  return (
    <>
      {parts.map((part, index) =>
        part.type === "currency" ? (
          <span key={`${part.type}-${index}`} className="font-normal opacity-70">
            {part.value}
          </span>
        ) : (
          <span key={`${part.type}-${index}`}>{part.value}</span>
        ),
      )}
    </>
  );
}

function IdeaSummarySection({
  idea,
  economics,
}: {
  idea: ProductIdeaLifecycle;
  economics: InstanceRow;
}) {
  const projection = projectedEconomics(economics);
  const latestMetric = idea.metricEntries[0] ?? null;
  const testSummary = idea.testResult || idea.testDecision || idea.testMarketplace || "No test logged";

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <SummaryCard
        label="Product score"
        value={idea.scannerScore === null ? "-" : String(idea.scannerScore)}
        detail={idea.scannerScoredAt ? `${compactScoreLabel(idea.scannerScore)} on ${formatDate(idea.scannerScoredAt, "relative")}` : compactScoreLabel(idea.scannerScore)}
        tone={scoreTone(idea.scannerScore)}
      />
      <SummaryCard
        label="Projected margin"
        value={formatCurrency(projection.margin)}
        detail={projection.marginPercent === null ? "Add economics to calculate margin" : `${formatPercent(projection.marginPercent)} of selling price`}
      />
      <SummaryCard
        label="Marketplace test"
        value={idea.statusLabel}
        detail={testSummary}
      />
      <SummaryCard
        label="Linked metrics"
        value={String(idea.metricEntries.length)}
        detail={latestMetric ? `${latestMetric.entryType === "validation" ? "Marketplace" : "Store"}: ${formatDate(latestMetric.weekEnding, "relative")}` : "No linked metrics yet"}
      />
    </section>
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
              <a
                href={event.href}
                className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-500 underline-offset-4 hover:text-cobalt-600 hover:underline"
              >
                {event.chapter}
              </a>
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
                <span className="text-xs text-ink-500">{formatDate(entry.weekEnding, "relative")}</span>
              </div>
              <p className="mt-1 text-sm leading-6 text-ink-600">{entry.summary}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function ProjectedActualSection({
  idea,
  economics,
}: {
  idea: ProductIdeaLifecycle;
  economics: InstanceRow;
}) {
  const projection = projectedEconomics(economics);
  const actualProfitEntry = idea.metricEntries.find((entry) => entry.profitPerSale !== null);
  const actualRevenueEntry = idea.metricEntries.find((entry) => entry.revenuePerOrder !== null);
  const actualProfitPerSale = actualProfitEntry?.profitPerSale ?? null;
  const actualRevenuePerOrder = actualRevenueEntry?.revenuePerOrder ?? null;
  const profitGap =
    projection.margin !== null && actualProfitPerSale !== null
      ? actualProfitPerSale - projection.margin
      : null;
  const normalisedProfitGap = profitGap !== null && Math.abs(profitGap) < 0.005 ? 0 : profitGap;

  const signal = (() => {
    if (projection.margin === null) return "Add the Chapter 5 economics to set the projection.";
    if (actualProfitPerSale === null) return "Log marketplace profit per sale to compare against the projection.";
    if (normalisedProfitGap === null) return "Actual profit is not ready yet.";
    if (normalisedProfitGap === 0) return "Actual marketplace profit matches the plan.";
    if (normalisedProfitGap > 0) return "Actual marketplace profit is beating the plan.";
    return "Actual marketplace profit is below the plan. Review price, fees, or fulfilment cost.";
  })();

  return (
    <section className="rounded-xl border border-ink-100 bg-surface-raised p-6 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-[Manrope] text-lg font-bold text-ink-900">Projected vs actual</h2>
          <p className="mt-2 text-sm leading-6 text-ink-500">
            Compares the Chapter 5 economics with metrics linked to this idea.
          </p>
        </div>
        <SecondaryButton href="/lean-canvas" className="shrink-0">
          Lean Canvas
        </SecondaryButton>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-ink-100 bg-white p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-500">Projected margin</p>
          <p className="mt-2 font-[Manrope] text-xl font-bold text-ink-900">{formatCurrency(projection.margin)}</p>
          <p className="mt-1 text-xs text-ink-500">{formatPercent(projection.marginPercent)} of selling price</p>
        </div>
        <div className="rounded-xl border border-ink-100 bg-white p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-500">Actual profit / sale</p>
          <p className="mt-2 font-[Manrope] text-xl font-bold text-ink-900">{formatCurrency(actualProfitPerSale)}</p>
          <p className="mt-1 text-xs text-ink-500">
            {normalisedProfitGap !== null ? formatSignedCurrencyDelta(normalisedProfitGap) : "From marketplace metrics"}
          </p>
        </div>
        <div className="rounded-xl border border-ink-100 bg-white p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-500">Planned price</p>
          <p className="mt-2 font-[Manrope] text-xl font-bold text-ink-900">{formatCurrency(projection.sellingPrice)}</p>
          <p className="mt-1 text-xs text-ink-500">From Chapter 5 economics</p>
        </div>
        <div className="rounded-xl border border-ink-100 bg-white p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-500">Actual revenue / order</p>
          <p className="mt-2 font-[Manrope] text-xl font-bold text-ink-900">{formatCurrency(actualRevenuePerOrder)}</p>
          <p className="mt-1 text-xs text-ink-500">
            {actualRevenueEntry?.orders !== null && actualRevenueEntry?.orders !== undefined
              ? `${actualRevenueEntry.orders} orders in latest store metric`
              : "From live store metrics"}
          </p>
        </div>
      </div>

      <p className="mt-4 rounded-xl bg-surface-sunken px-4 py-3 text-sm leading-6 text-ink-600">
        {signal}
      </p>
    </section>
  );
}

function ScoutUpgradePanel({ canUseResearchWorkspace }: { canUseResearchWorkspace: boolean }) {
  if (canUseResearchWorkspace) return null;
  return (
    <section className="rounded-xl border border-cobalt-100 bg-[#f4f8ff] p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-[Manrope] text-base font-bold text-ink-900">Unlock Scout Pro research</h2>
          <p className="mt-1 max-w-[620px] text-sm leading-6 text-ink-700">
            Move from basic saves to deeper Scout research, better product-page extraction, and richer product notes before the full OS launches.
          </p>
        </div>
        <PrimaryButton href="/upgrade?plan=scout_pro" className="shrink-0">
          Upgrade Scout
        </PrimaryButton>
      </div>
    </section>
  );
}

function activitySourceLabel(
  event: ProductIdeaLifecycle["timeline"][number],
  canAccessOsContent: boolean,
): { label: string; href: string } {
  if (canAccessOsContent) return { label: event.chapter, href: event.href };
  if (event.key === "captured") return { label: "Scout Workspace", href: "/ideas" };
  if (event.key === "economics") return { label: "Scout pricing", href: "#economics" };
  return { label: "Scout", href: "/ideas" };
}

function ActivitySection({
  idea,
  canAccessOsContent,
  localEvents,
}: {
  idea: ProductIdeaLifecycle;
  canAccessOsContent: boolean;
  localEvents: LocalActivityEvent[];
}) {
  return (
    <section id="history" className="rounded-xl border border-ink-100 bg-surface-raised p-6 shadow-card">
      <h2 className="font-[Manrope] text-lg font-bold text-ink-900">Activity</h2>
      <p className="mt-2 text-sm leading-6 text-ink-500">
        System events for this product candidate.
      </p>
      <ol className="mt-5 space-y-4 border-l border-ink-100 pl-4">
        {localEvents.map((event) => (
          <li key={event.key} className="relative">
            <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-[#00756a] ring-4 ring-surface-raised" />
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-[Manrope] text-sm font-bold text-ink-900">{event.label}</p>
              <a
                href={event.href}
                className="text-[10px] font-bold tracking-[0.08em] !text-cobalt-600 underline-offset-4 hover:!text-cobalt-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500 focus-visible:ring-offset-2"
              >
                {event.sourceLabel}
              </a>
            </div>
            <p className="mt-1 text-xs leading-5 text-ink-500">{event.detail}</p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-300">
              {formatDate(event.createdAt, "relative")}
            </p>
          </li>
        ))}
        {idea.timeline.map((event) => {
          const source = activitySourceLabel(event, canAccessOsContent);
          return (
            <li key={event.key} className="relative">
              <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-cobalt-600 ring-4 ring-surface-raised" />
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-[Manrope] text-sm font-bold text-ink-900">{event.label}</p>
                <a
                  href={source.href}
                  className="text-[10px] font-bold tracking-[0.08em] !text-cobalt-600 underline-offset-4 hover:!text-cobalt-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500 focus-visible:ring-offset-2"
                >
                  {source.label}
                </a>
              </div>
              <p className="mt-1 text-xs leading-5 text-ink-500">
                {!canAccessOsContent && event.key === "captured"
                  ? "Imported into Scout Workspace."
                  : event.detail.replace(/Chapter 3|Chapter 5|Chapter 6/g, "Scout")}
              </p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function NotesSection({
  canWriteNotes,
  notes,
  noteDraft,
  status,
  deletedNote,
  onChange,
  onSave,
  onUpdateNote,
  onDeleteNote,
  onUndoDelete,
}: {
  canWriteNotes: boolean;
  notes: ProductIdeaLifecycle["notes"];
  noteDraft: string;
  status: SaveState;
  deletedNote: { note: NoteRow; index: number } | null;
  onChange: (value: string) => void;
  onSave: () => Promise<void>;
  onUpdateNote: (noteId: string, value: string) => Promise<void>;
  onDeleteNote: (noteId: string) => Promise<void>;
  onUndoDelete: () => Promise<void>;
}) {
  return (
      <section id="notes" className="rounded-xl border border-ink-100 bg-surface-raised p-6 shadow-card">
        <div>
          <h2 className="font-[Manrope] text-lg font-bold text-ink-900">Notes</h2>
          <p className="mt-2 max-w-[620px] text-sm leading-6 text-ink-500">
            Add your own decision notes and supplier follow-ups.
          </p>
        </div>

      {canWriteNotes ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void onSave();
          }}
        >
          <label className="mt-5 block">
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-500">New note</span>
            <textarea
              className={`${inputBase} min-h-28`}
              value={noteDraft}
              onChange={(event) => onChange(event.target.value)}
              placeholder="Example: Supplier confirmed lower MOQ after follow-up, so this is cheaper to test than expected."
            />
          </label>
          <div className="mt-4">
            <NoteSaveButton state={status} disabled={!noteDraft.trim()} />
          </div>
        </form>
      ) : (
        <div className="mt-5 rounded-xl border border-cobalt-100 bg-[#f4f8ff] p-4">
          <p className="text-sm font-semibold text-ink-900">Upgrade Scout to add notes</p>
          <p className="mt-1 text-sm leading-6 text-ink-600">
            Free Scout captures let you save a few products. Notes, follow-ups, and ongoing workspace organisation are included with Scout Basic and Pro.
          </p>
          <PrimaryButton href="/upgrade?plan=scout_basic" className="mt-3 px-4 py-2">
            Upgrade Scout
          </PrimaryButton>
        </div>
      )}

      {deletedNote ? (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-lg bg-surface-sunken px-3 py-2 text-sm text-ink-700">
          <span>Note deleted.</span>
          <button type="button" onClick={() => void onUndoDelete()} className="font-semibold text-cobalt-600 underline-offset-4 hover:underline">
            Undo
          </button>
        </div>
      ) : null}

      {notes.length === 0 ? (
        <p className="mt-5 rounded-xl border border-dashed border-ink-100 bg-surface-sunken p-4 text-sm leading-6 text-ink-500">
          No notes yet. Add your first decision note above.
        </p>
      ) : (
        <div className="mt-5 space-y-3">
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              editable={canWriteNotes}
              onUpdate={onUpdateNote}
              onDelete={onDeleteNote}
            />
          ))}
        </div>
      )}
      </section>
  );
}

function NoteCard({
  note,
  editable,
  onUpdate,
  onDelete,
}: {
  note: ProductIdeaLifecycle["notes"][number];
  editable: boolean;
  onUpdate: (noteId: string, value: string) => Promise<void>;
  onDelete: (noteId: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState(note.note);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function save() {
    await onUpdate(note.id, draft.trim());
    setEditing(false);
  }

  return (
    <article className="rounded-xl bg-surface-sunken p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold text-ink-500">{formatDate(note.createdAt, "relative")}</p>
        {editable ? (
          <div className="relative">
            <ActionMenu
              ariaLabel="Note actions"
              items={[
                { label: "Edit", onClick: () => setEditing(true) },
                { label: "Delete", icon: <TrashIcon />, variant: "destructive", onClick: () => setConfirmDelete(true) },
              ]}
            />
            {confirmDelete ? (
              <div className="absolute right-0 z-20 mt-2 w-40 rounded-lg border border-ink-100 bg-white p-3 shadow-card">
                <p className="text-sm font-semibold text-ink-900">Delete note?</p>
                <div className="mt-3 flex gap-2">
                  <button type="button" onClick={() => void onDelete(note.id)} className="rounded-md bg-error-100 px-3 py-1.5 text-xs font-semibold text-error-700">Delete</button>
                  <button type="button" onClick={() => setConfirmDelete(false)} className="rounded-md bg-surface-sunken px-3 py-1.5 text-xs font-semibold text-ink-600">Cancel</button>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
      {editing ? (
        <div className="mt-3">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            className={`${inputBase} min-h-28`}
          />
          <div className="mt-3 flex gap-2">
            <PrimaryButton type="button" disabled={!draft.trim()} onClick={() => void save()} className="px-4 py-2">Save</PrimaryButton>
            <SecondaryButton type="button" onClick={() => { setDraft(note.note); setEditing(false); }} className="px-4 py-2">Cancel</SecondaryButton>
          </div>
        </div>
      ) : (
        <>
          <p className={`mt-3 whitespace-pre-wrap text-sm leading-6 text-ink-800 ${expanded ? "" : "line-clamp-4"}`}>
            {note.note}
          </p>
          {note.note.length > 220 ? (
            <button type="button" onClick={() => setExpanded((value) => !value)} className="mt-2 text-xs font-semibold text-cobalt-600 underline-offset-4 hover:underline">
              {expanded ? "Show less" : "Show more"}
            </button>
          ) : null}
        </>
      )}
    </article>
  );
}

function localNextActionHref(idea: ProductIdeaLifecycle): string {
  if (idea.status === "draft" || idea.status === "economics_checked") return "#economics";
  if (
    idea.status === "selected" ||
    idea.status === "test_planned" ||
    idea.status === "test_running" ||
    idea.status === "test_reviewed" ||
    idea.status === "retest"
  ) {
    return "#marketplace-test";
  }
  return idea.nextAction.href;
}

function statusLabel(status: ProductIdeaLifecycleStatus): string {
  switch (status) {
    case "draft":
      return "Draft idea";
    case "economics_checked":
      return "Economics checked";
    case "selected":
      return "Selected";
    case "test_planned":
      return "Test planned";
    case "test_running":
      return "Test running";
    case "test_reviewed":
      return "Test reviewed";
    case "proceed":
      return "Proceed";
    case "retest":
      return "Retest";
    case "pivot":
      return "Pivot";
  }
}

function nextActionForStatus(status: ProductIdeaLifecycleStatus) {
  switch (status) {
    case "draft":
      return { label: "Add economics", href: CHAPTER_5_ECONOMICS_HREF, note: "Check margin, costs, and first-test risk before committing." };
    case "economics_checked":
      return { label: "Review and choose", href: CHAPTER_5_ECONOMICS_HREF, note: "Compare the economics and select the idea to test first." };
    case "selected":
      return { label: "Plan marketplace test", href: CHAPTER_6_PLAN_HREF, note: "Turn the selected idea into a simple real-world test." };
    case "test_planned":
      return { label: "Log test metrics", href: "/metrics", note: "Track impressions, clicks, and orders while the test is running." };
    case "test_running":
      return { label: "Update test results", href: CHAPTER_6_RESULTS_HREF, note: "Record what happened when the test period ends." };
    case "test_reviewed":
      return { label: "Make test decision", href: CHAPTER_6_RESULTS_HREF, note: "Choose whether to proceed, adjust and retest, or pivot." };
    case "proceed":
      return { label: "Define customer", href: CHAPTER_7_CUSTOMER_HREF, note: "Move the validated idea into customer, offer, and store planning." };
    case "retest":
      return { label: "Plan retest", href: CHAPTER_6_PLAN_HREF, note: "Adjust the listing, price, or offer and run another evidence loop." };
    case "pivot":
      return { label: "Add next idea", href: "/chapter/brainstorm-with-discipline/steps?step=chapter-3-step-4-score-and-shortlist", note: "Use what you learned to shortlist another candidate." };
  }
}

function latestSignalForLocalStatus(status: ProductIdeaLifecycleStatus, economicsDecision: string, testDecision: string, testResult: string): string {
  if (status === "economics_checked") {
    return economicsDecision ? `Chapter 5 decision: ${economicsDecision}.` : "Numbers added in Chapter 5.";
  }
  if (status === "test_planned") return "Selected for a marketplace test.";
  if (status === "test_running") return "Marketplace test is still running.";
  if (status === "test_reviewed") return testResult ? `Test result: ${testResult}.` : "Marketplace test reviewed.";
  if (status === "proceed") return "Decision: build the store.";
  if (status === "retest") return "Decision: adjust and retest.";
  if (status === "pivot") return "Decision: try a different product.";
  return "Chosen after the Chapter 5 economics check.";
}

function localStatusFromTestDraft(testDraft: Record<string, string>): ProductIdeaLifecycleStatus {
  if (testDraft.decision === "Proceed: build the store") return "proceed";
  if (testDraft.decision === "Iterate and retest: adjust listing or price") return "retest";
  if (testDraft.decision === "Pivot: try a different product") return "pivot";
  if (testDraft.result === "Still running") return "test_running";
  if (testDraft.result) return "test_reviewed";
  if (testDraft.test_marketplace || testDraft.product_listed || testDraft.listing_price || testDraft.test_duration) return "test_planned";
  return "selected";
}

export function IdeaDetailClient({
  idea,
  responses,
  canAccessOsContent,
  canUseScannerImport,
  canUseResearchWorkspace,
}: {
  idea: ProductIdeaLifecycle;
  responses: ResponseMap;
  canAccessOsContent: boolean;
  canUseScannerImport: boolean;
  canUseResearchWorkspace: boolean;
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
  const noteRows = parseRows(responses.product_idea_notes) as NoteRow[];

  const [ideaDraft, setIdeaDraft] = useState({
    idea_description: getProductIdeaLabel(sourceIdea, ideaIndex),
    raw_product_title: sourceIdea.raw_product_title ?? "",
    product_image_url: sourceIdea.product_image_url ?? "",
    source_url: sourceIdea.source_url ?? "",
    source_label: sourceIdea.source_label ?? "",
    demand_evidence: cleanEvidenceText(sourceIdea.demand_evidence),
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
  const [noteDraft, setNoteDraft] = useState("");
  const [localNoteRows, setLocalNoteRows] = useState<NoteRow[]>(noteRows);
  const [deletedNote, setDeletedNote] = useState<{ note: NoteRow; index: number } | null>(null);
  const [localActivityEvents, setLocalActivityEvents] = useState<LocalActivityEvent[]>([]);
  const [localIdeaView, setLocalIdeaView] = useState({
    status: idea.status,
    statusLabel: idea.statusLabel,
    latestSignal: idea.latestSignal,
    nextAction: idea.nextAction,
  });
  const [status, setStatus] = useState<Record<string, SaveState>>({
    idea: "idle",
    economics: "idle",
    test: "idle",
    notes: "idle",
  });
  const [editSection, setEditSection] = useState<EditSection>(null);

  useEffect(() => {
    setLocalIdeaView({
      status: idea.status,
      statusLabel: idea.statusLabel,
      latestSignal: idea.latestSignal,
      nextAction: idea.nextAction,
    });
  }, [idea.latestSignal, idea.nextAction, idea.status, idea.statusLabel]);

  const displayIdea: ProductIdeaLifecycle = {
    ...idea,
    ...localIdeaView,
  };
  const nextActionHref = canAccessOsContent ? localNextActionHref(displayIdea) : "/upgrade";
  const nextActionLabel = canAccessOsContent ? displayIdea.nextAction.label : "Upgrade";
  const rawTitle = ideaDraft.raw_product_title.trim();
  const showRawTitle = Boolean(rawTitle && rawTitle !== ideaDraft.idea_description.trim());

  const setSectionStatus = (section: string, value: SaveState) => {
    setStatus((prev) => ({ ...prev, [section]: value }));
  };

  const addLocalActivity = (event: Omit<LocalActivityEvent, "key" | "createdAt">) => {
    setLocalActivityEvents((prev) => [
      {
        ...event,
        key: `local-${Date.now()}-${prev.length}`,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
  };

  const localNotes = localNoteRows
    .filter((note) => (note.idea_id ?? "").trim() === idea.ideaId && (note.note ?? "").trim() && !(note.note ?? "").trim().startsWith("Imported from Scout on"))
    .map((note, index) => ({
      id: (note.note_id ?? "").trim() || `note-${index}`,
      ideaId: idea.ideaId,
      createdAt: (note.created_at ?? "").trim() || "Undated",
      note: (note.note ?? "").trim(),
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

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
    if (result.ok) {
      setEditSection(null);
      router.refresh();
    }
  };

  const saveIdeaField = async (key: keyof IdeaDraft, value: string) => {
    const nextDraft = { ...ideaDraft, [key]: value };
    setIdeaDraft(nextDraft);
    setSectionStatus("idea", "saving");
    const nextRows = productIdeas.map((row, index) =>
      getProductIdeaId(row, index) === idea.ideaId
        ? { ...row, ...nextDraft, idea_id: idea.ideaId }
        : row,
    );
    const result = await writeWorksheetField("product_ideas", JSON.stringify(nextRows), "ideas-worksheet");
    setSectionStatus("idea", result.ok ? "saved" : "error");
    if (result.ok) {
      const label = key === "seasonality" ? "Seasonality updated" : key === "idea_description" ? "Idea name updated" : "Evidence updated";
      const detail = key === "seasonality"
        ? `Seasonality set to ${value || "None"}.`
        : key === "idea_description"
          ? `Idea name changed to ${value || "Untitled idea"}.`
          : "Idea evidence was updated.";
      addLocalActivity({
        label,
        detail,
        sourceLabel: "Idea evidence",
        href: "#idea-evidence",
      });
    }
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
    if (result.ok) {
      setEditSection(null);
      addLocalActivity({
        label: "Economics updated",
        detail: projectedEconomics(economicsDraft).marginPercent === null
          ? "Pricing inputs were saved."
          : `Projected margin is now ${formatPercent(projectedEconomics(economicsDraft).marginPercent)}.`,
        sourceLabel: "Economics",
        href: "#economics",
      });
      const nextStatus: ProductIdeaLifecycleStatus = "economics_checked";
      if (localIdeaView.status === "draft") {
        addLocalActivity({
          label: "Status changed",
          detail: `Status changed to ${statusLabel(nextStatus)}.`,
          sourceLabel: "Activity",
          href: "#history",
        });
      }
      setLocalIdeaView((prev) => {
        if (prev.status !== "draft" && prev.status !== "economics_checked") return prev;
        return {
          status: nextStatus,
          statusLabel: statusLabel(nextStatus),
          latestSignal: latestSignalForLocalStatus(nextStatus, economicsDraft.viable, "", ""),
          nextAction: nextActionForStatus(nextStatus),
        };
      });
      router.refresh();
    }
  };

  const saveEconomicsPatch = async (patch: Partial<EconomicsDraft>): Promise<boolean> => {
    const nextDraft = { ...economicsDraft, ...patch };
    setEconomicsDraft(nextDraft);
    setSectionStatus("economics", "saving");
    try {
      const response = await fetch("/api/ideas/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_economics",
          ideaId: idea.ideaId,
          sellingPrice: nextDraft.selling_price,
          productCost: nextDraft.product_cost,
          shippingToCustomer: nextDraft.shipping_to_customer,
          platformFees: nextDraft.platform_fees,
        }),
      });
      setSectionStatus("economics", response.ok ? "saved" : "error");
      if (response.ok) {
        const projection = projectedEconomics(nextDraft);
        addLocalActivity({
          label: "Economics updated",
          detail: projection.marginPercent === null
            ? "Pricing inputs were saved."
            : `Projected margin is now ${formatPercent(projection.marginPercent)}.`,
          sourceLabel: "Economics",
          href: "#economics",
        });
        const nextStatus: ProductIdeaLifecycleStatus = "economics_checked";
        if (localIdeaView.status === "draft") {
          addLocalActivity({
            label: "Status changed",
            detail: `Status changed to ${statusLabel(nextStatus)}.`,
            sourceLabel: "Activity",
            href: "#history",
          });
          setLocalIdeaView({
            status: nextStatus,
            statusLabel: statusLabel(nextStatus),
            latestSignal: latestSignalForLocalStatus(nextStatus, nextDraft.viable, "", ""),
            nextAction: nextActionForStatus(nextStatus),
          });
        }
      }
      return response.ok;
    } catch {
      setSectionStatus("economics", "error");
      return false;
    }
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
    if (ok) {
      setEditSection(null);
      const nextStatus = localStatusFromTestDraft(testDraft);
      addLocalActivity({
        label: "Status changed",
        detail: `Status changed to ${statusLabel(nextStatus)}.`,
        sourceLabel: "Marketplace test",
        href: "#marketplace-test",
      });
      setLocalIdeaView({
        status: nextStatus,
        statusLabel: statusLabel(nextStatus),
        latestSignal: latestSignalForLocalStatus(nextStatus, economicsDraft.viable, testDraft.decision, testDraft.result),
        nextAction: nextActionForStatus(nextStatus),
      });
      router.refresh();
    }
  };

  const saveNote = async () => {
    if (!canUseScannerImport) return;
    const trimmed = noteDraft.trim();
    if (!trimmed) return;
    setSectionStatus("notes", "saving");
    const nextRows: NoteRow[] = [
      {
        note_id: createNoteId(),
        idea_id: idea.ideaId,
        created_at: todayISO(),
        note: trimmed,
      },
      ...localNoteRows,
    ];
    setLocalNoteRows(nextRows);
    const result = await writeWorksheetField(
      "product_idea_notes",
      JSON.stringify(nextRows),
      "ideas-worksheet",
    );
    setSectionStatus("notes", result.ok ? "saved" : "error");
    if (result.ok) {
      setNoteDraft("");
      window.setTimeout(() => setSectionStatus("notes", "idle"), 2000);
      router.refresh();
    }
  };

  const updateNote = async (noteId: string, value: string) => {
    const nextRows = localNoteRows.map((note) => (
      (note.note_id ?? "") === noteId ? { ...note, note: value } : note
    ));
    setLocalNoteRows(nextRows);
    await writeWorksheetField("product_idea_notes", JSON.stringify(nextRows), "ideas-worksheet");
  };

  const deleteNote = async (noteId: string) => {
    const index = localNoteRows.findIndex((note) => (note.note_id ?? "") === noteId);
    if (index < 0) return;
    const note = localNoteRows[index];
    const nextRows = localNoteRows.filter((_, rowIndex) => rowIndex !== index);
    setDeletedNote({ note, index });
    setLocalNoteRows(nextRows);
    await writeWorksheetField("product_idea_notes", JSON.stringify(nextRows), "ideas-worksheet");
    window.setTimeout(() => setDeletedNote(null), 8000);
  };

  const undoDeleteNote = async () => {
    if (!deletedNote) return;
    const nextRows = [...localNoteRows];
    nextRows.splice(deletedNote.index, 0, deletedNote.note);
    setLocalNoteRows(nextRows);
    setDeletedNote(null);
    await writeWorksheetField("product_idea_notes", JSON.stringify(nextRows), "ideas-worksheet");
  };

  return (
    <div className="space-y-6">
      <GhostButton href="/ideas">Back to ideas</GhostButton>

      <header className="flex min-h-20 items-start gap-4">
        {ideaDraft.product_image_url ? (
          <img
            src={ideaDraft.product_image_url}
            alt=""
            className="h-20 w-20 shrink-0 rounded-lg border border-ink-100 object-cover"
          />
        ) : (
          <div
            aria-label="No product image"
            className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg border border-dashed border-ink-100 bg-surface-sunken text-[10px] font-bold uppercase tracking-[0.1em] text-ink-300"
          >
            Image
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h1 title={showRawTitle ? rawTitle : ideaDraft.idea_description} className="line-clamp-2 font-[Manrope] text-2xl font-bold leading-tight text-ink-900">
            {ideaDraft.idea_description || idea.label}
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            from {ideaDraft.source_label || displayIdea.sourceLabel || "Scout"} · scanned {formatDate(displayIdea.scannerScoredAt || displayIdea.scoutCapturedAt, "relative").toLowerCase()}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${lifecycleTone(displayIdea.status)}`}>
              {displayIdea.statusLabel}
            </span>
            {ideaDraft.source_url ? (
              <a
                href={ideaDraft.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-cobalt-600 underline-offset-4 hover:underline"
              >
                View on {ideaDraft.source_label || displayIdea.sourceLabel || "source"} ↗
              </a>
            ) : null}
          </div>
        </div>
      </header>

      <ScoutSignalSummary
        idea={displayIdea}
        sourceIdea={sourceIdea}
        canUseResearchWorkspace={canUseResearchWorkspace}
      />
      <EconomicsSnapshot
        economics={economicsDraft}
        saving={status.economics === "saving"}
        onSave={saveEconomicsPatch}
      />

      {canAccessOsContent ? (
        <section className="rounded-xl border border-cobalt-100 bg-white p-5 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-cobalt-600">
                Next best action
              </p>
              <p className="mt-2 text-sm leading-6 text-ink-700">{displayIdea.nextAction.note}</p>
            </div>
            <PrimaryButton href={nextActionHref} className="shrink-0">
              {nextActionLabel}
            </PrimaryButton>
          </div>
        </section>
      ) : null}

      {canAccessOsContent ? (
        <IdeaSummarySection idea={displayIdea} economics={economicsDraft} />
      ) : null}

      {canAccessOsContent ? (
        <div id="projected-actual">
          <ProjectedActualSection idea={idea} economics={economicsDraft} />
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          {editSection === "idea" ? (
            <EditableSection
              id="idea-evidence"
              title="Idea evidence"
              description={canAccessOsContent
                ? "Edit the user-facing idea name and seasonality judgement."
                : "Edit the user-facing idea name and seasonality judgement."
              }
              state={status.idea}
              onSubmit={saveIdea}
              onCancel={() => setEditSection(null)}
            >
              <Field
                label="Idea name"
                value={ideaDraft.idea_description}
                onChange={(value) => setIdeaDraft((prev) => ({ ...prev, idea_description: value }))}
              />
              <SelectField
                label="Seasonality"
                value={ideaDraft.seasonality}
                options={seasonalityEvidenceOptions}
                onChange={(value) => setIdeaDraft((prev) => ({ ...prev, seasonality: value }))}
              />
            </EditableSection>
          ) : (
            <EvidencePanel
              idea={displayIdea}
              sourceIdea={sourceIdea}
              ideaDraft={ideaDraft}
              onSaveField={saveIdeaField}
            />
          )}

          <NotesSection
            canWriteNotes={canUseScannerImport}
            notes={localNotes}
            noteDraft={noteDraft}
            status={status.notes}
            deletedNote={deletedNote}
            onChange={setNoteDraft}
            onSave={saveNote}
            onUpdateNote={updateNote}
            onDeleteNote={deleteNote}
            onUndoDelete={undoDeleteNote}
          />

          {!canAccessOsContent ? <ScoutUpgradePanel canUseResearchWorkspace={canUseResearchWorkspace} /> : null}

          {canAccessOsContent ? editSection === "economics" ? (
            <EditableSection
              id="economics"
              title="Economics"
              description="Edit the Chapter 5 numbers and viability decision for this candidate."
              state={status.economics}
              onSubmit={saveEconomics}
              onCancel={() => setEditSection(null)}
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
                label="Selling price"
                value={economicsDraft.selling_price}
                onChange={(value) => setEconomicsDraft((prev) => ({ ...prev, selling_price: value }))}
              />
              <div className="md:col-span-2">
                <FeeRowsEditor
                  value={economicsDraft.platform_fees}
                  sellingPrice={parsedMoney(economicsDraft.selling_price)}
                  currency="GBP"
                  onChange={(rows) => setEconomicsDraft((prev) => ({ ...prev, platform_fees: serializeFeeRows(rows) }))}
                />
              </div>
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
          ) : (
            <ReviewSection
              id="economics"
              title="Economics"
              description="The Chapter 5 numbers and viability decision for this candidate."
              onEdit={() => setEditSection("economics")}
            >
              <ReviewValue label="Selling price" value={economicsDraft.selling_price} />
              <ReviewValue label="Product cost" value={economicsDraft.product_cost} />
              <ReviewValue label="Shipping" value={economicsDraft.shipping_to_customer} />
              <ReviewValue
                label="Fees"
                value={formatFeeSummary(economicsDraft.platform_fees, parsedMoney(economicsDraft.selling_price))}
              />
              <ReviewValue label="Variant complexity" value={optionLabel(economicsDraft.variant_complexity)} />
              <ReviewValue label="Upfront risk" value={optionLabel(economicsDraft.upfront_cost_risk)} />
              <ReviewValue label="Test speed" value={optionLabel(economicsDraft.test_speed)} />
              <ReviewValue label="Confidence" value={optionLabel(economicsDraft.numbers_confidence)} />
              <ReviewValue label="Decision" value={optionLabel(economicsDraft.viable)} />
            </ReviewSection>
          ) : null}

          {canAccessOsContent ? editSection === "test" ? (
            <EditableSection
              id="marketplace-test"
              title="Marketplace test"
              description="Edit the test plan, result, learning, and decision. Saving this section makes this idea the active Chapter 6 test idea."
              state={status.test}
              onSubmit={saveTest}
              onCancel={() => setEditSection(null)}
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
          ) : (
            <ReviewSection
              id="marketplace-test"
              title="Marketplace test"
              description="The current test plan, result, learning, and decision for this candidate."
              onEdit={() => setEditSection("test")}
            >
              <ReviewValue label="Marketplace" value={testDraft.test_marketplace} />
              <ReviewValue label="Product listed" value={testDraft.product_listed} />
              <ReviewValue label="Listing price" value={testDraft.listing_price} />
              <ReviewValue label="Test duration" value={testDraft.test_duration} />
              <ReviewValue label="Result" value={optionLabel(testDraft.result)} />
              <ReviewValue label="Units sold" value={testDraft.units_sold} />
              <ReviewValue label="Decision" value={optionLabel(testDraft.decision)} />
              <ReviewValue label="What you learned" value={testDraft.what_you_learned} wide />
            </ReviewSection>
          ) : null}
        </div>

        <aside className="space-y-6">
          <ActivitySection
            idea={idea}
            canAccessOsContent={canAccessOsContent}
            localEvents={localActivityEvents}
          />
          {canAccessOsContent ? <MetricsSection idea={idea} /> : null}
        </aside>
      </div>
    </div>
  );
}
