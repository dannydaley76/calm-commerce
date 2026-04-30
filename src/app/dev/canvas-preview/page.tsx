/**
 * /dev/canvas-preview — visual Storybook-style reference page.
 *
 * Shows CanvasCard / BusinessModelCard in every state, side by side for
 * both Operating and Business model layers.  Use this to verify visual
 * parity during development.
 *
 * NOT included in the production build — wrap with `process.env.NODE_ENV`
 * check or a feature flag before shipping.
 */

import { getSectionState } from "@/components/lean-canvas/get-section-state";
import { CanvasCard } from "@/components/lean-canvas/CanvasCard";
import { BusinessModelCard } from "@/components/lean-canvas/BusinessModelCard";

/* ── Fixtures ────────────────────────────────────────────────────── */

const EDIT_HREF  = "/chapter/pick-your-customer/steps?step=step-3";
const SRC_LABEL  = "Chapter 7: Pick Your Customer";
const MULTI_SRC  = "Chapters 5, 8–9";

const emptyState = getSectionState({
  filledCount: 0, totalCount: 4,
  editHref: EDIT_HREF, sourceLabel: SRC_LABEL,
});

const partialState = getSectionState({
  filledCount: 1, totalCount: 4,
  editHref: EDIT_HREF, sourceLabel: SRC_LABEL,
});

const completeState = getSectionState({
  filledCount: 4, totalCount: 4,
  editHref: EDIT_HREF, sourceLabel: SRC_LABEL,
});

const singleEmptyState = getSectionState({
  filledCount: 0, totalCount: 1,
  editHref: "/chapter/set-your-founder-rules/worksheet",
  sourceLabel: "Chapter 4: Founder Rules",
});

const singleCompleteState = getSectionState({
  filledCount: 1, totalCount: 1,
  editHref: "/chapter/set-your-founder-rules/worksheet",
  sourceLabel: "Chapter 4: Founder Rules",
});

const solutionPartialState = getSectionState({
  filledCount: 1, totalCount: 4,
  editHref: "/chapter/shape-your-offer/steps?step=step-2",
  sourceLabel: MULTI_SRC,
});

/* ── Preview layout helper ───────────────────────────────────────── */

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-bold uppercase tracking-wider text-ink-700 border-b border-ink-100 pb-2">
        {label}
      </h2>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {children}
      </div>
    </section>
  );
}

/* ── Page ────────────────────────────────────────────────────────── */

export default function CanvasPreviewPage() {
  return (
    <div className="min-h-screen bg-surface-canvas px-6 py-12 lg:px-12">
      <div className="mx-auto max-w-[1200px] space-y-12">

        <header>
          <p className="text-xs font-bold uppercase tracking-wider text-cobalt-600">Dev preview</p>
          <h1 className="mt-2 font-[Manrope] text-3xl font-bold text-ink-900">
            Canvas card states
          </h1>
          <p className="mt-2 max-w-[640px] text-sm leading-7 text-ink-700">
            Every card state for both the Operating and Business model layers,
            side by side.  Verify: all cards are white, chips are visible, lozenges
            match the state, and the footer grid never breaks.
          </p>
        </header>

        {/* ── Operating layer ────────────────────────────────────────── */}

        <Row label="Operating layer — scalar field (totalCount = 1)">
          <CanvasCard
            title="Time budget"
            description="Your realistic weekly time limit is not defined yet."
            state={singleEmptyState}
            actionLabel="Edit"
          />
          <CanvasCard
            title="Time budget"
            state={singleCompleteState}
            actionLabel="Edit"
          >
            <p className="text-sm leading-6 text-ink-900">12 hrs / week</p>
          </CanvasCard>
          <CanvasCard
            title="Money cap"
            state={singleCompleteState}
            actionLabel="Edit"
          >
            <p className="text-sm leading-6 text-ink-900">£500 / month</p>
          </CanvasCard>
          <CanvasCard
            title="Experiment duration"
            description="You have not set the minimum test duration."
            state={singleEmptyState}
            actionLabel="Edit"
          />
        </Row>

        <Row label="Operating layer — long-form field">
          <CanvasCard
            title="Success metrics"
            description="You have not yet defined what genuine progress looks like."
            state={singleEmptyState}
            actionLabel="Edit"
          />
          <CanvasCard
            title="Success metrics"
            state={singleCompleteState}
            actionLabel="Edit"
          >
            <p className="text-sm leading-6 text-ink-900">
              3 paying customers per week for 4 consecutive weeks
            </p>
          </CanvasCard>
          <CanvasCard
            title="Kill criteria"
            description="You have not yet defined the result that would tell you to stop."
            state={singleEmptyState}
            actionLabel="Edit"
          />
          <CanvasCard
            title="Red-line rules"
            state={singleCompleteState}
            actionLabel="Edit"
          >
            <p className="text-sm leading-6 text-ink-900">
              Never borrow money. Never quit the day job before £1k/month profit.
            </p>
          </CanvasCard>
        </Row>

        {/* ── Business model layer via CanvasCard ────────────────────── */}

        <Row label="Business model layer — CanvasCard (partial + complete delegated states)">
          {/* Partial — 1 of 4 filled, subFields list */}
          <CanvasCard
            title="Solution"
            state={solutionPartialState}
            subFields={[
              { label: "Chosen product idea", value: "Novelty socks" },
              { label: "Offer summary",        value: null },
              { label: "Minimum viable version", value: null },
              { label: "Listing title",         value: null },
            ]}
          />

          {/* Complete — subFields */}
          <CanvasCard
            title="Problem"
            state={completeState}
            subFields={[
              { label: "Core problem",      value: "Hard to find quality socks that last" },
              { label: "What they value most", value: "Durability and unique style" },
              { label: "Pain frequency",    value: "Monthly purchase cycle" },
              { label: "Existing workaround", value: "Fast fashion, unsatisfied" },
            ]}
          />

          {/* Complete with children (unit economics style) */}
          <CanvasCard
            title="Cost structure"
            state={completeState}
          >
            <div className="rounded-xl bg-surface-sunken p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-cobalt-600 mb-2">
                Unit costs — Novelty socks
              </p>
              <dl className="space-y-1">
                {[["Product cost", "£3.50"], ["Shipping", "£1.20"], ["Platform fees", "£0.80"], ["Margin / unit", "£4.50"]].map(([k, v]) => (
                  <div key={k} className="flex items-baseline justify-between gap-2">
                    <dt className="text-xs text-ink-700">{k}</dt>
                    <dd className="text-xs font-semibold text-ink-900">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </CanvasCard>

          {/* Empty state delegated through BusinessModelCard */}
          <BusinessModelCard
            sectionId="channels-preview"
            title="Channels"
            description="How customers discover and buy from you."
            state={emptyState}
          />
        </Row>

        {/* ── BusinessModelCard — all 4 states ───────────────────────── */}

        <Row label="BusinessModelCard — all 4 states (empty, partial, complete, skipped)">
          <BusinessModelCard
            sectionId="bmc-empty-preview"
            title="Problem"
            description="The real problem your customer has that your product solves."
            state={emptyState}
          />
          <BusinessModelCard
            sectionId="bmc-partial-preview"
            title="Solution"
            state={solutionPartialState}
            subFields={[
              { label: "Chosen product idea", value: "Novelty socks" },
              { label: "Offer summary",        value: null },
              { label: "Minimum viable version", value: null },
              { label: "Listing title",         value: null },
            ]}
          />
          <BusinessModelCard
            sectionId="bmc-complete-preview"
            title="Problem"
            state={completeState}
            subFields={[
              { label: "Core problem",      value: "Hard to find quality socks" },
              { label: "What they value most", value: "Durability and style" },
              { label: "Pain frequency",    value: "Monthly" },
              { label: "Existing workaround", value: "Fast fashion" },
            ]}
          />
          {/* Skipped state — client-side, hydrates after mount */}
          <div className="relative">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-ink-500">
              Skipped state (hydrates client-side)
            </p>
            <BusinessModelCard
              sectionId="bmc-skipped-PREVIEW-NEVER-IN-PROD"
              title="Unfair advantage"
              description="What makes this hard for a competitor to copy."
              state={emptyState}
            />
          </div>
        </Row>

        {/* ── Edge cases ─────────────────────────────────────────────── */}

        <Row label="Edge cases — long titles, long chapter labels, all-null subfields">
          <CanvasCard
            title="Unique value proposition"
            description="Why your customer should buy from you instead of the alternative."
            state={emptyState}
          />
          <CanvasCard
            title="Customer segments"
            state={partialState}
            subFields={[
              { label: "Niche customer",    value: "UK home-workers, 25–45, style-conscious" },
              { label: "Where they gather", value: null },
              { label: "What builds trust", value: null },
            ]}
          />
          <CanvasCard
            title="Revenue streams"
            state={partialState}
            subFields={[
              { label: "Selling price",           value: null },
              { label: "Margin per sale",         value: null },
              { label: "Repeat purchase strategy", value: null },
              { label: "Email collection",        value: null },
            ]}
          />
          <CanvasCard
            title="Channels"
            state={makeStateLong()}
            subFields={[
              { label: "Free channels",     value: "Instagram, TikTok, Pinterest" },
              { label: "Paid channel",      value: "Meta ads" },
              { label: "First week actions", value: "Post 3 reels, run £20 test ad" },
            ]}
          />
        </Row>

      </div>
    </div>
  );
}

/* helper for long source label edge case */
function makeStateLong() {
  return getSectionState({
    filledCount: 3, totalCount: 3,
    editHref: "/chapter/free-traffic/steps?step=step-1",
    sourceLabel: "Chapters 11–12",
  });
}
