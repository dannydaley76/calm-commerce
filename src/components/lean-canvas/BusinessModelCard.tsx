'use client';

import Link from 'next/link';
import { useCallback, useState } from 'react';
import { CanvasCard } from './CanvasCard';
import { SourceChip } from './SourceChip';
import { canvasPreferences } from './CanvasPreferences';
import type { CanvasSectionState } from './types';
import type { SubField } from './CanvasCard';

/* ── Types ─────────────────────────────────────────────────────────── */

export interface BusinessModelCardProps {
  /** Stable section ID — used as the skip-state key. */
  sectionId: string;
  title: string;
  description?: string;
  state: CanvasSectionState;
  /** All sub-fields, filled or not (null → "Not yet"). */
  subFields?: SubField[];
  /** Extra content (e.g. unit economics block for Cost Structure). */
  children?: React.ReactNode;
  className?: string;
}

/* ── Shared card-shell classes ────────────────────────────────────── */
/*
 * All four states (empty, skipped, partial, complete) share one card
 * surface: bg-surface-raised (white) with a 1px ink-100 border.
 *
 * State is signalled by the lozenge + glyph inside the card, never by
 * changing the card background — that's what was causing SourceChip to
 * disappear (chip = surface-sunken on a surface-sunken card = invisible).
 */

const CARD_SHELL =
  'flex flex-col rounded-[1.5rem] bg-surface-raised border border-ink-100 ' +
  'shadow-card min-h-[280px] transition-[box-shadow] duration-150';

/* ── Skip glyph ───────────────────────────────────────────────────── */

function SkipGlyph({ className = '' }: { className?: string }) {
  return (
    <span
      className={`select-none text-lg leading-none shrink-0 text-ink-300 ${className}`}
      aria-label="Skipped"
      role="img"
      title="Skipped"
    >
      ⊘
    </span>
  );
}

/* ── Component ──────────────────────────────────────────────────────── */

/**
 * BusinessModelCard — wraps CanvasCard with a "Skip for now" affordance on
 * empty sections, and a "Bring this back" affordance on skipped sections.
 *
 * Four states
 * ──────────
 * empty    → card is a <div> with a real "Start →" anchor + "Skip for now"
 *            button on a separate row below the footer grid.
 * skipped  → same white card, ⊘ glyph, italic body, "Bring this back" button.
 * partial  → delegates to CanvasCard.
 * complete → delegates to CanvasCard.
 *
 * Skip persistence
 * ────────────────
 * Uses `canvasPreferences` (currently localStorage, swappable via
 * CanvasPreferences.ts). Initial state is read lazily on the client.
 */
export function BusinessModelCard({
  sectionId,
  title,
  description,
  state,
  subFields,
  children,
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
    setSkippedIds((prev) => new Set([...(prev ?? []), sectionId]));
  }, [sectionId]);

  const handleBringBack = useCallback(() => {
    canvasPreferences.setSkipped(sectionId, false);
    setSkippedIds((prev) => {
      if (!prev) return prev;
      const next = new Set(prev);
      next.delete(sectionId);
      return next;
    });
  }, [sectionId]);

  /* ── Skipped state ──────────────────────────────────────────────── */

  if (isSkipped) {
    return (
      <div className={`${CARD_SHELL} ${className}`}>
        <div className="flex flex-col gap-4 p-5 md:p-6 min-h-[280px]">

          {/* HEADER */}
          <div className="grid gap-2">
            <p className="text-xs font-bold uppercase tracking-wider text-cobalt-600 leading-tight">
              {title}
            </p>
            <div className="flex items-center justify-between gap-2">
              {/* Skipped lozenge */}
              <span className="inline-flex h-6 items-center rounded-full bg-surface-sunken px-2.5 text-[11px] font-semibold uppercase tracking-wide whitespace-nowrap text-ink-500">
                Skipped
              </span>
              <SkipGlyph />
            </div>
          </div>

          {/* BODY */}
          <div className="flex-1">
            <p className="text-sm italic leading-6 text-ink-500">
              Skipped for now. Fill it in when you&apos;re ready.
            </p>
          </div>

          {/* FOOTER */}
          <div className="mt-auto">
            <div className="grid grid-cols-[1fr_auto] items-center gap-3">
              <SourceChip label={sourceLabel} />
              <button
                type="button"
                onClick={handleBringBack}
                className="inline-flex min-w-[96px] items-center justify-center whitespace-nowrap rounded-lg border border-ink-100 bg-surface-raised px-3 py-1.5 text-xs font-semibold text-cobalt-600 hover:bg-surface-sunken hover:border-cobalt-500 transition-colors duration-150"
              >
                Bring this back
              </button>
            </div>
          </div>

        </div>
      </div>
    );
  }

  /* ── Empty state — real interactive elements inside a div card ──── */

  if (status === 'empty') {
    return (
      <div className={`${CARD_SHELL} ${className}`}>
        <div className="flex flex-col gap-4 p-5 md:p-6 min-h-[280px]">

          {/* HEADER */}
          <div className="grid gap-2">
            <p className="text-xs font-bold uppercase tracking-wider text-cobalt-600 leading-tight">
              {title}
            </p>
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex h-6 items-center rounded-full bg-surface-sunken px-2.5 text-[11px] font-semibold uppercase tracking-wide whitespace-nowrap text-ink-500">
                Not started
              </span>
              {/* ○ glyph (empty = ink-300) */}
              <span
                className="select-none text-lg leading-none shrink-0 text-ink-300"
                aria-hidden="true"
                title="Empty"
              >
                ○
              </span>
            </div>
          </div>

          {/* BODY */}
          <div className="flex-1">
            {description && (
              <p className="text-sm italic leading-6 text-ink-500">{description}</p>
            )}
          </div>

          {/* FOOTER — chip + "Start →" on one row, "Skip for now" on next */}
          <div className="mt-auto">
            <div className="grid grid-cols-[1fr_auto] items-center gap-3">
              <SourceChip label={sourceLabel} />
              {/* Primary action: internal navigation link */}
              <Link
                href={editHref}
                className="inline-flex min-w-[96px] items-center justify-center whitespace-nowrap rounded-lg bg-cobalt-600 px-3 py-1.5 text-xs font-semibold text-white shadow-[0_1px_2px_rgba(11,42,57,0.08)] hover:bg-cobalt-700 transition-colors duration-150"
              >
                Start →
              </Link>
            </div>

            {/* Secondary action — separate row, left-aligned */}
            <div className="mt-3">
              <button
                type="button"
                onClick={handleSkip}
                className="text-xs text-ink-500 underline underline-offset-4 hover:text-ink-900 transition-colors duration-150"
              >
                Skip for now
              </button>
            </div>
          </div>

        </div>
      </div>
    );
  }

  /* ── Partial / Complete — delegate to CanvasCard ────────────────── */

  return (
    <CanvasCard
      title={title}
      description={description}
      state={state}
      subFields={subFields}
      className={className}
    >
      {children}
    </CanvasCard>
  );
}
