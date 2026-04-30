type AccessStatusBadgeProps = {
  status: string | null;
  level: string | null;
  compact?: boolean;
  inverse?: boolean;
};

/**
 * Pill badge showing the learner's current access state.
 * Delegates colour to the cc-status-pill token system (data-state).
 *
 * inverse=true: transparent-white variant for use on dark/coloured backgrounds.
 */
export function AccessStatusBadge({
  status,
  level,
  compact = false,
  inverse = false,
}: AccessStatusBadgeProps) {
  const isPaid     = status === "active" && level === "full";
  const isInactive = status === "expired" || status === "cancelled";

  const pillState = isPaid ? "paid" : isInactive ? "not-started" : "active";

  const label = isPaid
    ? "Paid access active"
    : isInactive
      ? "Access inactive"
      : "Preview access";

  /* inverse variant: override colours for dark backgrounds */
  const inverseClass = inverse
    ? "!bg-white/20 !text-white"
    : "";

  return (
    <span
      className={`cc-status-pill ${compact ? "" : "px-4 py-1"} ${inverseClass}`}
      data-state={pillState}
    >
      {label}
    </span>
  );
}
