"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHero, PrimaryButton, SecondaryButton } from "@/components/design-system";
import {
  buildScannerImportDraft,
  parseScannerImportPayloadParam,
  type ScannerImportDraft,
} from "@/lib/scanner-import";

type ImportIdeaClientProps = {
  payloadParam?: string;
};

type FieldConfig = {
  key: keyof ScannerImportDraft;
  label: string;
  type?: "input" | "textarea" | "select";
  options?: string[];
};

const PRODUCT_FIELDS: FieldConfig[] = [
  { key: "productTitle", label: "Product idea" },
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

export function ImportIdeaClient({ payloadParam }: ImportIdeaClientProps) {
  const router = useRouter();
  const parsedPayload = useMemo(() => parseScannerImportPayloadParam(payloadParam), [payloadParam]);
  const [draft, setDraft] = useState<ScannerImportDraft>(() => (
    parsedPayload ? buildScannerImportDraft(parsedPayload) : emptyDraft()
  ));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateField(key: keyof ScannerImportDraft, value: string) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function saveImport() {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/ideas/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload: parsedPayload, draft }),
      });
      const result = (await response.json().catch(() => ({}))) as {
        error?: string;
        ideaHref?: string;
      };

      if (!response.ok || !result.ideaHref) {
        throw new Error(result.error || "Unable to import this idea.");
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
        title="Review this product idea"
        description="Check the research before it becomes part of your Calm Commerce idea history. The import will create an idea, attach any economics it has, and save the scanner notes."
      >
        <div className="flex flex-wrap gap-3">
          <PrimaryButton onClick={saveImport} disabled={saving || !draft.productTitle.trim()}>
            {saving ? "Adding..." : "Add to Ideas"}
          </PrimaryButton>
          <SecondaryButton href="/ideas">Back to Ideas</SecondaryButton>
        </div>
        {!payloadParam ? (
          <p className="mt-4 max-w-[640px] text-xs leading-5 text-ink-500">
            No scanner payload was provided. You can still add a manually reviewed idea from this page.
          </p>
        ) : !parsedPayload ? (
          <p className="mt-4 max-w-[640px] text-xs leading-5 text-error-700">
            The scanner payload could not be read. Review the fields below before saving.
          </p>
        ) : null}
      </PageHero>

      {error ? (
        <div className="rounded-lg border border-error-100 bg-error-100 px-4 py-3 text-sm leading-6 text-error-700">
          {error}
        </div>
      ) : null}

      <FieldSection
        title="Product research"
        description="This becomes the Chapter 3 idea record and carries the evidence behind the opportunity."
        fields={PRODUCT_FIELDS}
        draft={draft}
        updateField={updateField}
      />

      <FieldSection
        title="Economics draft"
        description="These values become the Chapter 5 economics draft. The OS still leaves the final viability decision to the learner."
        fields={ECONOMICS_FIELDS}
        draft={draft}
        updateField={updateField}
      />

      <section className="rounded-xl border border-ink-100 bg-surface-raised p-6 shadow-card">
        <h2 className="font-[Manrope] text-xl font-semibold text-ink-900">Notes</h2>
        <p className="mt-2 max-w-[680px] text-sm leading-6 text-ink-600">
          Add any extra context from the scanner, research workspace, or your own judgement.
        </p>
        <div className="mt-6">
          <Field
            config={{ key: "notes", label: "Import note", type: "textarea" }}
            value={draft.notes}
            onChange={(value) => updateField("notes", value)}
          />
        </div>
      </section>
    </div>
  );
}
