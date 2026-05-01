# Product Idea Lifecycle Architecture

Last updated: 2026-05-01

## Purpose

Calm Commerce OS should treat product ideas as durable candidates, not temporary worksheet rows.

The first architecture step is stable identity:

- Chapter 3 creates product idea rows.
- Each row receives an internal `idea_id`.
- Chapter 5 economics rows store the same `idea_id`.
- The Chapter 5 chosen idea field stores the selected `idea_id`.
- The Chapter 6 marketplace test stores the tested `idea_id`.
- UI still shows the readable idea description.

This lets later chapters attach tests, offer decisions, store decisions, and metrics to the same candidate over time.

## Current Slice

Implemented as a lightweight compatibility layer on top of existing worksheet JSON storage.

Storage still uses `worksheet_responses`:

- `product_ideas`: JSON array of Chapter 3 idea rows.
- `idea_economics`: JSON array of Chapter 5 economics rows.
- `chosen_idea`: selected idea ID for new saves. Legacy saved labels are still accepted.
- `test_idea`: Chapter 6 marketplace test idea ID.

Rows use:

```ts
{
  idea_id: "idea_xxxxx",
  idea_description: "Insulated bottle for trail runners",
  demand_evidence: "...",
  competition_notes: "...",
  seasonality: "Year-round"
}
```

Chapter 5 economics rows use:

```ts
{
  idea_id: "idea_xxxxx",
  idea_name: "Insulated bottle for trail runners",
  product_cost: "8",
  shipping_to_customer: "3",
  platform_fees: "10%",
  selling_price: "24",
  viable: "Yes: proceed"
}
```

## Compatibility

Existing saved rows may not have `idea_id`.

The compatibility layer:

- Keeps existing IDs when present.
- Generates deterministic fallback IDs for legacy rows from their content and position.
- Saves durable IDs the next time the Chapter 3 row is edited.
- Matches `chosen_idea` by ID first, then by legacy label.

This avoids a database migration for the first durable-idea pass.

## Lifecycle Status Layer

The dashboard now derives a compact lifecycle state for each idea from worksheet responses.

Inputs:

- `product_ideas`
- `idea_economics`
- `chosen_idea`
- `test_idea`
- `result`
- `decision`

Statuses:

- draft
- economics checked
- selected
- test planned
- test running
- test reviewed
- proceed
- retest
- pivot

This is intentionally derived rather than stored. The stored source of truth remains the worksheet answers; the lifecycle helper interprets those answers into a product-candidate view.

## Known Limits

The fallback ID for legacy rows is only fully stable once it has been saved into the row. Before that, changing the idea text or reordering legacy rows can change the generated fallback.

That is acceptable for the first slice, but the next stronger version should either:

- backfill IDs with a server-side migration, or
- add a dedicated `product_ideas` table.

## Next Steps

1. Add an idea history view now that Chapters 5 and 6 are both ID-linked.
2. Add timeline events when the user selects, tests, proceeds, retests, or pivots an idea.
3. Consider a dedicated table once the lifecycle needs multiple tests per idea, richer timeline events, or product-level metrics.
