# Scanner, Research Workspace, And Calm OS Architecture

Last updated: 2026-05-07

## Purpose

The Chrome extension should become a top-of-funnel product research tool that feeds Calm Commerce OS.

The product ladder is:

1. **Scanner** — quick product-page signal check.
2. **Research Workspace** — saved product research, categories, notes, comparisons, and MCP/AI support.
3. **Calm Commerce OS** — structured validation, economics, testing, launch, canvas, metrics, and ongoing operations.

This document defines how those layers should connect without turning the extension into a duplicate OS.

## Tier Model

### Tier 1: Scanner

Commercial model:

- One-time payment, currently planned around USD 5.

Capabilities:

- Amazon and AliExpress page extraction.
- Rule/regex processing.
- Demand, competition, and opportunity signals.
- Basic economics preview.
- Lightweight local scan history.

Product question answered:

> Is this product worth a closer look?

Storage:

- Prefer local extension storage for V1.
- Keep saved data lightweight and exportable.

### Tier 2: Research Workspace

Commercial model:

- Subscription tier.
- Includes MCP/AI support.

Capabilities:

- Saved ideas.
- Categories and tags.
- Notes.
- Status buckets: inbox, watchlist, shortlisted, rejected.
- Comparison of multiple scanned ideas.
- AI/MCP-generated structured research summaries.
- Export or send to Calm Commerce.

Product question answered:

> Which ideas should I seriously consider?

Important boundary:

Tier 2 should organise research and help compare candidates. It should not become the full launch/operations OS. Avoid duplicating:

- Chapter workflow.
- Lean Canvas.
- Store readiness.
- Traffic plan.
- Metrics tracking.
- Operating dashboard.

### Tier 3: Calm Commerce OS

Commercial model:

- Full OS subscription or bundle.
- Extension access bundled for Calm OS users.

Capabilities:

- Guided 17-chapter programme.
- Durable product idea lifecycle.
- Unit economics.
- Marketplace test planning.
- Idea detail history.
- Lean Canvas.
- Metrics.
- Later AI/MCP guidance.

Product question answered:

> How do I turn one idea into a real, tested business?

## Research Workspace Data Model

The extension/subscription workspace should use a concept like:

```ts
type ResearchIdea = {
  id: string;
  title: string;
  sourcePlatform: "amazon" | "aliexpress" | "shopify" | "other";
  sourceUrl: string;
  imageUrl?: string;

  status: "inbox" | "watchlist" | "shortlisted" | "rejected";
  category?: string;
  tags: string[];

  demandScore?: number;
  competitionScore?: number;
  opportunityScore?: number;
  confidenceScore?: number;

  observedPrice?: string;
  estimatedProductCost?: string;
  estimatedShippingCost?: string;
  intendedSellingPrice?: string;
  marginPreview?: string;

  differentiationAngle?: string;
  demandEvidence?: string;
  competitionNotes?: string;
  riskFlags?: ResearchRiskFlag[];

  notes: ResearchNote[];
  scans: ResearchScanSnapshot[];

  createdAt: string;
  updatedAt: string;
};
```

```ts
type ResearchNote = {
  id: string;
  body: string;
  createdAt: string;
};
```

```ts
type ResearchScanSnapshot = {
  id: string;
  scannedAt: string;
  platform: string;
  url: string;
  title: string;
  priceSeen?: string;
  ratingSeen?: string;
  reviewsSeen?: string;
  ordersSeen?: string;
  bsrSeen?: string;
  extractedRaw?: Record<string, unknown>;
};
```

```ts
type ResearchRiskFlag = {
  key: "seasonality" | "shipping_complexity" | "low_confidence" | "saturation" | "thin_margin";
  label: string;
  note: string;
};
```

## Calm OS Intake Payload

When research moves into Calm Commerce, use a reviewed import payload rather than directly writing final worksheet answers.

```ts
type ScannerImportPayload = {
  source: "scanner" | "research_workspace";
  sourcePlatform: "amazon" | "aliexpress" | "shopify" | "other";
  sourceUrl: string;
  scannedAt: string;

  productTitle: string;
  productImageUrl?: string;

  observedPrice?: string;
  observedRating?: string;
  observedReviewCount?: number;
  observedOrderCount?: number;
  observedBsr?: string;
  variantCount?: number;

  demandScore?: number;
  competitionScore?: number;
  opportunityScore?: number;
  confidenceScore?: number;
  missingSignals?: string[];

  demandEvidence?: string;
  competitionNotes?: string;
  differentiationAngle?: string;
  seasonality?: string;

  estimatedProductCost?: string;
  estimatedShippingToCustomer?: string;
  estimatedSellingPrice?: string;
  platformFees?: string;
  variantComplexity?: string;
  upfrontCostRisk?: string;
  testSpeed?: string;
  numbersConfidence?: string;

  notes?: string;
};
```

## Calm OS Field Mapping

### Chapter 3 Ideas

Create or append one row in `product_ideas`:

| Import field | Calm field |
| --- | --- |
| `productTitle` | `idea_description` |
| `demandEvidence`, `demandScore`, observed review/order data | `demand_evidence` |
| `competitionNotes`, `competitionScore` | `competition_notes` |
| `seasonality` and seasonal risk flag | `seasonality` |

Recommended generated evidence format:

```txt
Scanner import from AliExpress on 7 May 2026.
Demand score: 72/100.
Observed: 1,240 orders, 4.6 rating, 318 reviews.
Source: https://...
Summary: ...
```

### Chapter 5 Unit Economics

Create a draft row in `idea_economics` linked by `idea_id`, when cost or price signals exist:

| Import field | Calm field |
| --- | --- |
| generated idea ID | `idea_id` |
| `productTitle` | `idea_name` |
| `estimatedProductCost` | `product_cost` |
| `estimatedShippingToCustomer` | `shipping_to_customer` |
| `platformFees` | `platform_fees` |
| `estimatedSellingPrice` or `observedPrice` | `selling_price` |
| `variantComplexity` | `variant_complexity` |
| `upfrontCostRisk` | `upfront_cost_risk` |
| `testSpeed` | `test_speed` |
| `numbersConfidence` | `numbers_confidence` |

Do not set `viable` automatically. The learner should decide after reviewing the economics in Calm OS.

### Idea Notes

If the import includes notes, add a `product_idea_notes` row:

```ts
{
  note_id: "note_xxxxx",
  idea_id: "idea_xxxxx",
  created_at: "2026-05-07",
  note: "Imported from scanner. Differentiation angle: ..."
}
```

## Import UX

Do not write directly from URL params into worksheet responses.

Use a review-first flow:

1. Extension opens Calm OS import route.
2. User signs in if needed.
3. Import review page shows:
   - Product title.
   - Source platform and URL.
   - Demand and competition evidence.
   - Economics draft.
   - Missing or low-confidence fields.
4. User edits before saving.
5. User clicks "Add to Ideas".
6. OS writes to worksheet-backed fields.
7. User lands on the new idea detail page.

Recommended route:

```txt
/ideas/import
```

Possible first transport:

```txt
/ideas/import?payload=<base64url-json>
```

For larger payloads or paid workspace users, move to an authenticated API later.

## OS Implementation Plan

### Phase 1: Documentation And Schema

- Keep this document as the source of truth.
- Add a TypeScript schema/helper for `ScannerImportPayload`.
- Add parser and validation for base64url payloads.
- Add mapping helpers:
  - payload to `product_ideas` row.
  - payload to optional `idea_economics` row.
  - payload to optional `product_idea_notes` row.

### Phase 2: Import Review Page

Route:

```txt
src/app/ideas/import/page.tsx
```

Client component:

```txt
src/app/ideas/import/import-idea-client.tsx
```

Responsibilities:

- Read payload from URL.
- Validate payload.
- Render review/edit UI.
- Explain missing confidence.
- Save only after explicit user action.

### Phase 3: Save Action

Use existing worksheet response storage first:

- `product_ideas` under `ideas-worksheet`.
- `idea_economics` under `unit-economics-worksheet`.
- `product_idea_notes` under `ideas-worksheet`.

Reuse the durable idea ID strategy already used by the idea lifecycle.

### Phase 4: Timeline And Source Evidence

After first import works:

- Add an "Imported from scanner" timeline event.
- Show source URL and scan date on idea detail.
- Add a "Research source" section to idea detail.

This may require adding source metadata to the existing worksheet-backed row or introducing a lightweight source field.

## Upgrade Moments

For Research Workspace users, Calm OS upgrade prompts should appear when:

- They have saved 3+ ideas.
- They move an idea to shortlisted.
- They compare multiple products.
- They try to send to Calm OS.
- They ask "what should I do next?"

Suggested copy:

> You have promising product research. Calm Commerce turns this shortlist into a validation plan, economics check, marketplace test, Lean Canvas, and metrics history.

## Principles

- Research imports are drafts, not truth.
- The learner confirms before data enters Calm OS.
- Scores help prioritise attention; they do not decide for the user.
- Preserve source evidence so future decisions are auditable.
- Keep Tier 2 useful, but do not duplicate the full OS.
- Make the upgrade path feel natural, not forced.
