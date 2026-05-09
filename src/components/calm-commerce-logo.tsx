/**
 * Calm Commerce & Scout logo components.
 *
 * Wordmarks are built from an inline SVG icon + a CSS text span rather than
 * a text-in-SVG file. This avoids the font-in-<img> limitation (external SVGs
 * load in an isolated context that can't access page fonts), and lets the
 * Manrope 600 weight — already loaded by Next.js — render the wordmark natively.
 *
 * Usage:
 *   <CalmCommerceLogo />                  — horizontal wordmark, default size
 *   <CalmCommerceLogo variant="icon" />   — icon mark only
 *   <CalmCommerceLogo variant="favicon" />— simplified C-frame (no triangle)
 *   <CalmCommerceLogo variant="reverse" />— white mark on dark surfaces
 *   <ScoutLogo />                         — Scout horizontal wordmark
 *   <ScoutLogo variant="icon" />          — Scout icon only
 */

/* ── Calm Commerce icon paths ── */

const CC_FRAME = "M12 4C7.58172 4 4 7.58172 4 12V36C4 40.4183 7.58172 44 12 44H36C40.4183 44 44 40.4183 44 36V28H36V36C36 36.5523 35.5523 37 36 37H12C11.4477 37 11 36.5523 11 36V12C11 11.4477 11.4477 11 12 11H36C36.5523 11 37 11.4477 37 12V20H44V12C44 7.58172 40.4183 4 36 4H12Z";
const CC_TRIANGLE = "M32 20L32 32L20 32Z";

/* ── Scout crosshair paths ── */
const SCOUT_CROSSHAIR_V = "M24 15V19M24 29V33";
const SCOUT_CROSSHAIR_H = "M15 24H19M29 24H33";

/* ─────────────────────────────────────────────────────────────────────
   Base icon sub-components (pure inline SVG — no file dependency)
   ───────────────────────────────────────────────────────────────────── */

function CalmCommerceIconMark({
  size,
  reversed = false,
}: {
  size: number;
  reversed?: boolean;
}) {
  const frame = reversed ? "#FFFFFF" : "#2B5BDB";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <path d={CC_FRAME} fill={frame} />
      <path d={CC_TRIANGLE} fill="#0D9488" />
    </svg>
  );
}

function CalmCommerceFaviconMark({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d={CC_FRAME} fill="#2B5BDB" />
    </svg>
  );
}

function ScoutIconMark({
  size,
  reversed = false,
}: {
  size: number;
  reversed?: boolean;
}) {
  const frame = reversed ? "#FFFFFF" : "#2B5BDB";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <path d={CC_FRAME} fill={frame} />
      <circle cx="24" cy="24" r="5" stroke="#0D9488" strokeWidth="2" fill="none" />
      <circle cx="24" cy="24" r="1.5" fill="#0D9488" />
      <path d={SCOUT_CROSSHAIR_V} stroke="#0D9488" strokeWidth="2" strokeLinecap="round" />
      <path d={SCOUT_CROSSHAIR_H} stroke="#0D9488" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   CalmCommerceLogo
   ───────────────────────────────────────────────────────────────────── */

type CalmCommerceVariant = "horizontal" | "icon" | "favicon" | "reverse";

export function CalmCommerceLogo({
  variant = "horizontal",
  size = 36,
  className,
}: {
  /**
   * - "horizontal" — icon + "Calm Commerce" wordmark (default)
   * - "icon"        — icon mark only (with triangle)
   * - "favicon"     — simplified C-frame only (for 16–32 px uses)
   * - "reverse"     — horizontal wordmark on dark/ink surfaces (white frame)
   */
  variant?: CalmCommerceVariant;
  /** Icon height in px. Text scales proportionally (icon × 0.5). Default: 36. */
  size?: number;
  className?: string;
}) {
  if (variant === "favicon") {
    return <CalmCommerceFaviconMark size={size} />;
  }

  if (variant === "icon") {
    return <CalmCommerceIconMark size={size} />;
  }

  const reversed = variant === "reverse";
  const textSize = Math.round(size * 0.5);   // 18 px at size=36
  const gap      = Math.round(size * 0.28);  // 10 px at size=36
  const textColor = reversed ? "#FFFFFF" : "#1A1D23";

  return (
    <div
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap,
        lineHeight: 1,
      }}
      aria-label="Calm Commerce"
    >
      <CalmCommerceIconMark size={size} reversed={reversed} />
      <span
        style={{
          fontFamily: "Manrope, Inter, sans-serif",
          fontWeight: 600,
          fontSize: textSize,
          letterSpacing: "-0.02em",
          color: textColor,
          whiteSpace: "nowrap",
        }}
      >
        Calm Commerce
      </span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   ScoutLogo
   ───────────────────────────────────────────────────────────────────── */

type ScoutVariant = "horizontal" | "icon" | "reverse";

export function ScoutLogo({
  variant = "horizontal",
  size = 36,
  className,
}: {
  /**
   * - "horizontal" — icon + "Scout" + "by Calm Commerce" (default)
   * - "icon"        — Scout icon mark only
   * - "reverse"     — horizontal wordmark on dark surfaces (white frame)
   */
  variant?: ScoutVariant;
  size?: number;
  className?: string;
}) {
  const reversed = variant === "reverse";

  if (variant === "icon") {
    return <ScoutIconMark size={size} />;
  }

  const titleSize = Math.round(size * 0.5);      // 18 px at size=36
  const attrSize  = Math.round(size * 0.281);    // ~10 px at size=36
  const gap       = Math.round(size * 0.28);
  const titleColor = reversed ? "#FFFFFF" : "#1A1D23";
  const attrColor  = reversed ? "rgba(255,255,255,0.6)" : "#6B7280";

  return (
    <div
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap,
        lineHeight: 1,
      }}
      aria-label="Scout by Calm Commerce"
    >
      <ScoutIconMark size={size} reversed={reversed} />
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <span
          style={{
            fontFamily: "Manrope, Inter, sans-serif",
            fontWeight: 600,
            fontSize: titleSize,
            letterSpacing: "-0.02em",
            color: titleColor,
            lineHeight: 1,
            whiteSpace: "nowrap",
          }}
        >
          Scout
        </span>
        <span
          style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 400,
            fontSize: attrSize,
            color: attrColor,
            lineHeight: 1,
            whiteSpace: "nowrap",
          }}
        >
          by Calm Commerce
        </span>
      </div>
    </div>
  );
}

/**
 * Convenience alias — 32 px Calm Commerce icon for tight nav spaces.
 */
export function CalmCommerceNavIcon({ className }: { className?: string }) {
  return (
    <span className={className}>
      <CalmCommerceIconMark size={32} />
    </span>
  );
}
