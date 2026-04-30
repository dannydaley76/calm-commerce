# Calm Commerce OS — Agent Handover Brief

*Last updated: 2026-04-30*

---

## 1. Project Scope

### Vision and Goals

Calm Commerce OS is a structured e-commerce learning platform aimed at first-time online sellers. The product teaches founders to build a product business methodically — validating ideas before spending money, testing on marketplaces before building a store, and measuring decisions against evidence rather than gut feel.

The platform is built around a **17-chapter programme** called *Calm Commerce*, structured across seven phases:

| Phase | Label | Chapters |
|-------|-------|----------|
| 1 | Get Started | 1–2 |
| 2 | Set Your Rules and Test | 3–6 |
| 3 | Build Your Offer | 7–9 |
| 4 | Get Your Store Ready | 10 |
| 5 | Get Customers | 11–13 |
| 6 | Measure, Learn, Grow | 14–15 |
| 7 | Ongoing Operations | 16–17 |

Each chapter contains:
- **Steps** — paginated teaching content (headings, paragraphs, bullets, callouts, images)
- **A worksheet** — structured questions the learner answers as they go
- **Inline worksheet fields** — a newer pattern where worksheet questions appear *inside* the relevant step, not just at the end of the chapter

The learner builds a **Lean Canvas** as a living artefact across the programme — their business model evolves step-by-step and is always visible on a dedicated canvas page.

### Problem

A conventional "read then answer" structure forces learners to context-switch: they absorb teaching, move on, then return to answer questions when the context has faded. The inline worksheet feature solves this by surfacing the relevant question at the moment the teaching is complete.

### Solution

Worksheet fields are mapped to specific steps via an `inlineWorksheetFieldKeys` array on each step definition. A shared `InlineWorksheetCard` component renders those fields inline beneath the step content, with full save/persistence via Supabase. The full-chapter worksheet at the end remains for completion, but inline fields reduce the friction of capture.

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.1.6 (App Router) |
| UI | React 19, TypeScript 5 |
| Styling | Tailwind CSS v4 with `@config` loading a v3-compat `tailwind.config.ts` |
| Database / Auth | Supabase (Postgres + SSR auth via `@supabase/ssr`) |
| Payments | Stripe v20 |
| Testing | Vitest 4, Testing Library, Happy DOM, axe-core |
| E2E | Playwright |
| Deployment | Vercel (inferred from scaffold) |

**Tailwind v4 note — important:** The project uses `@config "../../tailwind.config.ts"` in `globals.css` to load a v3-compatible config. `@theme inline` blocks do NOT generate utility classes — only CSS variables. All custom colour utilities (e.g. `bg-cobalt-600`) must be defined in `tailwind.config.ts` under `extend.colors`, not in `@theme` blocks. Do not move colour definitions into `@theme inline`.

**CSS token system:** The design uses a `--ink-*`, `--cobalt-*`, `--surface-*`, `--error-*` variable system. Component-level tokens use a `--cc-*` namespace (canvas cards). These are defined in `src/app/globals.css`.

---

## 3. Where to Find Files

### Repository

Local path: `/Users/admin/.openclaw/workspace/digital-product-app`  
Branch: `main`  
Git managed via: openclaw (commits staged externally; Claude provides commit messages)

### Key Directories

```
src/
├── app/
│   ├── (v2)/
│   │   ├── chapter/[slug]/
│   │   │   ├── page.tsx              # Chapter landing page
│   │   │   ├── step-shell.tsx        # Step reader shell (nav, progress, container)
│   │   │   ├── steps/page.tsx        # Step content page — renders blocks + inline worksheet
│   │   │   └── worksheet/
│   │   │       └── worksheet-client.tsx  # Full-chapter worksheet UI
│   │   ├── metrics/
│   │   │   ├── metrics-client.tsx    # Full metrics UI (charts + history tables)
│   │   │   └── MetricsLineChart.tsx  # Pure SVG line chart with dual axis + hover tooltip
│   │   └── program/page.tsx          # Programme overview page
│   ├── lean-canvas/page.tsx          # Lean Canvas page (server component)
│   ├── page.tsx                      # Dashboard
│   ├── account/page.tsx              # Account & billing
│   └── globals.css                   # All design tokens + component CSS
│
├── components/
│   ├── ActionMenu.tsx                # Reusable 3-dot context menu
│   ├── lean-canvas/
│   │   ├── CanvasCard.tsx            # Card primitive (all canvas sections)
│   │   ├── CanvasTabs.tsx            # Operating / Business Model tab switcher
│   │   ├── BusinessModelCard.tsx     # Business model section card (skip/unskip)
│   │   ├── InlineEditCard.tsx        # Inline edit form for Operating tab fields
│   │   ├── CompletionGlyph.tsx       # SVG status icon (empty/partial/complete)
│   │   ├── FillBadge.tsx             # "X of Y fields filled" badge
│   │   ├── write-worksheet-field.ts  # Server action: upsert a single worksheet field
│   │   ├── get-section-state.ts      # Derive CanvasSectionState from raw data
│   │   ├── types.ts                  # CanvasSectionState, SectionStatus types
│   │   └── __tests__/               # Vitest unit + axe a11y tests
│   └── v2/
│       ├── content-block-renderer.tsx   # Renders ContentBlock union type to JSX
│       └── inline-worksheet-card.tsx    # Inline worksheet field renderer (used in steps)
│
└── lib/
    └── v2/
        ├── content/
        │   └── calm-commerce.ts      # ALL chapter content (steps, blocks, inlineWorksheetFieldKeys)
        ├── types/
        │   └── domain.ts             # All shared TypeScript types
        ├── worksheets/
        │   ├── registry.ts           # WORKSHEET_REGISTRY: maps worksheetId → WorksheetModel
        │   └── *.json                # 14 worksheet definition files
        ├── steps/
        │   ├── chapter-1-steps.ts    # Legacy step format (older chapters)
        │   ├── chapter-3-steps.ts
        │   └── chapter-4-steps.ts
        └── schema/
            ├── calm-commerce-v1.ts   # Phase labels, progress policy, step config
            └── index.ts
```

### Supabase Tables (key ones)

| Table | Purpose |
|-------|---------|
| `worksheet_responses` | Single-field upsert storage — `(project_id, worksheet_id, field_key)` unique |
| `weekly_metrics` | Recurring metrics entries (marketplace and own store) |
| `chapter_progress` | Per-chapter progress state per project |
| `project_resume_state` | Last visited location for resume-on-login |
| `projects` | Learner's project/business context |

### Metrics persistence — `weekly_metrics` only

Metrics entries are stored exclusively in `weekly_metrics`. There is no Chapter 14 worksheet JSON and no dual-write to `worksheet_responses`. Chapter 14 teaches the weekly review *ritual*; the Metrics page is where learners *perform* that ritual. The two are intentionally decoupled — Chapter 14 worksheet completion is tracked via the standard inline fields path, same as every other chapter.

The `POST /api/v2/weekly-metrics` route accepts optional `chapterId` and `chapterSlug` fields for updating `chapter_progress`, but `metrics-client.tsx` does not currently send them and should not start doing so without a deliberate decision (see Chapter 17 progress note in the work queue above).

---

## 4. Current Status

### What is complete and working

- **17-chapter content structure** — all chapters defined in `calm-commerce.ts` with steps, blocks, and `inlineWorksheetFieldKeys` fully mapped across all chapters
- **Step reader** — paginated teaching UI with sequential navigation, progress tracking, chapter/step breadcrumbs
- **14 worksheet JSON definitions** — all fields, types, groups, conditions, and completion rules defined
- **`InlineWorksheetCard` component** — renders inline fields within steps; handles cross-worksheet data loading (e.g. Chapter 5 reads ideas from Chapter 3)
- **Full-chapter worksheet UI** (`worksheet-client.tsx`) — complete form with field groups, linked groups, single-select, textarea, number fields, and recurring mode
- **Lean Canvas page** — full 12-column weighted grid, two tabs (Operating/Business Model), per-section cards with status, completion glyphs, inline edit and delete for Operating fields
- **`ActionMenu` component** — reusable 3-dot context menu used across canvas fields and metrics history tables
- **Metrics page** — dual SVG line charts (marketplace phase + own store phase), editable history tables for both with ActionMenu (edit inline, delete with confirm, view notes)
- **Dashboard, Programme page, Account page** — all styled and functional with the design token system
- **Design system** — complete token set (`ink`, `cobalt`, `surface`, `error`, button variants, shadow utilities, canvas card CSS)
- **102 passing unit tests** — canvas card, tabs, completion glyph, section state, axe a11y
- **Zero TypeScript errors** — `tsc --noEmit` clean

### What is partially complete (the current work queue)

#### 1. Worksheet link management

`worksheet-client.tsx` and some chapter definitions still contain a link to the full worksheet at the end of the step reader. Now that inline fields are in place across all chapters, this end-of-chapter prompt is redundant and should be changed to a "review your answers" link rather than a call to action to fill in the worksheet for the first time.

#### 2. Chapter 17 progress — completion trigger not yet wired

The schema defines Chapter 17's completion policy as `chapter17Completion: "dashboard_view"` in `src/lib/v2/schema/calm-commerce-v1.ts`. The intent is that Chapter 17 is marked complete when the learner views the Metrics page, not when they log a metric entry. This trigger is currently unimplemented — `src/app/(v2)/metrics/page.tsx` does not write to `chapter_progress` on load. This is the one outstanding item for Chapter 17.

Do not wire chapter progress to metric logging (POST entries). The `dashboard_view` policy is deliberate — the completion event is passive (viewing), not active (submitting).

#### 3. Testing inline fields end-to-end

Thorough testing is needed across all chapters:
- Fields save correctly per chapter/worksheet
- Chapter 5's cross-worksheet dropdown (reading ideas from Chapter 3) shows correct options and handles the empty state gracefully
- Worksheet completion percentage updates correctly when inline fields are used instead of the full worksheet form

---

## 5. Architecture Patterns to Understand

### Content block system

All step content is typed via `ContentBlock` (see `src/lib/v2/types/domain.ts`). The union covers: `heading`, `paragraph`, `bullets`, `numbered`, `table`, `quote`, `callout`, `image`, `loop`, `tooltip`. The `ContentBlockRenderer` component maps each type to its JSX. **Do not add raw JSX to step definitions** — add a new `ContentBlock` type if needed.

### Inline worksheet field wiring

The path from config to render is:
1. `calm-commerce.ts` step → `inlineWorksheetFieldKeys: ["field_key"]`
2. `steps/page.tsx` reads `currentStep.inlineWorksheetFieldKeys` and passes it to `<InlineWorksheetCard>`
3. `InlineWorksheetCard` receives `worksheetId`, `fieldKeys`, `worksheetDefinition`, and `chapterId`
4. It filters the worksheet definition to just those fields and renders them
5. Saves use the existing `worksheet_responses` upsert path: `(project_id, worksheet_id, field_key)`

### Lean Canvas field routing

Canvas fields come from multiple worksheets. The `FIELD_WORKSHEET_MAP` constant in `src/app/lean-canvas/page.tsx` maps every field key to its `worksheetId`. When `CanvasCard` saves or deletes a subfield, it calls `writeWorksheetField(key, value, worksheetId)` where `worksheetId` comes from this map. If you add new canvas sections, extend this map.

### `write-worksheet-field.ts`

This is a thin server action at `src/components/lean-canvas/write-worksheet-field.ts`. It does a Supabase upsert on `(project_id, worksheet_id, field_key)`. It returns `{ ok: true }` or `{ ok: false, error: string }`. Used by both `CanvasCard` (canvas edits) and `InlineWorksheetCard` (step inline fields).

### Stretched-link card pattern

Cards are fully clickable via an `absolute inset-0 z-0` anchor/button. Interactive elements inside the card (ActionMenu, inline edit inputs) sit at `z-20` so they receive clicks without triggering the card navigation. Do not put interactive elements inside cards at `z-0` or below.

### Optimistic updates

`CanvasCard` uses `localOverrides: Record<string, string | null>` to reflect saves and deletes immediately before the page re-fetches. If adding new editable fields to canvas cards, follow this pattern rather than forcing a full server re-render.

---

## 6. Conventions and Gotchas

- **`useEffect` not `useLayoutEffect`** — the codebase uses `useEffect` for DOM measurements (e.g. overflow detection in `CanvasCard`). `useLayoutEffect` causes test environment crashes.
- **`--break-system-packages`** — always use this flag with `pip install` in this environment.
- **Tailwind utility classes** — custom colours only work because of `tailwind.config.ts`. If a colour class appears to have no effect, check it is defined there under `extend.colors`.
- **Canvas grid breakpoints** — the `.canvas-grid` in `globals.css` uses explicit `@media` blocks for each breakpoint (xl 12-col, lg 6-col, md 2-col, sm 1-col). The default (no media query) is 1 column. Do not use Tailwind responsive classes for the canvas grid — it is managed entirely in CSS.
- **Git workflow** — commits are staged and pushed via openclaw. Claude provides commit messages; do not assume `git push` will work directly from the shell.
- **TypeScript must stay clean** — run `npx tsc --noEmit` before considering any feature complete. The current baseline is zero errors.
- **Tests must stay green** — run `npx vitest run` before committing. Current baseline: 102 tests passing across 5 test files.
