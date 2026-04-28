'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { subscribeToTabChange } from './tab-events';

export interface CanvasHeroOperatingActionProps {
  /**
   * The tab that is active on first render, derived server-side from
   * `searchParams.tab`.  Used to set correct initial visibility without
   * causing an SSR/client hydration mismatch.
   */
  initialTab: 'operating' | 'business';
}

/**
 * CanvasHeroOperatingAction — renders an "Edit Founder Rules Sheet" secondary
 * button inside the hero section, visible only when the Operating layer tab
 * is active.
 *
 * Visibility is managed by subscribing to the `canvas:tabchange` custom DOM
 * event fired by CanvasTabs on every tab switch.  This keeps the hero and
 * the tab system loosely coupled — no shared React context required.
 *
 * The button is rendered at the same level as the canvas-level progress bar
 * in page.tsx so it reads as immediately adjacent to the progress indicator.
 */
export function CanvasHeroOperatingAction({ initialTab }: CanvasHeroOperatingActionProps) {
  const [activeTab, setActiveTab] = useState<'operating' | 'business'>(initialTab);

  useEffect(() => {
    // subscribeToTabChange returns an unsubscribe function — use it as cleanup
    return subscribeToTabChange((tabId) => {
      if (tabId === 'operating' || tabId === 'business') {
        setActiveTab(tabId);
      }
    });
  }, []);

  if (activeTab !== 'operating') return null;

  return (
    <div className="mt-4">
      <Link
        href="/chapter/set-your-founder-rules/worksheet"
        className="inline-flex items-center gap-1.5 rounded-lg border border-[rgba(84,90,149,0.25)] px-4 py-[7px] text-xs font-semibold text-[#545a95] transition hover:bg-white"
      >
        Edit Founder Rules Sheet →
      </Link>
    </div>
  );
}
