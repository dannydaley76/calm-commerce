# Chapter 5 Idea Review Execution Plan

Last updated: 2026-04-30

## Goal

Turn Chapter 5 from a place where learners record unit economics into a place where the product helps them identify the strongest idea to test first.

The recommendation should be transparent, conservative, and beginner-friendly. It should not say "this is the best business idea". It should say things like:

- Strongest first test.
- Good margin, low complexity.
- Promising but risky.
- Needs better numbers.
- Margin too thin.

## Current Worksheet State

Worksheet: `src/lib/v2/worksheets/unit-economics-worksheet.json`

Current structured group: `idea_economics`

Existing fields:

- `idea_name`
- `product_cost`
- `shipping_to_customer`
- `platform_fees`
- `selling_price`
- calculated margin per unit from the raw price, cost, shipping, and fee inputs
- `variant_complexity`
- `viable`

Current final selection fields:

- `chosen_idea`
- `reason_for_choice`

Current gap:

The worksheet can compare broad economics, but it cannot yet reliably compare first-test quality. It needs a little more structure around risk, confidence, and speed.

## Proposed Worksheet Input Improvements

Add these fields inside the `idea_economics` field group:

### `upfront_cost_risk`

Type: `single-select`

Purpose: captures how much money is at risk before the first sale.

Options:

- Low: can test without buying much stock
- Medium: small sample or small stock order needed
- High: meaningful stock order needed
- Unknown: need supplier numbers

### `test_speed`

Type: `single-select`

Purpose: captures how quickly the learner can get a fair test live.

Options:

- Fast: can list this week
- Medium: needs sample, prep, or supplier confirmation
- Slow: needs production, customisation, or more setup
- Unknown

### `numbers_confidence`

Type: `single-select`

Purpose: distinguishes real supplier/platform numbers from guesses.

Options:

- High: based on real quotes and known fees
- Medium: based on close estimates
- Low: mostly guesses
- Unknown: missing key costs

### Optional later field: `notes_or_risks`

Type: `textarea`

Purpose: lets learners capture context the score cannot know.

This can wait unless the UI feels too thin without it.

## Scoring Model

Create a pure helper that accepts parsed `idea_economics` rows and returns a review object per idea.

Suggested file:

`src/lib/v2/worksheets/review-unit-economics.ts`

Suggested output shape:

```ts
type IdeaReview = {
  ideaName: string;
  label:
    | "Strongest first test"
    | "Promising but risky"
    | "Needs better numbers"
    | "Margin too thin"
    | "Operationally complex";
  score: number;
  strengths: string[];
  cautions: string[];
  nextStep: string;
};
```

Scoring dimensions:

- Margin strength.
- Variant complexity.
- Upfront cost risk.
- Test speed.
- Numbers confidence.
- Current learner decision (`viable`).

Avoid making the score feel too precise. The score is only a sorting aid. The written label and cautions matter more.

## Suggested Rules

### Margin

- Strong: margin is at least 40% of selling price.
- Workable: margin is 25-40%.
- Thin: margin is 10-25%.
- Weak: margin is below 10%, negative, or missing.

If margin cannot be calculated because values are missing, label the idea as needing better numbers. Do not ask the learner to calculate margin manually.

### Complexity

- `1 SKU: simple`: positive.
- `2-5 SKUs: manageable`: neutral.
- `6-15 SKUs: complex`: caution.
- `16+ SKUs: very complex`: strong caution.

### Upfront risk

- Low: positive.
- Medium: neutral.
- High: caution.
- Unknown: caution and request supplier numbers.

### Test speed

- Fast: positive.
- Medium: neutral.
- Slow: caution.
- Unknown: caution.

### Confidence

- High: positive.
- Medium: neutral.
- Low or unknown: caution.

## UI Placement

### First pass

Show a review panel under the Chapter 5 inline worksheet card after `idea_economics`.

Panel content:

- Recommended first test.
- Per-idea status rows.
- Short explanation of why the recommendation was made.
- Reminder that the learner still chooses the final idea.

### Full worksheet page

Show the same review panel on `/chapter/know-your-numbers/worksheet`, below the `idea_economics` group and above `chosen_idea`.

### Lean Canvas

Later, surface the chosen idea's review in the Product Economics / Cost Structure section. This should wait until the scoring helper is stable.

## Implementation Steps

1. Update `unit-economics-worksheet.json` with the new first-test quality fields.
2. Confirm `InlineWorksheetCard` and `GenericWorksheetClient` render the new field-group fields without changes.
3. Create the pure scoring helper in `src/lib/v2/worksheets/review-unit-economics.ts`.
4. Add unit tests for the helper:
   - strong low-risk idea wins over higher-margin complex idea
   - missing costs returns "Needs better numbers"
   - thin margin returns "Margin too thin"
   - high SKU complexity returns a caution
   - unknown upfront risk or confidence lowers recommendation
5. Build a small `UnitEconomicsReviewPanel` component.
6. Wire the panel into inline worksheet rendering for Chapter 5.
7. Wire the panel into the full worksheet page.
8. Run `npm run typecheck` and `npm run test`.
9. Manually review Chapter 5 step 4 in the browser.

## Acceptance Criteria

- Learners can enter numbers for up to three shortlisted ideas.
- The product highlights the strongest first test using visible reasoning.
- The recommendation never hides missing data.
- The UI nudges learners away from high-risk, high-complexity ideas even if the margin looks attractive.
- `chosen_idea` remains the learner's decision.
- Existing worksheet persistence still works.
- TypeScript and tests pass.

## Open Questions

- Should margin be calculated automatically from fields, or should the learner still calculate it manually first?
- Should `platform_fees` accept mixed values like `10% Etsy` in the first pass, or should we add a more structured fee input later?
- Should the recommendation panel appear before or after the learner selects `chosen_idea`?
- Should the panel update the `reason_for_choice` field with a suggested draft, or would that feel too automated?
