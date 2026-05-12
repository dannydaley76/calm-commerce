import type { ProductCode } from "@/lib/auth/get-access-state";

type AccessStatusBadgeProps = {
  status: string | null;
  level: string | null;
  activeProducts?: ProductCode[];
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
  activeProducts = [],
  compact = false,
  inverse = false,
}: AccessStatusBadgeProps) {
  const isPaid     = status === "active" && level === "full";
  const isInactive = status === "expired" || status === "cancelled";
  const hasOs = activeProducts.includes("calm_commerce_os");
  const hasPro = activeProducts.includes("research_workspace");
  const hasBasic = activeProducts.includes("scanner_extension");

  const pillState = isPaid ? "paid" : isInactive ? "not-started" : "active";

  const label = isPaid
    ? hasOs
      ? "Calm Commerce OS active"
      : hasPro
        ? "Scout Pro active"
        : hasBasic
          ? "Scout Basic active"
          : "Paid access active"
    : isInactive
      ? "Access inactive"
      : "Free Scout access";

  const helper = isPaid
    ? hasOs
      ? "Calm Commerce OS access is active for this account."
      : hasPro
        ? "Scout Pro access is active for this account."
        : hasBasic
          ? "Scout Basic access is active for this account."
          : "Paid access is active for this account."
    : isInactive
      ? "Paid access is inactive for this account."
      : "Free Scout access is active for this account.";

  /* inverse variant: override colours for dark backgrounds */
  const inverseClass = inverse
    ? "!bg-white/20 !text-white"
    : "";

  return (
    <span
      className={`cc-status-pill ${compact ? "" : "px-4 py-1"} ${inverseClass}`}
      data-state={pillState}
      title={helper}
      aria-label={helper}
    >
      {label}
    </span>
  );
}
