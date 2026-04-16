// components/chapter3/InlineWorksheetFields.tsx
"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent, type ReactNode } from "react";

/* ══════════════════════════════════════════════
   Worksheet state hook (shared across all fields
   on the same page via module-level state + sync)
   ══════════════════════════════════════════════ */

export interface FounderRulesData {
  hoursPerWeek: string;
  fixedWorkBlocks: string;
  weeklyReviewSlot: string;
  minExperimentDuration: string;

  currency: "GBP" | "USD" | "EUR";
  monthlyMaxSpend: string;
  toolingMaxSpend: string;
  testBudgetSplit: string;

  leadingMetrics: string;
  laggingMetrics: string;

  killCriteria: string;
  continueCriteria: string;
  escalationCriteria: string;

  redLineRules: string[];

  dataOverEgoCommitment: boolean;
  dataOverEgoCustomText: string;
}

const EMPTY: FounderRulesData = {
  hoursPerWeek: "",
  fixedWorkBlocks: "",
  weeklyReviewSlot: "",
  minExperimentDuration: "",
  currency: "GBP",
  monthlyMaxSpend: "",
  toolingMaxSpend: "",
  testBudgetSplit: "",
  leadingMetrics: "",
  laggingMetrics: "",
  killCriteria: "",
  continueCriteria: "",
  escalationCriteria: "",
  redLineRules: ["", ""],
  dataOverEgoCommitment: false,
  dataOverEgoCustomText: "",
};

const STORAGE_KEY = "founder-rules-ch3";

function loadSheet(): FounderRulesData {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? { ...EMPTY, ...JSON.parse(raw) } : EMPTY;
  } catch {
    return EMPTY;
  }
}

function useFounderRules() {
  const [sheet, setSheet] = useState<FounderRulesData>(EMPTY);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setSheet(loadSheet());
  }, []);

  const update = useCallback((partial: Partial<FounderRulesData>) => {
    setSheet((prev) => {
      const next = { ...prev, ...partial };
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        try {
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {}
      }, 500);
      return next;
    });
  }, []);

  return { sheet, update };
}

/* ══════════════════════════════════════════════
   Shared UI primitives — matching existing design
   ══════════════════════════════════════════════ */

function InlineCard({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mt-10 rounded-[1.5rem] border border-[#e2e4ea] bg-white p-6 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#0053dc]">
        Your Founder Rules — {label}
      </p>
      <div className="mt-5 space-y-5">{children}</div>
    </div>
  );
}

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="block font-[Manrope] text-sm font-semibold text-[#003748]">
      {children}
    </label>
  );
}

function FieldHint({ children }: { children: ReactNode }) {
  return <p className="mt-0.5 text-xs leading-5 text-[#5d5f68]">{children}</p>;
}

function TextInput({
  id,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  id: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="mt-1.5 block w-full rounded-xl border border-[#e2e4ea] bg-[#fafbfc] px-4 py-2.5 text-sm text-[#003748] shadow-sm outline-none transition placeholder:text-[#b0b3be] focus:border-[#0053dc] focus:ring-1 focus:ring-[#0053dc]"
    />
  );
}

function TextArea({
  id,
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  id: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      id={id}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      className="mt-1.5 block w-full rounded-xl border border-[#e2e4ea] bg-[#fafbfc] px-4 py-2.5 text-sm text-[#003748] shadow-sm outline-none transition placeholder:text-[#b0b3be] focus:border-[#0053dc] focus:ring-1 focus:ring-[#0053dc]"
    />
  );
}

/* ══════════════════════════════════════════════
   STEP 1 — Time Rules (Sections A + C)
   ══════════════════════════════════════════════ */

export function Step1TimeRulesFields({ chapterSlug }: { chapterSlug?: string } = {}) {
  const { sheet, update } = useFounderRules();

  return (
    <InlineCard label="Time Budget">
      <div>
        <FieldLabel htmlFor="hoursPerWeek">Hours per week</FieldLabel>
        <FieldHint>How many total hours can you sustain every week for the next 8–12 weeks?</FieldHint>
        <TextInput
          id="hoursPerWeek"
          type="number"
          value={sheet.hoursPerWeek}
          placeholder="e.g. 10"
          onChange={(e) => update({ hoursPerWeek: e.target.value })}
        />
      </div>

      <div>
        <FieldLabel htmlFor="fixedWorkBlocks">Fixed work blocks</FieldLabel>
        <FieldHint>Which exact days and times are protected for execution?</FieldHint>
        <TextInput
          id="fixedWorkBlocks"
          value={sheet.fixedWorkBlocks}
          placeholder="e.g. Tue/Thu 7–9 PM, Sat 9 AM–1 PM"
          onChange={(e) => update({ fixedWorkBlocks: e.target.value })}
        />
      </div>

      <div>
        <FieldLabel htmlFor="weeklyReviewSlot">Weekly review slot</FieldLabel>
        <FieldHint>A fixed checkpoint to review experiments and decide next actions.</FieldHint>
        <TextInput
          id="weeklyReviewSlot"
          value={sheet.weeklyReviewSlot}
          placeholder="e.g. Sunday 6:00–6:45 PM"
          onChange={(e) => update({ weeklyReviewSlot: e.target.value })}
        />
      </div>

      <div>
        <FieldLabel htmlFor="minExperimentDuration">Minimum experiment duration</FieldLabel>
        <FieldHint>How long will you run a test before making a major decision?</FieldHint>
        <TextInput
          id="minExperimentDuration"
          value={sheet.minExperimentDuration}
          placeholder="e.g. 14 days"
          onChange={(e) => update({ minExperimentDuration: e.target.value })}
        />
      </div>
    </InlineCard>
  );
}

/* ══════════════════════════════════════════════
   STEP 2 — Money Rules (Section B)
   ══════════════════════════════════════════════ */

export function Step2MoneyRulesFields({ chapterSlug }: { chapterSlug?: string } = {}) {
  const { sheet, update } = useFounderRules();
  const sym = sheet.currency === "GBP" ? "£" : sheet.currency === "EUR" ? "€" : "$";

  return (
    <InlineCard label="Money Cap">
      <div>
        <FieldLabel htmlFor="currency">Currency</FieldLabel>
        <select
          id="currency"
          value={sheet.currency}
          onChange={(e) => update({ currency: e.target.value as FounderRulesData["currency"] })}
          className="mt-1.5 block w-full rounded-xl border border-[#e2e4ea] bg-[#fafbfc] px-4 py-2.5 text-sm text-[#003748] shadow-sm outline-none transition focus:border-[#0053dc] focus:ring-1 focus:ring-[#0053dc]"
        >
          <option value="GBP">£ GBP</option>
          <option value="USD">$ USD</option>
          <option value="EUR">€ EUR</option>
        </select>
      </div>

      <div>
        <FieldLabel htmlFor="monthlyMaxSpend">Monthly max spend ({sym})</FieldLabel>
        <FieldHint>The hard cap you will not exceed each month.</FieldHint>
        <TextInput
          id="monthlyMaxSpend"
          type="number"
          value={sheet.monthlyMaxSpend}
          placeholder="e.g. 300"
          onChange={(e) => update({ monthlyMaxSpend: e.target.value })}
        />
      </div>

      <div>
        <FieldLabel htmlFor="toolingMaxSpend">Tooling max spend ({sym}/month)</FieldLabel>
        <FieldHint>Maximum recurring software spend.</FieldHint>
        <TextInput
          id="toolingMaxSpend"
          type="number"
          value={sheet.toolingMaxSpend}
          placeholder="e.g. 75"
          onChange={(e) => update({ toolingMaxSpend: e.target.value })}
        />
      </div>

      <div>
        <FieldLabel htmlFor="testBudgetSplit">Test budget split</FieldLabel>
        <FieldHint>How much goes to experiments vs infrastructure?</FieldHint>
        <TextInput
          id="testBudgetSplit"
          value={sheet.testBudgetSplit}
          placeholder="e.g. 70% demand tests / 30% conversion tests"
          onChange={(e) => update({ testBudgetSplit: e.target.value })}
        />
      </div>
    </InlineCard>
  );
}

/* ══════════════════════════════════════════════
   STEP 3 — Decision Rules (Sections E/F/G)
   ══════════════════════════════════════════════ */

export function Step3DecisionRulesFields({ chapterSlug }: { chapterSlug?: string } = {}) {
  const { sheet, update } = useFounderRules();

  return (
    <InlineCard label="Kill / Continue / Escalation">
      <div>
        <FieldLabel htmlFor="killCriteria">Kill criteria — I will stop if…</FieldLabel>
        <FieldHint>What results mean this idea does not earn more time?</FieldHint>
        <TextArea
          id="killCriteria"
          value={sheet.killCriteria}
          placeholder="e.g. Conversion <1.8% after 2 major iterations; CPA >£30 for 2 consecutive weeks"
          onChange={(e) => update({ killCriteria: e.target.value })}
        />
      </div>

      <div>
        <FieldLabel htmlFor="continueCriteria">Continue criteria — I will keep going if…</FieldLabel>
        <FieldHint>What results mean the direction is positive but needs more time?</FieldHint>
        <TextArea
          id="continueCriteria"
          value={sheet.continueCriteria}
          placeholder="e.g. Conversion trending up ≥20% across cycles; CPA improving and under £25"
          onChange={(e) => update({ continueCriteria: e.target.value })}
        />
      </div>

      <div>
        <FieldLabel htmlFor="escalationCriteria">Escalation criteria — I will invest more when…</FieldLabel>
        <FieldHint>What objective thresholds justify scaling up?</FieldHint>
        <TextArea
          id="escalationCriteria"
          value={sheet.escalationCriteria}
          placeholder="e.g. Conversion ≥4% with stable traffic; CPA ≤£18 and early retention positive"
          onChange={(e) => update({ escalationCriteria: e.target.value })}
        />
      </div>
    </InlineCard>
  );
}

/* ══════════════════════════════════════════════
   STEP 4 — Data Over Ego (Sections I + D)
   ══════════════════════════════════════════════ */

export function Step4DataOverEgoFields({ chapterSlug }: { chapterSlug?: string } = {}) {
  const { sheet, update } = useFounderRules();

  return (
    <InlineCard label="Data-over-Ego Commitment & Metrics">
      <div className="flex items-start gap-3">
        <input
          id="dataOverEgoCommitment"
          type="checkbox"
          checked={sheet.dataOverEgoCommitment}
          onChange={(e) => update({ dataOverEgoCommitment: e.target.checked })}
          className="mt-0.5 h-5 w-5 rounded border-[#e2e4ea] text-[#0053dc] focus:ring-[#0053dc]"
        />
        <label htmlFor="dataOverEgoCommitment" className="text-sm leading-6 text-[#003748]">
          My personal interest in an idea is not sufficient reason to continue. I continue only when measurable signals support it.
        </label>
      </div>

      <div>
        <FieldLabel htmlFor="dataOverEgoCustomText">Or write your own version (optional)</FieldLabel>
        <TextInput
          id="dataOverEgoCustomText"
          value={sheet.dataOverEgoCustomText}
          placeholder="Your personal data-over-ego statement…"
          onChange={(e) => update({ dataOverEgoCustomText: e.target.value })}
        />
      </div>

      <div>
        <FieldLabel htmlFor="leadingMetrics">Leading metrics</FieldLabel>
        <FieldHint>Early signals you will track — the data that guides weekly decisions.</FieldHint>
        <TextInput
          id="leadingMetrics"
          value={sheet.leadingMetrics}
          placeholder="e.g. CTR ≥1.5%, landing page conversion ≥3%"
          onChange={(e) => update({ leadingMetrics: e.target.value })}
        />
      </div>

      <div>
        <FieldLabel htmlFor="laggingMetrics">Lagging metrics</FieldLabel>
        <FieldHint>Later results that confirm whether the business is working.</FieldHint>
        <TextInput
          id="laggingMetrics"
          value={sheet.laggingMetrics}
          placeholder="e.g. CPA ≤£18, repeat intent within 30 days"
          onChange={(e) => update({ laggingMetrics: e.target.value })}
        />
      </div>
    </InlineCard>
  );
}

/* ══════════════════════════════════════════════
   STEP 5 — Boring Can Be Profitable (Section H)
   ══════════════════════════════════════════════ */

export function Step5RedLineRulesFields({ chapterSlug }: { chapterSlug?: string } = {}) {
  const { sheet, update } = useFounderRules();

  const handleRule = (index: number, value: string) => {
    const next = [...sheet.redLineRules];
    next[index] = value;
    update({ redLineRules: next });
  };

  const addRule = () => {
    if (sheet.redLineRules.length < 4) {
      update({ redLineRules: [...sheet.redLineRules, ""] });
    }
  };

  return (
    <InlineCard label="Red-Line Rules (Non-Negotiables)">
      <FieldHint>
        These are boundaries you will not cross regardless of circumstances. Set 2–4 rules.
      </FieldHint>

      {sheet.redLineRules.map((rule, i) => (
        <div key={i}>
          <FieldLabel htmlFor={`redLine-${i}`}>Rule {i + 1}</FieldLabel>
          <TextInput
            id={`redLine-${i}`}
            value={rule}
            placeholder={
              i === 0
                ? 'e.g. "No new tools unless one existing tool is removed."'
                : i === 1
                  ? 'e.g. "No skipping weekly review."'
                  : "Another non-negotiable…"
            }
            onChange={(e) => handleRule(i, e.target.value)}
          />
        </div>
      ))}

      {sheet.redLineRules.length < 4 ? (
        <button
          type="button"
          onClick={addRule}
          className="text-sm font-semibold text-[#0053dc] transition hover:text-[#003da8]"
        >
          + Add another rule
        </button>
      ) : null}
    </InlineCard>
  );
}

/* ══════════════════════════════════════════════
   STEP 6 — Review Summary (all sections)
   ══════════════════════════════════════════════ */

export function Step6ReviewSummary({ chapterSlug = "set-your-founder-rules" }: { chapterSlug?: string } = {}) {
  const { sheet } = useFounderRules();
  const sym = sheet.currency === "GBP" ? "£" : sheet.currency === "EUR" ? "€" : "$";

  const allFields: { key: keyof FounderRulesData; skip?: boolean }[] = [
    { key: "hoursPerWeek" },
    { key: "fixedWorkBlocks" },
    { key: "weeklyReviewSlot" },
    { key: "minExperimentDuration" },
    { key: "monthlyMaxSpend" },
    { key: "toolingMaxSpend" },
    { key: "testBudgetSplit" },
    { key: "leadingMetrics" },
    { key: "laggingMetrics" },
    { key: "killCriteria" },
    { key: "continueCriteria" },
    { key: "escalationCriteria" },
    { key: "redLineRules" },
    { key: "dataOverEgoCommitment" },
  ];

  const filled = allFields.filter(({ key }) => {
    const v = sheet[key];
    if (typeof v === "string") return v.trim().length > 0;
    if (typeof v === "boolean") return v;
    if (Array.isArray(v)) return v.some((s) => s.trim().length > 0);
    return false;
  }).length;

  function Row({ label, value, stepId }: { label: string; value: string | boolean | null; stepId: string }) {
    const display =
      value === null || value === "" || value === false
        ? null
        : typeof value === "boolean"
          ? "✓ Committed"
          : String(value);

    return (
      <div className="flex items-baseline justify-between gap-4 border-b border-[#f0f1f4] py-2.5">
        <span className="text-sm font-medium text-[#5d5f68]">{label}</span>
        {display ? (
          <span className="text-right text-sm text-[#003748]">{display}</span>
        ) : (
          <a
            href={`/chapter/${chapterSlug}/steps?step=${stepId}`}
            className="text-right text-xs font-semibold text-[#0053dc] transition hover:text-[#003da8]"
          >
            Not yet set →
          </a>
        )}
      </div>
    );
  }

  function SectionLabel({ children }: { children: ReactNode }) {
    return (
      <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#5d5f68]">
        {children}
      </p>
    );
  }

  // Verified step IDs from chapter-3-steps.ts
  const STEP_IDS = {
    time: "chapter-3-step-1-why-founder-rules-matter",
    money: "chapter-3-step-2-real-constraints",
    decision: "chapter-3-step-3-rules-before-emotion",
    ego: "chapter-3-step-4-data-over-ego",
    boring: "chapter-3-step-5-boring-can-win",
  };

  return (
    <InlineCard label={`Review — ${filled}/${allFields.length} fields completed`}>
      <SectionLabel>A — Time Budget</SectionLabel>
      <Row label="Hours/week" value={sheet.hoursPerWeek} stepId={STEP_IDS.time} />
      <Row label="Work blocks" value={sheet.fixedWorkBlocks} stepId={STEP_IDS.time} />
      <Row label="Review slot" value={sheet.weeklyReviewSlot} stepId={STEP_IDS.time} />
      <Row label="Min experiment duration" value={sheet.minExperimentDuration} stepId={STEP_IDS.time} />

      <SectionLabel>B — Money Cap</SectionLabel>
      <Row label={`Monthly max (${sym})`} value={sheet.monthlyMaxSpend} stepId={STEP_IDS.money} />
      <Row label={`Tooling max (${sym}/mo)`} value={sheet.toolingMaxSpend} stepId={STEP_IDS.money} />
      <Row label="Test budget split" value={sheet.testBudgetSplit} stepId={STEP_IDS.money} />

      <SectionLabel>D — Success Metrics</SectionLabel>
      <Row label="Leading metrics" value={sheet.leadingMetrics} stepId={STEP_IDS.ego} />
      <Row label="Lagging metrics" value={sheet.laggingMetrics} stepId={STEP_IDS.ego} />

      <SectionLabel>E/F/G — Decision Rules</SectionLabel>
      <Row label="Kill criteria" value={sheet.killCriteria} stepId={STEP_IDS.decision} />
      <Row label="Continue criteria" value={sheet.continueCriteria} stepId={STEP_IDS.decision} />
      <Row label="Escalation criteria" value={sheet.escalationCriteria} stepId={STEP_IDS.decision} />

      <SectionLabel>H — Red-Line Rules</SectionLabel>
      {sheet.redLineRules.map((r, i) => (
        <Row key={i} label={`Rule ${i + 1}`} value={r} stepId={STEP_IDS.boring} />
      ))}

      <SectionLabel>I — Data-over-Ego</SectionLabel>
      <Row label="Commitment" value={sheet.dataOverEgoCommitment} stepId={STEP_IDS.ego} />
      <Row label="Custom statement" value={sheet.dataOverEgoCustomText} stepId={STEP_IDS.ego} />

      <div className="mt-6 flex flex-wrap gap-3">
        <a
          href={`/chapter/${chapterSlug}/worksheet`}
          className="inline-flex items-center rounded-full border border-[#0053dc] px-4 py-2 text-sm font-semibold text-[#0053dc] transition hover:bg-[#0053dc] hover:text-white"
        >
          Open full worksheet
        </a>
      </div>
    </InlineCard>
  );
}
