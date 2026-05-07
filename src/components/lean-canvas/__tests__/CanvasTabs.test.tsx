import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CanvasTabs, CanvasTabPanel } from '../CanvasTabs';

const TABS = [
  { id: 'operating', label: 'Operating rules', filledCount: 5, totalCount: 8 },
  { id: 'business',  label: 'Business model',  filledCount: 3, totalCount: 8 },
];

// Stub history.replaceState so we can assert on URL updates without a real browser
const replaceStateSpy = vi.spyOn(window.history, 'replaceState').mockImplementation(() => {});

beforeEach(() => {
  replaceStateSpy.mockClear();
});

describe('CanvasTabs', () => {
  describe('tablist ARIA structure', () => {
    it('renders a tablist with the correct aria-label', () => {
      render(<CanvasTabs tabs={TABS} initialTab="operating" />);
      expect(screen.getByRole('tablist', { name: /canvas layer navigation/i })).toBeInTheDocument();
    });

    it('renders a tab for each entry', () => {
      render(<CanvasTabs tabs={TABS} initialTab="operating" />);
      expect(screen.getAllByRole('tab')).toHaveLength(2);
    });

    it('marks the initial tab as selected', () => {
      render(<CanvasTabs tabs={TABS} initialTab="operating" />);
      const [operating, business] = screen.getAllByRole('tab');
      expect(operating).toHaveAttribute('aria-selected', 'true');
      expect(business).toHaveAttribute('aria-selected', 'false');
    });

    it('each tab button has aria-controls pointing to its panel', () => {
      render(
        <CanvasTabs tabs={TABS} initialTab="operating">
          <CanvasTabPanel id="operating"><p>Op content</p></CanvasTabPanel>
          <CanvasTabPanel id="business"><p>Biz content</p></CanvasTabPanel>
        </CanvasTabs>,
      );
      const [operatingBtn] = screen.getAllByRole('tab');
      const controlledId = operatingBtn.getAttribute('aria-controls')!;
      expect(document.getElementById(controlledId)).toBeInTheDocument();
    });
  });

  describe('tab labels and badges', () => {
    it('renders tab labels', () => {
      render(<CanvasTabs tabs={TABS} initialTab="operating" />);
      expect(screen.getByText('Operating rules')).toBeInTheDocument();
      expect(screen.getByText('Business model')).toBeInTheDocument();
    });

    it('renders "X of Y started" badge text via FillBadge', () => {
      render(<CanvasTabs tabs={TABS} initialTab="operating" />);
      expect(screen.getByText('5 of 8 started')).toBeInTheDocument();
      expect(screen.getByText('3 of 8 started')).toBeInTheDocument();
    });

    it('does not render badges when counts are omitted', () => {
      const tabsNoCounts = [
        { id: 'a', label: 'Tab A' },
        { id: 'b', label: 'Tab B' },
      ];
      render(<CanvasTabs tabs={tabsNoCounts} initialTab="a" />);
      // The badge spans are absent — no text matching a fraction pattern
      expect(screen.queryByText(/\d+\/\d+/)).toBeNull();
    });
  });

  describe('switching tabs', () => {
    it('updates aria-selected when a tab is clicked', async () => {
      const user = userEvent.setup();
      render(
        <CanvasTabs tabs={TABS} initialTab="operating">
          <CanvasTabPanel id="operating"><p>Op</p></CanvasTabPanel>
          <CanvasTabPanel id="business"><p>Biz</p></CanvasTabPanel>
        </CanvasTabs>,
      );

      const [, businessBtn] = screen.getAllByRole('tab');
      await user.click(businessBtn);

      expect(businessBtn).toHaveAttribute('aria-selected', 'true');
      const [operatingBtn] = screen.getAllByRole('tab');
      expect(operatingBtn).toHaveAttribute('aria-selected', 'false');
    });

    it('shows the panel for the active tab and hides others', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <CanvasTabs tabs={TABS} initialTab="operating">
          <CanvasTabPanel id="operating"><p>Operating content</p></CanvasTabPanel>
          <CanvasTabPanel id="business"><p>Business content</p></CanvasTabPanel>
        </CanvasTabs>,
      );

      // Query panel divs directly — `getByRole('tabpanel')` cannot see HTML-
      // hidden elements even with { hidden: true }, so we use the DOM directly.
      const panelDivs = container.querySelectorAll('[role="tabpanel"]');
      const operatingPanel = panelDivs[0]!;
      const businessPanel  = panelDivs[1]!;

      // Operating tab is active initially
      expect(operatingPanel).not.toHaveAttribute('hidden');
      expect(businessPanel).toHaveAttribute('hidden');

      // Switch to business
      await user.click(screen.getAllByRole('tab')[1]!);
      expect(businessPanel).not.toHaveAttribute('hidden');
      expect(operatingPanel).toHaveAttribute('hidden');
    });

    it('calls history.replaceState with the new tab id', async () => {
      const user = userEvent.setup();
      render(<CanvasTabs tabs={TABS} initialTab="operating" paramName="tab" />);

      await user.click(screen.getAllByRole('tab')[1]!);

      expect(replaceStateSpy).toHaveBeenCalledOnce();
      // The URL passed to replaceState should contain tab=business
      const calledUrl: string = replaceStateSpy.mock.calls[0]![2] as string;
      expect(calledUrl).toContain('tab=business');
    });

    it('uses a custom paramName when provided', async () => {
      const user = userEvent.setup();
      render(<CanvasTabs tabs={TABS} initialTab="operating" paramName="view" />);

      await user.click(screen.getAllByRole('tab')[1]!);
      const calledUrl: string = replaceStateSpy.mock.calls[0]![2] as string;
      expect(calledUrl).toContain('view=business');
    });
  });

  describe('keyboard navigation', () => {
    it('moves to next tab on ArrowRight', async () => {
      const user = userEvent.setup();
      render(<CanvasTabs tabs={TABS} initialTab="operating" />);

      const [operatingBtn] = screen.getAllByRole('tab');
      operatingBtn!.focus();
      await user.keyboard('{ArrowRight}');

      const [, businessBtn] = screen.getAllByRole('tab');
      expect(businessBtn).toHaveAttribute('aria-selected', 'true');
    });

    it('wraps from last tab to first on ArrowRight', async () => {
      const user = userEvent.setup();
      render(<CanvasTabs tabs={TABS} initialTab="business" />);

      const [, businessBtn] = screen.getAllByRole('tab');
      businessBtn!.focus();
      await user.keyboard('{ArrowRight}');

      const [operatingBtn] = screen.getAllByRole('tab');
      expect(operatingBtn).toHaveAttribute('aria-selected', 'true');
    });

    it('moves to previous tab on ArrowLeft', async () => {
      const user = userEvent.setup();
      render(<CanvasTabs tabs={TABS} initialTab="business" />);

      const [, businessBtn] = screen.getAllByRole('tab');
      businessBtn!.focus();
      await user.keyboard('{ArrowLeft}');

      const [operatingBtn] = screen.getAllByRole('tab');
      expect(operatingBtn).toHaveAttribute('aria-selected', 'true');
    });

    it('jumps to first tab on Home', async () => {
      const user = userEvent.setup();
      render(<CanvasTabs tabs={TABS} initialTab="business" />);

      const [, businessBtn] = screen.getAllByRole('tab');
      businessBtn!.focus();
      await user.keyboard('{Home}');

      const [operatingBtn] = screen.getAllByRole('tab');
      expect(operatingBtn).toHaveAttribute('aria-selected', 'true');
    });

    it('jumps to last tab on End', async () => {
      const user = userEvent.setup();
      render(<CanvasTabs tabs={TABS} initialTab="operating" />);

      const [operatingBtn] = screen.getAllByRole('tab');
      operatingBtn!.focus();
      await user.keyboard('{End}');

      const [, businessBtn] = screen.getAllByRole('tab');
      expect(businessBtn).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('CanvasTabPanel', () => {
    it('renders with role="tabpanel"', () => {
      render(
        <CanvasTabs tabs={TABS} initialTab="operating">
          <CanvasTabPanel id="operating"><p>Content</p></CanvasTabPanel>
        </CanvasTabs>,
      );
      expect(screen.getByRole('tabpanel')).toBeInTheDocument();
    });

    it('throws if rendered outside CanvasTabs', () => {
      // Suppress the console.error from React's error boundary output
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => {
        render(<CanvasTabPanel id="foo"><p>Oops</p></CanvasTabPanel>);
      }).toThrow('<CanvasTabPanel> must be rendered inside <CanvasTabs>.');
      errorSpy.mockRestore();
    });
  });
});
