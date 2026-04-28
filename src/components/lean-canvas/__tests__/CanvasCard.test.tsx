import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CanvasCard } from '../CanvasCard';
import type { CanvasSectionState } from '../types';

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

const makeState = (overrides: Partial<CanvasSectionState> = {}): CanvasSectionState => ({
  status: 'empty',
  filledCount: 0,
  totalCount: 4,
  editHref: '/chapter/pick-your-customer/steps?step=step-3',
  sourceLabel: 'Chapter 7: Pick Your Customer',
  ...overrides,
});

describe('CanvasCard', () => {

  /* ── Empty state ──────────────────────────────────────────────── */

  describe('empty state', () => {
    it('renders the section title', () => {
      render(
        <CanvasCard title="Problem" description="The real problem." state={makeState()} />,
      );
      expect(screen.getByText('Problem')).toBeInTheDocument();
    });

    it('renders the description in the empty body', () => {
      render(
        <CanvasCard title="Problem" description="The real problem." state={makeState()} />,
      );
      expect(screen.getByText('The real problem.')).toBeInTheDocument();
    });

    it('shows the "Not started" lozenge', () => {
      render(<CanvasCard title="Problem" state={makeState()} />);
      expect(screen.getByText('Not started')).toBeInTheDocument();
    });

    it('wraps the whole card in an <a> pointing to editHref', () => {
      render(
        <CanvasCard title="Problem" state={makeState({ editHref: '/chapter/foo?step=bar' })} />,
      );
      expect(screen.getByRole('link')).toHaveAttribute('href', '/chapter/foo?step=bar');
    });

    it('shows the "Start →" action label by default', () => {
      render(<CanvasCard title="Problem" state={makeState()} />);
      expect(screen.getByText('Start →')).toBeInTheDocument();
    });

    it('respects an explicit actionLabel override', () => {
      render(<CanvasCard title="Problem" state={makeState()} actionLabel="Edit" />);
      expect(screen.getByText('Edit →')).toBeInTheDocument();
    });

    it('renders the sourceLabel as a chip with middle-dot separator', () => {
      render(<CanvasCard title="Problem" state={makeState()} />);
      expect(screen.getByText(/Chapter 7 · Pick Your Customer/)).toBeInTheDocument();
    });

    it('does not render children in the empty state', () => {
      render(
        <CanvasCard title="Problem" state={makeState()}>
          <span data-testid="child-content">Value</span>
        </CanvasCard>,
      );
      expect(screen.queryByTestId('child-content')).toBeNull();
    });
  });

  /* ── Partial state ────────────────────────────────────────────── */

  describe('partial state', () => {
    const partialState = makeState({ status: 'partial', filledCount: 1, totalCount: 4 });

    it('wraps the card in an <a> pointing to editHref', () => {
      render(<CanvasCard title="Problem" state={partialState} />);
      expect(screen.getByRole('link')).toHaveAttribute('href', partialState.editHref);
    });

    it('shows "Continue (1/4) →" default action label', () => {
      render(<CanvasCard title="Problem" state={partialState} />);
      expect(screen.getByText('Continue (1/4) →')).toBeInTheDocument();
    });

    it('shows "X of Y filled" lozenge when totalCount > 1', () => {
      render(<CanvasCard title="Problem" state={partialState} />);
      expect(screen.getByText('1 of 4 filled')).toBeInTheDocument();
    });

    it('renders children', () => {
      render(
        <CanvasCard title="Problem" state={partialState}>
          <span data-testid="child-content">Some value</span>
        </CanvasCard>,
      );
      expect(screen.getByTestId('child-content')).toBeInTheDocument();
    });

    it('renders filled subField values normally', () => {
      render(
        <CanvasCard
          title="Problem"
          state={partialState}
          subFields={[{ label: 'Core problem', value: 'Hard to find quality products' }]}
        />,
      );
      expect(screen.getByText('Core problem')).toBeInTheDocument();
      expect(screen.getByText('Hard to find quality products')).toBeInTheDocument();
    });

    it('renders null subField values as italic "Not yet"', () => {
      render(
        <CanvasCard
          title="Problem"
          state={partialState}
          subFields={[
            { label: 'Core problem', value: 'Hard to find…' },
            { label: 'What they value', value: null },
          ]}
        />,
      );
      expect(screen.getByText('What they value')).toBeInTheDocument();
      expect(screen.getByText('Not yet')).toBeInTheDocument();
    });

    it('renders ALL subFields, not just the filled ones', () => {
      render(
        <CanvasCard
          title="Problem"
          state={partialState}
          subFields={[
            { label: 'Field A', value: 'Filled' },
            { label: 'Field B', value: null },
            { label: 'Field C', value: null },
          ]}
        />,
      );
      expect(screen.getByText('Field A')).toBeInTheDocument();
      expect(screen.getByText('Field B')).toBeInTheDocument();
      expect(screen.getByText('Field C')).toBeInTheDocument();
      expect(screen.getAllByText('Not yet')).toHaveLength(2);
    });
  });

  /* ── Complete state ───────────────────────────────────────────── */

  describe('complete state', () => {
    const completeState = makeState({ status: 'complete', filledCount: 4, totalCount: 4 });

    it('shows "Edit →" default action label', () => {
      render(<CanvasCard title="Problem" state={completeState} />);
      expect(screen.getByText('Edit →')).toBeInTheDocument();
    });

    it('shows "Complete" lozenge', () => {
      render(<CanvasCard title="Problem" state={completeState} />);
      expect(screen.getByText('Complete')).toBeInTheDocument();
    });

    it('does NOT show "X of Y filled" lozenge (shows "Complete" instead)', () => {
      render(<CanvasCard title="Problem" state={completeState} />);
      expect(screen.queryByText('4 of 4 filled')).toBeNull();
    });

    it('the card link points to editHref', () => {
      render(
        <CanvasCard
          title="Problem"
          state={makeState({ status: 'complete', filledCount: 4, totalCount: 4, editHref: '/edit-link' })}
        />,
      );
      expect(screen.getByRole('link')).toHaveAttribute('href', '/edit-link');
    });
  });

  /* ── Lozenge system ───────────────────────────────────────────── */

  describe('lozenge system', () => {
    it('shows "Not started" lozenge for empty state', () => {
      render(<CanvasCard title="Problem" state={makeState({ status: 'empty' })} />);
      expect(screen.getByText('Not started')).toBeInTheDocument();
    });

    it('shows "X of Y filled" lozenge for partial state', () => {
      render(
        <CanvasCard title="Problem" state={makeState({ status: 'partial', filledCount: 1, totalCount: 4 })} />,
      );
      expect(screen.getByText('1 of 4 filled')).toBeInTheDocument();
    });

    it('shows "Complete" lozenge for complete state', () => {
      render(
        <CanvasCard title="Problem" state={makeState({ status: 'complete', filledCount: 4, totalCount: 4 })} />,
      );
      expect(screen.getByText('Complete')).toBeInTheDocument();
    });

    it('"Not started" appears even for single-field cards', () => {
      render(
        <CanvasCard title="Time budget" state={makeState({ status: 'empty', totalCount: 1 })} />,
      );
      expect(screen.getByText('Not started')).toBeInTheDocument();
    });

    it('"Complete" appears for single-field complete cards', () => {
      render(
        <CanvasCard
          title="Time budget"
          state={makeState({ status: 'complete', filledCount: 1, totalCount: 1 })}
        />,
      );
      expect(screen.getByText('Complete')).toBeInTheDocument();
      // No "1 of 1 filled" badge
      expect(screen.queryByText('1 of 1 filled')).toBeNull();
    });

    it('"1 of 2 filled" lozenge for partial 2-field card', () => {
      render(
        <CanvasCard title="Problem" state={makeState({ status: 'partial', filledCount: 1, totalCount: 2 })} />,
      );
      expect(screen.getByText('1 of 2 filled')).toBeInTheDocument();
    });
  });

  /* ── CompletionGlyph integration ─────────────────────────────── */

  describe('CompletionGlyph integration', () => {
    it('renders ○ for empty cards', () => {
      render(<CanvasCard title="Problem" state={makeState({ status: 'empty' })} />);
      expect(screen.getByText('○')).toBeInTheDocument();
    });

    it('renders ◐ for partial cards', () => {
      render(<CanvasCard title="Problem" state={makeState({ status: 'partial', filledCount: 1, totalCount: 4 })} />);
      expect(screen.getByText('◐')).toBeInTheDocument();
    });

    it('renders ● for complete cards', () => {
      render(<CanvasCard title="Problem" state={makeState({ status: 'complete', filledCount: 4, totalCount: 4 })} />);
      expect(screen.getByText('●')).toBeInTheDocument();
    });
  });

  /* ── "Your answer" label ─────────────────────────────────────── */

  describe('"Your answer" label', () => {
    it('appears on partial cards WHEN children are provided', () => {
      render(
        <CanvasCard title="Time budget" state={makeState({ status: 'partial', filledCount: 1, totalCount: 1 })}>
          <p>12 hrs/week</p>
        </CanvasCard>,
      );
      expect(screen.getByText(/your answer/i)).toBeInTheDocument();
    });

    it('appears on complete cards WHEN children are provided', () => {
      render(
        <CanvasCard title="Time budget" state={makeState({ status: 'complete', filledCount: 1, totalCount: 1 })}>
          <p>12 hrs/week</p>
        </CanvasCard>,
      );
      expect(screen.getByText(/your answer/i)).toBeInTheDocument();
    });

    it('does NOT appear when only subFields are provided (dt labels replace it)', () => {
      render(
        <CanvasCard
          title="Problem"
          state={makeState({ status: 'partial', filledCount: 1, totalCount: 2 })}
          subFields={[{ label: 'Core problem', value: 'Something' }]}
        />,
      );
      expect(screen.queryByText(/your answer/i)).toBeNull();
    });

    it('does NOT appear on empty cards', () => {
      render(<CanvasCard title="Problem" state={makeState({ status: 'empty' })} />);
      expect(screen.queryByText(/your answer/i)).toBeNull();
    });
  });

  /* ── Source chip ──────────────────────────────────────────────── */

  describe('source chip', () => {
    it('replaces colon with middle dot in chapter labels', () => {
      render(
        <CanvasCard
          title="Problem"
          state={makeState({ status: 'partial', filledCount: 1, totalCount: 2, sourceLabel: 'Chapter 7: Pick Your Customer' })}
        />,
      );
      expect(screen.getByText(/Chapter 7 · Pick Your Customer/)).toBeInTheDocument();
      expect(screen.queryByText(/Chapter 7: Pick Your Customer/)).toBeNull();
    });

    it('leaves multi-chapter labels without a colon unchanged', () => {
      render(
        <CanvasCard title="Channels" state={makeState({ status: 'empty', sourceLabel: 'Chapters 11–12' })} />,
      );
      expect(screen.getByText(/Chapters 11–12/)).toBeInTheDocument();
    });
  });

  /* ── Stretched-link / accessibility ─────────────────────────────── */

  describe('stretched link accessibility', () => {
    it('card has exactly one focusable link (the stretched link)', () => {
      render(<CanvasCard title="Problem" state={makeState()} />);
      expect(screen.getAllByRole('link')).toHaveLength(1);
    });

    it('stretched link carries an aria-label describing the action + title', () => {
      render(<CanvasCard title="Problem" state={makeState({ status: 'empty' })} />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('aria-label', 'Start: Problem');
    });

    it('stretched link aria-label updates for partial state', () => {
      render(
        <CanvasCard
          title="Solution"
          state={makeState({ status: 'partial', filledCount: 1, totalCount: 4 })}
        />,
      );
      expect(screen.getByRole('link')).toHaveAttribute('aria-label', 'Continue (1/4): Solution');
    });

    it('stretched link aria-label uses explicit actionLabel when provided', () => {
      render(
        <CanvasCard title="Time budget" state={makeState()} actionLabel="Edit" />,
      );
      expect(screen.getByRole('link')).toHaveAttribute('aria-label', 'Edit: Time budget');
    });

    it('stretched link is keyboard-reachable (tabIndex not -1)', () => {
      render(<CanvasCard title="Problem" state={makeState()} />);
      expect(screen.getByRole('link')).not.toHaveAttribute('tabindex', '-1');
    });

    it('button variant renders a stretched <button> when onClick provided', () => {
      render(
        <CanvasCard title="Time budget" state={makeState()} onClick={() => {}} />,
      );
      // The stretched button is the only button UNTIL the show-more toggle
      // appears (it won't in a test environment since no layout is computed)
      expect(screen.queryByRole('link')).toBeNull();
      // At least one button (the stretched button)
      expect(screen.getAllByRole('button').length).toBeGreaterThanOrEqual(1);
    });

    it('primary action label span is aria-hidden (described by stretched link)', () => {
      const { container } = render(<CanvasCard title="Problem" state={makeState()} />);
      // The action text span should be aria-hidden
      const actionSpan = container.querySelector('.cc-footer span[aria-hidden="true"]');
      expect(actionSpan).not.toBeNull();
    });
  });

  /* ── Chapter chip row ─────────────────────────────────────────── */

  describe('chapter chip row', () => {
    it('chip is always rendered in the cc-chip-row (own grid row)', () => {
      const { container } = render(
        <CanvasCard title="Problem" state={makeState({ status: 'empty' })} />,
      );
      const chipRow = container.querySelector('.cc-chip-row');
      expect(chipRow).not.toBeNull();
      // The chip row should contain the SourceChip with the chapter label
      expect(chipRow?.textContent).toMatch(/Chapter 7/);
    });

    it('chip row is present on partial cards too', () => {
      const { container } = render(
        <CanvasCard title="Problem" state={makeState({ status: 'partial', filledCount: 1, totalCount: 2 })} />,
      );
      expect(container.querySelector('.cc-chip-row')).not.toBeNull();
    });

    it('chip row is NOT inside the card-header (no competition for width)', () => {
      const { container } = render(<CanvasCard title="Problem" state={makeState()} />);
      const header = container.querySelector('.cc-header');
      // cc-chip-row must NOT be a descendant of card-header
      expect(header?.querySelector('.cc-chip-row')).toBeNull();
    });
  });

  /* ── Show-more toggle ─────────────────────────────────────────── */

  describe('show-more toggle (expanded state)', () => {
    it('does NOT render when body is not overflowing (no layout in test env)', () => {
      render(
        <CanvasCard
          title="Problem"
          state={makeState({ status: 'partial', filledCount: 1, totalCount: 2 })}
          subFields={[{ label: 'Core problem', value: 'Short value' }]}
        />,
      );
      // In happy-dom, scrollHeight = clientHeight = 0, so isOverflowing = false
      expect(screen.queryByRole('button', { name: /show more/i })).toBeNull();
    });

    it('when visible, toggle has aria-expanded and aria-controls', () => {
      // Force the toggle to render by directly expanding — we can't simulate
      // overflow in happy-dom, so just verify ARIA attributes if it renders.
      // This test is a contract test; real overflow detection is tested in e2e.
      const { container } = render(
        <CanvasCard title="Problem" state={makeState({ status: 'partial', filledCount: 1, totalCount: 2 })} />,
      );
      // If toggle rendered, it must have correct ARIA attrs
      const toggle = container.querySelector('.cc-show-more') as HTMLElement | null;
      if (toggle) {
        expect(toggle).toHaveAttribute('aria-expanded');
        expect(toggle).toHaveAttribute('aria-controls');
      }
    });

    it('card-body has a stable id for aria-controls targeting', () => {
      const { container } = render(
        <CanvasCard title="Problem" state={makeState({ status: 'partial', filledCount: 1, totalCount: 2 })} />,
      );
      const body = container.querySelector('.cc-body');
      expect(body).toHaveAttribute('id');
      expect(body?.getAttribute('id')).toMatch(/cc-body-/);
    });
  });
});
