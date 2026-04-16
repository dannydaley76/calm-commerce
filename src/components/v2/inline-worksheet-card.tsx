"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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

type FieldGroup = {
  type: "field-group";
  key: string;
  label: string;
  repeatMin: number;
  repeatMax: number;
  summaryFieldKey: string;
  fields: WorksheetField[];
};

type DefinitionItem = WorksheetField | FieldGroup;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type WorksheetDefinition = {
  worksheet: { id: string };
  fields: any[];
};

type LearnerStateResponse = {
  auth?: boolean;
  worksheetResponses?: Record<string, string>;
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

function emptyInstances(n: number): InstanceRow[] {
  return Array.from({ length: n }, () => ({}));
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
      // Each required slot (repeatMin) is one unit; filled when summaryFieldKey is non-empty
      const instances = parseGroupValue(values[item.key] ?? "", item.repeatMin);
      totalCount += item.repeatMin;
      filledCount += instances
        .slice(0, item.repeatMin)
        .filter((row) => (row[item.summaryFieldKey] ?? "").trim().length > 0).length;
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
        setValues(data.worksheetResponses ?? {});
        setStatus(data.auth ? "idle" : "error");
      } catch {
        if (!active) return;
        setStatus("error");
      }
    };
    void load();
    return () => { active = false; };
  }, []);

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
        setStatus("saved");
        setTimeout(() => setStatus("idle"), 1500);
      } catch {
        setStatus("error");
        setTimeout(() => setStatus("idle"), 2500);
      }
    }, 800);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [worksheetId, chapterId, chapterSlug, thisWorksheetKeys.join(",")]);

  const handleChange = (key: string, value: string) => {
    const next = { ...values, [key]: value };
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
      <div className="mb-5 flex items-center justify-between gap-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#0053dc]">
          Worksheet — capture your answer
        </p>
        <StatusBadge status={status} filledCount={filledCount} totalCount={totalCount} />
      </div>

      {/* Items */}
      <div className="space-y-5">
        {orderedItems.map((item) =>
          isFieldGroup(item) ? (
            <FieldGroupRenderer
              key={item.key}
              group={item}
              rawValue={values[item.key] ?? ""}
              onChange={(val) => handleChange(item.key, val)}
              disabled={status === "loading"}
              allValues={values}
            />
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

      {/* Footer */}
      <div className="mt-6 border-t border-[#e2e6f5] pt-4">
        <a
          href={`/chapter/${chapterSlug}/worksheet`}
          className="text-sm font-semibold text-[#0053dc] transition hover:text-[#003da8]"
        >
          View full worksheet →
        </a>
      </div>
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
  const instances = parseGroupValue(rawValue, group.repeatMin);

  const updateInstance = (index: number, fieldKey: string, fieldValue: string) => {
    const next = instances.map((row, i) =>
      i === index ? { ...row, [fieldKey]: fieldValue } : row,
    );
    onChange(JSON.stringify(next));
  };

  const addInstance = () => {
    if (instances.length >= group.repeatMax) return;
    onChange(JSON.stringify([...instances, {}]));
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
              <p className="font-[Manrope] text-sm font-bold text-[#003748]">{instanceLabel}</p>
              {instances.length > group.repeatMin && (
                <button
                  type="button"
                  onClick={() => removeInstance(index)}
                  disabled={disabled}
                  className="text-xs font-semibold text-[#a83836] transition hover:text-[#7a1f1e] disabled:opacity-40"
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
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[#bfc4d9] bg-white py-3 text-sm font-semibold text-[#0053dc] transition hover:border-[#0053dc] hover:bg-[#f0f5ff] disabled:opacity-40"
        >
          <span>+</span>
          <span>Add another {group.label.toLowerCase()}</span>
        </button>
      )}
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
    "mt-1.5 block w-full rounded-xl border border-[#e2e4ea] bg-white px-4 py-2.5 text-sm text-[#003748] shadow-sm outline-none transition placeholder:text-[#b0b3be] focus:border-[#0053dc] focus:ring-1 focus:ring-[#0053dc] disabled:bg-[#f4f4f8] disabled:text-[#9a9ca8]";

  /* ── Cross-worksheet select: build options from another worksheet's field-group ── */
  if (field.fieldType === "cross-worksheet-select") {
    let crossOptions: string[] = [];
    if (field.sourceGroupKey && allValues) {
      const raw = allValues[field.sourceGroupKey] ?? "";
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          crossOptions = parsed
            .map((row: Record<string, string>) =>
              (row[field.sourceLabelKey ?? ""] ?? "").trim(),
            )
            .filter(Boolean);
        }
      } catch {
        /* ignore parse errors */
      }
    }

    const hasOptions = crossOptions.length > 0;

    return (
      <div>
        <label className="block">
          <span className="block font-[Manrope] text-sm font-semibold text-[#003748]">
            {field.label}
          </span>
          {field.helpText && (
            <span className="mt-0.5 block text-xs leading-5 text-[#5d5f68]">{field.helpText}</span>
          )}
          {hasOptions ? (
            <select
              className={`${inputBase} mt-2`}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              disabled={disabled}
            >
              <option value="">Select your idea…</option>
              {crossOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          ) : (
            <div className="mt-2 rounded-xl border border-dashed border-[#d7d9e6] bg-[#f8f8fb] px-4 py-3 text-sm text-[#5d5f68]">
              Complete the Chapter 3 worksheet first — your shortlisted ideas will appear here as options.
            </div>
          )}
        </label>
      </div>
    );
  }

  return (
    <div>
      <label className="block">
        <span className="block font-[Manrope] text-sm font-semibold text-[#003748]">
          {field.label}
        </span>
        {field.helpText && (
          <span className="mt-0.5 block text-xs leading-5 text-[#5d5f68]">{field.helpText}</span>
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
              className="mt-0.5 h-4 w-4 rounded border-[#e2e4ea] text-[#0053dc] focus:ring-[#0053dc]"
              checked={value === "true"}
              onChange={(e) => onChange(e.target.checked ? "true" : "")}
              disabled={disabled}
            />
            <span className="text-sm leading-6 text-[#5d5f68]">Yes, I commit to this.</span>
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
      <span className="shrink-0 rounded-full bg-[#f0f1f7] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#5d5f68]">
        Loading…
      </span>
    );
  }
  if (status === "saving") {
    return (
      <span className="shrink-0 rounded-full bg-[#eef4ff] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#0053dc]">
        Saving…
      </span>
    );
  }
  if (status === "saved") {
    return (
      <span className="shrink-0 rounded-full bg-[#eefcf5] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#005e3f]">
        Saved ✓
      </span>
    );
  }
  if (status === "error") {
    const remaining = totalCount - filledCount;
    return (
      <span className="shrink-0 rounded-full bg-[#fff1f1] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#a83836]">
        {remaining > 0 ? `Not saved — ${remaining} to complete` : "Not saved"}
      </span>
    );
  }
  if (filledCount === totalCount) {
    return (
      <span className="shrink-0 rounded-full bg-[#eefcf5] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#005e3f]">
        Complete ✓
      </span>
    );
  }
  const remaining = totalCount - filledCount;
  return (
    <span className="shrink-0 rounded-full bg-[#f4f3fa] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#5d5f68]">
      {remaining} {remaining === 1 ? "field" : "fields"} to fill
    </span>
  );
}
