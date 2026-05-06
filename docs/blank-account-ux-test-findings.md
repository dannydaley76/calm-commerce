# Blank Account UX Test Findings

Test date: 2026-05-06  
Test account: codex.calmcommerce.1778084636164@gmail.com  
Scope: blank-account journey from signup through idea capture, economics, marketplace test, marketplace metrics, test decision, own-store metrics, Ideas, idea detail, dashboard, and Lean Canvas.

## Summary

The core product loop is now visible and mostly works: an idea can start in Chapter 3, move through Chapter 5 economics, become a Chapter 6 test, receive marketplace metrics, record a test decision, receive own-store metrics, and show a unified history on the idea detail page.

The strongest experience is the Ideas detail page. It clearly shows evidence, economics, test plan, test result, linked metrics, projected vs actual, and timeline. This is the closest expression of the OS vision.

The weakest points are onboarding/auth clarity, dashboard prioritisation, and the Lean Canvas relationship to the selected idea/economics.

## P0 / Launch Blockers

### 1. Signup requires email confirmation but the app message is vague

Route: `/signup`, `/login`

What happened: signup succeeded, but sign-in failed until the Supabase auth user was manually confirmed. The signup message says: "If email confirmation is required, check your inbox. Otherwise you can sign in now."

Why it matters: for a paid launch, this creates uncertainty at the exact moment the user is trying to start. If confirmation is required, say that directly and provide a resend/check spam path.

Suggested fix: make the post-signup state explicit: "Check your email to confirm your account." Add a resend confirmation action and clear next-step copy.

### 2. After successful sign-in, dashboard renders while URL remains `/login`

Route: `/login`

What happened: after signing in, the dashboard rendered, but the address bar remained `http://localhost:3000/login`.

Why it matters: this is disorienting and makes the app feel technically unreliable. Refreshing or copying the URL does not match what the user sees.

Suggested fix: after successful login/bootstrap, force navigation to `/` with a normal route transition.

## P1 / Should Fix Before Paid Launch

### 3. Chapter 5 can show a false empty-state before ideas appear

Route: `/chapter/know-your-numbers/steps?step=chapter-5-step-4-score-with-real-numbers`

What happened: immediately after completing Chapter 3 inline ideas, Chapter 5 initially showed "Add your product ideas in Chapter 3 first" even though the Ideas page already showed both product candidates. After opening the full Chapter 3 worksheet and returning, Chapter 5 displayed the idea economics rows correctly.

Why it matters: this is a major trust break. The user has just entered ideas and is told the system cannot see them.

Suggested fix: audit cross-worksheet loading and empty-state timing. Keep showing "Loading..." until cross-worksheet data has definitely resolved. If Chapter 3 completion is required, explain that explicitly and provide a one-click completion/review path.

### 4. Dashboard chooses the wrong "next product action" after a successful test

Route: `/`

What happened: after the desk shelf idea proceeded through Chapter 6 and had both marketplace and store metrics, the dashboard's "Next product action" was still "Review and choose" for the marginal cable tidy idea.

Why it matters: the dashboard should orient the user around the active/validated idea, not pull attention back to a weaker candidate unless that is intentional.

Suggested fix: prioritise ideas by lifecycle urgency: active test, proceed/validated, retest, then unfinished economics. If multiple ideas need work, label this as "Other idea needs attention" rather than "Next product action."

### 5. Ideas page "Open next idea" also points to the marginal idea after the chosen idea has proceeded

Route: `/ideas`

What happened: "Open next idea" linked to the cable tidy idea, while the desk shelf idea was the selected/proceeded candidate with linked metrics.

Why it matters: this repeats the dashboard confusion and undermines the sense that the chosen idea is the operating centre.

Suggested fix: rename to "Open next unfinished idea" if that is the intent, or prioritise the active/proceeded idea.

### 6. Lean Canvas shows the selected idea ID instead of the human idea name

Route: `/lean-canvas`, Business model tab

What happened: the canvas banner says it is built around `idea_364vx1`.

Why it matters: this exposes internal implementation detail and reduces confidence. A learner should see the product name, not an ID.

Suggested fix: render the selected idea label, with the internal ID hidden.

### 7. Lean Canvas does not yet expose the economics/metrics relationship clearly

Route: `/lean-canvas`, Business model tab

What happened: after Chapter 5 economics and live metrics, the canvas only showed the chosen product idea under Solution. Cost structure and revenue streams remained not started.

Why it matters: the idea detail page now connects projected vs actual, but the canvas does not yet reflect that operating/business model progress. This weakens the "living business model" promise.

Suggested fix: add a lightweight economics summary to the relevant canvas cards: planned price, projected margin, actual profit per sale, actual revenue per order, and latest linked metric date.

### 8. Chapter 6 does not preselect the Chapter 5 chosen idea

Route: `/chapter/test-before-you-build/steps?step=chapter-6-step-1-your-first-sale-and-choose-marketplace`

What happened: the Chapter 6 "Idea to test" dropdown included both ideas but defaulted to "Select your idea..." even though Chapter 5 had a chosen idea.

Why it matters: this adds unnecessary friction and creates a chance the user links the test to the wrong candidate.

Suggested fix: default to the Chapter 5 chosen idea, while still allowing the learner to change it.

## P2 / Quality Improvements

### 9. Autosave feedback is too implicit in inline worksheets

Routes: Chapter 3, Chapter 5, Chapter 6 inline worksheet fields

What happened: fields saved, but there was not a clear persistent "Saved" confirmation after editing.

Why it matters: these fields are important business decisions. Users may worry they need to click something else before leaving the page.

Suggested fix: show subtle field/card-level "Saved" or "Saving..." state, especially before navigating away.

### 10. Chapter 5 chosen idea select is slightly awkward for automation and likely accessibility

Route: Chapter 5 economics step

What happened: selecting the chosen idea by visible text failed through one select path, but worked when selecting by option label. This may indicate option values are internal IDs while labels are long product names.

Why it matters: native user interaction probably works, but long labels in selects are hard to scan and may be fragile for accessibility/testing.

Suggested fix: consider a richer idea picker that shows label, economics signal, and margin rather than a plain select.

### 11. Metrics copy says "Your store's performance" even in marketplace phase

Route: `/metrics`

What happened: the page intro says "Your store's performance over time" even before the user has a store and while tracking marketplace validation.

Why it matters: the platform teaches users not to build a store too early. The metrics page should reinforce the two-stage model.

Suggested fix: use neutral copy such as "Track marketplace tests and store performance over time."

### 12. Metrics date formatting is inconsistent between marketplace and own-store tables

Route: `/metrics`

What happened: marketplace history showed `6 May 2026`; own-store history showed `2026-05-06`.

Why it matters: small polish issue, but it makes the two tables feel less intentionally designed.

Suggested fix: use the same formatted date helper in both histories.

### 13. Own-store metric can be logged before later store-building chapters are complete

Route: `/metrics`

What happened: after Chapter 6, I could switch to own-store metrics and add live store data even though Chapters 7-13 were not completed.

Why it matters: this may be useful for flexible testing, but it conflicts with the educational sequence.

Suggested fix: decide whether this is intentional. If allowed, add copy: "Use this once your own store is live." If gated, direct the user to the relevant store setup chapters first.

### 14. Preview access appears throughout the paid journey

Routes: dashboard, Lean Canvas

What happened: the blank account had "Preview access" but could still complete substantial core functionality.

Why it matters: before paid launch, this needs a deliberate access model. Preview access should have clear limits or a clear trial meaning.

Suggested fix: define what preview users can do, and make the UI explain it. Avoid showing "Preview access" without consequence or explanation.

## Things That Worked Well

- Chapter 3 idea capture successfully created durable product candidates.
- Ideas page showed both candidates with evidence, economics, test status, and metrics count.
- Chapter 5 calculated margin automatically and gave useful economic viability feedback.
- Chapter 5 idea review correctly recommended the stronger first test.
- Chapter 6 successfully linked the marketplace test to the product idea once selected.
- Marketplace metrics defaulted to the selected/chosen product idea and linked back into the idea history.
- Own-store metrics linked to the same idea.
- Idea detail page successfully displayed projected margin, actual marketplace profit per sale, actual revenue per order, linked metrics, and a chronological timeline.

## Suggested Fix Order

1. Fix login redirect and signup confirmation UX.
2. Fix Chapter 5 cross-worksheet empty-state/loading reliability.
3. Fix dashboard and Ideas "next action" prioritisation.
4. Preselect the Chapter 5 chosen idea in Chapter 6.
5. Replace Lean Canvas internal idea ID with the idea label.
6. Add economics/metrics summary to Lean Canvas business model cards.
7. Polish autosave indicators, metrics intro copy, and date formatting.
