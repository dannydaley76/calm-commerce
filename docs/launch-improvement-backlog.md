# Calm Commerce OS Launch Improvement Backlog

Last updated: 2026-04-30

This backlog turns the launch review into a practical working list. The goal is to make Calm Commerce OS feel worth paying for as a guided operating system, not just a short course.

## Recommended Launch Positioning

Calm Commerce OS should be sold as a guided system for first-time e-commerce founders who want to validate a product business without wasting money on the wrong product, store, or ads.

Primary promise:

> Build your first product business methodically: choose an idea, test demand, run the numbers, launch carefully, and know what to do next.

Initial pricing hypothesis:

- Founding beta: GBP 49-79 for 6 months access.
- Main self-serve subscription: GBP 12-19/month.
- Annual plan: GBP 99-149/year.
- Future AI bundle: GBP 19-29/month.
- Future AI add-on: GBP 9-15/month.

Do not lead with "course access" as the core value. Lead with the operating system: programme, worksheets, Lean Canvas, metrics, and eventually AI guidance.


## Current Focus: Content First

Decision: before pricing, charging, or AI packaging work, improve the chapter content so the core programme is strong enough to stand on its own.

Why this comes first:

- A better paid offer starts with a better learner outcome.
- The AI assistant will be more useful if the underlying content, examples, and decision frameworks are sharper.
- Stronger chapters create better worksheet answers, which improves the Lean Canvas, Metrics guidance, and future AI context.
- Pricing decisions become easier once the product clearly delivers more than short lessons.

Content expansion principle:

Keep the main lesson path calm and digestible. Add depth through worked examples, decision tables, checklists, diagnosis trees, and optional deeper-dive blocks rather than turning every chapter into a long essay.

## Chapter Expansion Sprint Plan

Work through the content in this order:

1. Chapter 5: Know Your Numbers Before You Commit.
2. Chapter 6: Test Before You Build a Store.
3. Chapter 3: Brainstorm With Discipline.
4. Chapter 14: Read Your Numbers.
5. Chapter 17: Your Operating Dashboard.
6. Chapter 9: Write Listings That Sell.
7. Chapter 12: Paid Ads.
8. Chapter 11: Free Traffic.

Rationale:

- Chapters 3, 5, and 6 determine whether the learner chooses a sensible product and avoids wasting money.
- Chapters 14 and 17 turn the product from a course into an operating tool.
- Chapters 9, 11, and 12 improve execution once the offer is clearer.

For each chapter expansion, complete this checklist:

- Add at least one worked example.
- Add at least one practical checklist, table, or decision rule.
- Add beginner-friendly failure cases: what weak execution looks like and how to fix it.
- Confirm inline worksheet fields still appear at the right moment.
- Confirm the chapter still feels readable in one sitting.
- Run typecheck after editing content.

## Phase 0: Pre-Launch Essentials

### P0.1 Replace Placeholder Upgrade Messaging

Priority: P0

Current issue: The upgrade page still refers to an "MVP billing model" and "recurring access billed every 6 months". This feels internal and unfinished.

Improve:

- Write customer-facing pricing copy.
- Show what paid access unlocks.
- Add a founding/beta price.
- Explain whether access is monthly, annual, or 6-month.
- Add simple refund or guarantee language if desired.

Acceptance criteria:

- Upgrade page has a clear price and offer.
- No internal language such as "MVP billing model".
- Buyer understands exactly what they get.

### P0.2 Define The Paid Offer

Priority: P0

Current issue: The product can be interpreted as either a course, a dashboard, or a worksheet app. The paid promise needs to be explicit.

Improve:

- Define the paid plan name.
- Define what is free/preview versus paid.
- Define the launch price and renewal terms.
- Add 3-5 outcome bullets.

Suggested paid offer:

- 17-chapter Calm Commerce programme.
- Inline worksheets and saved answers.
- Living Lean Canvas.
- Weekly Metrics dashboard.
- Store-readiness and testing checklists.
- Future updates during the paid access period.

Acceptance criteria:

- Pricing page, account page, and access lock copy use the same offer language.
- Entitlement model matches the copy.

### P0.3 Add A Demo Journey Or Preview Screens

Priority: P0

Current issue: Users need to see that this is more than written content before paying.

Improve:

- Add a short preview of the programme flow.
- Show Lean Canvas and Metrics screenshots or live preview cards.
- Include a "what you will have by the end" section.

Acceptance criteria:

- A prospective buyer can understand the product in under 60 seconds.
- The page shows the tool outputs, not only the curriculum.

### P0.4 Validate Chapter 17 Dashboard Completion

Priority: P0

Current issue: Chapter 17 completion is defined as dashboard view. This has now been wired on the metrics page and should be verified against real Supabase data.

Improve:

- Confirm visiting `/metrics` while authenticated marks Chapter 17 complete.
- Confirm it does not create worksheet responses.
- Confirm metric logging still only writes to `weekly_metrics`.

Acceptance criteria:

- Chapter 17 appears completed after viewing Metrics.
- No dual-write to `worksheet_responses`.

## Phase 1: Make Existing Content Worth Paying For

### P1.1 Add Worked Examples To High-Value Chapters

Priority: P0

Current issue: The content is intentionally digestible, but several chapters are too short to justify paid access unless the examples and tools carry more value.

Improve these chapters first:

- Chapter 3: Brainstorm With Discipline.
- Chapter 5: Know Your Numbers Before You Commit.
- Chapter 6: Test Before You Build a Store.
- Chapter 9: Write Listings That Sell.
- Chapter 11: Free Traffic.
- Chapter 12: Paid Ads.
- Chapter 14: Read Your Numbers.
- Chapter 17: Your Operating Dashboard.

Acceptance criteria:

- Each target chapter has at least one concrete worked example.
- Examples are specific enough that a beginner can copy the method.
- Examples remain concise and do not bloat the main reading path.

### P1.2 Expand Chapter 3: Idea Generation And Validation

Priority: P0

Add:

- 5-7 idea-generation prompts by category.
- Examples of weak versus stronger product ideas.
- How to spot fake demand.
- Review-mining walkthrough.
- Marketplace evidence checklist.
- A shortlist scoring pattern.

Acceptance criteria:

- User can generate and shortlist at least 5 candidate product ideas.
- Worksheet output gives Chapter 5 enough material to evaluate.

### P1.3 Expand Chapter 5: Unit Economics

Priority: P0

Add:

- Multiple worked margin examples.
- Marketplace fee examples.
- Shipping scenarios: free, charged, flat-rate.
- Profit-per-sale threshold guidance.
- Red flags for products that cannot support ads.
- "Reject, revise, or proceed" decision examples.

Acceptance criteria:

- User can calculate real margin after product cost, fees, shipping, packaging, and returns allowance.
- User can explain why an idea passes or fails.

### P1.4 Expand Chapter 6: Marketplace Test Design

Priority: P0

Add:

- What a fair marketplace test looks like.
- Minimum listing quality checklist.
- How long to run the test.
- What to do with views, clicks, questions, saves, carts, and sales.
- Examples of "sold", "interest but no sale", "views but no engagement", and "few views".

Acceptance criteria:

- User knows how to interpret inconclusive tests.
- User has clear decision rules before building a store.

### P1.5 Expand Chapter 9: Listings That Sell

Priority: P1

Add:

- Title formula.
- Description formula.
- Before/after listing examples.
- Image checklist.
- Objection handling examples.
- Marketplace SEO basics.

Acceptance criteria:

- User can produce a competent first product listing.
- The chapter gives enough structure for future AI listing review.

### P1.6 Expand Chapter 11: Free Traffic Playbooks

Priority: P1

Add channel-specific starter playbooks:

- TikTok/Reels short-form content.
- Instagram product/community posting.
- Pinterest visual search.
- Reddit/forums/community participation.
- Basic SEO/content route.
- Local or niche community route.

Acceptance criteria:

- User can choose 1-2 channels and create a realistic first-week action plan.
- Advice avoids vague "post consistently" guidance.

### P1.7 Expand Chapter 12: Paid Ads Risk Controls

Priority: P1

Add:

- When not to run ads.
- Tiny-budget test setup.
- Creative testing basics.
- Audience testing basics.
- CPA versus margin worked examples.
- Stop/continue/escalate examples.

Acceptance criteria:

- User understands how to avoid wasting money.
- User can interpret CTR, CPC, conversion rate, CPA, and margin relationship.

### P1.8 Add Metrics Diagnosis Trees

Priority: P0

Current issue: Metrics are useful, but the product should tell users what the numbers mean.

Add rule-based guidance for:

- Traffic up, revenue flat.
- Traffic low, conversion normal.
- Conversion below 1%.
- CPA above margin.
- Revenue up, profit weak.
- Orders up, refunds up.
- Email list not growing.

Acceptance criteria:

- Metrics page includes "What this probably means" and "What to try next".
- Guidance can later become the basis for AI coaching.

## Phase 2: Product Experience Improvements

### P2.1 Add Next Best Action On Dashboard

Priority: P0

Current issue: Users may not know what to do next after logging in.

Improve:

- Show the next chapter/step.
- Show incomplete worksheet fields.
- Show missing Lean Canvas sections.
- Show metrics review prompt if relevant.

Acceptance criteria:

- Dashboard answers "what should I do next?" without requiring AI.

### P2.2 Improve End-Of-Chapter Worksheet Links

Priority: P1

Current issue: Now that inline fields exist across all chapters, end-of-chapter worksheet prompts should become review links rather than first-time calls to fill the worksheet.

Improve:

- Change language from "complete the worksheet" to "review your answers".
- Keep full worksheet pages available for review and editing.
- Avoid making users feel they must duplicate work.

Acceptance criteria:

- No redundant "go fill this in now" messaging after inline capture.

### P2.3 Add Export Options

Priority: P1

Improve:

- Export Lean Canvas as PDF or markdown.
- Export worksheet answers.
- Export weekly metrics CSV.

Acceptance criteria:

- User can take their work out of the platform.
- Export reinforces the value of the saved artefacts.

### P2.4 Add Progress Payoff Moments

Priority: P1

Improve:

- Show Lean Canvas completion percentage.
- Show phase completion.
- Celebrate meaningful milestones without feeling childish.
- Examples: "Your first test plan is ready", "Your store readiness checklist is complete".

Acceptance criteria:

- Progress feels tangible and tied to useful business artefacts.

## Phase 3: AI And MCP Assistant

### P3.1 Define AI Assistant Scope

Priority: P0 before building AI

Do not build a generic chatbot. Define specific jobs:

- Explain a chapter concept another way.
- Brainstorm product ideas.
- Critique product ideas against Calm Commerce criteria.
- Review unit economics.
- Review a listing draft.
- Interpret metrics.
- Suggest next best action.
- Improve Lean Canvas sections.

Acceptance criteria:

- Assistant has named modes or entry points.
- Each mode has clear inputs, outputs, and limits.

### P3.2 Create MCP Tool Contract

Priority: P1

Useful tools:

- Read current chapter/step.
- Read worksheet responses.
- Read Lean Canvas state.
- Read weekly metrics.
- Calculate unit economics.
- Generate weekly action plan.
- Suggest field updates.
- Write worksheet field only after explicit user confirmation.

Acceptance criteria:

- Tools are narrow and auditable.
- Read-only tools exist before write tools.
- Writes require confirmation.

### P3.3 AI Metrics Coach

Priority: P1

First AI feature to build because it is most differentiated.

Features:

- Explain current metric trends.
- Identify likely bottleneck.
- Recommend one action for next week.
- Connect recommendation to relevant chapter.
- Save recommendation history.

Acceptance criteria:

- User can click "What should I do this week?" on Metrics.
- Response uses their actual metrics and business context.
- Response is short, specific, and action-oriented.

### P3.4 AI Chapter Tutor

Priority: P2

Features:

- "Explain this another way".
- "Show me an example".
- "How does this apply to my business?"

Acceptance criteria:

- Tutor uses current chapter content and user's worksheet/canvas context.
- Tutor does not hallucinate platform-specific instructions without caveats.

### P3.5 AI Pricing And Usage Controls

Priority: P0 before paid AI

Recommended AI pricing:

- Add-on: GBP 9-15/month.
- Core plus AI bundle: GBP 19-29/month.
- Higher tier later: GBP 39/month if it includes richer diagnostics and saved plans.

Usage controls:

- Monthly message quota.
- Per-request context budget.
- Prefer short retrieved context over full-course context.
- Use cheaper model for tutoring/brainstorming.
- Reserve stronger model for diagnostics and complex synthesis.
- Log token usage per user.

Acceptance criteria:

- AI cost per subscriber is measurable.
- Product cannot be accidentally bankrupted by heavy users.

## Phase 4: Launch And Learning Loop

### P4.1 Run A Paid Beta

Priority: P0

Suggested launch:

- 20-50 founding users.
- GBP 49-79 for 6 months.
- Ask for feedback at key points: after Chapter 3, Chapter 6, Chapter 10, and first Metrics use.

Acceptance criteria:

- At least 5 user interviews or detailed feedback responses.
- Identify top 5 points of confusion.
- Capture testimonials from successful users.

### P4.2 Add Feedback Prompts

Priority: P1

Improve:

- Add "Was this clear?" or "What are you stuck on?" at chapter ends.
- Capture qualitative feedback tied to chapter/step.

Acceptance criteria:

- Feedback is stored or delivered somewhere reviewable.
- Feedback can be linked to content improvements.

### P4.3 Track Activation Metrics

Priority: P1

Track:

- Account created.
- Chapter 3 completed.
- First product ideas entered.
- Unit economics completed.
- Marketplace test plan completed.
- Lean Canvas reaches 50%.
- First metrics entry logged.
- Chapter 17 viewed.

Acceptance criteria:

- You can tell where users drop off.
- Product decisions are based on usage, not guesswork.

## Suggested Build Order

1. Expand Chapter 5 with deeper unit economics examples and decision rules.
2. Expand Chapter 6 with marketplace test design and result interpretation.
3. Expand Chapter 3 with stronger idea-generation and validation examples.
4. Expand Chapters 14 and 17 with metrics diagnosis guidance.
5. Expand Chapters 9, 12, and 11 with execution playbooks.
6. Review the full programme for flow, duplication, and worksheet placement.
7. Then finalise paid offer, upgrade page, and launch pricing.
8. Add dashboard next-best-action and exports.
9. Run paid beta.
10. Build AI metrics coach.
11. Build AI chapter tutor and brainstorming assistant.

## Notes

- Keep the core lesson path short.
- Put depth into examples, expandable panels, calculators, and AI help.
- Do not compete with huge video courses on volume.
- Compete on clarity, calm decision-making, saved artefacts, and knowing what to do next.
