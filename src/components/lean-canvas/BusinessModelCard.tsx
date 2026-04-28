'use client';

import Link from 'next/link';
import { useCallback, useState } from 'react';
import { CanvasCard } from './CanvasCard';
import { canvasPreferences } from './CanvasPreferences';
import type { CanvasSectionState } from './types';
import type { SubField, CardVariant } from './CanvasCard';

/* ── Types ─────────────────────────────────────────────────────────── */

export interface BusinessModelCardProps {
  sectionId: string;
  title: string;
  description?: string;
  state: CanvasSectionState;
  subFields?: SubField[];
  children?: React.ReactNode;
  variant?: CardVariant;
  /** Extra classes including the grid-area class (e.g. "area-prob"). */
  className?: string;
}

/* ── Shared card shell ────────────────────────────────────────────── */

const CARD_SHELL =
  'canvas-card';  /* CSS handles bg, border, grid layout */

/* ── Component ──────────────────────────────────────────────────────── */

/**
 * BusinessModelCard — wraps CanvasCard with "Skip for now" / "Bring this back".
 *
 * States:
 *   empty    → article card with a real "Start →" anchor + "Skip for now" button
 *   skipped  → article card with data-skipped="true"; CSS compresses internals
 *   partial  → delegates to CanvasCard
 *   complete → delegates to CanvasCard
 *
 * data-skipped="true" is set on the root element so CSS selectors can compress
 * the chapter chip, body, and hide the secondary CTA without any grid reflow
 * (the grid-area stays assigned, only internals change).
 */
export function BusinessModelCard({
  sectionId,
  title,
  description,
  state,
  subFields,
  children,
  variant = 'tall',
  className = '',
}: BusinessModelCardProps) {
  const { status, editHref, sourceLabel } = state;

  const [skippedIds, setSkippedIds] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set();
    return new Set(canvasPreferences.getSkippedIds());
  });

  const isSkipped = skippedIds.has(sectionId);

  const handleSkip = useCallback(() => {
    canvasPreferences.setSkipped(sectionId, true);
    setSkippedIds((prev) => new Set([...prev, sectionId]));
  }, [sectionId]);

  const handleBringBack = useCallback(() => {
    canvasPreferences.setSkipped(sectionId, false);
    setSkippedIds((prev) => {
      const next = new Set(prev);
      next.delete(sectionId);
      return next;
    });
  }, [sectionId]);

  /* Format source label (colon → middle dot) */
  const chipLabel = formatSourceLabel(sourceLabel);

  /* ── Skipped state ──────────────────────────────────────────────── */

  if (isSkipped) {
    return (
      <article
        data-skipped="true"
        data-variant={variant}
        className={`${CARD_SHELL} variant-${variant} ${className}`}
      >
        {/* Row 1: header */}
        <header className="cc-header">
          <h3 className="cc-title">{title}</h3>
          <div className="cc-header-meta">
            <span className="cc-status-pill" data-state="not-started">
              Skipped
            </span>
            <span className="cc-indicator select-none text-ink-300" aria-hidden="true">⊘</span>
          </div>
        </header>

        {/* Row 2: chip */}
        <div className="cc-chip-row">
          <span className="cc-chapter-chip">
            <span aria-hidden="true">📘</span>
            {chipLabel}
          </span>
        </div>

        {/* Row 3: body */}
        <div className="cc-body">
          <p className="text-sm italic leading-relaxed text-ink-500">
            Skipped for now. Fill it in when you&apos;re ready.
          </p>
        </div>

        {/* Row 4: no toggle */}

        {/* Row 5: footer */}
        <footer className="cc-footer">
          <button
            type="button"
            onClick={handleBringBack}
            className="btn inline-flex items-center justify-center rounded-lg border border-ink-100 bg-surface-raised px-3 py-1.5 text-xs font-semibold text-cobalt-600 hover:bg-surface-sunken hover:border-cobalt-500 transition-colors duration-150"
          >
            <span className="btn-label">Bring this back</span>
          </button>
        </footer>
      </article>
    );
  }

  /* ── Empty state — card is a div with real interactive CTAs ─────── */

  if (status === 'empty') {
    return (
      <article
        data-variant={variant}
        className={`${CARD_SHELL} variant-${variant} ${className}`}
      >
        {/* Row 1: header */}
        <header className="cc-header">
          <h3 className="cc-title">{title}</h3>
          <div className="cc-header-meta">
            <span className="cc-status-pill" data-state="not-started">
              Not started
            </span>
            <span className="cc-indicator select-none text-ink-300" aria-hidden="true">○</span>
          </div>
        </header>

        {/* Row 2: chip */}
        <div className="cc-chip-row">
          <span className="cc-chapter-chip">
            <span aria-hidden="true">📘</span>
            {chipLabel}
          </span>
        </div>

        {/* Row 3: body */}
        <div className="cc-body">
          {description && (
            <p className="text-sm italic leading-relaxed text-ink-500">{description}</p>
          )}
        </div>

        {/* Row 4: no toggle */}

        {/* Row 5: footer — real anchor + skip button */}
        <footer className="cc-footer">
          <Link
            href={editHref}
            className="btn inline-flex items-center justify-center rounded-lg bg-cobalt-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-cobalt-700 transition-colors duration-150"
          >
            Start →
          </Link>
          <button
            type="button"
            onClick={handleSkip}
            className="btn btn-secondary inline-flex items-center text-xs text-ink-500 underline underline-offset-4 hover:text-ink-900 transition-colors duration-150"
          >
            <span className="btn-label">Skip for now</span>
          </button>
        </footer>
      </article>
    );
  }

  /* ── Partial / Complete — delegate to CanvasCard ────────────────── */

  return (
    <CanvasCard
      title={title}
      description={description}
      state={state}
      subFields={subFields}
      variant={variant}
      className={className}
    >
      {children}
    </CanvasCard>
  );
}

/* ── Helpers ─────────────────────────────────────────────────────── */

function formatSourceLabel(label: string): string {
  const idx = label.indexOf(': ');
  return idx !== -1 ? `${label.slice(0, idx)} · ${label.slice(idx + 2)}` : label;
}
