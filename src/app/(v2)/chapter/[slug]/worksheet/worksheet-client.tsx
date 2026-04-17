"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type WorksheetClientModel = {
  worksheet: {
    id: string;
    chapterId: string;
    title: string;
    description: string;
    completionRule: {
      kind: string;
      requiredFieldKeys: string[];
    };
  };
  fields: {
    id: string;
    key: string;
    label: string;
    type: string;
    required: boolean;
    helpText?: string;
  }[];
};

type LearnerStateResponse = {
  auth?: boolean;
  learnerId?: string;
  worksheetResponses?: Record<string, string>;
  progress?: {
    status?: "not_started" | "in_progress" | "completed";
    worksheet_completion_percent?: number;
    last_location_type?: "chapter" | "worksheet" | "completion";
  } | null;
  resume?: {
    route?: string;
  } | null;
  computed?: {
    worksheetCompletionPercent?: number;
  };
};

const FIELD_GROUPS = [
  {
    title: "Time rules",
    description: "Protect your time by being specific about when and how much you will work.",
    keys: ["hours_per_week", "fixed_work_blocks", "weekly_review_slot"],
  },
  {
    title: "Money rules",
    description: "Define your spending limits and how your budget is split between tools and testing.",
    keys: ["money_cap_per_month", "tooling_max_spend", "budget_split"],
  },
  {
    title: "Decision rules",
    description: "Define what results mean stop, continue, or invest more — before emotion gets involved.",
    keys: ["minimum_experiment_duration", "kill_criteria", "continue_criteria", "escalation_criteria"],
  },
  {
    title: "Data over ego",
    description: "Write your personal commitment to following evidence over attachment.",
    keys: ["data_over_ego_commitment"],
  },
  {
    title: "Red-line rules",
    description: "The boundaries you will not cross regardless of how things are going.",
    keys: ["red_line_rules"],
  },
] as const;

function getFieldUnit(fieldKey: string, currencySymbol: string) {
  if (fieldKey === "hours_per_week") return "hrs/week";
  if (fieldKey === "money_cap_per_month") return `${currencySymbol}/month`;
  if (fieldKey === "tooling_max_spend") return `${currencySymbol}/month`;
  if (fieldKey === "minimum_experiment_duration") return "weeks";
  return null;
}

function getFieldPlaceholder(fieldKey: string, currencySymbol: string) {
  if (fieldKey === "hours_per_week") return "e.g. 8";
  if (fieldKey === "fixed_work_blocks") return "e.g. Tue & Thu 7–9pm, Sat 9am–12pm";
  if (fieldKey === "weekly_review_slot") return "e.g. Sunday 6–6:30pm";
  if (fieldKey === "money_cap_per_month") return `e.g. ${currencySymbol}200`;
  if (fieldKey === "tooling_max_spend") return `e.g. ${currencySymbol}30`;
  if (fieldKey === "budget_split") return "e.g. 80% testing / 20% tools";
  if (fieldKey === "minimum_experiment_duration") return "e.g. 3";
  return null;
}

function getFieldExample(fieldKey: string, currencySymbol: string) {
  if (fieldKey === "kill_criteria") {
    return "Example: Stop if 4 weeks of consistent testing produce no traction, weak customer interest, and no sign of a real buying problem.";
  }
  if (fieldKey === "continue_criteria") {
    return "Example: Keep going if I get questions and engagement but sales are slow — as long as the problem is confirmed as real.";
  }
  if (fieldKey === "escalation_criteria") {
    return `Example: Increase effort if the first offer converts profitably, or if repeatable demand justifies spending ${currencySymbol}300/month instead of ${currencySymbol}200.`;
  }
  if (fieldKey === "data_over_ego_commitment") {
    return "Example: My personal attachment to an idea is not a reason to keep going. I will follow the evidence, not my feelings about the idea.";
  }
  if (fieldKey === "red_line_rules") {
    return "Example: I will not skip my weekly review. I will not add a new tool without removing one. I will not exceed my monthly cap.";
  }
  return null;
}

export function WorksheetClient({ worksheetModel, currencyCode, currencySymbol }: { worksheetModel: WorksheetClientModel; currencyCode: string; currencySymbol: string }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "loading" | "saving" | "saved" | "error">("loading");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [hasLoadedSavedData, setHasLoadedSavedData] = useState(false);
  const [serverCompletionPercent, setServerCompletionPercent] = useState<number | null>(null);
  const requiredKeys = worksheetModel.worksheet.completionRule.requiredFieldKeys;

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const res = await fetch("/api/v2/learner-state", { cache: "no-store", credentials: "same-origin" });
        if (!res.ok) throw new Error("Failed to load learner state");
        const data = (await res.json()) as LearnerStateResponse;
        if (!active) return;
        // Scope to only the fields this worksheet owns (all keys across FIELD_GROUPS)
        const allKeys = FIELD_GROUPS.flatMap((g) => [...g.keys]);
        const allResponses = data.worksheetResponses ?? {};
        const loadedValues = Object.fromEntries(
          Object.entries(allResponses).filter(([key]) => allKeys.includes(key as never)),
        );
        setValues(loadedValues);
        setHasLoadedSavedData(Object.keys(loadedValues).length > 0);
        setServerCompletionPercent(data.computed?.worksheetCompletionPercent ?? data.progress?.worksheet_completion_percent ?? null);
        setStatus(data.auth ? "idle" : "error");
      } catch {
        if (!active) return;
        setStatus("error");
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, []);

  const completionPercent = useMemo(() => {
    const completed = requiredKeys.filter((key) => (values[key] ?? "").trim().length > 0).length;
    return requiredKeys.length ? Math.round((completed / requiredKeys.length) * 100) : 0;
  }, [requiredKeys, values]);

  const effectiveCompletionPercent = serverCompletionPercent ?? completionPercent;
  const isCompleted = effectiveCompletionPercent === 100;

  const persist = async (nextValues: Record<string, string>, lastLocationType: "worksheet" | "completion" = "worksheet") => {
    setStatus("saving");
    try {
      const res = await fetch("/api/v2/learner-state", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          worksheetId: worksheetModel.worksheet.id,
          chapterId: worksheetModel.worksheet.chapterId,
          responses: nextValues,
          worksheetCompletionPercent: completionPercent,
          lastLocationType,
          lastLocationKey: null,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as LearnerStateResponse & {
        error?: string;
        worksheetCompletionPercent?: number;
      };

      if (!res.ok) {
        throw new Error(data.error || "Could not save your draft. Please try again.");
      }

      const refreshRes = await fetch("/api/v2/learner-state", { cache: "no-store", credentials: "same-origin" });
      const refreshed = (await refreshRes.json().catch(() => ({}))) as LearnerStateResponse & { error?: string };

      if (!refreshRes.ok) {
        throw new Error(refreshed.error || "Saved, but could not refresh worksheet state.");
      }

      const canonicalResponses = refreshed.worksheetResponses ?? nextValues;
      const percent = refreshed.computed?.worksheetCompletionPercent ?? refreshed.progress?.worksheet_completion_percent ?? data.worksheetCompletionPercent ?? null;

      setValues(canonicalResponses);
      setHasLoadedSavedData(Object.keys(canonicalResponses).length > 0);
      setServerCompletionPercent(percent);
      setStatus("saved");
      setToast({ type: "success", message: "Draft saved. Your changes are safely stored." });
      window.setTimeout(() => setStatus("idle"), 1200);
      window.setTimeout(() => setToast(null), 2200);
    } catch (error) {
      setStatus("error");
      setToast({
        type: "error",
        message: error instanceof Error ? error.message : "Could not save your draft. Please try again.",
      });
      window.setTimeout(() => setToast(null), 2600);
    }
  };

  const onChange = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setServerCompletionPercent(null);
  };

  const onSaveDraft = async () => {
    await persist(values, "worksheet");
  };

  const onComplete = async () => {
    await persist(values, completionPercent === 100 ? "completion" : "worksheet");
  };

  const completionStateLabel = isCompleted ? "Complete" : "In progress";
  const completedRequiredCount = requiredKeys.filter((key) => (values[key] ?? "").trim().length > 0).length;

  return (
    <>
      <div
        className={`mb-4 rounded-2xl p-4 text-sm ${
          status === "saved"
            ? "bg-[#eefcf5] text-[#005e3f]"
            : status === "saving"
              ? "bg-[#eef4ff] text-[#0049c2]"
              : status === "error"
                ? "bg-[#fff1f1] text-[#a83836]"
                : "bg-[#f4f3fa] text-[#5d5f68]"
        }`}
      >
        <div className="flex items-center justify-between gap-4">
          <span>Completion: {effectiveCompletionPercent}%</span>
          <span className="font-semibold">
            {status === "loading" && "Loading worksheet…"}
            {status === "saving" && "Saving draft…"}
            {status === "saved" && "Draft saved"}
            {status === "error" && "Could not save draft"}
            {status === "idle" && "Ready"}
          </span>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#e1e2ed]">
          <div className="h-full rounded-full bg-[#0053dc] transition-all" style={{ width: `${effectiveCompletionPercent}%` }}></div>
        </div>
        <p className="mt-3 text-sm leading-6 text-[#5d5f68]">
          {completedRequiredCount} of {requiredKeys.length} required sections completed.
          {isCompleted
            ? " Your Founder Rules are now complete and ready to feed into the Lean Canvas."
            : " Finish the remaining sections to turn this worksheet into a usable operating ruleset."}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.12em]">
          <span className="rounded-full bg-white px-3 py-1 text-[#30323b]">{completionStateLabel}</span>
          {hasLoadedSavedData ? <span className="rounded-full bg-white px-3 py-1 text-[#30323b]">Saved data loaded</span> : null}
          {isCompleted ? <span className="rounded-full bg-[#6ffbbe] px-3 py-1 text-[#005e3f]">Founder Rules Sheet complete</span> : null}
        </div>
        {status === "saved" ? (
          <p className="mt-3 text-sm font-medium">Your draft has been saved successfully.</p>
        ) : null}
        {status === "error" ? (
          <p className="mt-3 text-sm font-medium">Please make sure you are signed in and try again.</p>
        ) : null}
      </div>

      <div className="space-y-5 rounded-[2rem] bg-white p-6 shadow-[0px_24px_48px_rgba(48,50,59,0.04)]">
        {FIELD_GROUPS.map((group) => (
          <section key={group.title} className="rounded-[1.5rem] bg-[#fbfcff] p-5 ring-1 ring-[#eef1f7]">
            <div className="mb-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#0053dc]">{group.title}</p>
              <p className="mt-2 text-sm leading-6 text-[#5d5f68]">{group.description}</p>
            </div>
            <div className="space-y-5">
              {group.keys.map((key) => {
                const field = worksheetModel.fields.find((item) => item.key === key);
                if (!field) return null;
                return (
                  <label key={field.id} className="block">
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <span className="block font-[Manrope] text-lg font-bold">{field.label}</span>
                      {field.required ? <span className="rounded-full bg-[#eef4ff] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#0053dc]">Required</span> : null}
                    </div>
                    {field.helpText ? (
                      <span className="mb-3 block text-sm text-[#5d5f68]">
                        {field.helpText}
                        {field.key === "money_cap_per_month" ? ` Use your preferred currency (${currencyCode}).` : ""}
                      </span>
                    ) : null}
                    {field.type === "textarea" ? (
                      <div>
                        <textarea
                          className="min-h-32 w-full rounded-xl bg-[#f4f3fa] p-4 outline-none"
                          placeholder={`Enter ${field.label.toLowerCase()}...`}
                          value={values[field.key] ?? ""}
                          onChange={(e) => onChange(field.key, e.target.value)}
                        />
                        {getFieldExample(field.key, currencySymbol) ? (
                          <p className="mt-3 rounded-xl bg-[#eef4ff] px-4 py-3 text-sm leading-6 text-[#23408e]">
                            {getFieldExample(field.key, currencySymbol)}
                          </p>
                        ) : null}
                      </div>
                    ) : (
                      <div>
                        <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[#5d5f68]">
                          <span>Expected unit</span>
                          {getFieldUnit(field.key, currencySymbol) ? (
                            <span className="rounded-full bg-[#eef4ff] px-2 py-1 text-[#0053dc]">{getFieldUnit(field.key, currencySymbol)}</span>
                          ) : null}
                        </div>
                        <input
                          className="w-full rounded-xl bg-[#f4f3fa] p-4 outline-none"
                          placeholder={getFieldPlaceholder(field.key, currencySymbol) ?? `Enter ${field.label.toLowerCase()}...`}
                          value={values[field.key] ?? ""}
                          onChange={(e) => onChange(field.key, e.target.value)}
                        />
                      </div>
                    )}
                  </label>
                );
              })}
            </div>
          </section>
        ))}

        <div className="flex flex-col gap-4 pt-4 sm:flex-row">
          <button
            onClick={onSaveDraft}
            className="flex-1 rounded-xl bg-[#003748] px-5 py-4 font-semibold text-white"
          >
            {status === "saving" ? "Saving…" : status === "saved" ? "Saved" : "Save Draft"}
          </button>
          <button onClick={onComplete} className="flex-[1.5] rounded-xl bg-[#0053dc] px-5 py-4 font-semibold !text-white">
            {isCompleted ? "Keep worksheet complete" : "Complete Worksheet"}
          </button>
        </div>
        <p className="text-sm leading-6 text-[#5d5f68]">
          Save Draft stores your progress. Complete Worksheet confirms the Founder Rules Sheet is ready to drive the Lean Canvas.
        </p>

        {isCompleted ? (
          <div className="rounded-2xl bg-[#eefcf5] p-5 text-[#005e3f]">
            <p className="font-[Manrope] text-lg font-bold">Founder Rules Sheet completed</p>
            <p className="mt-2 text-sm leading-6">
              You now have a practical set of operating rules for time, money, and decision discipline. The best next step is to view the Lean Canvas so you can see how these rules now appear as part of your emerging business operating model.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Link href="/lean-canvas" className="inline-flex items-center justify-center rounded-xl bg-[#005e3f] px-5 py-3 font-semibold !text-white">
                View Lean Canvas
              </Link>
              <Link href="/chapter/set-your-founder-rules" className="inline-flex items-center justify-center rounded-xl border border-[#b8e5d0] bg-white px-5 py-3 font-semibold text-[#0f5132]">
                Return to Chapter 3
              </Link>
              <Link href="/program" className="inline-flex items-center justify-center rounded-xl border border-[#b8e5d0] bg-white px-5 py-3 font-semibold text-[#0f5132]">
                Back to Program
              </Link>
            </div>
          </div>
        ) : null}
      </div>

      {toast ? (
        <div className="pointer-events-none fixed bottom-6 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 sm:left-auto sm:right-6 sm:w-full sm:translate-x-0">
          <div
            className={`rounded-2xl px-4 py-3 text-sm font-medium shadow-[0px_16px_32px_rgba(48,50,59,0.16)] ${
              toast.type === "success" ? "bg-[#005e3f] !text-white" : "bg-[#a83836] !text-white"
            }`}
          >
            {toast.message}
          </div>
        </div>
      ) : null}
    </>
  );
}
