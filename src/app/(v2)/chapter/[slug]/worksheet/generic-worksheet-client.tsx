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
      const instances = parseGroupValue(values[item.key] ?? "", item.repeatMin);
      const filled = instances
        .slice(0, item.repeatMin)
        .filter((row) => (row[item.summaryFieldKey] ?? "").trim().length > 0).length;
      totalAll += item.repeatMin;
      filledAll += filled;
      if (requiredFieldKeys.includes(item.key)) {
        totalRequired += item.repeatMin;
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

  const keysToLoad = [...allKeys, ...crossWorksheetSourceKeys];

  /* ── Load saved values on mount ── */
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await fetch("/api/v2/learner-state", { cache: "no-store", credentials: "same-origin" });
        if (!res.ok) throw new Error("Failed to load");
        const data = (await res.json()) as { auth?: boolean; worksheetResponses?: Record<string, string> };
        if (!active) return;
        const all = data.worksheetResponses ?? {};
        // Scope to this worksheet's fields + any cross-worksheet source group keys
        setValues(Object.fromEntries(Object.entries(all).filter(([key]) => keysToLoad.includes(key))));
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
        try {
          const res = await fetch("/api/v2/learner-state", {
            method: "POST",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              worksheetId,
              chapterId,
              chapterSlug,
              responses: nextValues,
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
    [worksheetId, chapterId, chapterSlug],
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
            ? "bg-[#fff1f1] text-[#a83836]"
            : status === "saving"
              ? "bg-[#eef4ff] text-[#0049c2]"
              : status === "saved"
                ? "bg-[#eefcf5] text-[#005e3f]"
                : "bg-[#f4f3fa] text-[#5d5f68]"
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
            className="h-full rounded-full bg-[#0053dc] transition-all"
            style={{ width: `${completionPercent || Math.round((filledAll / Math.max(totalAll, 1)) * 100)}%` }}
          />
        </div>
        {status === "error" && (
          <p className="mt-2 text-sm">Please make sure you are signed in and try again.</p>
        )}
      </div>

      {/* Fields */}
      <div className="space-y-5 rounded-[2rem] bg-white p-6 shadow-[0px_24px_48px_rgba(48,50,59,0.04)]">
        {items.map((item) =>
          isFieldGroup(item) ? (
            <FieldGroupSection
              key={item.key}
              group={item}
              rawValue={values[item.key] ?? ""}
              onChange={(val) => handleChange(item.key, val)}
              disabled={status === "loading"}
              allValues={values}
            />
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
            className="inline-flex items-center gap-2 rounded-xl border border-[#d7d9e6] bg-white px-5 py-3 font-semibold text-[#30323b] transition hover:bg-[#f8f8fb]"
          >
            ← Back to Chapter {chapterNumber}
          </a>
        </div>
      </div>

      {/* Completion callout */}
      {isComplete && (
        <div className="rounded-2xl bg-[#eefcf5] p-5 text-[#005e3f]">
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
  const instances = parseGroupValue(rawValue, group.repeatMin);

  const updateInstance = (index: number, fieldKey: string, fieldValue: string) => {
    const next = instances.map((row, i) => (i === index ? { ...row, [fieldKey]: fieldValue } : row));
    onChange(JSON.stringify(next));
  };

  const addInstance = () => {
    if (instances.length >= group.repeatMax) return;
    onChange(JSON.stringify([...instances, {}]));
  };

  const removeInstance = (index: number) => {
    if (instances.length <= group.repeatMin) return;
    onChange(JSON.stringify(instances.filter((_, i) => i !== index)));
  };

  return (
    <div className="rounded-[1.5rem] bg-[#fbfcff] p-5 ring-1 ring-[#eef1f7]">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#0053dc]">{group.label}</p>
      <div className="mt-4 space-y-4">
        {instances.map((row, index) => {
          const summaryValue = (row[group.summaryFieldKey] ?? "").trim();
          const instanceLabel = summaryValue
            ? `${group.label} ${index + 1}: ${summaryValue.length > 50 ? summaryValue.slice(0, 50) + "…" : summaryValue}`
            : `${group.label} ${index + 1}`;

          return (
            <div key={index} className="rounded-2xl border border-[#e2e6f5] bg-white p-5">
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
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[#bfc4d9] bg-white py-3 text-sm font-semibold text-[#0053dc] transition hover:border-[#0053dc] hover:bg-[#f0f5ff] disabled:opacity-40"
          >
            <span>+</span>
            <span>Add another {group.label.toLowerCase()}</span>
          </button>
        )}
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
    "mt-2 block w-full rounded-xl border border-[#e2e4ea] bg-[#f4f3fa] px-4 py-3 text-sm text-[#003748] outline-none transition placeholder:text-[#b0b3be] focus:border-[#0053dc] focus:bg-white focus:ring-1 focus:ring-[#0053dc] disabled:opacity-60";

  /* ── Cross-worksheet select ── */
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
        <div className="mb-1 flex items-start justify-between gap-3">
          <label className="font-[Manrope] text-base font-bold text-[#003748]">{field.label}</label>
          {field.required && (
            <span className="shrink-0 rounded-full bg-[#eef4ff] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#0053dc]">
              Required
            </span>
          )}
        </div>
        {field.helpText && (
          <p className="mb-2 text-sm leading-6 text-[#5d5f68]">{field.helpText}</p>
        )}
        {hasOptions ? (
          <select
            className={inputBase}
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
      </div>
    );
  }

  return (
    <div>
      <div className="mb-1 flex items-start justify-between gap-3">
        <label className="font-[Manrope] text-base font-bold text-[#003748]">{field.label}</label>
        {field.required && (
          <span className="shrink-0 rounded-full bg-[#eef4ff] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#0053dc]">
            Required
          </span>
        )}
      </div>
      {field.helpText && (
        <p className="mb-2 text-sm leading-6 text-[#5d5f68]">{field.helpText}</p>
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
            className="mt-0.5 h-4 w-4 rounded border-[#e2e4ea] text-[#0053dc] focus:ring-[#0053dc]"
            checked={value === "true"}
            onChange={(e) => onChange(e.target.checked ? "true" : "")}
            disabled={disabled}
          />
          <span className="text-sm leading-6 text-[#5d5f68]">Yes, I confirm this.</span>
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
