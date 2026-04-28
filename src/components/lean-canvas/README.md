# `components/lean-canvas`

Shared primitives for the `/lean-canvas` page. Both the **Operating rules** tab and the **Business model** tab render from the same state model and component set, with a few specialized client-side helpers for inline editing, skip state, and hero-level tab awareness.

---

## The state model

A single canvas section is described by **`CanvasSectionState`**:

```ts
interface CanvasSectionState {
  status: 'empty' | 'partial' | 'complete';
  filledCount: number;
  totalCount: number;
  editHref: string;
  sourceLabel: string;
}
```

Derive one from existing page data via **`getSectionState`**:

```ts
import { getSectionState } from '@/components/lean-canvas';

const state = getSectionState({
  filledCount: section.filledCount,
  totalCount: section.fields.length,
  editHref: deepLink.href,
  sourceLabel: section.chapterLabel,
});
```

`getSectionState` is pure. It does not read from storage, the database, or worksheet APIs.

---

## Status values

| Status | Glyph | Meaning |
|:--|:--:|:--|
| `empty` | ○ | No field in the section has a value yet. |
| `partial` | ◐ | Some fields have values, but the section is not complete. |
| `complete` | ● | Every field in the section has a value. |

Edge cases handled by `getSectionState`:
- `totalCount === 0` → `complete`
- `filledCount >= totalCount` → `complete`
- `filledCount <= 0` → `empty`

---

## Core primitives

### `<CompletionGlyph state />`

Renders the single-character status indicator.

Current colour mapping:
- `empty` → `ink-300`
- `partial` → `amber-500`
- `complete` → `success-600`

Use `decorative` when adjacent text already communicates status.

### `<CanvasCard />`

The shared section card primitive used for both tabs.

Key behavior:
- always uses `bg-surface-raised`
- state is communicated by lozenge, glyph, and complete accent stripe
- renders as either:
  - `<a>` for navigation, or
  - `<button>` when `onClick` is supplied

Props include:
- `title`
- `description`
- `state`
- `actionLabel`
- `children`
- `subFields`
- `className`
- `onClick`

### `<CanvasTabs />` + `<CanvasTabPanel />`

Accessible tab navigation for switching between Operating and Business layers.

Behavior:
- updates `?tab=` using `window.history.replaceState`
- avoids full navigation and scroll reset
- supports ArrowLeft, ArrowRight, Home, and End keyboard controls

### `<FillBadge />`

Small completion-count pill used primarily in tab buttons.

Example:

```tsx
<FillBadge filled={5} total={8} className="bg-cobalt-100 text-cobalt-700" />
```

### `<SourceChip />`

Displays the source chapter label for a section.

Example:
- `Chapter 7: Pick Your Customer`
- rendered as `📘 Chapter 7 · Pick Your Customer`

---

## Specialized client components

### `<InlineEditCard />`

Used for short scalar operating fields that can be edited in place.

Current use cases:
- Time budget
- Money cap
- Experiment duration

Behavior:
- view mode delegates to `CanvasCard`
- edit mode shows input + Save / Cancel
- Enter saves
- Escape cancels
- persistence uses `writeWorksheetField()`

### `<BusinessModelCard />`

Wrapper around `CanvasCard` for business-model sections with skip/unskip affordances.

States:
- empty
- skipped
- partial
- complete

Skip state is stored via `CanvasPreferences`.

### `<CanvasHeroOperatingAction />`

Hero-level action button that only appears when the Operating tab is active.

It listens for the custom tab-change event fired by `CanvasTabs`.

---

## Supporting utilities

### `CanvasPreferences.ts`

Preference store abstraction for per-user canvas UI state that is not yet persisted in the worksheet backend.

Current implementation:
- localStorage-backed skip state

### `tab-events.ts`

Tiny DOM event pub/sub used to keep tab-adjacent UI in sync without shared React context.

### `write-worksheet-field.ts`

Thin wrapper around the existing learner-state API write path.

Used by `InlineEditCard` so components do not scatter raw `fetch()` calls.

---

## File map

```text
components/lean-canvas/
├── BusinessModelCard.tsx
├── CanvasCard.tsx
├── CanvasHeroOperatingAction.tsx
├── CanvasPreferences.ts
├── CanvasTabs.tsx
├── CompletionGlyph.tsx
├── FillBadge.tsx
├── InlineEditCard.tsx
├── README.md
├── SourceChip.tsx
├── get-section-state.ts
├── index.ts
├── tab-events.ts
├── types.ts
├── write-worksheet-field.ts
└── __tests__/
```
