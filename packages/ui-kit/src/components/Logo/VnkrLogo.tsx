/**
 * @vnkrvietnam/ui — Logo System
 * VNKR Organisation — Brand Identity
 * Wordmark "VNKR" + Wi-Fi signal mark (top-right of R)
 *
 * Variants:
 *   dark  — black on white (default)
 *   light — white on dark
 *   green — black on lime-green (#BEFF6C) brand bg
 *   pink  — black on magenta (#FD9FDD) brand bg
 *
 * Safe-zone rule: minimum clear space = 1× logo height on all sides
 * Min size: 80px wide (print: 20mm)
 */
import React from "react";
import type { CSSProperties } from "react";

export type LogoVariant = "dark" | "light" | "green" | "pink";
export type LogoSize    = "xs" | "sm" | "md" | "lg" | "xl";

const SIZE_MAP: Record<LogoSize, number> = {
  xs: 60,
  sm: 80,
  md: 120,
  lg: 180,
  xl: 240,
};

const VARIANT_MAP: Record<LogoVariant, { fg: string; bg: string }> = {
  dark:  { fg: "#000000", bg: "transparent" },
  light: { fg: "#FFFFFF", bg: "transparent" },
  green: { fg: "#000000", bg: "#BEFF6C"     },
  pink:  { fg: "#000000", bg: "#FD9FDD"     },
};

export interface LogoProps {
  variant?: LogoVariant;
  size?:    LogoSize | number;
  /** Show background badge (rounded rect) */
  badge?:   boolean;
  style?:   CSSProperties;
  className?: string;
  /** aria-label override */
  title?:   string;
}

export function VnkrLogo({
  variant   = "dark",
  size      = "md",
  badge     = false,
  style,
  className,
  title     = "VNKR",
}: LogoProps) {
  const w     = typeof size === "number" ? size : SIZE_MAP[size];
  const c     = VARIANT_MAP[variant];
  const h     = Math.round(w * 0.32); // aspect ratio ≈ 3.1 : 1
  const pad   = badge ? Math.round(w * 0.12) : 0;
  const totalW = w + pad * 2;
  const totalH = h + pad * 2;
  const r     = badge ? Math.round(totalH * 0.25) : 0;
  const fg    = c.fg;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={totalW}
      height={totalH}
      viewBox={`0 0 ${totalW} ${totalH}`}
      role="img"
      aria-label={title}
      style={style}
      className={className}
    >
      <title>{title}</title>

      {/* Background badge */}
      {badge && (
        <rect
          x="0" y="0"
          width={totalW} height={totalH}
          rx={r} ry={r}
          fill={c.bg === "transparent" ? (variant === "light" ? "#000000" : "#FFFFFF") : c.bg}
        />
      )}

      {/* ── VNKR wordmark ── */}
      <text
        x={pad}
        y={pad + h * 0.82}
        fontFamily="'Work Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        fontWeight="700"
        fontSize={h}
        fill={fg}
        letterSpacing="-0.01em"
      >
        VNKR
      </text>

      {/* ── Wi-Fi signal mark (3 arcs, top-right of R) ── */}
      <WifiMark
        x={pad + w * 0.865}
        y={pad + h * 0.04}
        size={h * 0.3}
        color={fg}
      />
    </svg>
  );
}

// ─── Wi-Fi 3-arc mark ────────────────────────────────────────────────────────
function WifiMark({ x, y, size, color }: { x: number; y: number; size: number; color: string }) {
  const sw = size * 0.12;
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* outer arc */}
      <path
        d={describeArc(0, size * 0.8, size, -45, 45)}
        fill="none" stroke={color}
        strokeWidth={sw} strokeLinecap="round"
      />
      {/* middle arc */}
      <path
        d={describeArc(0, size * 0.55, size * 0.65, -45, 45)}
        fill="none" stroke={color}
        strokeWidth={sw} strokeLinecap="round"
      />
      {/* inner arc / dot */}
      <path
        d={describeArc(0, size * 0.3, size * 0.3, -45, 45)}
        fill="none" stroke={color}
        strokeWidth={sw} strokeLinecap="round"
      />
    </g>
  );
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const x1 = cx + r * Math.cos(toRad(startAngle - 90));
  const y1 = cy + r * Math.sin(toRad(startAngle - 90));
  const x2 = cx + r * Math.cos(toRad(endAngle - 90));
  const y2 = cy + r * Math.sin(toRad(endAngle - 90));
  return `M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`;
}
