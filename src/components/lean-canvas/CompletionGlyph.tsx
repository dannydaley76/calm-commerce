import type { CanvasSectionState, SectionStatus } from './types';

/** Props accept either the full state object or just the status string. */
export interface CompletionGlyphProps {
  /**
   * The section's full state object. Only `status` is read —
   * passing the whole object keeps call-sites terse when you already
   * hold a CanvasSectionState.
   */
  state: CanvasSectionState | SectionStatus;
  /** Extra Tailwind classes forwarded to the wrapping <span>. */
  className?: string;
  /** Set to true when the glyph is decorative and a neighbouring label
   *  already conveys the status. Defaults to false. */
  decorative?: boolean;
}

const GLYPHS: Record<SectionStatus, string> = {
  empty:    '○',
  partial:  '◐',
  complete: '●',
};

const COLOURS: Record<SectionStatus, string> = {
  empty:    'text-ink-300',     // muted
  partial:  'text-amber-500',   // amber — matches the partial lozenge colour
  complete: 'text-success-600', // success — matches the complete lozenge + accent stripe
};

const LABELS: Record<SectionStatus, string> = {
  empty:    'Empty',
  partial:  'Partially filled',
  complete: 'Complete',
};

function resolveStatus(state: CanvasSectionState | SectionStatus): SectionStatus {
  return typeof state === 'string' ? state : state.status;
}

/**
 * A single-character status glyph that lives in the top-right corner of
 * every CanvasCard.
 *
 *   ○  empty     — no fields filled
 *   ◐  partial   — some fields filled
 *   ●  complete  — all fields filled
 *
 * Colours map directly to the app's existing design tokens:
 *   empty → --muted  |  partial → --accent  |  complete → --success
 *
 * Usage inside a card wrapper that has `position: relative`:
 *
 *   <CompletionGlyph state={sectionState} className="absolute top-5 right-5" />
 */
export function CompletionGlyph({
  state,
  className = '',
  decorative = false,
}: CompletionGlyphProps) {
  const status = resolveStatus(state);

  return (
    <span
      className={`select-none text-lg leading-none shrink-0 ${COLOURS[status]} ${className}`}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : LABELS[status]}
      role={decorative ? undefined : 'img'}
      title={LABELS[status]}
    >
      {GLYPHS[status]}
    </span>
  );
}
