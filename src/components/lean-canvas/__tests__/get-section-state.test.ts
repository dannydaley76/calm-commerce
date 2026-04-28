import { describe, it, expect } from 'vitest';
import { getSectionState } from '../get-section-state';
import type { SectionStateInput } from '../types';

const base: SectionStateInput = {
  filledCount: 0,
  totalCount: 4,
  editHref: '/chapter/pick-your-customer/steps?step=step-3',
  sourceLabel: 'Chapter 7: Pick Your Customer',
};

describe('getSectionState', () => {
  describe('status derivation', () => {
    it('returns "empty" when filledCount is 0', () => {
      const result = getSectionState({ ...base, filledCount: 0, totalCount: 4 });
      expect(result.status).toBe('empty');
    });

    it('returns "partial" when filledCount is between 0 and totalCount', () => {
      const result = getSectionState({ ...base, filledCount: 1, totalCount: 4 });
      expect(result.status).toBe('partial');
    });

    it('returns "partial" at filledCount = totalCount - 1', () => {
      const result = getSectionState({ ...base, filledCount: 3, totalCount: 4 });
      expect(result.status).toBe('partial');
    });

    it('returns "complete" when filledCount equals totalCount', () => {
      const result = getSectionState({ ...base, filledCount: 4, totalCount: 4 });
      expect(result.status).toBe('complete');
    });

    it('clamps to "complete" when filledCount exceeds totalCount (defensive)', () => {
      const result = getSectionState({ ...base, filledCount: 6, totalCount: 4 });
      expect(result.status).toBe('complete');
    });

    it('returns "complete" when totalCount is 0 (vacuously full)', () => {
      const result = getSectionState({ ...base, filledCount: 0, totalCount: 0 });
      expect(result.status).toBe('complete');
    });

    it('returns "empty" when filledCount is negative (defensive)', () => {
      const result = getSectionState({ ...base, filledCount: -1, totalCount: 4 });
      expect(result.status).toBe('empty');
    });
  });

  describe('passthrough fields', () => {
    it('preserves filledCount', () => {
      expect(getSectionState({ ...base, filledCount: 2 }).filledCount).toBe(2);
    });

    it('preserves totalCount', () => {
      expect(getSectionState({ ...base, totalCount: 8 }).totalCount).toBe(8);
    });

    it('preserves editHref', () => {
      const href = '/chapter/shape-your-offer/steps?step=uvp-1';
      expect(getSectionState({ ...base, editHref: href }).editHref).toBe(href);
    });

    it('preserves sourceLabel', () => {
      const label = 'Chapter 8: Shape Your Offer';
      expect(getSectionState({ ...base, sourceLabel: label }).sourceLabel).toBe(label);
    });
  });

  describe('return shape', () => {
    it('returns all five CanvasSectionState keys', () => {
      const result = getSectionState(base);
      expect(result).toMatchObject({
        status: expect.any(String),
        filledCount: expect.any(Number),
        totalCount: expect.any(Number),
        editHref: expect.any(String),
        sourceLabel: expect.any(String),
      });
    });

    it('does not mutate the input', () => {
      const input: SectionStateInput = { ...base, filledCount: 2 };
      getSectionState(input);
      expect(input.filledCount).toBe(2);
    });
  });
});
