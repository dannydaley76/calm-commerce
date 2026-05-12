# Future Product Ideas

Last updated: 2026-05-06

This file holds useful ideas that are not the current focus. The current near-term focus is multi-idea metrics and a projected-versus-actual economics bridge.

## Product Idea Lifecycle

### Scanner And Research Workspace Import

Calm Commerce should connect to the Chrome extension/research product ladder:

- Tier 1: one-time paid scanner for Amazon and AliExpress product pages.
- Tier 2: subscription research workspace with saved ideas, categories, notes, comparison, and MCP/AI research support.
- Tier 3: Calm Commerce OS users get the extension bundled and can send research into the OS.

The strategic ladder is:

```txt
Scanner -> Research Workspace -> Calm Commerce OS
```

The OS should receive scanned/researched products through a review-first import flow, not direct silent writes:

1. Extension or research workspace opens `/ideas/import` with a structured payload.
2. OS shows a review/edit screen.
3. User confirms "Add to Ideas".
4. OS creates a durable Chapter 3 idea row and optional Chapter 5 draft economics row.
5. User lands on the new idea detail page.

See `docs/scanner-research-os-architecture.md` for payload shape, field mapping, and implementation phases.

### Scanner Title Normalisation

Imported scanner titles can be long marketplace descriptions rather than usable product names. Add an MCP/API endpoint that accepts the raw title, page metadata, source URL, and optional image context, then returns:

- A short product name for cards and tables.
- A fuller cleaned description for evidence/detail pages.
- Important attributes worth preserving, such as pack size, material, variant, or use case.
- Confidence plus the original raw title for auditability.

The OS should keep the raw marketplace title, but display the short name by default. The import review screen should let the user accept or edit the suggested name before saving.

### Idea Pipeline

Treat each Chapter 3 product idea as a durable candidate that can move through the whole Calm Commerce OS.

Lifecycle:

- Draft idea.
- Demand evidence captured.
- Economics checked.
- Selected for marketplace test.
- Test running.
- Test reviewed.
- Offer/store candidate.
- Live product.
- Iterated, paused, retired, or replaced.

Why this matters:

- Turns the product from a course into an operating system.
- Lets the learner add more ideas later and run the same viability loop again.
- Preserves the story of why an idea was chosen, changed, paused, or rejected.
- Makes later metrics more meaningful because numbers connect back to the original idea and test history.

### Stable Idea Identity

Current linked worksheet rows are useful, but the long-term model needs stable IDs for ideas.

Needed:

- Add stable IDs to Chapter 3 idea rows.
- Store Chapter 5 economics against idea IDs, not only row position.
- Store the chosen idea as an idea ID.
- Carry the selected idea into Chapter 6 and later chapters.
- Preserve history if the user edits, reorders, deletes, or adds ideas.

This should be handled before the idea flow becomes too complex. Row-index matching is acceptable for a prototype, but it will become fragile once users revisit Chapter 3 and run multiple testing cycles.

### Idea History View

Add a place where the learner can inspect the full journey of an idea.

Possible first version:

- Idea name and current status.
- Demand evidence from Chapter 3.
- Economics result from Chapter 5.
- Marketplace test from Chapter 6.
- Offer, store, listing, and acquisition decisions from later chapters.
- Metrics tied to the product once live.
- Decision log: continue, improve, pause, retire, or revisit.

### Research Score History

The current scanner import stores the latest product score snapshot directly on the idea row so the Ideas index can show a sortable score quickly. A richer future version should preserve multiple research snapshots per idea instead of overwriting or flattening the scan.

Useful future shape:

- Multiple scans per idea, including AliExpress supplier pages, Amazon competitor pages, Shopify stores, and generic product pages.
- Score, verdict, confidence, demand score, competition score, price signal, trend signal, missing signals, and risk flags for each scan.
- Source URL, source label, product image, scanned date, and notes for auditability.
- A comparison view showing whether the idea is getting stronger, weaker, or simply better understood over time.
- A way to mark one scan as the current reference supplier or current reference competitor.
- A "rescan" action on saved products so the user can refresh price, image, reviews, demand, competition, trend, and risk evidence without creating a duplicate idea.

This should eventually move into a dedicated research snapshot structure or table. The Ideas index can continue to show the latest/current score, while the idea detail page shows the evidence trail behind that score.

Possible UI locations:

- Dedicated Ideas page.
- Dashboard module.
- Lean Canvas side panel.
- Product detail page linked from worksheets and metrics.

### Scout Workspace Economics Visibility

Scout captures useful economics inputs in the extension popup, but the Workspace index and product detail page do not yet make those inputs visible enough.

Future UI review:

- Show projected margin on the Scout Workspace table when selling price, product cost, shipping, and platform fees are available.
- Add a compact "has notes" indicator to the table so saved research context is visible without opening every product.
- Review the product detail page hierarchy so imported economics, notes, and risk evidence are easy to find, not buried below less important panels.
- Keep the table scannable for dozens of products by using compact columns, filters, and progressive disclosure rather than turning every row into a full report.

### Testing Cycle UX

Make it obvious that going back to Chapter 3 is part of the system, not a backward step.

UX ideas:

- "Add another idea" from Chapter 5 when no candidate is viable.
- "Run this idea through the numbers" from Chapter 3.
- "Test next candidate" after a failed marketplace test.
- "Retire this idea" with a short reason.
- "Duplicate and adjust" for a related idea or narrower version.

The learner should feel that each cycle makes the business smarter, even when an individual idea does not continue.

### Later Chapter Idea Attachment

Current implementation makes ideas durable through the early validation loop:

- Chapter 3 ideas.
- Chapter 5 economics.
- Chapter 6 marketplace test.
- Linked metrics.
- Idea detail notes and timeline.

Later chapters are still mostly project-level rather than idea-level. Customer profile, offer, pricing, listing, store setup, free traffic, paid ads, email, iteration, and growth strategy effectively describe the current business context.

Future question:

- Should Chapters 7-13 attach their worksheet outputs to the active `idea_id`?
- Should the user explicitly select which idea/product later offer and marketing decisions belong to?
- Should one live store be allowed to contain multiple product ideas?

Possible first step:

- Keep one active idea as the default.
- Show the active idea name on later chapter worksheets.
- Add a lightweight "change active idea" control only when users have more than one viable candidate.

Defer until the early loop feels stable.

### Multi-Idea Metrics

Users may test more than one idea at the same time. Metrics should support that without muddying the history.

Near-term direction:

- Keep each metrics entry tied to one `product_idea_id`.
- If testing two ideas in the same week, the learner logs two entries: one per idea.
- Metrics forms should make this explicit: "Testing more than one idea? Add one entry per idea."
- Metrics history should show the idea label on each row.
- Idea detail pages should show only metrics linked to that idea.

Why this is preferable now:

- Keeps timelines clean.
- Avoids complicated multi-product metric rows.
- Fits the existing `weekly_metrics.data_json.product_idea_id` model.
- Makes comparison possible later.

Longer-term possibility:

- Add `metric_entries` and `metric_entry_items` tables.
- Support one reporting period with multiple product rows.
- Compare product-level conversion, margin, CPA, and trend over time.
- Group metrics by marketplace, listing, product, or store channel.

Do not introduce that table structure until we know users genuinely need multi-product reporting.

### Projected Versus Actual Economics

The product needs a clearer bridge between planned economics, real metrics, and the Lean Canvas.

Current pieces:

- Chapter 5 captures projected economics: selling price, costs, fees, margin signal, and viability.
- Metrics captures actual numbers: impressions, clicks, orders, profit per sale, revenue, traffic, ad spend, and notes.
- Lean Canvas shows business model assumptions.

Useful first version:

- Add a "Projected vs actual" panel on the idea detail page.
- Compare projected margin from Chapter 5 with actual profit per sale from metrics.
- Compare intended selling price with actual revenue per order where possible.
- Show whether actual performance is above, close to, or below the viability signal.
- Link the panel back to the relevant Lean Canvas economics section.

Lean Canvas bridge:

- Show projected economics from worksheet data.
- Show actual economics from linked metrics.
- Add a confidence label such as "Projected", "Tested", or "Live data".
- Make it obvious when the canvas is based on assumptions versus observed performance.

This should be derived from existing worksheet and metrics data first. Avoid new storage unless the model becomes too complex.

### Idea-Level Comparison

Once multiple ideas can have metrics, the learner will need a simple comparison view.

Possible locations:

- Ideas page summary table.
- Metrics page grouped by idea.
- Dashboard next action module.

Useful comparisons:

- Status.
- Projected margin.
- Actual profit per sale.
- Test orders.
- Marketplace clicks.
- Latest decision.
- Next action.

Keep this plain and decision-led. The goal is not analytics for its own sake; it is helping the learner decide which candidate deserves attention.

### Dedicated Product Data Model

The current worksheet-backed compatibility layer is useful, but there is a natural ceiling.

Consider dedicated tables when we need:

- Multiple tests per idea.
- Multiple listings per idea.
- Multiple products live in one store.
- Rich notes with edit/delete/categories.
- Product-level metrics and reporting.
- Clean audit history independent of worksheet JSON.

Possible future tables:

- `product_ideas`
- `product_idea_economics`
- `product_idea_tests`
- `product_idea_notes`
- `metric_entries`
- `metric_entry_items`

This is a later architecture step. The current approach is still appropriate while the product shape is settling.

## AI And MCP Ideas

### AI Metrics Coach

Give the learner a "What should I do this week?" button on the Metrics page.

Inputs:

- Weekly metrics history.
- Current Lean Canvas.
- Founder Rules.
- Current phase.

Output:

- Likely bottleneck.
- One recommended action.
- Why that action matters.
- Related chapter to revisit.

Notes:

- This is probably the strongest first AI feature.
- Keep it short and action-led.
- Save recommendation history later.

### Chapter Tutor

Add contextual help inside each chapter:

- Explain this another way.
- Show me an example.
- How does this apply to my business?

Notes:

- Use chapter content plus worksheet/canvas context.
- Avoid generic chatbot behaviour.
- Good candidate for a paid AI add-on after the core programme is stronger.

### Brainstorming Assistant

Help users generate and critique product ideas in Chapter 3.

Possible modes:

- Generate ideas from interests, budget, and sourcing model.
- Critique ideas against demand evidence.
- Suggest review-mining searches.
- Turn vague ideas into specific testable ideas.

Notes:

- Should not replace the learner's evidence gathering.
- Should push users toward marketplace validation, not fantasy product lists.

### Listing Reviewer

Review product titles, descriptions, objections, and photo plans.

Best placed in:

- Chapter 9.
- Product listing worksheet.

Output:

- Clarity score.
- Missing objections.
- Suggested stronger title.
- Suggested photo list.

## Product Experience Ideas

### Dashboard Next Best Action

Show the learner what to do next when they land on the dashboard.

Potential rules:

- Resume current chapter step.
- Finish incomplete worksheet fields.
- Review Lean Canvas gaps.
- Log metrics if store is live.
- Return to Chapter 3 if no product ideas exist.

### Export Options

Add exports for:

- Lean Canvas PDF or markdown.
- Worksheet answers.
- Weekly metrics CSV.

Why:

- Increases perceived value.
- Gives users confidence that their work is portable.
- Useful for coaching, accountability, and founder records.

### Progress Payoff Moments

Add understated milestone moments:

- First shortlisted idea added.
- Unit economics completed.
- First marketplace test planned.
- Store readiness complete.
- First metrics entry logged.
- Lean Canvas reaches 50% and 100%.

Tone:

- Calm and practical.
- Avoid childish celebration.

### Full Worksheet Link Review

Now that inline worksheet fields are present, full worksheet links should feel like review/edit links rather than "go complete this from scratch" prompts.

Possible copy:

- Review your answers.
- Edit full worksheet.
- Review this chapter's decisions.

## Content Ideas After Chapter 5

### Chapter 3: Stronger Product Discovery

Add:

- More idea-generation prompts.
- Strong versus weak idea examples.
- Fake demand warnings.
- Review-mining walkthrough.
- Marketplace evidence checklist.

### Chapter 14 And 17: Metrics Diagnosis

Add rule-based guidance for:

- Traffic up, sales flat.
- Traffic low, conversion healthy.
- CPA above margin.
- Conversion below 1%.
- Revenue up but profit weak.
- Email list not growing.

This will later feed the AI Metrics Coach.

### Chapter 9: Listing Examples

Add:

- Before/after title examples.
- Description structure.
- Objection handling examples.
- Photo checklist.

### Chapter 11 And 12: Customer Acquisition Playbooks

Add:

- Free traffic channel-specific playbooks.
- Paid ads test setup examples.
- When not to run ads.
- Budget guardrails.

## Commercial Ideas For Later

### Pricing

Current hypothesis:

- Founding beta: GBP 49-79 for 6 months.
- Main subscription: GBP 12-19/month.
- Annual: GBP 99-149/year.
- Future AI add-on: GBP 9-15/month.
- Core plus AI bundle: GBP 19-29/month.

Decision:

- Do not prioritise pricing page until the content and Chapter 5 review flow feel strong.

### AI Usage Controls

Before paid AI:

- Track token usage per user.
- Use small models for tutoring and brainstorming.
- Use stronger models only for complex diagnostics.
- Add monthly message limits.
- Keep write tools user-confirmed.
