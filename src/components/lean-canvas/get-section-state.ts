import type { CanvasSectionState, SectionStateInput, SectionStatus } from './types';

/**
 * Derives a CanvasSectionState from the counts and metadata the lean-canvas
 * page already computes. This is a pure wrapper — it does NOT touch the data
 * layer, only interprets counts into a status bucket.
 *
 * Status rules
 * ────────────
 * • filledCount === 0                  → 'empty'
 * • filledCount >= totalCount (≥ 1)    → 'complete'
 * • 0 < filledCount < totalCount       → 'partial'
 *
 * Edge cases
 * ──────────
 * • If totalCount is 0, the section is considered 'complete' (vacuously full).
 * • If filledCount somehow exceeds totalCount we clamp to 'complete'.
 *
 * @example
 * const state = getSectionState({
 *   filledCount: section.filledCount,
 *   totalCount:  section.fields.length,
 *   editHref:    deepLink.href,
 *   sourceLabel: section.chapterLabel,
 * });
 */
export function getSectionState(input: SectionStateInput): CanvasSectionState {
  const { filledCount, totalCount, editHref, sourceLabel } = input;

  let status: SectionStatus;

  if (totalCount === 0 || filledCount >= totalCount) {
    status = 'complete';
  } else if (filledCount <= 0) {
    status = 'empty';
  } else {
    status = 'partial';
  }

  return { status, filledCount, totalCount, editHref, sourceLabel };
}
