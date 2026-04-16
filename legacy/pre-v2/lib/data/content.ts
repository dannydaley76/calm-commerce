export type ChapterBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] };

export type Chapter = {
  id: number;
  title: string;
  worksheetId: string;
  blocks: ChapterBlock[];
};

export type ChapterSlide = {
  title: string;
  body: string;
  image?: {
    src: string;
    alt: string;
    caption?: string;
  };
};

export type WorksheetField = {
  id: string;
  label: string;
  type: "text" | "textarea";
  placeholder?: string;
};

export type Worksheet = {
  id: string;
  title: string;
  description: string;
  fields: WorksheetField[];
};

export const chapters: Chapter[] = [
  {
    id: 1,
    title: "Welcome: You Can Do This",
    worksheetId: "1",
    blocks: [
      { type: "paragraph", text: "An online store is simply a way for someone to find what you sell, pay you, and receive it." },
      { type: "paragraph", text: "You do not need to be highly technical to start. The goal is not perfection. The goal is proof." },
      {
        type: "list",
        items: [
          "Keep spending low until you have proof",
          "Start with one simple product",
          "Use templates and improve one step at a time",
        ],
      },
    ],
  },
  {
    id: 2,
    title: "Choose Your Low-Risk Model",
    worksheetId: "2",
    blocks: [
      { type: "paragraph", text: "You are not choosing a forever plan — just your safest starting point." },
      {
        type: "list",
        items: [
          "Marketplace first: easiest and fastest to test",
          "Store first: more control, slightly more work",
          "Hybrid: test on marketplace, then move to your own store",
        ],
      },
      { type: "paragraph", text: "If unsure, hybrid is usually the safest default." },
    ],
  },
  {
    id: 3,
    title: "Pick Your First Product",
    worksheetId: "3",
    blocks: [
      { type: "paragraph", text: "You are choosing a first test, not a forever product." },
      {
        type: "list",
        items: [
          "Easy to explain in one sentence",
          "Easy to pack and post",
          "Low return risk",
          "Simple to photograph",
        ],
      },
      { type: "paragraph", text: "Start with one product to reduce overwhelm and learn faster." },
    ],
  },
  {
    id: 4,
    title: "Simple Product Research",
    worksheetId: "4",
    blocks: [
      { type: "paragraph", text: "Research is about avoiding obvious mistakes before you spend money." },
      {
        type: "list",
        items: [
          "Demand: are people already buying this?",
          "Competition: can you stand out clearly?",
          "Pricing: is profit worth your time after costs?",
        ],
      },
      { type: "paragraph", text: "Use a Green/Amber/Red decision to keep choices calm and objective." },
    ],
  },
  {
    id: 5,
    title: "Test First, Spend Later",
    worksheetId: "5",
    blocks: [
      { type: "paragraph", text: "Avoid over-investing early. Test small, learn quickly, then scale." },
      {
        type: "list",
        items: [
          "Tiny batch test",
          "Marketplace-first test",
          "Honest pre-sell (only with clear delivery promises)",
        ],
      },
      { type: "paragraph", text: "Define stop rules in advance so decisions are rational, not emotional." },
    ],
  },
  {
    id: 6,
    title: "Simple Branding: Clarity Beats Creativity",
    worksheetId: "6",
    blocks: [
      { type: "paragraph", text: "At the start, branding is mostly clarity and trust." },
      {
        type: "list",
        items: [
          "Clear shop name",
          "One-line promise",
          "Consistent trust signals",
        ],
      },
      { type: "paragraph", text: "Keep it simple now; refine visuals later." },
    ],
  },
  {
    id: 7,
    title: "Setting Up Your Store (No Design Skills Needed)",
    worksheetId: "7",
    blocks: [
      { type: "paragraph", text: "You need a simple, trustworthy place for buyers to understand and purchase." },
      {
        type: "list",
        items: [
          "Show product clearly",
          "Answer delivery/returns/contact basics",
          "Use template and launch softly",
        ],
      },
      { type: "paragraph", text: "Clean and clear beats complex design." },
    ],
  },
  {
    id: 8,
    title: "Product Pages That Sell (Without Being Pushy)",
    worksheetId: "8",
    blocks: [
      { type: "paragraph", text: "Good product pages answer buyer questions clearly." },
      {
        type: "list",
        items: [
          "Clear 5-part structure",
          "Honest photos",
          "Trust-first copy",
        ],
      },
      { type: "paragraph", text: "Clarity builds confidence and conversion." },
    ],
  },
];

export const worksheets: Worksheet[] = [
  {
    id: "1",
    title: "Worksheet 1 — Calm Start Snapshot",
    description: "Set your realistic time, budget and 30-day success goal.",
    fields: [
      { id: "weekly_time", label: "I can commit this many hours per week", type: "text", placeholder: "e.g. 3-5" },
      { id: "test_budget", label: "My maximum test budget (£)", type: "text", placeholder: "e.g. 100" },
      { id: "goal_30_day", label: "My 30-day success goal", type: "textarea", placeholder: "e.g. First 1-3 sales" },
    ],
  },
  {
    id: "2",
    title: "Worksheet 2 — Choose Your Starting Model",
    description: "Choose marketplace, store, or hybrid and define why.",
    fields: [
      { id: "model_choice", label: "My starting model", type: "text", placeholder: "Marketplace / Store / Hybrid" },
      { id: "why", label: "Why this is right for me", type: "textarea" },
    ],
  },
  {
    id: "3",
    title: "Worksheet 3 — Choose Your First Product",
    description: "Pick one low-risk product to test.",
    fields: [
      { id: "product_choice", label: "Product to test first", type: "text" },
      { id: "one_line", label: "One sentence: this product helps people to...", type: "textarea" },
    ],
  },
  {
    id: "4",
    title: "Worksheet 4 — Demand, Competition, Pricing",
    description: "Capture what you found and decide Green/Amber/Red.",
    fields: [
      { id: "demand_notes", label: "Demand notes", type: "textarea" },
      { id: "pricing_summary", label: "Pricing summary", type: "textarea" },
      { id: "decision", label: "Decision", type: "text", placeholder: "Green / Amber / Red" },
    ],
  },
  {
    id: "5",
    title: "Worksheet 5 — Low-Risk Test Plan",
    description: "Set stop rules, test period, and weekly execution plan.",
    fields: [
      { id: "stop_rules", label: "My stop rules", type: "textarea" },
      { id: "test_length", label: "Test length (days)", type: "text" },
      { id: "success_marker", label: "Success marker", type: "text" },
    ],
  },
  {
    id: "6",
    title: "Worksheet 6 — Branding Clarity Check",
    description: "Define name, one-line promise, and trust signals.",
    fields: [
      { id: "shop_name", label: "Shop name shortlist", type: "textarea" },
      { id: "one_line_promise", label: "One-line promise", type: "textarea" },
      { id: "trust_signals", label: "Trust signals checklist", type: "textarea" }
    ],
  },
  {
    id: "7",
    title: "Worksheet 7 — Store Setup & Soft Launch",
    description: "Define minimum pages and run a soft-launch checklist.",
    fields: [
      { id: "minimum_pages", label: "My minimum pages", type: "textarea" },
      { id: "trust_checklist", label: "Trust checklist before launch", type: "textarea" },
      { id: "soft_launch_steps", label: "Soft launch steps", type: "textarea" }
    ],
  },
  {
    id: "8",
    title: "Worksheet 8 — Product Page Builder",
    description: "Write your page using the 5-part structure and photo list.",
    fields: [
      { id: "headline_benefit", label: "Headline benefit", type: "text" },
      { id: "five_part_structure", label: "5-part structure draft", type: "textarea" },
      { id: "photo_shot_list", label: "Photo shot list", type: "textarea" }
    ],
  },
];
