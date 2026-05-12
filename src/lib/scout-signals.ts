const SCOUT_SIGNAL_TOTAL = 5;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function humanizeSignal(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function normalizeMissingSignals(value: string | string[] | null | undefined): string[] {
  const parts = Array.isArray(value)
    ? value
    : (value ?? "")
      .split(/[,|\n]/)
      .map((part) => part.trim());

  return Array.from(new Set(parts.map(humanizeSignal).filter(Boolean)));
}

export function capturedSignalsSummary(
  confidenceScore: number | null | undefined,
  missingSignals: string | string[] | null | undefined,
): {
  label: string;
  detail: string;
  captured: number | null;
  total: number;
  missing: string[];
} {
  const missing = normalizeMissingSignals(missingSignals);
  const score = typeof confidenceScore === "number" && Number.isFinite(confidenceScore) ? confidenceScore : null;
  const captured = missing.length > 0
    ? clamp(SCOUT_SIGNAL_TOTAL - missing.length, 0, SCOUT_SIGNAL_TOTAL)
    : score === null
      ? null
      : clamp(Math.round((score / 100) * SCOUT_SIGNAL_TOTAL), 0, SCOUT_SIGNAL_TOTAL);

  if (captured === null) {
    return {
      label: "Not captured",
      detail: "Scout did not return a captured-signal summary for this scan.",
      captured,
      total: SCOUT_SIGNAL_TOTAL,
      missing,
    };
  }

  const label = captured >= SCOUT_SIGNAL_TOTAL
    ? "All core signals captured"
    : `${captured} of ${SCOUT_SIGNAL_TOTAL} captured`;
  const detail = missing.length > 0
    ? `Missing ${missing.join(", ")}`
    : captured >= SCOUT_SIGNAL_TOTAL
      ? "No missing signals reported."
      : "Scout did not return the missing-signal list for this scan.";

  return {
    label,
    detail,
    captured,
    total: SCOUT_SIGNAL_TOTAL,
    missing,
  };
}
