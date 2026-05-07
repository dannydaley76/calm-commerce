'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useId,
} from 'react';
import { FillBadge } from './FillBadge';
import { dispatchTabChange } from './tab-events';

/* ── Types ───────────────────────────────────────────────────────────── */

export interface CanvasTab {
  id: string;
  label: string;
  /** Optional badge counts rendered inside each tab button. */
  filledCount?: number;
  totalCount?: number;
}

export interface CanvasTabsProps {
  tabs: CanvasTab[];
  /**
   * The tab id that is active on first render.
   * Should be derived server-side from `searchParams.tab` and passed in,
   * which avoids the hydration mismatch that would arise from reading
   * `window.location.search` inside `useState`.
   */
  initialTab?: string;
  /**
   * The query-string parameter name that holds the active tab.
   * Defaults to `"tab"`.
   */
  paramName?: string;
  /**
   * Tab panel content. Wrap each panel in a <CanvasTabPanel id="…"> so
   * the tabs context knows which panel to show.
   */
  children?: React.ReactNode;
}

export interface CanvasTabPanelProps {
  /** Must match one of the tab ids passed to the parent <CanvasTabs>. */
  id: string;
  children: React.ReactNode;
}

/* ── Context ─────────────────────────────────────────────────────────── */

interface TabsContextValue {
  activeTab: string;
  /** Unique id prefix for generating aria-controls / id pairs. */
  uid: string;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext(component: string): TabsContextValue {
  const ctx = useContext(TabsContext);
  if (!ctx) {
    throw new Error(`<${component}> must be rendered inside <CanvasTabs>.`);
  }
  return ctx;
}

/* ── Helpers ─────────────────────────────────────────────────────────── */

function tabId(uid: string, tabId: string) {
  return `${uid}-tab-${tabId}`;
}

function panelId(uid: string, tabId: string) {
  return `${uid}-panel-${tabId}`;
}

function updateUrlParam(paramName: string, value: string): void {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  url.searchParams.set(paramName, value);
  // replaceState: no new history entry, no scroll-position loss,
  // no server round-trip. The URL stays shareable.
  window.history.replaceState({}, '', url.toString());
}

/* ── CanvasTabPanel ──────────────────────────────────────────────────── */

/**
 * Renders its children only when its `id` matches the currently active tab.
 * Must be a direct or indirect child of <CanvasTabs>.
 *
 * @example
 * <CanvasTabPanel id="operating">…operating content…</CanvasTabPanel>
 */
export function CanvasTabPanel({ id: panelTabId, children }: CanvasTabPanelProps) {
  const { activeTab, uid } = useTabsContext('CanvasTabPanel');
  const isActive = activeTab === panelTabId;

  return (
    <div
      role="tabpanel"
      id={panelId(uid, panelTabId)}
      aria-labelledby={tabId(uid, panelTabId)}
      hidden={!isActive}
      tabIndex={isActive ? 0 : -1}
    >
      {/* Always render children — hidden via `hidden` attr — so server
          HTML is stable and there are no content flash issues. */}
      {children}
    </div>
  );
}

/* ── CanvasTabs ──────────────────────────────────────────────────────── */

/**
 * Accessible tablist for the Lean Canvas page.
 *
 * ARIA contract
 * ─────────────
 * • The tab bar renders with `role="tablist"`.
 * • Each button has `role="tab"`, `aria-selected`, and `aria-controls`
 *   pointing to its panel.
 * • Each panel (via <CanvasTabPanel>) has `role="tabpanel"` and
 *   `aria-labelledby` pointing back to its tab.
 *
 * Navigation
 * ──────────
 * Switching tabs calls `window.history.replaceState` directly — no Next.js
 * router involved, no server round-trip, no scroll-position loss.
 * The `?tab=…` parameter stays in the URL for shareability; the server page
 * reads it through `searchParams` and passes the result as `initialTab`.
 *
 * Keyboard
 * ────────
 * ArrowLeft / ArrowRight cycle through tabs (ARIA keyboard pattern).
 * Home / End jump to first / last tab.
 *
 * @example
 * // In your server page:
 * const activeTab = searchParams.tab === 'business' ? 'business' : 'operating';
 *
 * // In the rendered JSX:
 * <CanvasTabs tabs={tabs} initialTab={activeTab} paramName="tab">
 *   <CanvasTabPanel id="operating">…</CanvasTabPanel>
 *   <CanvasTabPanel id="business">…</CanvasTabPanel>
 * </CanvasTabs>
 */
export function CanvasTabs({
  tabs,
  initialTab,
  paramName = 'tab',
  children,
}: CanvasTabsProps) {
  const uid = useId();
  const firstTabId = tabs[0]?.id ?? '';

  const [activeTab, setActiveTab] = useState<string>(
    () => initialTab ?? firstTabId,
  );

  // Keep state in sync if the parent re-renders with a different initialTab
  // (e.g. after a server-side navigation). Don't run on mount — that would
  // overwrite the client state set from the URL.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  useEffect(() => {
    if (mounted && initialTab !== undefined) {
      setActiveTab(initialTab);
    }
    // We intentionally only react to initialTab changes, not `mounted`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTab]);

  const handleTabClick = useCallback(
    (id: string) => {
      setActiveTab(id);
      updateUrlParam(paramName, id);
      dispatchTabChange(id);
    },
    [paramName],
  );

  /** ARIA keyboard navigation — roving focus within the tablist. */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
      const last = tabs.length - 1;
      let nextIndex: number | null = null;

      switch (e.key) {
        case 'ArrowRight':
          nextIndex = currentIndex < last ? currentIndex + 1 : 0;
          break;
        case 'ArrowLeft':
          nextIndex = currentIndex > 0 ? currentIndex - 1 : last;
          break;
        case 'Home':
          nextIndex = 0;
          break;
        case 'End':
          nextIndex = last;
          break;
        default:
          return;
      }

      e.preventDefault();
      const nextTab = tabs[nextIndex];
      if (nextTab) {
        handleTabClick(nextTab.id);
        // Move browser focus to the newly selected tab button
        const el = document.getElementById(tabId(uid, nextTab.id));
        el?.focus();
      }
    },
    [tabs, handleTabClick, uid],
  );

  return (
    <TabsContext.Provider value={{ activeTab, uid }}>
      {/* Tab bar */}
      <div
        role="tablist"
        aria-label="Canvas layer navigation"
        className="flex flex-wrap gap-3"
      >
        {tabs.map((tab, index) => {
          const isSelected = activeTab === tab.id;
          const hasCounts =
            tab.filledCount !== undefined && tab.totalCount !== undefined;

          return (
            <button
              key={tab.id}
              id={tabId(uid, tab.id)}
              role="tab"
              aria-selected={isSelected}
              aria-controls={panelId(uid, tab.id)}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => handleTabClick(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={[
                // ── Base (all states) ──────────────────────────────────────────
                'inline-flex min-h-[44px] items-center gap-2 rounded-xl px-5 py-2.5',
                'text-sm font-semibold',
                'transition-[background-color,border-color,box-shadow,color,transform]',
                'duration-150 ease-out',
                // Disable the hover border flash from the global button rule
                'hover:border-current',
                // Focus ring (both states)
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500 focus-visible:ring-offset-2',
                // Disabled
                'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',

                isSelected
                  // ── Active tab ────────────────────────────────────────────
                  ? [
                      'bg-cobalt-600 text-white',
                      'border border-cobalt-700',
                      'shadow-[0_6px_14px_rgba(0,73,207,0.25)]',
                      // Active hover: go darker, no transform
                      'hover:bg-cobalt-700',
                    ].join(' ')
                  // ── Inactive tab ──────────────────────────────────────────
                  : [
                      'bg-surface-raised text-ink-700',
                      'border border-ink-100',
                      // Inactive hover: sunken bg, cobalt accent border, pop up
                      'hover:bg-surface-sunken hover:border-cobalt-500 hover:text-ink-900',
                      'motion-safe:hover:-translate-y-px',
                    ].join(' '),
              ].join(' ')}
            >
              <span>{tab.label}</span>

              {hasCounts && (
                <FillBadge
                  filled={tab.filledCount!}
                  total={tab.totalCount!}
                  label="started"
                  className={
                    isSelected
                      ? 'bg-white/15 text-white'
                      : 'bg-cobalt-100 text-cobalt-700'
                  }
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Separator — 1px line between the tablist and the active panel */}
      <div aria-hidden="true" className="mt-6 border-t border-ink-100" />

      {/* Tab panels — rendered by <CanvasTabPanel> children */}
      <div className="mt-6">{children}</div>
    </TabsContext.Provider>
  );
}
