/**
 * FillBadge — the single completion-count component used everywhere on the
 * Lean Canvas page.
 *
 * Renders "X of Y filled" in a rounded pill.  The caller supplies colour
 * via `className`; the badge owns its own layout tokens (padding, radius,
 * font size, weight, tracking) so the text and shape are always consistent.
 *
 * Usage examples
 * ──────────────
 * // Green (complete) — inside CanvasCard
 * <FillBadge filled={4} total={4} className="bg-success-100 text-[#0f7b53]" />
 *
 * // Purple/accent (partial) — inside CanvasCard
 * <FillBadge filled={1} total={4} className="bg-[rgba(84,90,149,0.1)] text-[#545a95]" />
 *
 * // Tab button (selected)
 * <FillBadge filled={5} total={8} className="bg-white/20 text-white" />
 *
 * // Tab button (inactive)
 * <FillBadge filled={2} total={8} className="bg-surface-sunken text-ink-500" />
 */
export interface FillBadgeProps {
  filled: number;
  total: number;
  /**
   * Tailwind colour classes forwarded to the wrapping <span>.
   * The badge controls its own layout (padding, border-radius, text size,
   * weight, tracking) — only provide colour tokens here.
   */
  className?: string;
}

export function FillBadge({ filled, total, className = '' }: FillBadgeProps) {
  return (
    <span
      className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${className}`}
    >
      {filled} of {total} filled
    </span>
  );
}
