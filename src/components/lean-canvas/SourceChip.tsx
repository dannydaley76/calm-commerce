/**
 * SourceChip — a small pill indicating which chapter(s) a canvas section
 * draws its data from.
 *
 * Formats the label so a colon separator becomes a middle dot:
 *   "Chapter 7: Pick Your Customer"  →  "📘 Chapter 7 · Pick Your Customer"
 *   "Chapters 7–8"                   →  "📘 Chapters 7–8"
 *
 * Styles:
 *   bg-surface-sunken on a bg-surface-raised (white) card → chip visually
 *   contrasts so learners always notice the chapter attribution.
 *   border-ink-100 gives the chip a subtle hairline that reads well in
 *   any lighting condition.
 *   max-w-full + truncate: the chip collapses gracefully if the label is
 *   very long — the full text is accessible via the `title` attribute.
 */

export function formatSourceLabel(label: string): string {
  const idx = label.indexOf(': ');
  return idx !== -1 ? `${label.slice(0, idx)} · ${label.slice(idx + 2)}` : label;
}

export function SourceChip({ label }: { label: string }) {
  const formatted = formatSourceLabel(label);
  return (
    <span
      className="chapter-chip inline-flex max-w-full items-center gap-1.5 truncate rounded-full border border-ink-100 bg-surface-sunken px-3 py-1.5 text-xs font-medium text-ink-700"
      title={label}
    >
      <span aria-hidden="true" className="shrink-0 text-sm">📘</span>
      <span className="truncate">{formatted}</span>
    </span>
  );
}
