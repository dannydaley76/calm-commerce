/**
 * tab-events — lightweight pub/sub for canvas tab switches.
 *
 * CanvasTabs fires TAB_CHANGE_EVENT via dispatchTabChange() whenever the
 * active tab changes.  Components outside the CanvasTabs tree (e.g.
 * CanvasHeroOperatingAction in the hero section) subscribe with
 * subscribeToTabChange() to stay in sync without a shared React context.
 *
 * This is a DOM CustomEvent approach — no third-party state library required.
 * Server-side safety: all helpers are no-ops when window is undefined.
 */

export const TAB_CHANGE_EVENT = 'canvas:tabchange' as const;

export interface TabChangeDetail {
  tabId: string;
}

/** Fired by CanvasTabs when the active tab changes. */
export function dispatchTabChange(tabId: string): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<TabChangeDetail>(TAB_CHANGE_EVENT, { detail: { tabId } }),
  );
}

/**
 * Subscribe to tab change events.
 * Returns an unsubscribe function — call it in your useEffect cleanup.
 *
 * @example
 * useEffect(() => {
 *   return subscribeToTabChange((tabId) => setActiveTab(tabId));
 * }, []);
 */
export function subscribeToTabChange(cb: (tabId: string) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = (e: Event) => cb((e as CustomEvent<TabChangeDetail>).detail.tabId);
  window.addEventListener(TAB_CHANGE_EVENT, handler);
  return () => window.removeEventListener(TAB_CHANGE_EVENT, handler);
}
