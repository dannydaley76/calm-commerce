'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CanvasCard } from './CanvasCard';
import { CompletionGlyph } from './CompletionGlyph';
import { SourceChip } from './SourceChip';
import { getSectionState } from './get-section-state';
import { writeWorksheetField } from './write-worksheet-field';
import type { CanvasSectionState } from './types';

/* ── Types ─────────────────────────────────────────────────────────── */

export interface InlineFieldConfig {
  /** HTML input type. Use "number" for numeric-only fields. */
  inputType: 'text' | 'number';
  /** Text shown to the right of the input (e.g. "hrs/week"). */
  unitSuffix?: string;
  /** Text shown to the left of the input (e.g. currency symbol). */
  unitPrefix?: string;
  /** Input placeholder. */
  placeholder?: string;
}

export interface InlineEditCardProps {
  title: string;
  /** Shown as the empty-state body text. */
  description?: string;
  /**
   * The server-computed initial state. InlineEditCard will re-derive its
   * own state from `currentValue` after saves, using the same editHref and
   * sourceLabel from this object.
   */
  initialState: CanvasSectionState;
  /** Current persisted value — becomes the input's initial content. */
  initialValue: string;
  /** Worksheet field key, e.g. "time_budget_hours_per_week". */
  fieldKey: string;
  /** Worksheet this field belongs to (default: "founder-rules-sheet"). */
  worksheetId?: string;
  fieldConfig: InlineFieldConfig;
  className?: string;
}

/* ── Shared style constants (mirror CanvasCard) ──────────────────── */

const BASE =
  'relative block rounded-[1.5rem] p-6 ' +
  'transition-[box-shadow,transform] duration-150';

const EDIT_RING =
  'bg-surface-raised border-2 border-[#545a95] shadow-card-hover';

/* ── Component ──────────────────────────────────────────────────────── */

/**
 * InlineEditCard — a canvas card that supports in-place value editing for
 * short scalar fields (Time budget, Money cap, Experiment duration).
 *
 * View mode   → identical to CanvasCard (click anywhere to enter edit mode).
 * Edit mode   → the value becomes a labelled input with Save / Cancel.
 *               Enter = save, Escape = cancel.
 * Persistence → uses writeWorksheetField() (same API path as the worksheet
 *               clients) with an optimistic update that reverts on error.
 *
 * Long-form fields (Success metrics etc.) should continue to use CanvasCard
 * with the default `<a href>` behaviour (routes to the full worksheet).
 */
export function InlineEditCard({
  title,
  description,
  initialState,
  initialValue,
  fieldKey,
  worksheetId = 'founder-rules-sheet',
  fieldConfig,
  className = '',
}: InlineEditCardProps) {
  const [isEditing, setIsEditing]       = useState(false);
  const [currentValue, setCurrentValue] = useState(initialValue);
  const [inputValue, setInputValue]     = useState(initialValue);
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState<string | null>(null);

  const inputRef      = useRef<HTMLInputElement>(null);
  const viewWrapperRef = useRef<HTMLDivElement>(null);

  /**
   * Track isEditing across renders so we can detect the transition
   * true → false and return focus to the card button without firing on
   * initial mount (where isEditing starts false).
   */
  const wasEditing = useRef(false);
  useEffect(() => {
    if (wasEditing.current && !isEditing && viewWrapperRef.current) {
      const btn = viewWrapperRef.current.querySelector<HTMLElement>('button, a[href]');
      btn?.focus();
    }
    wasEditing.current = isEditing;
  }, [isEditing]);

  /* Derive card state from the current (possibly optimistically updated)
     value so the glyph, badge, and action label stay correct after a save. */
  const cardState = useMemo(
    (): CanvasSectionState =>
      getSectionState({
        filledCount:  currentValue.trim() ? 1 : 0,
        totalCount:   1,
        editHref:     initialState.editHref,
        sourceLabel:  initialState.sourceLabel,
      }),
    [currentValue, initialState.editHref, initialState.sourceLabel],
  );

  /* ── Handlers ────────────────────────────────────────────────────── */

  const openEdit = useCallback(() => {
    setInputValue(currentValue);
    setError(null);
    setIsEditing(true);
  }, [currentValue]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setInputValue(currentValue);
    setError(null);
  }, [currentValue]);

  const handleSave = useCallback(async () => {
    const next = inputValue.trim();
    const prev = currentValue;

    // Optimistic update
    setCurrentValue(next);
    setIsEditing(false);
    setSaving(true);
    setError(null);

    const result = await writeWorksheetField(fieldKey, next, worksheetId);

    setSaving(false);
    if (!result.ok) {
      // Revert on failure
      setCurrentValue(prev);
      setInputValue(prev);
      setError(result.error ?? 'Save failed — please try again.');
      setIsEditing(true);
    }
  }, [inputValue, currentValue, fieldKey, worksheetId]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        void handleSave();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      }
    },
    [handleSave, handleCancel],
  );

  /* ── Edit mode ───────────────────────────────────────────────────── */

  if (isEditing) {
    return (
      <div className={`${BASE} ${EDIT_RING} ${className}`}>
        <CompletionGlyph state={cardState} className="absolute top-5 right-5" decorative />

        {/* Title */}
        <p className="pr-6 text-[10px] font-bold uppercase tracking-[0.18em] text-cobalt-600">
          {title}
        </p>

        {/* "Your answer" label */}
        <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-300">
          Your answer
        </p>

        {/* Input row */}
        <div className="mt-2 flex items-center gap-2">
          {fieldConfig.unitPrefix && (
            <span className="shrink-0 text-sm font-medium text-ink-900">
              {fieldConfig.unitPrefix}
            </span>
          )}
          <input
            ref={inputRef}
            type={fieldConfig.inputType}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={fieldConfig.placeholder ?? ''}
            autoFocus
            aria-label={title}
            className="w-full min-w-0 rounded-lg border border-ink-100 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-300 focus:border-[#545a95] focus:outline-none focus:ring-2 focus:ring-[rgba(84,90,149,0.15)]"
          />
          {fieldConfig.unitSuffix && (
            <span className="shrink-0 whitespace-nowrap text-sm text-ink-500">
              {fieldConfig.unitSuffix}
            </span>
          )}
        </div>

        {/* Error */}
        {error && (
          <p role="alert" className="mt-2 text-xs text-error-700">
            {error}
          </p>
        )}

        {/* Save / Cancel */}
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="rounded-lg bg-cobalt-600 px-4 py-[7px] text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-lg border border-ink-100 px-4 py-[7px] text-xs font-semibold text-ink-900 transition hover:bg-surface-sunken"
          >
            Cancel
          </button>
        </div>

        {/* Footer */}
        <div className="mt-4">
          <SourceChip label={initialState.sourceLabel} />
        </div>
      </div>
    );
  }

  /* ── View mode (delegates to CanvasCard) ─────────────────────────── */

  return (
    /* viewWrapperRef lets us querySelector for the card's <button> to
       return focus after exiting edit mode via Save or Cancel.           */
    <div ref={viewWrapperRef}>
      <CanvasCard
        title={title}
        description={description}
        state={cardState}
        actionLabel="Edit"
        onClick={openEdit}
        className={saving ? 'opacity-60 pointer-events-none' : className}
      >
        {/* Display the current value when filled */}
        {currentValue.trim() && (
          <p className="text-sm leading-6 text-ink-900">
            {fieldConfig.unitPrefix}
            {currentValue}
            {fieldConfig.unitSuffix ? ` ${fieldConfig.unitSuffix}` : ''}
          </p>
        )}
      </CanvasCard>
    </div>
  );
}
