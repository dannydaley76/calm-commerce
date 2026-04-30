"use client";

import { useCallback, useRef, useState } from "react";

/* ─────────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────────── */

export interface ChartSeries {
  label: string;
  /** Parallel to the `weeks` array; null means no data for that week. */
  values: (number | null)[];
  /** CSS colour string, e.g. "#0049CF". */
  color: string;
  /** If provided, draws a dashed line (SVG stroke-dasharray). */
  dashed?: boolean;
  /** How to format values in the tooltip, e.g. v => `£${v}` */
  format: (v: number) => string;
  /** Unit suffix shown on the y-axis, e.g. "%" */
  unit?: string;
}

interface Props {
  /** Abbreviated week labels in chronological order, e.g. "15 Apr". */
  weeks: string[];
  /** Left-axis series — rendered as a filled area + line. */
  primary: ChartSeries;
  /** Right-axis series — rendered as a dashed line only. */
  secondary?: ChartSeries;
  height?: number;
}

/* ─────────────────────────────────────────────────────────────
   Constants & helpers
───────────────────────────────────────────────────────────── */

const VW = 600;       // viewBox width
const VH = 200;       // viewBox height
const PT = 16;        // padding top
const PB = 36;        // padding bottom (for x-axis labels)
const PL = 52;        // padding left (for primary y-axis)
const PR_BASE = 12;   // padding right when no secondary
const PR_SEC = 52;    // padding right when secondary axis exists

function chartW(hasSecondary: boolean) { return VW - PL - (hasSecondary ? PR_SEC : PR_BASE); }
const chartH = VH - PT - PB;   // drawable height

function xPos(i: number, n: number, hasSecondary: boolean): number {
  if (n <= 1) return PL + chartW(hasSecondary) / 2;
  return PL + (i / (n - 1)) * chartW(hasSecondary);
}

function yPos(value: number, domainMin: number, domainMax: number): number {
  const range = domainMax - domainMin || 1;
  return PT + chartH - ((value - domainMin) / range) * chartH;
}

/** Returns [min, max] with a bit of headroom above max. */
function domain(values: (number | null)[]): [number, number] {
  const nums = values.filter((v): v is number => v !== null);
  if (!nums.length) return [0, 1];
  const mn = 0; // y-axis always starts at 0
  const mx = Math.max(...nums);
  return [mn, mx === 0 ? 1 : mx * 1.15];
}

/** Build an SVG "M L L …" path string from a list of {x, y} points. */
function linePath(points: { x: number; y: number }[]): string {
  return points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
}

/** Close a line path into a filled area back to the baseline. */
function areaPath(points: { x: number; y: number }[], baseline: number): string {
  if (!points.length) return "";
  const line = linePath(points);
  const first = points[0]!;
  const last = points[points.length - 1]!;
  return `${line} L${last.x.toFixed(1)},${baseline.toFixed(1)} L${first.x.toFixed(1)},${baseline.toFixed(1)} Z`;
}

/** Nice round tick values for a domain, deduplicated. */
function ticks(min: number, max: number, count = 4): number[] {
  const range = max - min;
  if (range === 0) return [min];

  // Pick a "nice" step: 1, 2, or 5 × a power of 10
  const rawStep = range / count;
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep || 1)));
  const norm = rawStep / mag;
  const step = norm <= 1 ? mag : norm <= 2 ? 2 * mag : norm <= 5 ? 5 * mag : 10 * mag;

  const start = Math.ceil(min / step) * step;
  const result: number[] = [];
  if (min === 0 && start > 0) result.push(0);
  for (let t = start; t <= max + step * 0.01; t += step) {
    const v = Math.round(t * 1e9) / 1e9;   // strip floating-point noise
    if (!result.includes(v)) result.push(v);
  }
  return result;
}

/**
 * Decide how often to show an x-axis label so the chart stays readable.
 * Returns the step (show label when index % step === 0).
 */
function xStep(n: number): number {
  if (n <= 8) return 1;
  if (n <= 16) return 2;
  if (n <= 26) return 3;
  return Math.ceil(n / 8);
}

/* ─────────────────────────────────────────────────────────────
   Component
───────────────────────────────────────────────────────────── */

/**
 * MetricsLineChart — a pure SVG dual-axis line chart for the metrics page.
 *
 * Primary series: filled area + line (left y-axis)
 * Secondary series: dashed line (right y-axis, typically a percentage)
 *
 * No external charting library required.  Tooltip is HTML-based and
 * positioned using percentage offsets relative to the chart container.
 */
export function MetricsLineChart({ weeks, primary, secondary }: Props) {
  const hasSecondary = Boolean(secondary?.values.some((v) => v !== null));
  const cw = chartW(hasSecondary);
  const n = weeks.length;

  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  /* Compute domains */
  const [pMin, pMax] = domain(primary.values);
  const [sMin, sMax] = secondary ? domain(secondary.values) : [0, 1];

  /* Build SVG point arrays */
  const primaryPoints = primary.values
    .map((v, i) => (v !== null ? { x: xPos(i, n, hasSecondary), y: yPos(v, pMin, pMax) } : null))
    .filter((p): p is { x: number; y: number } => p !== null);

  const secondaryPoints = secondary
    ? secondary.values
        .map((v, i) => (v !== null ? { x: xPos(i, n, hasSecondary), y: yPos(v, sMin, sMax) } : null))
        .filter((p): p is { x: number; y: number } => p !== null)
    : [];

  const baseline = PT + chartH; // y position of x-axis

  /* Tick values */
  const pTicks = ticks(pMin, pMax, 4);
  const sTicks = secondary ? ticks(sMin, sMax, 4) : [];

  /* Mouse handling — detect closest data point */
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGRectElement>) => {
      const svg = svgRef.current;
      if (!svg || n < 2) return;
      const rect = svg.getBoundingClientRect();
      const svgX = ((e.clientX - rect.left) / rect.width) * VW;
      // Find closest week index
      let best = 0;
      let bestDist = Infinity;
      for (let i = 0; i < n; i++) {
        const dist = Math.abs(xPos(i, n, hasSecondary) - svgX);
        if (dist < bestDist) { bestDist = dist; best = i; }
      }
      setHoveredIdx(best);
    },
    [n, hasSecondary],
  );

  /* Tooltip content */
  const tooltipData =
    hoveredIdx !== null
      ? {
          week: weeks[hoveredIdx] ?? "",
          primary: primary.values[hoveredIdx] ?? null,
          secondary: secondary ? (secondary.values[hoveredIdx] ?? null) : null,
          /** 0–100: how far into the chart area (used for edge-clamping the tooltip). */
          xPct: ((xPos(hoveredIdx, n, hasSecondary) - PL) / cw) * 100,
          /** % of the full container width — direct CSS `left` value. */
          leftPct: (xPos(hoveredIdx, n, hasSecondary) / VW) * 100,
        }
      : null;

  if (n === 0) return null;

  return (
    <div className="relative select-none" aria-hidden="true">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VW} ${VH}`}
        className="w-full"
        style={{ aspectRatio: `${VW}/${VH}` }}
        role="img"
        aria-label={`${primary.label} trend chart`}
      >
        {/* ── Grid lines ── */}
        {pTicks.map((t) => {
          const y = yPos(t, pMin, pMax);
          return (
            <line
              key={`grid-${t}`}
              x1={PL} y1={y} x2={PL + cw} y2={y}
              stroke="#D4DEE3" strokeWidth="1"
            />
          );
        })}

        {/* ── Primary area fill ── */}
        {primaryPoints.length > 1 && (
          <path
            d={areaPath(primaryPoints, baseline)}
            fill={primary.color}
            fillOpacity="0.12"
          />
        )}

        {/* ── Primary line ── */}
        {primaryPoints.length > 1 && (
          <path
            d={linePath(primaryPoints)}
            fill="none"
            stroke={primary.color}
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}

        {/* ── Secondary line (dashed) ── */}
        {secondaryPoints.length > 1 && secondary && (
          <path
            d={linePath(secondaryPoints)}
            fill="none"
            stroke={secondary.color}
            strokeWidth="2"
            strokeDasharray="6 4"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}

        {/* ── Hover: vertical rule ── */}
        {hoveredIdx !== null && (
          <line
            x1={xPos(hoveredIdx, n, hasSecondary)}
            y1={PT}
            x2={xPos(hoveredIdx, n, hasSecondary)}
            y2={baseline}
            stroke="#8AA2AE"
            strokeWidth="1"
            strokeDasharray="4 3"
          />
        )}

        {/* ── Hover dots ── */}
        {hoveredIdx !== null && (() => {
          const pv = primary.values[hoveredIdx];
          const sv = secondary ? secondary.values[hoveredIdx] : null;
          const hx = xPos(hoveredIdx, n, hasSecondary);
          return (
            <>
              {pv !== null && (
                <circle cx={hx} cy={yPos(pv, pMin, pMax)} r={5}
                  fill={primary.color} stroke="white" strokeWidth={2} />
              )}
              {sv !== null && secondary && (
                <circle cx={hx} cy={yPos(sv, sMin, sMax)} r={5}
                  fill={secondary.color} stroke="white" strokeWidth={2} />
              )}
            </>
          );
        })()}

        {/* ── Primary data dots (always visible) ── */}
        {primaryPoints.map((p, i) => (
          <circle key={`dot-${i}`} cx={p.x} cy={p.y} r={3}
            fill={primary.color} fillOpacity={0.7} />
        ))}

        {/* ── Primary y-axis labels (left) ── */}
        {pTicks.map((t) => (
          <text key={`py-${t}`}
            x={PL - 6} y={yPos(t, pMin, pMax) + 4}
            textAnchor="end" fontSize={11} fill="#4A6B7A"
          >
            {primary.format(t)}
          </text>
        ))}

        {/* ── Secondary y-axis labels (right) ── */}
        {hasSecondary && secondary && sTicks.map((t) => (
          <text key={`sy-${t}`}
            x={PL + cw + 6} y={yPos(t, sMin, sMax) + 4}
            textAnchor="start" fontSize={11} fill={secondary.color}
          >
            {secondary.format(t)}
          </text>
        ))}

        {/* ── X-axis labels ── */}
        {weeks.map((w, i) => {
          if (i % xStep(n) !== 0 && i !== n - 1) return null;
          return (
            <text key={`x-${i}`}
              x={xPos(i, n, hasSecondary)} y={VH - 6}
              textAnchor="middle" fontSize={11} fill="#4A6B7A"
            >
              {w}
            </text>
          );
        })}

        {/* ── Invisible hit area ── */}
        <rect
          x={PL} y={PT} width={cw} height={chartH}
          fill="transparent"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredIdx(null)}
          style={{ cursor: "crosshair" }}
        />
      </svg>

      {/* ── Tooltip ── */}
      {tooltipData && (
        <div
          className="pointer-events-none absolute top-1 z-10 min-w-[120px] rounded-lg border border-ink-100 bg-surface-raised px-3 py-2 shadow-card text-xs"
          style={{
            left: `${tooltipData.leftPct}%`,
            // Pin left at the left edge, pin right at the right edge, otherwise centre.
            transform: tooltipData.xPct < 15
              ? 'translateX(0)'
              : tooltipData.xPct > 85
                ? 'translateX(-100%)'
                : 'translateX(-50%)',
          }}
        >
          <p className="font-semibold text-ink-900 mb-1">{tooltipData.week}</p>
          <p style={{ color: primary.color }}>
            {primary.label}: {tooltipData.primary !== null ? primary.format(tooltipData.primary) : "—"}
          </p>
          {secondary && (
            <p style={{ color: secondary.color }}>
              {secondary.label}: {tooltipData.secondary !== null ? secondary.format(tooltipData.secondary) : "—"}
            </p>
          )}
        </div>
      )}

      {/* ── Legend ── */}
      <div className="mt-1 flex flex-wrap items-center gap-4 px-[52px] text-[11px] text-ink-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-5 rounded-full" style={{ background: primary.color }} />
          {primary.label}
        </span>
        {secondary && hasSecondary && (
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-5 rounded-full" style={{ background: secondary.color, borderTop: `2px dashed ${secondary.color}` }} />
            {secondary.label}
          </span>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Sparkline — tiny inline trend for summary cards
───────────────────────────────────────────────────────────── */

interface SparklineProps {
  values: (number | null)[];
  color: string;
  height?: number;
  width?: number;
}

/**
 * A minimal inline sparkline for displaying a trend in a tight space.
 * No axes, no labels — just the shape of the trend.
 */
export function Sparkline({ values, color, height = 32, width = 80 }: SparklineProps) {
  const nums = values.filter((v): v is number => v !== null);
  if (nums.length < 2) return null;

  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const range = max - min || 1;

  const pad = 2;
  const w = width - pad * 2;
  const h = height - pad * 2;

  const points = values
    .map((v, i) =>
      v !== null
        ? { x: pad + (i / (values.length - 1)) * w, y: pad + h - ((v - min) / range) * h }
        : null,
    )
    .filter((p): p is { x: number; y: number } => p !== null);

  const d = linePath(points);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} aria-hidden="true">
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      {/* Final dot */}
      {points[points.length - 1] && (
        <circle cx={points[points.length - 1]!.x} cy={points[points.length - 1]!.y} r={2.5} fill={color} />
      )}
    </svg>
  );
}
