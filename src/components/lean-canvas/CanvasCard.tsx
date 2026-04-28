'use client';

import { Fragment, useEffect, useId, useRef, useState } from 'react';
import type { CanvasSectionState, SectionStatus } from './types';
import { CompletionGlyph } from './CompletionGlyph';

/* ── Types ─────────────────────────────────────────────────────────── */

export interface SubField {
  label: string;
  /** null → italic muted "Not yet". */
  value: string | null;
}

/**
 * Internal density variant.  Grid placement is owned by the caller
 * via className (e.g. "area-prob"); this prop controls internal padding,
 * body clamping, and dl layout.
 */
export type CardVariant = 'tall' | 'compact' | 'footer-wide';

export interface CanvasCardProps {
  title: string;
  description?: string;
  state: CanvasSectionState;
  /** Override the default state-aware CTA label. */
  actionLabel?: string;
  /** Free-form content — shown before subFields on partial/complete cards. */
  children?: React.ReactNode;
  /** All section fields. null value → "Not yet". */
  subFields?: SubField[];
  /** Defaults to 'tall'. */
  variant?: CardVariant;
  /** Extra classes forwarded to the <article> root (including grid-area). */
  className?: string;
  /**
   * When provided, renders the stretched interactive element as a <button>
   * calling this handler rather than a navigation <a>.
   * Used by InlineEditCard.
   */
  onClick?: () => void;
}

/* ── Overflow detection ─────────────────────────────────────────── */

/**
 * Returns true when ref.current.scrollHeight > clientHeight + 1.
 *
 * Uses useEffect (not useLayoutEffect) to avoid SSR/test-environment
 * issues.  Detection happens after first paint — acceptable since the
 * Show More toggle is purely cosmetic.
 */
function useIsOverflowing(ref: React.RefObject<HTMLDivElement | null>): boolean {
  const [overflowing, setOverflowing] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const check = () => setOverflowing(el.scrollHeight > el.clientHeight + 1);
    check();

    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => {
      // Use RAF to batch ResizeObserver callbacks and avoid layout thrashing
      requestAnimationFrame(check);
    });
    ro.observe(el);
    return () => ro.disconnect();
    // ref.current is stable after mount; omitting from deps is intentional
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return overflowing;
}

/* ── Chevron icon ───────────────────────────────────────────────── */

function Chevron({ up = false }: { up?: boolean }) {
  return (
    <svg
      width="12" height="12" viewBox="0 0 12 12"
      fill="none" aria-hidden="true"
      className={`cc-chevron${up ? ' is-up' : ''}`}
    >
      <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Status-pill state mapping ───────────────────────────────────── */

/** Maps CanvasSectionState status to the data-state attribute on .cc-status-pill.
 *  Colour is driven entirely by CSS variables (see globals.css --cc-pill-* tokens). */
const PILL_STATE: Record<SectionStatus, string> = {
  empty:    'not-started',
  partial:  'in-progress',
  complete: 'complete',
};

const PILL_LABELS: Record<SectionStatus, (f: number, t: number) => string> = {
  empty:    ()     => 'Not started',
  partial:  (f, t) => `${f} of ${t} filled`,
  complete: ()     => 'Complete',
};

/* ── Component ───────────────────────────────────────────────────── */

/**
 * CanvasCard — shared card primitive for both canvas layers.
 *
 * DOM structure:
 *   <article.canvas-card> (4-row grid + position:relative)
 *     <a|button>          ← stretched link at z-0 (whole card clickable)
 *     <header.cc-header>  ← row 1: title | status-pill | glyph
 *     <div.cc-chip-row>   ← row 2: chapter chip (FULL WIDTH, own row)
 *     <div.cc-body>       ← row 3: 1fr, line-clamped per data-variant
 *     <button.cc-show-more> ← row 4: expand toggle (absent = 0-height)
 *     <footer.cc-footer>  ← row 5: flex-wrap CTAs
 *
 * The chapter chip being on its own row (row 2) is the fix for the
 * "C.." truncation — it no longer competes with the status-pill and
 * glyph for horizontal space.
 */
export function CanvasCard({
  title,
  description,
  state,
  actionLabel,
  children,
  subFields,
  variant = 'tall',
  className = '',
  onClick,
}: CanvasCardProps) {
  const { status, filledCount, totalCount, editHref, sourceLabel } = state;
  const label   = actionLabel ?? getDefaultActionLabel(state);
  const isEmpty = status === 'empty';

  /* Expand / show-more */
  const [isExpanded, setIsExpanded] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const isOverflowing = useIsOverflowing(bodyRef);
  const showToggle = isOverflowing || isExpanded;

  /* Stable id for aria-controls ↔ body element */
  const uid        = useId();
  const cardBodyId = `cc-body-${uid.replace(/:/g, '')}`;

  /* Formatted chapter source */
  const chipLabel  = formatSourceLabel(sourceLabel);

  const rootCls = [
    'canvas-card',
    status === 'complete' ? 'is-complete' : '',
    `variant-${variant}`,
    className,
  ].filter(Boolean).join(' ');

  return (
    <article
      className={rootCls}
      data-variant={variant}
      data-expanded={isExpanded ? 'true' : undefined}
    >

      {/* Stretched link / button — absolute inset-0, z-index 0.
          NOT a grid item (position:absolute → taken out of flow).
          Carries the accessible name for screen readers.            */}
      {onClick ? (
        <button
          type="button"
          onClick={onClick}
          aria-label={`${label}: ${title}`}
          className="absolute inset-0 z-0 rounded-[12px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500 focus-visible:ring-offset-0"
        />
      ) : (
        <a
          href={editHref}
          aria-label={`${label}: ${title}`}
          className="absolute inset-0 z-0 rounded-[12px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500 focus-visible:ring-offset-0"
        />
      )}

      {/* Row 1 — cc-header: title | status-pill | glyph */}
      <header className="cc-header relative z-10">
        <h3 className="cc-title">{title}</h3>
        <div className="cc-header-meta">
          <span className="cc-status-pill" data-state={PILL_STATE[status]}>
            {PILL_LABELS[status](filledCount, totalCount)}
          </span>
          <CompletionGlyph state={state} decorative className="cc-indicator" />
        </div>
      </header>

      {/* Row 2 — cc-chip-row: chapter chip, full width, no competitors */}
      <div className="cc-chip-row relative z-10">
        <span className="cc-chapter-chip">
          <span aria-hidden="true">📘</span>
          {chipLabel}
        </span>
      </div>

      {/* Row 3 — cc-body: 1fr, clamped per data-variant */}
      <div
        className="cc-body relative z-10"
        id={cardBodyId}
        ref={bodyRef}
      >
        {/* Empty state: description */}
        {isEmpty && description && (
          <p className="text-sm italic leading-relaxed text-ink-500">{description}</p>
        )}

        {/* Partial / complete: "Your answer" block + subfields */}
        {!isEmpty && (
          <>
            {children && (
              <div className="mb-2">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-ink-500">
                  Your answer
                </p>
                {children}
              </div>
            )}

            {subFields && subFields.length > 0 && (
              variant === 'footer-wide'
                ? /* Two-column dl for wide footer sections */
                  <dl className="cc-dl">
                    {subFields.map((f) => (
                      <Fragment key={f.label}>
                        <dt>{f.label}</dt>
                        <dd>
                          {f.value !== null
                            ? f.value
                            : <em className="text-ink-300">Not yet</em>}
                        </dd>
                      </Fragment>
                    ))}
                  </dl>
                : /* Standard stacked list */
                  <dl className={children ? 'mt-2' : undefined}>
                    {subFields.map((f) => (
                      <div key={f.label} className="mb-2">
                        <dt className="text-[10px] font-bold uppercase tracking-wider text-cobalt-600">
                          {f.label}
                        </dt>
                        {f.value !== null ? (
                          <dd className="mt-0.5 text-sm leading-6 text-ink-900">{f.value}</dd>
                        ) : (
                          <dd className="mt-0.5 text-sm italic text-ink-300">Not yet</dd>
                        )}
                      </div>
                    ))}
                  </dl>
            )}
          </>
        )}
      </div>

      {/* Row 4 — cc-show-more: only when body clips (z-20 > stretched link) */}
      {showToggle && (
        <button
          type="button"
          className="cc-show-more relative z-20"
          aria-expanded={isExpanded}
          aria-controls={cardBodyId}
          onClick={() => setIsExpanded((v) => !v)}
        >
          <span>{isExpanded ? 'Show less' : 'Show more'}</span>
          <Chevron up={isExpanded} />
        </button>
      )}

      {/* Row 5 — cc-footer: flex-wrap CTAs (aria-hidden since stretched link has the label) */}
      <footer className="cc-footer relative z-10">
        <span
          aria-hidden="true"
          className={[
            'btn inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-xs font-semibold',
            status === 'complete'
              ? 'text-cobalt-600'
              : 'bg-cobalt-600 text-white',
          ].join(' ')}
        >
          {label} →
        </span>
      </footer>

    </article>
  );
}

/* ── Helpers ─────────────────────────────────────────────────────── */

function getDefaultActionLabel(state: CanvasSectionState): string {
  switch (state.status) {
    case 'empty':    return 'Start';
    case 'partial':  return `Continue (${state.filledCount}/${state.totalCount})`;
    case 'complete': return 'Edit';
  }
}

function formatSourceLabel(label: string): string {
  const idx = label.indexOf(': ');
  return idx !== -1 ? `${label.slice(0, idx)} · ${label.slice(idx + 2)}` : label;
}
