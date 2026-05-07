"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { IdeaChoicePicker } from "@/components/v2/idea-choice-picker";
import { UnitEconomicsReviewPanel, UnitEconomicsViabilityCard } from "@/components/v2/unit-economics-review-panel";
import {
  PRODUCT_ID_FIELD,
  ensureProductIdeaIds,
  getProductIdeaId,
  getProductIdeaLabel,
} from "@/lib/v2/worksheets/product-idea-identity";

/* ─────────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────────── */

type WorksheetField = {
  type: string;
  id: string;
  key: string;
  label: string;
  fieldType: string;
  required?: boolean;
  helpText?: string;
  options?: string[];
  currencyAware?: boolean;
  /** For fieldType === "cross-worksheet-select": field-group key in the flat values map */
  sourceGroupKey?: string;
  /** For fieldType === "cross-worksheet-select": sub-field to use as the option label */
  sourceLabelKey?: string;
};

type LinkedGroupConfig = {
  sourceGroupKey: string;
  sourceLabelKey: string;
  targetFieldKey: string;
};

type FieldGroup = {
  type: "field-group";
  key: string;
  label: string;
  repeatMin: number;
  repeatMax: number;
  summaryFieldKey: string;
  fields: WorksheetField[];
  linkedGroup?: LinkedGroupConfig;
};

type DefinitionItem = WorksheetField | FieldGroup;

type WorksheetDefinition = {
  worksheet: {
    id: string;
    chapterId: string;
    title: string;
    description: string;
    completionRule?: {
      kind: string;
      requiredFieldKeys: string[];
    };
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fields: any[];
};

type InstanceRow = Record<string, string>;

/* ─────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────── */

function isFieldGroup(item: DefinitionItem): item is FieldGroup {
  return item.type === "field-group";
}

function parseGroupValue(raw: string, repeatMin: number): InstanceRow[] {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed as InstanceRow[];
  } catch {
    // fall through
  }
  return Array.from({ length: repeatMin }, () => ({}));
}

function parseLinkedSource(
  allValues: Record<string, string>,
  sourceGroupKey: string,
): InstanceRow[] {
  try {
    const parsed = JSON.parse(allValues[sourceGroupKey] ?? "");
    if (Array.isArray(parsed)) return parsed as InstanceRow[];
  } catch {
    // fall through
  }
  return [];
}

function withDurableRowId(groupKey: string, row: InstanceRow, index: number): InstanceRow {
  if (groupKey !== "product_ideas") return row;
  return {
    ...row,
    [PRODUCT_ID_FIELD]: getProductIdeaId(row, index),
  };
}

function computeCompletion(
  items: DefinitionItem[],
  values: Record<string, string>,
  requiredFieldKeys: string[],
): { filledRequired: number; totalRequired: number; filledAll: number; totalAll: number } {
  let filledRequired = 0;
  let totalRequired = 0;
  let filledAll = 0;
  let totalAll = 0;

  for (const item of items) {
    if (isFieldGroup(item)) {
      const instances = parseGroupValue(values[item.key] ?? "", item.linkedGroup ? 0 : item.repeatMin);
      const expectedCount = item.linkedGroup
        ? Math.min(parseLinkedSource(values, item.linkedGroup.sourceGroupKey).length, item.repeatMax)
        : item.repeatMin;
      const filled = item.linkedGroup
        ? instances
            .slice(0, expectedCount)
            .filter((row) =>
              Object.entries(row).some(
                ([key, value]) =>
                  key !== item.linkedGroup!.targetFieldKey && (value ?? "").trim().length > 0,
              ),
            ).length
        : instances
            .slice(0, expectedCount)
            .filter((row) => (row[item.summaryFieldKey] ?? "").trim().length > 0).length;
      totalAll += expectedCount;
      filledAll += filled;
      if (requiredFieldKeys.includes(item.key)) {
        totalRequired += expectedCount;
        filledRequired += filled;
      }
    } else {
      const isFilled = (values[item.key] ?? "").trim().length > 0;
      totalAll += 1;
      if (isFilled) filledAll += 1;
      if (item.required || requiredFieldKeys.includes(item.key)) {
        totalRequired += 1;
        if (isFilled) filledRequired += 1;
      }
    }
  }

  return { filledRequired, totalRequired, filledAll, totalAll };
}

/* ─────────────────────────────────────────────────────────────
   Main component
───────────────────────────────────────────────────────────── */

export function GenericWorksheetClient({
  worksheetDefinition,
  chapterId,
  chapterSlug,
  chapterNumber,
}: {
  worksheetDefinition: WorksheetDefinition;
  chapterId: string;
  chapterSlug: string;
  chapterNumber: number;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"loading" | "idle" | "saving" | "saved" | "error">("loading");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const worksheetId = worksheetDefinition.worksheet.id;
  const requiredFieldKeys = worksheetDefinition.worksheet.completionRule?.requiredFieldKeys ?? [];

  const items: DefinitionItem[] = (worksheetDefinition.fields ?? []).filter(
    (f): f is DefinitionItem => f != null && typeof f === "object" && "key" in f,
  );

  const allKeys = items.map((item) => item.key);

  // Also collect any cross-worksheet source keys so they survive the load filter
  const crossWorksheetSourceKeys: string[] = items
    .filter((item): item is WorksheetField => !isFieldGroup(item) && item.fieldType === "cross-worksheet-select")
    .map((item) => (item as WorksheetField).sourceGroupKey ?? "")
    .filter(Boolean);

  const linkedGroupSourceKeys: string[] = items
    .filter((item): item is FieldGroup => isFieldGroup(item) && !!item.linkedGroup)
    .map((item) => item.linkedGroup?.sourceGroupKey ?? "")
    .filter(Boolean);

  const keysToLoad = [...allKeys, ...crossWorksheetSourceKeys, ...linkedGroupSourceKeys];

  /* ── Load saved values on mount ── */
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await fetch("/api/v2/learner-state", { cache: "no-store", credentials: "same-origin" });
        if (!res.ok) throw new Error("Failed to load");
        const data = (await res.json()) as {
          auth?: boolean;
          worksheetResponses?: Record<string, string>;
          responsesByWorksheet?: Record<string, Record<string, string>>;
        };
        if (!active) return;
        // Build scoped values: current worksheet's fields are authoritative; other worksheets'
        // fields are merged in for cross-worksheet source lookups (safe because field-group keys
        // are globally unique). Falls back to legacy flat map if server hasn't been updated.
        let merged: Record<string, string> = {};
        if (data.responsesByWorksheet) {
          for (const [wsId, fields] of Object.entries(data.responsesByWorksheet)) {
            if (wsId !== worksheetId) Object.assign(merged, fields);
          }
          Object.assign(merged, data.responsesByWorksheet[worksheetId] ?? {});
        } else {
          merged = data.worksheetResponses ?? {};
        }
        setValues(Object.fromEntries(Object.entries(merged).filter(([key]) => keysToLoad.includes(key))));
        setStatus(data.auth ? "idle" : "error");
      } catch {
        if (!active) return;
        setStatus("error");
      }
    };
    void load();
    return () => { active = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Debounced auto-save ── */
  const scheduleAutosave = useCallback(
    (nextValues: Record<string, string>, completionPct: number) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        setStatus("saving");
        const scopedResponses = Object.fromEntries(
          Object.entries(nextValues).filter(([key]) => allKeys.includes(key)),
        );
        try {
          const res = await fetch("/api/v2/learner-state", {
            method: "POST",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              worksheetId,
              chapterId,
              chapterSlug,
              responses: scopedResponses,
              worksheetCompletionPercent: completionPct,
              lastLocationType: "worksheet",
            }),
          });
          if (!res.ok) throw new Error("Save failed");
          setStatus("saved");
          setTimeout(() => setStatus("idle"), 1500);
        } catch {
          setStatus("error");
          setTimeout(() => setStatus("idle"), 2500);
        }
      }, 800);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [worksheetId, chapterId, chapterSlug, allKeys.join(",")],
  );

  const handleChange = (key: string, value: string) => {
    const next = { ...values, [key]: value };
    setValues(next);
    const { filledRequired: nextFilled, totalRequired: nextTotal } = computeCompletion(items, next, requiredFieldKeys);
    const pct = nextTotal > 0 ? Math.round((nextFilled / nextTotal) * 100) : 0;
    scheduleAutosave(next, pct);
  };

  const { filledRequired, totalRequired, filledAll, totalAll } = computeCompletion(items, values, requiredFieldKeys);
  const completionPercent = totalRequired > 0 ? Math.round((filledRequired / totalRequired) * 100) : 0;
  const isComplete = completionPercent === 100 && totalRequired > 0;

  return (
    <div className="space-y-6">
      {/* Status bar */}
      <div
        className={`rounded-2xl p-4 text-sm ${
          status === "error"
            ? "bg-[#fff1f1] text-error-700"
            : status === "saving"
              ? "bg-[#eef4ff] text-[#0049c2]"
              : status === "saved"
                ? "bg-success-100 text-[#005e3f]"
                : "bg-surface-sunken text-ink-500"
        }`}
      >
        <div className="flex items-center justify-between gap-4">
          <span>
            {totalRequired > 0
              ? `${filledRequired} of ${totalRequired} required fields complete`
              : `${filledAll} of ${totalAll} fields filled`}
          </span>
          <span className="font-semibold">
            {status === "loading" && "Loading…"}
            {status === "saving" && "Saving…"}
            {status === "saved" && "Saved ✓"}
            {status === "error" && "Not saved"}
            {status === "idle" && (isComplete ? "Complete" : "In progress")}
          </span>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#e1e2ed]">
          <div
            className="h-full rounded-full bg-cobalt-600 transition-all"
            style={{ width: `${completionPercent || Math.round((filledAll / Math.max(totalAll, 1)) * 100)}%` }}
          />
        </div>
        {status === "error" && (
          <p className="mt-2 text-sm">Please make sure you are signed in and try again.</p>
        )}
      </div>

      {/* Fields */}
      <div className="space-y-5 rounded-[2rem] bg-white p-6 shadow-[0px_24px_48px_rgba(11,42,57,0.04)]">
        {items.map((item) =>
          isFieldGroup(item) ? (
            <div key={item.key} className="space-y-4">
              <FieldGroupSection
                group={item}
                rawValue={values[item.key] ?? ""}
                onChange={(val) => handleChange(item.key, val)}
                disabled={status === "loading"}
                allValues={values}
              />
              {worksheetId === "unit-economics-worksheet" && item.key === "idea_economics" ? (
                <UnitEconomicsReviewPanel rawValue={values[item.key] ?? ""} allValues={values} />
              ) : null}
            </div>
          ) : (
            <FieldSection
              key={item.key}
              field={item}
              value={values[item.key] ?? ""}
              onChange={(val) => handleChange(item.key, val)}
              disabled={status === "loading"}
              allValues={values}
            />
          ),
        )}

        <div className="border-t border-[#e8e7f1] pt-5">
          <a
            href={`/chapter/${chapterSlug}`}
            className="inline-flex items-center gap-2 rounded-xl border border-ink-100 bg-white px-5 py-3 font-semibold text-ink-900 transition hover:bg-surface-sunken"
          >
            ← Back to Chapter {chapterNumber}
          </a>
        </div>
      </div>

      {/* Completion callout */}
      {isComplete && (
        <div className="rounded-2xl bg-success-100 p-5 text-[#005e3f]">
          <p className="font-[Manrope] text-lg font-bold">Worksheet complete</p>
          <p className="mt-2 text-sm leading-6">
            Your answers are saved. You can return here at any time to update them as your thinking evolves.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href={`/chapter/${chapterSlug}`}
              className="inline-flex items-center justify-center rounded-xl bg-[#005e3f] px-5 py-3 font-semibold text-white"
            >
              Return to chapter
            </a>
            <a
              href="/program"
              className="inline-flex items-center justify-center rounded-xl border border-[#b8e5d0] bg-white px-5 py-3 font-semibold text-[#0f5132]"
            >
              Back to program
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Field group section
───────────────────────────────────────────────────────────── */

function FieldGroupSection({
  group,
  rawValue,
  onChange,
  disabled,
  allValues,
}: {
  group: FieldGroup;
  rawValue: string;
  onChange: (val: string) => void;
  disabled: boolean;
  allValues: Record<string, string>;
}) {
  if (group.linkedGroup) {
    return (
      <LinkedFieldGroupSection
        group={group}
        linkedGroup={group.linkedGroup}
        rawValue={rawValue}
        onChange={onChange}
        disabled={disabled}
        allValues={allValues}
      />
    );
  }

  const instances = parseGroupValue(rawValue, group.repeatMin).map((row, index) =>
    withDurableRowId(group.key, row, index),
  );

  const updateInstance = (index: number, fieldKey: string, fieldValue: string) => {
    const next = instances.map((row, i) => (i === index ? { ...row, [fieldKey]: fieldValue } : row));
    onChange(JSON.stringify(next));
  };

  const addInstance = () => {
    if (instances.length >= group.repeatMax) return;
    onChange(JSON.stringify([...instances, withDurableRowId(group.key, {}, instances.length)]));
  };

  const removeInstance = (index: number) => {
    if (instances.length <= group.repeatMin) return;
    onChange(JSON.stringify(instances.filter((_, i) => i !== index)));
  };

  return (
    <div className="rounded-[1.5rem] bg-surface-sunken p-5 ring-1 ring-ink-100">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cobalt-600">{group.label}</p>
      <div className="mt-4 space-y-4">
        {instances.map((row, index) => {
          const summaryValue = (row[group.summaryFieldKey] ?? "").trim();
          const instanceLabel = summaryValue
            ? `${group.label} ${index + 1}: ${summaryValue.length > 50 ? summaryValue.slice(0, 50) + "…" : summaryValue}`
            : `${group.label} ${index + 1}`;

          return (
            <div key={index} className="rounded-2xl border border-[#e2e6f5] bg-white p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="font-[Manrope] text-sm font-bold text-ink-900">{instanceLabel}</p>
                {instances.length > group.repeatMin && (
                  <button
                    type="button"
                    onClick={() => removeInstance(index)}
                    disabled={disabled}
                    className="text-xs font-semibold text-error-700 transition hover:text-[#7a1f1e] disabled:opacity-40"
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className="space-y-4">
                {group.fields.map((field) => (
                  <FieldSection
                    key={field.key}
                    field={field}
                    value={row[field.key] ?? ""}
                    onChange={(val) => updateInstance(index, field.key, val)}
                    disabled={disabled}
                    allValues={allValues}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {instances.length < group.repeatMax && (
          <button
            type="button"
            onClick={addInstance}
            disabled={disabled}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[#bfc4d9] bg-white py-3 text-sm font-semibold text-cobalt-600 transition hover:border-cobalt-600 hover:bg-[#f0f5ff] disabled:opacity-40"
          >
            <span>+</span>
            <span>Add another {group.label.toLowerCase()}</span>
          </button>
        )}
      </div>
    </div>
  );
}

function LinkedFieldGroupSection({
  group,
  linkedGroup,
  rawValue,
  onChange,
  disabled,
  allValues,
}: {
  group: FieldGroup;
  linkedGroup: LinkedGroupConfig;
  rawValue: string;
  onChange: (val: string) => void;
  disabled: boolean;
  allValues: Record<string, string>;
}) {
  const sourceRows =
    linkedGroup.sourceGroupKey === "product_ideas"
      ? ensureProductIdeaIds(parseLinkedSource(allValues, linkedGroup.sourceGroupKey))
      : parseLinkedSource(allValues, linkedGroup.sourceGroupKey);
  const visibleSource = sourceRows.slice(0, group.repeatMax);
  const stored = parseGroupValue(rawValue, 0);

  if (visibleSource.length === 0) {
    if (disabled) {
      return (
        <div className="rounded-[1.5rem] border border-dashed border-ink-100 bg-surface-sunken px-5 py-6 text-sm leading-6 text-ink-500">
          <p className="font-semibold text-ink-900">Loading your shortlisted ideas…</p>
          <p className="mt-1">We are checking Chapter 3 before showing the idea-linked fields.</p>
        </div>
      );
    }

    return (
      <div className="rounded-[1.5rem] border border-dashed border-ink-100 bg-surface-sunken px-5 py-6 text-sm leading-6 text-ink-500">
        <p className="font-semibold text-ink-900">Add your product ideas in Chapter 3 first.</p>
        <p className="mt-1">
          Each idea you list there will appear here with its own economics breakdown.
        </p>
      </div>
    );
  }

  const updateInstance = (index: number, fieldKey: string, fieldValue: string) => {
    const sourceRow = visibleSource[index] ?? {};
    const sourceIdeaId = getProductIdeaId(sourceRow, index);
    const sourceLabel = (sourceRow[linkedGroup.sourceLabelKey] ?? "").trim() || `Idea ${index + 1}`;
    const existingIndex = stored.findIndex((row) => row[PRODUCT_ID_FIELD] === sourceIdeaId);
    const writeIndex = existingIndex >= 0 ? existingIndex : index < stored.length ? index : stored.length;
    const next: InstanceRow[] = stored.map((row) => ({ ...row }));
    next[writeIndex] = {
      ...(next[writeIndex] ?? {}),
      [PRODUCT_ID_FIELD]: sourceIdeaId,
      [linkedGroup.targetFieldKey]: sourceLabel,
      [fieldKey]: fieldValue,
    };
    onChange(JSON.stringify(next));
  };

  return (
    <div className="rounded-[1.5rem] bg-surface-sunken p-5 ring-1 ring-ink-100">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cobalt-600">{group.label}</p>
      <div className="mt-4 space-y-4">
        {visibleSource.map((sourceRow, index) => {
          const derivedLabel =
            (sourceRow[linkedGroup.sourceLabelKey] ?? "").trim() || `Idea ${index + 1}`;
          const sourceIdeaId = getProductIdeaId(sourceRow, index);
          const storedRow =
            stored.find((row) => row[PRODUCT_ID_FIELD] === sourceIdeaId) ?? stored[index] ?? {};
          const shortLabel =
            derivedLabel.length > 50 ? `${derivedLabel.slice(0, 50)}…` : derivedLabel;
          const instanceLabel = `${group.label} ${index + 1}: ${shortLabel}`;

          return (
            <div key={index} className="rounded-2xl border border-[#e2e6f5] bg-white p-5">
              <div className="mb-4 flex items-center gap-3">
                <p className="font-[Manrope] text-sm font-bold text-ink-900">{instanceLabel}</p>
                <span className="rounded-full bg-[#eef4ff] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-cobalt-600">
                  From Chapter 3
                </span>
              </div>
              <div className="space-y-4">
                {group.fields.map((field) => {
                  const isTarget = field.key === linkedGroup.targetFieldKey;
                  const fieldValue = isTarget ? derivedLabel : (storedRow[field.key] ?? "");
                  return (
                    <div key={field.key} className="space-y-3">
                      {field.key === "viable" ? (
                        <UnitEconomicsViabilityCard row={{ ...storedRow, [PRODUCT_ID_FIELD]: sourceIdeaId, idea_name: derivedLabel }} />
                      ) : null}
                      <FieldSection
                        field={field}
                        value={fieldValue}
                        onChange={(val) => updateInstance(index, field.key, val)}
                        disabled={disabled || isTarget}
                        allValues={allValues}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Scalar field section
───────────────────────────────────────────────────────────── */

function FieldSection({
  field,
  value,
  onChange,
  disabled,
  allValues,
}: {
  field: WorksheetField;
  value: string;
  onChange: (val: string) => void;
  disabled: boolean;
  allValues?: Record<string, string>;
}) {
  const inputBase =
    "mt-2 block w-full rounded-xl border border-[#e2e4ea] bg-surface-sunken px-4 py-3 text-sm text-ink-900 outline-none transition placeholder:text-[#b0b3be] focus:border-cobalt-600 focus:bg-white focus:ring-1 focus:ring-cobalt-600 disabled:opacity-60";

  /* ── Cross-worksheet select ── */
  if (field.fieldType === "cross-worksheet-select") {
    let crossOptions: string[] = [];
    if (field.sourceGroupKey && allValues) {
      const raw = allValues[field.sourceGroupKey] ?? "";
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          crossOptions = ensureProductIdeaIds(parsed as Record<string, string>[])
            .map((row, index) => {
              const label = field.sourceGroupKey === "product_ideas"
                ? getProductIdeaLabel(row, index)
                : (row[field.sourceLabelKey ?? ""] ?? "").trim();
              const optionValue = field.sourceGroupKey === "product_ideas"
                ? getProductIdeaId(row, index)
                : label;
              return label ? `${optionValue}|||${label}` : "";
            })
            .filter(Boolean);
        }
      } catch {
        /* ignore parse errors */
      }
    }

    const hasOptions = crossOptions.length > 0;
    const selectedValue =
      crossOptions
        .map((opt) => {
          const [optionValue, label] = opt.split("|||");
          return { optionValue, label };
        })
        .find((opt) => value === opt.optionValue || value === opt.label)?.optionValue ?? value;

    if (field.key === "chosen_idea") {
      return (
        <IdeaChoicePicker
          label={field.label}
          helpText={field.helpText}
          value={selectedValue}
          allValues={allValues}
          disabled={disabled}
          onChange={onChange}
          labelSize="base"
          required={field.required}
        />
      );
    }

    return (
      <div>
        <div className="mb-1 flex items-start justify-between gap-3">
          <label className="font-[Manrope] text-base font-bold text-ink-900">{field.label}</label>
          {field.required && (
            <span className="shrink-0 rounded-full bg-[#eef4ff] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-cobalt-600">
              Required
            </span>
          )}
        </div>
        {field.helpText && (
          <p className="mb-2 text-sm leading-6 text-ink-500">{field.helpText}</p>
        )}
        {hasOptions ? (
          <select
            className={inputBase}
            value={selectedValue}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
          >
            <option value="">Select your idea…</option>
            {crossOptions.map((opt) => {
              const [optionValue, label] = opt.split("|||");
              return (
                <option key={optionValue} value={optionValue}>
                  {label}
                </option>
              );
            })}
          </select>
        ) : disabled ? (
          <div className="mt-2 rounded-xl border border-dashed border-ink-100 bg-surface-sunken px-4 py-3 text-sm text-ink-500">
            Loading your shortlisted ideas…
          </div>
        ) : (
          <div className="mt-2 rounded-xl border border-dashed border-ink-100 bg-surface-sunken px-4 py-3 text-sm text-ink-500">
            Add your product ideas in Chapter 3 first. Your shortlisted ideas will appear here as options.
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-1 flex items-start justify-between gap-3">
        <label className="font-[Manrope] text-base font-bold text-ink-900">{field.label}</label>
        {field.required && (
          <span className="shrink-0 rounded-full bg-[#eef4ff] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-cobalt-600">
            Required
          </span>
        )}
      </div>
      {field.helpText && (
        <p className="mb-2 text-sm leading-6 text-ink-500">{field.helpText}</p>
      )}

      {field.fieldType === "textarea" ? (
        <textarea
          className={`${inputBase} min-h-[110px] resize-y`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder={`Enter ${field.label.toLowerCase()}…`}
        />
      ) : field.fieldType === "single-select" && field.options ? (
        <select
          className={inputBase}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        >
          <option value="">Select…</option>
          {field.options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : field.fieldType === "checkbox" ? (
        <label className="mt-2 flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-[#e2e4ea] text-cobalt-600 focus:ring-cobalt-600"
            checked={value === "true"}
            onChange={(e) => onChange(e.target.checked ? "true" : "")}
            disabled={disabled}
          />
          <span className="text-sm leading-6 text-ink-500">Yes, I confirm this.</span>
        </label>
      ) : (
        <input
          type={field.fieldType === "number" ? "number" : "text"}
          className={inputBase}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder={`Enter ${field.label.toLowerCase()}…`}
        />
      )}
    </div>
  );
}
