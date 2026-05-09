"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHero, PrimaryButton, SecondaryButton } from "@/components/design-system";
import {
  buildScannerImportDraft,
  parseScannerImportPayloadParamDetailed,
  sourceLabelForUrl,
  type ScannerImportDraft,
} from "@/lib/scanner-import";

type ImportIdeaClientProps = {
  payloadParam?: string;
  limitMessage?: string;
};

type DuplicateImport = {
  ideaHref: string;
  ideaId: string;
  ideaTitle: string;
};

type FieldConfig = {
  key: keyof ScannerImportDraft;
  label: string;
  type?: "input" | "textarea" | "select";
  options?: string[];
};

const PRODUCT_FIELDS: FieldConfig[] = [
  { key: "productTitle", label: "Product idea" },
  { key: "rawProductTitle", label: "Raw Scout title" },
  { key: "sourcePlatform", label: "Source platform", type: "select", options: ["amazon", "aliexpress", "shopify", "other"] },
  { key: "sourceUrl", label: "Source URL" },
  { key: "scannedAt", label: "Research date" },
  { key: "demandEvidence", label: "Demand evidence", type: "textarea" },
  { key: "competitionNotes", label: "Competition notes", type: "textarea" },
  { key: "seasonality", label: "Seasonality" },
];

const ECONOMICS_FIELDS: FieldConfig[] = [
  { key: "productCost", label: "Product cost" },
  { key: "shippingToCustomer", label: "Shipping to customer" },
  { key: "platformFees", label: "Platform fees" },
  { key: "sellingPrice", label: "Selling price" },
  { key: "variantComplexity", label: "Variant complexity" },
  { key: "upfrontCostRisk", label: "Upfront cost risk" },
  { key: "testSpeed", label: "Test speed" },
  { key: "numbersConfidence", label: "Numbers confidence" },
];

function emptyDraft(): ScannerImportDraft {
  return {
    productTitle: "",
    rawProductTitle: "",
    productImageUrl: "",
    sourcePlatform: "other",
    sourceUrl: "",
    scannedAt: new Date().toISOString().slice(0, 10),
    demandEvidence: "",
    competitionNotes: "",
    seasonality: "",
    productCost: "",
    shippingToCustomer: "",
    platformFees: "",
    sellingPrice: "",
    variantComplexity: "",
    upfrontCostRisk: "",
    testSpeed: "",
    numbersConfidence: "Low: mostly guesses",
    notes: "",
  };
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-ink-100 bg-surface-sunken px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-500">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-ink-900">{value || "Not captured"}</p>
    </div>
  );
}

function scoreTone(value: number | undefined): string {
  if (value === undefined) return "border-ink-100 bg-surface-sunken text-ink-500";
  if (value >= 70) return "border-success-100 bg-success-100 text-[#005e3f]";
  if (value >= 40) return "border-amber-100 bg-amber-100 text-[#835700]";
  return "border-error-100 bg-error-100 text-error-700";
}

function scoreLabel(value: number | undefined): string {
  if (value === undefined) return "Not scored";
  if (value >= 70) return "Strong";
  if (value >= 40) return "Mixed";
  return "Weak";
}

function ScoreMetric({
  label,
  value,
  suffix = "/100",
}: {
  label: string;
  value: number | undefined;
  suffix?: string;
}) {
  const valueText = value === undefined ? "No data" : `${value}${suffix}`;
  return (
    <div className={`rounded-lg border px-4 py-3 ${scoreTone(value)}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em]">{label}</p>
        <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em]">
          {scoreLabel(value)}
        </span>
      </div>
      <p className="mt-2 text-lg font-bold">{valueText}</p>
    </div>
  );
}

function EvidenceBlock({ title, value }: { title: string; value: string }) {
  if (!value.trim()) return null;
  return (
    <div className="rounded-lg border border-ink-100 bg-surface-raised p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-500">{title}</p>
      <p className="mt-2 whitespace-pre-line text-sm leading-6 text-ink-700">{value}</p>
    </div>
  );
}

function Field({
  config,
  value,
  onChange,
}: {
  config: FieldConfig;
  value: string;
  onChange: (value: string) => void;
}) {
  const id = `scanner-import-${config.key}`;
  const baseClass = "mt-2 w-full rounded-lg border border-ink-100 bg-surface-raised px-3 py-2 text-sm text-ink-900 shadow-inner outline-none transition focus:border-cobalt-500 focus:ring-2 focus:ring-cobalt-100";

  return (
    <label htmlFor={id} className="block">
      <span className="text-xs font-bold uppercase tracking-[0.12em] text-ink-500">
        {config.label}
      </span>
      {config.type === "textarea" ? (
        <textarea
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={5}
          className={`${baseClass} resize-y leading-6`}
        />
      ) : config.type === "select" ? (
        <select
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={baseClass}
        >
          {(config.options ?? []).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={baseClass}
        />
      )}
    </label>
  );
}

function FieldSection({
  title,
  description,
  fields,
  draft,
  updateField,
}: {
  title: string;
  description: string;
  fields: FieldConfig[];
  draft: ScannerImportDraft;
  updateField: (key: keyof ScannerImportDraft, value: string) => void;
}) {
  return (
    <section className="rounded-xl border border-ink-100 bg-surface-raised p-6 shadow-card">
      <div>
        <h2 className="font-[Manrope] text-xl font-semibold text-ink-900">{title}</h2>
        <p className="mt-2 max-w-[680px] text-sm leading-6 text-ink-600">{description}</p>
      </div>
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        {fields.map((field) => (
          <div
            key={field.key}
            className={field.type === "textarea" ? "md:col-span-2" : undefined}
          >
            <Field
              config={field}
              value={draft[field.key]}
              onChange={(value) => updateField(field.key, value)}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

export function ImportIdeaClient({ payloadParam, limitMessage }: ImportIdeaClientProps) {
  const router = useRouter();
  const payloadResult = useMemo(() => parseScannerImportPayloadParamDetailed(payloadParam), [payloadParam]);
  const parsedPayload = payloadResult.ok ? payloadResult.payload : null;
  const [draft, setDraft] = useState<ScannerImportDraft>(() => (
    parsedPayload ? buildScannerImportDraft(parsedPayload) : emptyDraft()
  ));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicate, setDuplicate] = useState<DuplicateImport | null>(null);
  const [editingResearch, setEditingResearch] = useState(!parsedPayload);
  const [editingEconomics, setEditingEconomics] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const sourceLabel = sourceLabelForUrl(draft.sourceUrl, draft.sourcePlatform || "Source product");

  function updateField(key: keyof ScannerImportDraft, value: string) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function saveImport(updateExistingIdeaId?: string) {
    setSaving(true);
    setError(null);
    setDuplicate(null);

    try {
      const response = await fetch("/api/ideas/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload: parsedPayload, draft, updateExistingIdeaId }),
      });
      const result = (await response.json().catch(() => ({}))) as {
        error?: string;
        limitMessage?: string;
        ideaHref?: string;
        ideaId?: string;
        ideaTitle?: string;
        duplicate?: boolean;
      };

      if (response.status === 409 && result.duplicate && result.ideaHref && result.ideaId) {
        setDuplicate({
          ideaHref: result.ideaHref,
          ideaId: result.ideaId,
          ideaTitle: result.ideaTitle || draft.productTitle,
        });
        setSaving(false);
        return;
      }

      if (!response.ok || !result.ideaHref) {
        throw new Error(result.limitMessage || result.error || "Unable to import this idea.");
      }

      router.push(result.ideaHref);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to import this idea.");
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHero
        label="Scanner import"
        title={draft.productTitle ? `Review ${draft.productTitle}` : "Review this product idea"}
        description="Check the product, evidence, and economics before this Scout capture becomes part of your Calm Commerce idea history."
      >
        <div className="flex flex-wrap gap-3">
          <PrimaryButton
            onClick={() => void saveImport()}
            disabled={saving || !draft.productTitle.trim() || !payloadResult.ok}
          >
            {saving ? "Adding..." : "Add to Ideas"}
          </PrimaryButton>
          <SecondaryButton href="/ideas">Back to Ideas</SecondaryButton>
        </div>
        {!payloadResult.ok ? (
          <p className="mt-4 max-w-[640px] text-xs leading-5 text-error-700">
            {payloadResult.message}
          </p>
        ) : null}
        {limitMessage ? (
          <p className="mt-4 max-w-[640px] rounded-lg bg-surface-sunken px-3 py-2 text-xs leading-5 text-ink-600">
            {limitMessage}
          </p>
        ) : null}
      </PageHero>

      {error ? (
        <div className="rounded-lg border border-error-100 bg-error-100 px-4 py-3 text-sm leading-6 text-error-700">
          {error}
        </div>
      ) : null}

      {duplicate ? (
        <div className="rounded-lg border border-cobalt-100 bg-cobalt-100/50 px-4 py-4 text-sm leading-6 text-ink-700">
          <p className="font-semibold text-ink-900">This product is already in Ideas.</p>
          <p className="mt-1">
            We found an existing idea for {duplicate.ideaTitle}. Open it, or update that idea with this latest Scout capture.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <PrimaryButton href={duplicate.ideaHref}>Open existing</PrimaryButton>
            <SecondaryButton
              onClick={() => void saveImport(duplicate.ideaId)}
              disabled={saving}
            >
              {saving ? "Updating..." : "Update existing"}
            </SecondaryButton>
          </div>
        </div>
      ) : null}

      <section className="overflow-hidden rounded-xl border border-ink-100 bg-surface-raised shadow-card">
        <div className="grid gap-0 md:grid-cols-[240px_1fr]">
          <div className="bg-surface-sunken">
            {draft.productImageUrl ? (
              <img
                src={draft.productImageUrl}
                alt=""
                className="h-full min-h-[220px] w-full object-cover"
              />
            ) : (
              <div className="flex h-full min-h-[220px] items-center justify-center px-6 text-center text-sm leading-6 text-ink-500">
                No product image captured
              </div>
            )}
          </div>
          <div className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-cobalt-600">
                  Imported from Scout
                </p>
                <h2 className="mt-2 font-[Manrope] text-2xl font-bold leading-tight text-ink-900">
                  {draft.productTitle || "Untitled product"}
                </h2>
                {draft.rawProductTitle && draft.rawProductTitle !== draft.productTitle ? (
                  <p className="mt-2 line-clamp-2 max-w-[720px] text-xs leading-5 text-ink-500">
                    Raw title: {draft.rawProductTitle}
                  </p>
                ) : null}
                {draft.sourceUrl ? (
                  <a
                    href={draft.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={draft.sourceUrl}
                    className="mt-3 inline-flex max-w-full items-center rounded-full bg-cobalt-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-cobalt-600 underline-offset-4 hover:underline"
                  >
                    View on {sourceLabel}
                  </a>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => setEditingResearch((value) => !value)}
                className="rounded-lg border border-ink-100 bg-surface-raised px-4 py-2 text-sm font-semibold text-ink-900 transition hover:border-cobalt-500 hover:bg-surface-sunken"
              >
                {editingResearch ? "Hide fields" : "Edit research"}
              </button>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <SummaryMetric label="Platform" value={draft.sourcePlatform} />
              <SummaryMetric label="Selling price" value={draft.sellingPrice} />
              <SummaryMetric label="Product cost" value={draft.productCost} />
              <SummaryMetric label="Confidence" value={draft.numbersConfidence} />
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <ScoreMetric label="Opportunity" value={parsedPayload?.opportunityScore} suffix="/100" />
              <ScoreMetric label="Demand" value={parsedPayload?.demandScore} />
              <ScoreMetric label="Competition" value={parsedPayload?.competitionScore} />
              <ScoreMetric label="Confidence" value={parsedPayload?.confidenceScore} />
            </div>
          </div>
        </div>
      </section>

      {editingResearch ? (
        <FieldSection
          title="Product research"
          description="Edit only the details that look wrong. The source evidence below is saved to the idea history."
          fields={[{ key: "productTitle", label: "Product idea" }, { key: "productImageUrl", label: "Product image URL" }, ...PRODUCT_FIELDS.filter((field) => field.key !== "productTitle")]}
          draft={draft}
          updateField={updateField}
        />
      ) : (
        <section className="rounded-xl border border-ink-100 bg-surface-raised p-6 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-[Manrope] text-xl font-semibold text-ink-900">Research evidence</h2>
              <p className="mt-2 max-w-[680px] text-sm leading-6 text-ink-600">
                Saved into the Chapter 3 idea record.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEditingResearch(true)}
              className="rounded-lg border border-ink-100 bg-surface-raised px-4 py-2 text-sm font-semibold text-ink-900 transition hover:border-cobalt-500 hover:bg-surface-sunken"
            >
              Edit
            </button>
          </div>
          <div className="mt-6 grid gap-4">
            <EvidenceBlock title="Demand evidence" value={draft.demandEvidence} />
            <EvidenceBlock title="Competition notes" value={draft.competitionNotes} />
            <EvidenceBlock title="Seasonality" value={draft.seasonality} />
          </div>
        </section>
      )}

      {editingEconomics ? (
        <FieldSection
          title="Economics draft"
          description="These values become the Chapter 5 economics draft. The OS still leaves the final viability decision to the learner."
          fields={ECONOMICS_FIELDS}
          draft={draft}
          updateField={updateField}
        />
      ) : (
        <section className="rounded-xl border border-ink-100 bg-surface-raised p-6 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-[Manrope] text-xl font-semibold text-ink-900">Economics draft</h2>
              <p className="mt-2 max-w-[680px] text-sm leading-6 text-ink-600">
                Saved into Chapter 5 so the idea can be compared with other contenders.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEditingEconomics(true)}
              className="rounded-lg border border-ink-100 bg-surface-raised px-4 py-2 text-sm font-semibold text-ink-900 transition hover:border-cobalt-500 hover:bg-surface-sunken"
            >
              Edit
            </button>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {ECONOMICS_FIELDS.map((field) => (
              <SummaryMetric key={field.key} label={field.label} value={draft[field.key]} />
            ))}
          </div>
        </section>
      )}

      <section className="rounded-xl border border-ink-100 bg-surface-raised p-6 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-[Manrope] text-xl font-semibold text-ink-900">Notes</h2>
            <p className="mt-2 max-w-[680px] text-sm leading-6 text-ink-600">
              Add any extra context from the scanner, research workspace, or your own judgement.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setEditingNotes((value) => !value)}
            className="rounded-lg border border-ink-100 bg-surface-raised px-4 py-2 text-sm font-semibold text-ink-900 transition hover:border-cobalt-500 hover:bg-surface-sunken"
          >
            {editingNotes ? "Hide fields" : "Edit note"}
          </button>
        </div>
        {editingNotes ? (
          <div className="mt-6">
            <Field
              config={{ key: "notes", label: "Import note", type: "textarea" }}
              value={draft.notes}
              onChange={(value) => updateField("notes", value)}
            />
          </div>
        ) : (
          <p className="mt-6 whitespace-pre-line rounded-lg border border-ink-100 bg-surface-sunken p-4 text-sm leading-6 text-ink-700">
            {draft.notes || "No extra notes captured."}
          </p>
        )}
      </section>
    </div>
  );
}
