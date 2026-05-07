"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { UnitEconomicsReviewPanel, UnitEconomicsViabilityCard } from "./unit-economics-review-panel";
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
  /** Key of the driving field-group in another worksheet (read via the flat values map). */
  sourceGroupKey: string;
  /** Sub-field within the source group whose value becomes the row label. */
  sourceLabelKey: string;
  /** Sub-field in THIS group that should be pre-filled (and locked) with the derived label. */
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
  /** When present, instances are driven 1:1 by another group. Add/remove is disabled,
   *  and `targetFieldKey` renders as a read-only field populated from the source. */
  linkedGroup?: LinkedGroupConfig;
};

type DefinitionItem = WorksheetField | FieldGroup;

type WorksheetDefinition = {
  worksheet: { id: string };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fields: any[];
};

type LearnerStateResponse = {
  auth?: boolean;
  worksheetResponses?: Record<string, string>;
  responsesByWorksheet?: Record<string, Record<string, string>>;
};

/** Build this worksheet's flat values from the nested server response.
 *  - Current worksheet's fields authoritative (wins on any collision).
 *  - Other worksheets' fields merged in for cross-worksheet lookups
 *    (field-group keys are globally unique across worksheets, so this is safe). */
function buildValuesForWorksheet(
  responsesByWorksheet: Record<string, Record<string, string>> | undefined,
  worksheetId: string | null,
): Record<string, string> {
  if (!responsesByWorksheet) return {};
  const merged: Record<string, string> = {};
  for (const [wsId, fields] of Object.entries(responsesByWorksheet)) {
    if (wsId !== worksheetId) Object.assign(merged, fields);
  }
  if (worksheetId) Object.assign(merged, responsesByWorksheet[worksheetId] ?? {});
  return merged;
}

type InstanceRow = Record<string, string>;
type PendingWorksheetCache = Record<string, Record<string, string>>;

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

/** Parse another group's stored JSON from the flat values map. Returns [] on empty/invalid. */
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

const PENDING_CACHE_KEY = "calm-commerce:pending-worksheet-values";

function readPendingCache(): PendingWorksheetCache {
  if (typeof window === "undefined") return {};
  try {
    const parsed = JSON.parse(window.localStorage.getItem(PENDING_CACHE_KEY) ?? "{}");
    return parsed && typeof parsed === "object" ? parsed as PendingWorksheetCache : {};
  } catch {
    return {};
  }
}

function writePendingValue(worksheetId: string | null, key: string, value: string) {
  if (!worksheetId || typeof window === "undefined") return;
  try {
    const cache = readPendingCache();
    cache[worksheetId] = { ...(cache[worksheetId] ?? {}), [key]: value };
    window.localStorage.setItem(PENDING_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Local cache is a reliability helper; failed browser storage should not block typing.
  }
}

function clearPendingValues(worksheetId: string | null, keys: string[]) {
  if (!worksheetId || typeof window === "undefined") return;
  try {
    const cache = readPendingCache();
    if (!cache[worksheetId]) return;
    for (const key of keys) {
      delete cache[worksheetId][key];
    }
    if (Object.keys(cache[worksheetId]).length === 0) {
      delete cache[worksheetId];
    }
    window.localStorage.setItem(PENDING_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore cache cleanup failures; server persistence already succeeded.
  }
}

function mergePendingCache(
  values: Record<string, string>,
  worksheetId: string | null,
): Record<string, string> {
  const pending = readPendingCache();
  const merged = { ...values };
  for (const [pendingWorksheetId, fields] of Object.entries(pending)) {
    if (pendingWorksheetId === worksheetId) continue;
    for (const [key, value] of Object.entries(fields)) {
      if (!(key in merged)) merged[key] = value;
    }
  }
  if (worksheetId) Object.assign(merged, pending[worksheetId] ?? {});
  return merged;
}

function applyWorksheetDefaults(
  values: Record<string, string>,
  worksheetId: string | null,
): Record<string, string> {
  if (worksheetId !== "pre-store-test-worksheet") return values;
  if ((values.test_idea ?? "").trim() || !(values.chosen_idea ?? "").trim()) return values;
  return { ...values, test_idea: values.chosen_idea };
}

/* ─────────────────────────────────────────────────────────────
   Completion counting
───────────────────────────────────────────────────────────── */

function countCompletion(
  orderedItems: DefinitionItem[],
  values: Record<string, string>,
): { filledCount: number; totalCount: number } {
  let filledCount = 0;
  let totalCount = 0;

  for (const item of orderedItems) {
    if (isFieldGroup(item)) {
      if (item.linkedGroup) {
        // Linked groups: one slot per source row (clamped to repeatMax).
        // A slot is "filled" when the user has entered something in any non-target field.
        const sourceRows = parseLinkedSource(values, item.linkedGroup.sourceGroupKey);
        const visibleCount = Math.min(sourceRows.length, item.repeatMax);
        const stored = parseGroupValue(values[item.key] ?? "", 0);
        totalCount += visibleCount;
        for (let i = 0; i < visibleCount; i++) {
          const row = stored[i] ?? {};
          const hasContent = Object.entries(row).some(
            ([k, v]) =>
              k !== item.linkedGroup!.targetFieldKey && (v ?? "").trim().length > 0,
          );
          if (hasContent) filledCount += 1;
        }
      } else {
        // Each required slot (repeatMin) is one unit; filled when summaryFieldKey is non-empty
        const instances = parseGroupValue(values[item.key] ?? "", item.repeatMin);
        totalCount += item.repeatMin;
        filledCount += instances
          .slice(0, item.repeatMin)
          .filter((row) => (row[item.summaryFieldKey] ?? "").trim().length > 0).length;
      }
    } else {
      totalCount += 1;
      if ((values[item.key] ?? "").trim().length > 0) filledCount += 1;
    }
  }

  return { filledCount, totalCount };
}

/* ─────────────────────────────────────────────────────────────
   Main component
───────────────────────────────────────────────────────────── */

export function InlineWorksheetCard({
  chapterSlug,
  chapterId,
  worksheetId,
  fieldKeys,
  worksheetDefinition,
}: {
  chapterSlug: string;
  chapterId: string;
  worksheetId: string | null;
  fieldKeys: string[];
  worksheetDefinition: WorksheetDefinition | null;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"loading" | "idle" | "saving" | "saved" | "error">("loading");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Resolve items in fieldKeys order, matching both scalar fields and field groups
  const orderedItems: DefinitionItem[] = fieldKeys
    .map((key) =>
      (worksheetDefinition?.fields ?? []).find(
        (f): f is DefinitionItem =>
          f != null && typeof f === "object" && "key" in f && f.key === key,
      ),
    )
    .filter((f): f is DefinitionItem => f !== undefined);

  /* ── Load saved values on mount ── */
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await fetch("/api/v2/learner-state", { cache: "no-store", credentials: "same-origin" });
        if (!res.ok) throw new Error("Failed to load");
        const data = (await res.json()) as LearnerStateResponse;
        if (!active) return;
        // Prefer worksheet-scoped responses; fall back to legacy flat map if server hasn't been updated.
        const values = data.responsesByWorksheet
          ? buildValuesForWorksheet(data.responsesByWorksheet, worksheetId)
          : (data.worksheetResponses ?? {});
        setValues(applyWorksheetDefaults(mergePendingCache(values, worksheetId), worksheetId));
        setStatus(data.auth ? "idle" : "error");
      } catch {
        if (!active) return;
        setStatus("error");
      }
    };
    void load();
    return () => { active = false; };
  }, [worksheetId]);

  /* ── Debounced auto-save ── */
  // Only save fields that belong to this worksheet (the keys in orderedItems)
  const thisWorksheetKeys = orderedItems.map((item) => item.key);

  const scheduleAutosave = useCallback((nextValues: Record<string, string>, completionPct: number) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setStatus("saving");
      // Scope the payload to this worksheet's fields only
      const scopedResponses = Object.fromEntries(
        Object.entries(nextValues).filter(([key]) => thisWorksheetKeys.includes(key)),
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
            lastLocationType: "chapter",
          }),
        });
        if (!res.ok) throw new Error("Save failed");
        clearPendingValues(worksheetId, Object.keys(scopedResponses));
        setLastSavedAt(new Date());
        setStatus("saved");
        setTimeout(() => setStatus("idle"), 3000);
      } catch {
        setStatus("error");
        setTimeout(() => setStatus("idle"), 2500);
      }
    }, 800);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [worksheetId, chapterId, chapterSlug, thisWorksheetKeys.join(",")]);

  const handleChange = (key: string, value: string) => {
    const next = { ...values, [key]: value };
    writePendingValue(worksheetId, key, value);
    setValues(next);
    const { filledCount: nextFilled, totalCount: nextTotal } = countCompletion(orderedItems, next);
    const pct = nextTotal > 0 ? Math.round((nextFilled / nextTotal) * 100) : 0;
    scheduleAutosave(next, pct);
  };

  /* ── Nothing to render guard ── */
  if (!worksheetId || orderedItems.length === 0) return null;

  const { filledCount, totalCount } = countCompletion(orderedItems, values);

  return (
    <div className="mt-8 rounded-[1.5rem] border border-[#d9def2] bg-[#f7f9ff] p-6">
      {/* Header */}
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cobalt-600">
            Worksheet: capture your answer
          </p>
          <p className="mt-2 max-w-xl text-sm leading-6 text-ink-500">
            {status === "saving"
              ? "Saving your answer now."
              : status === "saved"
                ? "Saved. You can move on when you are ready."
                : status === "error"
                  ? "Your latest change was not saved. Please try again before moving on."
                  : "Your answers save automatically as you type."}
          </p>
        </div>
        <StatusBadge status={status} filledCount={filledCount} totalCount={totalCount} />
      </div>

      {/* Items */}
      <div className="space-y-5">
        {orderedItems.map((item) =>
          isFieldGroup(item) ? (
            <div key={item.key} className="space-y-4">
              <FieldGroupRenderer
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
            <FieldRenderer
              key={item.key}
              field={item}
              value={values[item.key] ?? ""}
              onChange={(val) => handleChange(item.key, val)}
              disabled={status === "loading"}
              allValues={values}
            />
          ),
        )}
      </div>

      <AutosaveFooter status={status} lastSavedAt={lastSavedAt} />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Field group renderer
───────────────────────────────────────────────────────────── */

function FieldGroupRenderer({
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
  /* ── Linked-group branch: driven 1:1 by another group ── */
  if (group.linkedGroup) {
    return (
      <LinkedGroupRenderer
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
    const next = instances.map((row, i) =>
      i === index ? { ...row, [fieldKey]: fieldValue } : row,
    );
    onChange(JSON.stringify(next));
  };

  const addInstance = () => {
    if (instances.length >= group.repeatMax) return;
    onChange(JSON.stringify([...instances, withDurableRowId(group.key, {}, instances.length)]));
  };

  const removeInstance = (index: number) => {
    if (instances.length <= group.repeatMin) return;
    const next = instances.filter((_, i) => i !== index);
    onChange(JSON.stringify(next));
  };

  return (
    <div className="space-y-4">
      {instances.map((row, index) => {
        const summaryValue = (row[group.summaryFieldKey] ?? "").trim();
        const instanceLabel = summaryValue
          ? `${group.label} ${index + 1}: ${summaryValue.length > 40 ? summaryValue.slice(0, 40) + "…" : summaryValue}`
          : `${group.label} ${index + 1}`;

        return (
          <div key={index} className="rounded-2xl border border-[#e2e6f5] bg-white p-5">
            {/* Instance header */}
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

            {/* Sub-fields */}
            <div className="space-y-4">
              {group.fields.map((field) => (
                <FieldRenderer
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

      {/* Add instance button */}
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
  );
}

/* ─────────────────────────────────────────────────────────────
   Linked field group renderer
   Rows are driven 1:1 by another group (from allValues). User can edit
   all sub-fields except `targetFieldKey`, which is derived read-only from
   the source. Add/remove UI is disabled.
───────────────────────────────────────────────────────────── */

function LinkedGroupRenderer({
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

  // Empty state when the upstream group has nothing yet
  if (visibleSource.length === 0) {
    if (disabled) {
      return (
        <div className="rounded-2xl border border-dashed border-ink-100 bg-surface-sunken px-5 py-6 text-sm leading-6 text-ink-500">
          <p className="font-semibold text-ink-900">Loading your shortlisted ideas…</p>
          <p className="mt-1">
            We are checking Chapter 3 before showing the idea-linked fields.
          </p>
        </div>
      );
    }

    return (
      <div className="rounded-2xl border border-dashed border-ink-100 bg-surface-sunken px-5 py-6 text-sm leading-6 text-ink-500">
        <p className="font-semibold text-ink-900">
          Add your product ideas in Chapter 3 first.
        </p>
        <p className="mt-1">
          Each idea you list there will appear here with its own economics breakdown. No need
          to retype anything.
        </p>
      </div>
    );
  }

  const updateInstance = (index: number, fieldKey: string, fieldValue: string) => {
    // Size the stored array to cover any visible slot the user edits, without shrinking
    // existing data (preserves entries if the source temporarily loses rows).
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
    <div className="space-y-4">
      {visibleSource.map((sourceRow, index) => {
        const derivedLabel =
          (sourceRow[linkedGroup.sourceLabelKey] ?? "").trim() || `Idea ${index + 1}`;
        const sourceIdeaId = getProductIdeaId(sourceRow, index);
        const storedRow =
          stored.find((row) => row[PRODUCT_ID_FIELD] === sourceIdeaId) ?? stored[index] ?? {};
        const shortLabel =
          derivedLabel.length > 40 ? `${derivedLabel.slice(0, 40)}…` : derivedLabel;
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
                const fieldValue = isTarget
                  ? derivedLabel
                  : (storedRow[field.key] ?? "");
                return (
                  <div key={field.key} className="space-y-3">
                    {field.key === "viable" ? (
                      <UnitEconomicsViabilityCard row={{ ...storedRow, [PRODUCT_ID_FIELD]: sourceIdeaId, idea_name: derivedLabel }} />
                    ) : null}
                    <FieldRenderer
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
  );
}

/* ─────────────────────────────────────────────────────────────
   Scalar field renderer
───────────────────────────────────────────────────────────── */

function FieldRenderer({
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
    "mt-1.5 block w-full rounded-xl border border-[#e2e4ea] bg-white px-4 py-2.5 text-sm text-ink-900 shadow-sm outline-none transition placeholder:text-[#b0b3be] focus:border-cobalt-600 focus:ring-1 focus:ring-cobalt-600 disabled:bg-[#f4f4f8] disabled:text-[#9a9ca8]";

  /* ── Cross-worksheet select: build options from another worksheet's field-group ── */
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

    return (
      <div>
        <label className="block">
          <span className="block font-[Manrope] text-sm font-semibold text-ink-900">
            {field.label}
          </span>
          {field.helpText && (
            <span className="mt-0.5 block text-xs leading-5 text-ink-500">{field.helpText}</span>
          )}
          {hasOptions ? (
            <select
              className={`${inputBase} mt-2`}
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
        </label>
      </div>
    );
  }

  return (
    <div>
      <label className="block">
        <span className="block font-[Manrope] text-sm font-semibold text-ink-900">
          {field.label}
        </span>
        {field.helpText && (
          <span className="mt-0.5 block text-xs leading-5 text-ink-500">{field.helpText}</span>
        )}

        {field.fieldType === "textarea" ? (
          <textarea
            className={`${inputBase} mt-2 min-h-[100px] resize-y`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            placeholder={`Enter ${field.label.toLowerCase()}…`}
          />
        ) : field.fieldType === "single-select" && field.options ? (
          <select
            className={`${inputBase} mt-2`}
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
          <div className="mt-2 flex items-start gap-2.5">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded border-[#e2e4ea] text-cobalt-600 focus:ring-cobalt-600"
              checked={value === "true"}
              onChange={(e) => onChange(e.target.checked ? "true" : "")}
              disabled={disabled}
            />
            <span className="text-sm leading-6 text-ink-500">Yes, I commit to this.</span>
          </div>
        ) : (
          <input
            type={field.fieldType === "number" ? "number" : "text"}
            className={`${inputBase} mt-2`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            placeholder={`Enter ${field.label.toLowerCase()}…`}
          />
        )}
      </label>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Status badge
───────────────────────────────────────────────────────────── */

function StatusBadge({
  status,
  filledCount,
  totalCount,
}: {
  status: "loading" | "idle" | "saving" | "saved" | "error";
  filledCount: number;
  totalCount: number;
}) {
  if (status === "loading") {
    return (
      <span className="shrink-0 rounded-full bg-[#f0f1f7] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-500">
        Loading…
      </span>
    );
  }
  if (status === "saving") {
    return (
      <span className="shrink-0 rounded-full bg-[#eef4ff] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-cobalt-600">
        Saving…
      </span>
    );
  }
  if (status === "saved") {
    return (
      <span className="shrink-0 rounded-full bg-success-100 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#005e3f]">
        Saved ✓
      </span>
    );
  }
  if (status === "error") {
    const remaining = totalCount - filledCount;
    return (
      <span className="shrink-0 rounded-full bg-[#fff1f1] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-error-700">
        {remaining > 0 ? `Not saved: ${remaining} to complete` : "Not saved"}
      </span>
    );
  }
  if (filledCount === totalCount) {
    return (
      <span className="shrink-0 rounded-full bg-success-100 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#005e3f]">
        Complete ✓
      </span>
    );
  }
  const remaining = totalCount - filledCount;
  return (
    <span className="shrink-0 rounded-full bg-surface-sunken px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-500">
      {remaining} {remaining === 1 ? "field" : "fields"} to fill
    </span>
  );
}

function AutosaveFooter({
  status,
  lastSavedAt,
}: {
  status: "loading" | "idle" | "saving" | "saved" | "error";
  lastSavedAt: Date | null;
}) {
  const savedTime = lastSavedAt?.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const message =
    status === "loading"
      ? "Loading your saved answers."
      : status === "saving"
        ? "Saving your latest change..."
        : status === "error"
          ? "Autosave could not confirm the latest change. Check your connection before leaving."
          : savedTime
            ? `Autosaved at ${savedTime}.`
            : "Autosave is ready.";

  const dotClass =
    status === "saving"
      ? "bg-cobalt-600"
      : status === "error"
        ? "bg-error-700"
        : status === "loading"
          ? "bg-ink-300"
          : "bg-[#005e3f]";

  return (
    <div className="mt-6 flex items-center gap-2 border-t border-[#e2e6f5] pt-4 text-xs leading-5 text-ink-500">
      <span className={`h-2 w-2 shrink-0 rounded-full ${dotClass}`} aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
