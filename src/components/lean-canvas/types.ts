/**
 * Canonical state for a single canvas section, shared across both the
 * Operating and Business tabs. Derive one of these via getSectionState()
 * rather than computing status inline wherever you render a card.
 */

/** How far along a canvas section is. */
export type SectionStatus = 'empty' | 'partial' | 'complete';

/**
 * Everything a UI primitive needs to render a canvas section card,
 * a completion glyph, or a tab badge — with no knowledge of the
 * underlying worksheet shape.
 */
export interface CanvasSectionState {
  /** Completion bucket: empty → partial → complete. */
  status: SectionStatus;

  /** How many fields inside this section have a non-empty value. */
  filledCount: number;

  /** Total number of fields in this section (the denominator). */
  totalCount: number;

  /**
   * Deep link that takes the user directly to the worksheet step
   * where they can fill or edit this section.
   * E.g. `/chapter/pick-your-customer/steps?step=step-3`
   */
  editHref: string;

  /**
   * Human-readable label for where this data comes from.
   * E.g. `"Chapter 7: Pick Your Customer"`
   */
  sourceLabel: string;
}

/**
 * Minimum shape needed to call getSectionState().
 * Callers may pass anything that satisfies this — the function only
 * reads these four fields and does not mutate them.
 */
export interface SectionStateInput {
  filledCount: number;
  totalCount: number;
  editHref: string;
  sourceLabel: string;
}
