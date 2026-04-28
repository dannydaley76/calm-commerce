import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CompletionGlyph } from '../CompletionGlyph';
import type { CanvasSectionState } from '../types';

const makeState = (overrides: Partial<CanvasSectionState> = {}): CanvasSectionState => ({
  status: 'empty',
  filledCount: 0,
  totalCount: 4,
  editHref: '/chapter/foo',
  sourceLabel: 'Chapter 7',
  ...overrides,
});

describe('CompletionGlyph', () => {
  describe('glyph characters', () => {
    it('renders ○ for "empty" status string', () => {
      render(<CompletionGlyph state="empty" />);
      expect(screen.getByText('○')).toBeInTheDocument();
    });

    it('renders ◐ for "partial" status string', () => {
      render(<CompletionGlyph state="partial" />);
      expect(screen.getByText('◐')).toBeInTheDocument();
    });

    it('renders ● for "complete" status string', () => {
      render(<CompletionGlyph state="complete" />);
      expect(screen.getByText('●')).toBeInTheDocument();
    });

    it('reads status from a full CanvasSectionState object', () => {
      render(<CompletionGlyph state={makeState({ status: 'complete' })} />);
      expect(screen.getByText('●')).toBeInTheDocument();
    });

    it('renders ○ for empty CanvasSectionState', () => {
      render(<CompletionGlyph state={makeState({ status: 'empty' })} />);
      expect(screen.getByText('○')).toBeInTheDocument();
    });

    it('renders ◐ for partial CanvasSectionState', () => {
      render(<CompletionGlyph state={makeState({ status: 'partial' })} />);
      expect(screen.getByText('◐')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has role="img" and aria-label by default', () => {
      render(<CompletionGlyph state="empty" />);
      const el = screen.getByRole('img', { name: /empty/i });
      expect(el).toBeInTheDocument();
    });

    it('uses "Partially filled" as the label for partial', () => {
      render(<CompletionGlyph state="partial" />);
      expect(screen.getByRole('img', { name: /partially filled/i })).toBeInTheDocument();
    });

    it('uses "Complete" as the label for complete', () => {
      render(<CompletionGlyph state="complete" />);
      expect(screen.getByRole('img', { name: /complete/i })).toBeInTheDocument();
    });

    it('sets aria-hidden when decorative=true', () => {
      render(<CompletionGlyph state="complete" decorative />);
      // role="img" should not be present
      expect(screen.queryByRole('img')).toBeNull();
    });
  });

  describe('className forwarding', () => {
    it('applies extra className to the span', () => {
      const { container } = render(
        <CompletionGlyph state="empty" className="absolute top-5 right-5" />,
      );
      const span = container.querySelector('span');
      expect(span?.className).toContain('absolute');
      expect(span?.className).toContain('top-5');
    });
  });
});
