# Worksheet Field Placement Map

## The Rule

Worksheet fields appear **inline at the bottom of the step that teaches the relevant concept**, not at the end of the chapter. A learner should never need to remember what they read three steps ago to fill in a field. The field appears while the context is still fresh.

Each step can have zero, one, or a small group of related fields. No step should have more than 4-5 fields. If a worksheet has many fields, they are distributed across multiple steps.

The final step of every chapter is a **closing/transition step with no fields**. It builds forward momentum into the next chapter.

---

## Chapter 1 — Welcome: You Can Do This

No worksheet. No inline fields.

| Step | Content | Fields |
|------|---------|--------|
| 1 | You are about to build something real + What this course is | None |
| 2 | How the course works + What you will need | None |

---

## Chapter 2 — Choose How You'll Sell

| Step | Content | Fields |
|------|---------|--------|
| 1 | The question before the question + Reselling + Print-on-demand | None (still learning) |
| 2 | Dropshipping + Private label + Design and manufacture | None (still learning) |
| 3 | You are not locking yourself in | `sourcing_model` (single-select), `why_this_model` (textarea) |
| 4 | Before you move on → next chapter teaser | `estimated_startup_cost` (text), `timeline_to_first_listing` (text) |

**Rationale:** Fields appear after all five models have been presented, not before. The choice fields come in step 3 when the learner has the full picture. The estimation fields come in step 4 as a final commitment before moving on.

*Alternative:* Move all four fields to step 3 and make step 4 a pure closing step with no fields. Either works. The key is that no fields appear during steps 1-2 while the learner is still absorbing the options.

---

## Chapter 3 — Brainstorm With Discipline

| Step | Content | Fields |
|------|---------|--------|
| 1 | Where good ideas come from + Bestseller lists + Search patterns | None |
| 2 | Review mining + Social listening + Seasonality | None |
| 3 | Competition + Boring can be profitable | None |
| 4 | Score and shortlist your ideas | All idea fields: `idea_1_description`, `idea_1_demand_evidence`, `idea_1_competition_notes`, `idea_1_seasonality` (and repeat for ideas 2-3) |
| 5 | You are making real progress → next chapter teaser | None |

**Rationale:** The entire chapter teaches research methods. The learner needs all the methods before they can score ideas. Placing the idea fields at the scoring step (step 4) is the only logical position. This is one of the few chapters where fields are concentrated in a single step because the worksheet *is* the scoring exercise.

**Note for field groups:** If using the `FieldGroup` schema with `repeatMin: 2, repeatMax: 3`, the step 4 UI shows a tabbed or accordion interface for each idea, with an "Add another idea" button up to the maximum.

---

## Chapter 4 — Set Your Founder Rules

| Step | Content | Fields |
|------|---------|--------|
| 1 | Your ideas deserve protection (intro) | None |
| 2 | Time rules: small and steady wins | `hours_per_week` (text), `fixed_work_blocks` (text), `weekly_review_slot` (text) |
| 3 | Money rules: spend on evidence not hope | `money_cap_per_month` (text, currency-aware), `tooling_max_spend` (text, currency-aware), `budget_split` (text) |
| 4 | Decision rules + Data over ego | `minimum_experiment_duration` (text), `kill_criteria` (textarea), `continue_criteria` (textarea), `escalation_criteria` (textarea), `data_over_ego_commitment` (checkbox + optional text) |
| 5 | Red-line rules + bookkeeping | `red_line_rules` (textarea) |
| 6 | You now have an operating system → next chapter teaser | None |

**Rationale:** This chapter teaches four distinct rule categories. Each one has its own step with matching fields. The learner sets time rules while reading about time rules, money rules while reading about money rules, etc. This is the clearest example of why fields-at-the-end fails — by step 5, the learner has forgotten the specifics of step 2's time advice.

---

## Chapter 5 — Know Your Numbers Before You Commit

| Step | Content | Fields |
|------|---------|--------|
| 1 | The chapter that saves you the most money + The maths + Costs most beginners miss | None (absorbing the concept) |
| 2 | Shipping + Product complexity (SKUs, MOQs, variants) | None (absorbing the concept) |
| 3 | Talking to suppliers | None (guidance, no fields needed) |
| 4 | Score your ideas with real numbers | Per-idea fields: `product_cost`, `shipping_to_customer`, `platform_fees`, `selling_price`, calculated margin and viability feedback, `variant_complexity` (select), `viable` (select). Then: `chosen_idea` (select from ideas), `reason_for_choice` (textarea) |
| 5 | You now know which idea can make money → next chapter teaser | None |

**Rationale:** Same pattern as Chapter 3. The teaching builds up to a scoring exercise. Fields appear at the scoring moment. The per-idea fields use the field group pattern, ideally pre-populated with the idea descriptions from Chapter 3 so the learner doesn't re-enter them.

**Important:** The `chosen_idea` field should be a select that pulls its options from the idea descriptions entered in Chapter 3's worksheet, filtered to only show ideas marked as "Yes — proceed" or "Marginal" in the `viable` field. This is a cross-worksheet read.

---

## Chapter 6 — Test Before You Build a Store

| Step | Content | Fields |
|------|---------|--------|
| 1 | Your first sale could happen this week + Why marketplaces + Choose your marketplace | `test_marketplace` (single-select) |
| 2 | Write your first listing + Set your test duration | `product_listed` (text), `listing_price` (text, currency-aware), `test_duration` (text) |
| 3 | When it sells: ship it well | None (guidance) |
| 4 | Read the results + Make your decision | `result` (single-select), `units_sold` (number, visible when result=Sold), `what_you_learned` (textarea), `decision` (single-select) |
| 5 | What this test proves → next chapter teaser | None |

**Rationale:** Fields are split across three steps matching the natural workflow: plan the test (step 1-2), run it (step 3, no fields — this happens offline), then record the results (step 4). This mirrors the actual sequence of events rather than treating it as a form to fill in one sitting.

---

## Chapter 7 — Pick Your Customer

| Step | Content | Fields |
|------|---------|--------|
| 1 | You already know more + Why "everyone" is not a customer | None |
| 2 | Define your niche customer | `customer_description` (textarea) |
| 3 | Find where they gather | `core_problem` (textarea), `where_they_gather` (textarea) |
| 4 | What they value most + What would make them trust a new seller | `what_they_value_most` (single-select), `what_builds_trust` (textarea) |
| 5 | You now know who you are talking to → next chapter teaser | None |

**Rationale:** Customer profile fields are spread across three steps because the chapter teaches three distinct aspects: who the customer is (step 2), where they are (step 3), and what they care about (step 4). Each field appears directly after the teaching that equips the learner to answer it.

---

## Chapter 8 — Shape Your Offer

| Step | Content | Fields |
|------|---------|--------|
| 1 | A product is not an offer + What is your customer doing right now | None |
| 2 | Position against the alternatives + Minimum viable offer | `key_differentiator` (text), `minimum_viable_version` (textarea) |
| 3 | Name it and describe it | `offer_summary` (textarea), `positioning_statement` (text) |
| 4 | Price it with confidence + Does your margin still work? | `final_price` (text, currency-aware), `margin_after_all_costs` (text, currency-aware) |
| 5 | Your offer is ready → next chapter teaser | None |

**Rationale:** Each field appears at the moment the chapter gives the learner the framework to answer it. Positioning fields after the positioning section. Price after the pricing framework. Margin check after the margin discussion.

---

## Chapter 9 — Write Listings That Sell

| Step | Content | Fields |
|------|---------|--------|
| 1 | Your listing is your salesperson + Write a title | `product_title` (text) |
| 2 | Write a description that answers every question | `product_description_draft` (textarea), `objections_addressed` (textarea) |
| 3 | Take photos that build confidence | `key_images_needed` (textarea), `images_captured` (checkbox) |
| 4 | Social proof: reviews and trust | None (guidance — no fields, this is advice not a worksheet exercise) |
| 5 | Your listing is ready → next chapter teaser | None |

**Rationale:** The title field appears immediately after teaching title writing (step 1). The description fields appear after description writing (step 2). The photo fields appear after photo guidance (step 3). The social proof section is advice, not something the learner fills in, so it has no fields.

---

## Chapter 10 — What Your Store Actually Needs

| Step | Content | Fields |
|------|---------|--------|
| 1 | It is simpler than you think + Choose your platform | `platform_chosen` (text) |
| 2 | Essential building blocks (product page, about, contact, returns) | `product_page_live` (checkbox), `about_page_live` (checkbox), `contact_method_visible` (checkbox), `returns_policy_published` (checkbox) |
| 3 | Payment processing + Legal pages + Checkout testing | `payment_processing_active` (checkbox), `privacy_policy_live` (checkbox), `store_tested_with_friend` (checkbox) |
| 4 | Test your store with a real person + What "ready" means → closing | `store_url` (text, optional) |

**Rationale:** This is a checklist chapter. The checkboxes appear alongside the building blocks they correspond to, so the learner can tick each one as they set it up. Splitting the checklist across steps 2-3 keeps each step focused and prevents a wall of checkboxes.

---

## Chapter 11 — Free Traffic: Start Without Spending

| Step | Content | Fields |
|------|---------|--------|
| 1 | Your store is open + Share in communities | None (guidance — learner needs to absorb approach first) |
| 2 | Basic SEO + Social media as distribution | None (guidance) |
| 3 | Your personal network + Track what is working | `free_channels_chosen` (textarea), `community_plan` (textarea) |
| 4 | Free traffic takes patience | `posting_frequency` (text), `first_week_actions` (textarea) |
| 5 | You are building momentum → next chapter teaser | None |

**Rationale:** All the teaching comes first (steps 1-2). The planning fields appear in steps 3-4 once the learner understands all the channel options. Splitting across two steps: step 3 captures *what* channels and *how* they'll contribute, step 4 captures the *when* and *first actions*.

---

## Chapter 12 — Paid Ads: Small Budget Testing

| Step | Content | Fields |
|------|---------|--------|
| 1 | Now you can accelerate + How paid ads work | None |
| 2 | Set up your first test | `ad_platform` (text), `daily_budget` (text, currency-aware), `test_duration` (text), `target_audience_description` (textarea) |
| 3 | The numbers that matter (CTR, CPC, conversion, CPA) | None (teaching) |
| 4 | Read your results and decide | `ctr_after_test` (text), `cpc_after_test` (text, currency-aware), `conversion_rate_after_test` (text), `cpa_after_test` (text, currency-aware), `cpa_vs_margin` (textarea), `decision` (single-select) |
| 5 | Update your Founder Rules + Common mistakes | `updated_kill_criteria` (textarea), `updated_continue_criteria` (textarea), `updated_escalation_criteria` (textarea) |
| 6 | You now have a customer acquisition engine → closing | None |

**Rationale:** Three distinct field moments: planning the test (step 2), recording results (step 4), and updating founder rules (step 5). Steps 1 and 3 are pure teaching with no fields. The post-test fields in step 4 will likely be empty when the learner first reads the chapter and filled in later when they come back with results — that's fine.

**Important UX note:** Steps 4-5 fields should be clearly labelled "Fill these in after running your test" so the learner knows they can read ahead and return.

---

## Chapter 13 — Email and Repeat Customers

| Step | Content | Fields |
|------|---------|--------|
| 1 | Most valuable customer + Why email beats social | None |
| 2 | Start collecting emails | `email_collection_method` (text), `incentive_offered` (text) |
| 3 | Your first three emails | `welcome_email_subject` (text), `welcome_email_key_message` (textarea) |
| 4 | After the sale + Customer lifetime value | `post_purchase_follow_up_plan` (textarea), `repeat_purchase_strategy` (textarea) |
| 5 | You now have three engines → closing | None |

**Rationale:** Email collection fields after the collection teaching (step 2). Email content fields after the email sequence teaching (step 3). Retention strategy after the LTV teaching (step 4). Each field group matches its teaching section.

---

## Chapter 14 — Read Your Numbers

| Step | Content | Fields |
|------|---------|--------|
| 1 | The difference between guessing and knowing + Six numbers | None (teaching) |
| 2 | Where to find your numbers + What "good" looks like | None (teaching) |
| 3 | Your weekly review ritual | `weekly_traffic` (number), `conversion_rate` (text), `average_order_value` (text, currency-aware), `cpa_this_week` (text, currency-aware), `margin_per_sale` (text, currency-aware), `email_list_size` (number) |
| 4 | Update your Founder Rules | `what_working` (textarea), `what_to_change` (textarea), `updated_founder_rules` (textarea) |
| 5 | You are now managing a real business → closing | None |

**Rationale:** Steps 1-2 teach what to measure and where. Step 3 is where the learner actually records their first set of numbers — this mirrors the weekly review ritual being taught. Step 4 captures the reflection.

**Note:** These fields overlap with Chapter 17's recurring metric entry. Consider whether Ch14's fields should write to the same `weekly_metrics` table (as the learner's first entry) or to the chapter worksheet (as a one-time exercise). Recommendation: write to the worksheet. Chapter 17 introduces the recurring system.

---

## Chapter 15 — Iterate and Pivot

| Step | Content | Fields |
|------|---------|--------|
| 1 | Something is not working + Diagnose before you decide | `current_diagnosis` (single-select), `evidence_for_diagnosis` (textarea) |
| 2 | Iterate: small changes, one at a time | `planned_iteration` (textarea), `expected_outcome` (text) |
| 3 | When to pivot + What pivoting looks like + The pivot loop | None (teaching + loop block) |
| 4 | When not to pivot | `iteration_result` (textarea), `decision` (single-select) |
| 5 | You are making better decisions → closing | None |

**Rationale:** Diagnosis fields appear at the diagnosis step (step 1). Iteration planning at the iteration step (step 2). The pivot section (step 3) is teaching and the loop block — no fields because the learner is making a navigation decision, not filling in a form. Results and decision come in step 4 after they've either iterated or read the pivot guidance.

---

## Chapter 16 — What Changes When It Works

| Step | Content | Fields |
|------|---------|--------|
| 1 | You have earned this chapter + Recognise what working looks like | None |
| 2 | Scale vs grow + Increase ad spend + Add products or go deeper | `growth_strategy` (single-select), `reason` (textarea) |
| 3 | A second store: when it makes sense | `second_store_considerations` (textarea, optional) |
| 4 | Update your Founder Rules for the next phase | `new_time_budget` (text, optional), `new_money_cap` (text, currency-aware, optional), `updated_decision_thresholds` (textarea, optional) |
| 5 | Growth is a continuation → closing | None |

**Rationale:** Growth strategy fields at the growth teaching step. Second store considerations kept separate (step 3) because it's a distinct decision. Updated founder rules at the end because they synthesise all the growth decisions.

---

## Chapter 17 — Your Operating Dashboard

| Step | Content | Fields |
|------|---------|--------|
| 1 | Everything you have built + Weekly review is your most important habit | None |
| 2 | What to review and when (weekly/monthly/quarterly) | None (teaching) |
| 3 | Entering your metrics + How to read your dashboard | Weekly metric entry form: `week_ending`, `revenue`, `orders`, `traffic`, `ad_spend`, `new_email_subscribers`, `refunds_returns`, `what_worked`, `what_to_change`, `notes` |
| 4 | When the dashboard shows trouble + What happens next + AI teaser | None |

**Rationale:** The metric entry form appears at step 3 after the learner has learned *what* to review and *when*. Step 4 is the course closing with no fields. The metric entry form writes to `weekly_metrics` table, not `worksheet_responses`, since it's a recurring entry.

---

## Summary Rule for Developers

```
For each chapter:
1. Read the step breakdown above.
2. If a step has fields listed, set inlineWorksheetFieldKeys on that step.
3. If a step has no fields listed, inlineWorksheetFieldKeys is omitted or empty.
4. The final step of every chapter has NO fields.
5. No step has more than 6 fields.
6. Fields appear on the step that teaches the concept they ask about.
```

This map should be encoded directly into each chapter's JSON file. Do not rely on runtime logic to determine field placement.
