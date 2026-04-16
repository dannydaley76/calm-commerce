// Re-export the JSON as a TypeScript constant
// This is used by InlineWorksheetFields components to pull content instead of hardcoding

export const CHAPTER3_INLINE_FIELDS_CONTENT = {
  step1: {
    cardLabel: "Time Budget",
    fields: [
      {
        key: "hoursPerWeek",
        label: "Hours per week",
        hint: "How many total hours can you sustain every week for the next 8–12 weeks?",
        placeholder: "e.g. 10",
        type: "number" as const,
      },
      {
        key: "fixedWorkBlocks",
        label: "Fixed work blocks",
        hint: "Which exact days and times are protected for execution?",
        placeholder: "e.g. Tue/Thu 7–9 PM, Sat 9 AM–1 PM",
        type: "text" as const,
      },
      {
        key: "weeklyReviewSlot",
        label: "Weekly review slot",
        hint: "A fixed checkpoint to review experiments and decide next actions.",
        placeholder: "e.g. Sunday 6:00–6:45 PM",
        type: "text" as const,
      },
      {
        key: "minExperimentDuration",
        label: "Minimum experiment duration",
        hint: "How long will you run a test before making a major decision?",
        placeholder: "e.g. 14 days",
        type: "text" as const,
      },
    ],
  },
  step2: {
    cardLabel: "Money Cap",
    fields: [
      {
        key: "currency",
        label: "Currency",
        type: "select" as const,
        options: [
          { value: "GBP", label: "£ GBP" },
          { value: "USD", label: "$ USD" },
          { value: "EUR", label: "€ EUR" },
        ],
      },
      {
        key: "monthlyMaxSpend",
        label: "Monthly max spend",
        hint: "The hard cap you will not exceed each month.",
        placeholder: "e.g. 300",
        type: "number" as const,
      },
      {
        key: "toolingMaxSpend",
        label: "Tooling max spend",
        hint: "Maximum recurring software spend.",
        placeholder: "e.g. 75",
        type: "number" as const,
      },
      {
        key: "testBudgetSplit",
        label: "Test budget split",
        hint: "How much goes to experiments vs infrastructure?",
        placeholder: "e.g. 70% demand tests / 30% conversion tests",
        type: "text" as const,
      },
    ],
  },
  step3: {
    cardLabel: "Kill / Continue / Escalation",
    fields: [
      {
        key: "killCriteria",
        label: "Kill criteria — I will stop if…",
        hint: "What results mean this idea does not earn more time?",
        placeholder:
          "e.g. Conversion <1.8% after 2 major iterations; CPA >£30 for 2 consecutive weeks",
        type: "textarea" as const,
      },
      {
        key: "continueCriteria",
        label: "Continue criteria — I will keep going if…",
        hint: "What results mean the direction is positive but needs more time?",
        placeholder:
          "e.g. Conversion trending up ≥20% across cycles; CPA improving and under £25",
        type: "textarea" as const,
      },
      {
        key: "escalationCriteria",
        label: "Escalation criteria — I will invest more when…",
        hint: "What objective thresholds justify scaling up?",
        placeholder:
          "e.g. Conversion ≥4% with stable traffic; CPA ≤£18 and early retention positive",
        type: "textarea" as const,
      },
    ],
  },
  step4: {
    cardLabel: "Data-over-Ego Commitment & Metrics",
    fields: [
      {
        key: "dataOverEgoCommitment",
        type: "checkbox" as const,
        label:
          "My personal interest in an idea is not sufficient reason to continue. I continue only when measurable signals support it.",
      },
      {
        key: "dataOverEgoCustomText",
        label: "Or write your own version (optional)",
        placeholder: "Your personal data-over-ego statement…",
        type: "text" as const,
      },
      {
        key: "leadingMetrics",
        label: "Leading metrics",
        hint: "Early signals you will track — the data that guides weekly decisions.",
        placeholder: "e.g. CTR ≥1.5%, landing page conversion ≥3%",
        type: "text" as const,
      },
      {
        key: "laggingMetrics",
        label: "Lagging metrics",
        hint: "Later results that confirm whether the business is working.",
        placeholder: "e.g. CPA ≤£18, repeat intent within 30 days",
        type: "text" as const,
      },
    ],
  },
  step5: {
    cardLabel: "Red-Line Rules (Non-Negotiables)",
    hint: "These are boundaries you will not cross regardless of circumstances. Set 2–4 rules.",
    defaultRuleCount: 2,
    maxRuleCount: 4,
    rulePlaceholders: [
      'e.g. "No new tools unless one existing tool is removed."',
      'e.g. "No skipping weekly review."',
      "Another non-negotiable…",
      "Another non-negotiable…",
    ],
    addButtonLabel: "+ Add another rule",
  },
  step6: {
    cardLabel: "Review",
    sections: [
      {
        id: "A",
        title: "Time Budget",
        rows: [
          {
            label: "Hours/week",
            key: "hoursPerWeek",
            stepId: "chapter-3-step-1-why-founder-rules-matter",
          },
          {
            label: "Work blocks",
            key: "fixedWorkBlocks",
            stepId: "chapter-3-step-1-why-founder-rules-matter",
          },
          {
            label: "Review slot",
            key: "weeklyReviewSlot",
            stepId: "chapter-3-step-1-why-founder-rules-matter",
          },
          {
            label: "Min experiment duration",
            key: "minExperimentDuration",
            stepId: "chapter-3-step-1-why-founder-rules-matter",
          },
        ],
      },
      {
        id: "B",
        title: "Money Cap",
        rows: [
          {
            label: "Monthly max",
            key: "monthlyMaxSpend",
            stepId: "chapter-3-step-2-real-constraints",
          },
          {
            label: "Tooling max",
            key: "toolingMaxSpend",
            stepId: "chapter-3-step-2-real-constraints",
          },
          {
            label: "Test budget split",
            key: "testBudgetSplit",
            stepId: "chapter-3-step-2-real-constraints",
          },
        ],
      },
      {
        id: "D",
        title: "Success Metrics",
        rows: [
          {
            label: "Leading metrics",
            key: "leadingMetrics",
            stepId: "chapter-3-step-4-data-over-ego",
          },
          {
            label: "Lagging metrics",
            key: "laggingMetrics",
            stepId: "chapter-3-step-4-data-over-ego",
          },
        ],
      },
      {
        id: "E/F/G",
        title: "Decision Rules",
        rows: [
          {
            label: "Kill criteria",
            key: "killCriteria",
            stepId: "chapter-3-step-3-rules-before-emotion",
          },
          {
            label: "Continue criteria",
            key: "continueCriteria",
            stepId: "chapter-3-step-3-rules-before-emotion",
          },
          {
            label: "Escalation criteria",
            key: "escalationCriteria",
            stepId: "chapter-3-step-3-rules-before-emotion",
          },
        ],
      },
      {
        id: "H",
        title: "Red-Line Rules",
        dynamicRows: "redLineRules" as const,
        stepId: "chapter-3-step-5-boring-can-win",
      },
      {
        id: "I",
        title: "Data-over-Ego",
        rows: [
          {
            label: "Commitment",
            key: "dataOverEgoCommitment",
            stepId: "chapter-3-step-4-data-over-ego",
          },
          {
            label: "Custom statement",
            key: "dataOverEgoCustomText",
            stepId: "chapter-3-step-4-data-over-ego",
          },
        ],
      },
    ],
    ctaLabel: "Open full worksheet",
    ctaPath: "/chapter/{{chapterSlug}}/worksheet",
  },
} as const;
