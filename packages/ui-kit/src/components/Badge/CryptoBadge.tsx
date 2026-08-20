/**
 * @vnkrvietnam/ui — CryptoBadge
 * Pill-style badge showing crypto ticker + % change
 * Extracted from Home-v1.png, Home-v2.png (BTC/ETH/GLD row)
 *
 * Style: dark pill with lime-green or teal % indicator + black ticker label
 */
import React from "react";
import type { CSSProperties } from "react";

export type CryptoBadgeTrend = "up" | "down" | "neutral";

export interface CryptoBadgeProps {
  /** Ticker symbol e.g. "BTC" */
  ticker:     string;
  /** Percentage string e.g. "12.7%" */
  percent:    string;
  trend?:     CryptoBadgeTrend;
  /** Accent color for the % pill — defaults to #BEFF6C */
  accentColor?: string;
  onClick?:   () => void;
  style?:     CSSProperties;
  active?:    boolean;
}

const TREND_ARROW = { up: "↑", down: "↓", neutral: "→" } as const;

const TREND_COLOR: Record<CryptoBadgeTrend, string> = {
  up:      "#BEFF6C",
  down:    "#FF3D71",
  neutral: "#49DBC8",
};

export function CryptoBadge({
  ticker,
  percent,
  trend    = "up",
  accentColor,
  onClick,
  style,
  active   = false,
}: CryptoBadgeProps) {
  const accent = accentColor ?? TREND_COLOR[trend];

  const outer: CSSProperties = {
    display:      "inline-flex",
    alignItems:   "center",
    height:       36,
    borderRadius: 99,
    background:   "#000000",
    overflow:     "hidden",
    cursor:       onClick ? "pointer" : "default",
    userSelect:   "none",
    boxShadow:    active ? `0 0 0 2px ${accent}` : "none",
    transition:   "box-shadow 0.15s",
    ...style,
  };

  const pctPill: CSSProperties = {
    display:      "flex",
    alignItems:   "center",
    gap:          3,
    padding:      "0 10px",
    height:       "100%",
    background:   accent,
    fontSize:     12,
    fontWeight:   700,
    fontFamily:   "'Work Sans', sans-serif",
    color:        "#000",
    letterSpacing: "0.01em",
    whiteSpace:   "nowrap",
  };

  const tickerLabel: CSSProperties = {
    padding:      "0 12px",
    fontSize:     13,
    fontWeight:   700,
    fontFamily:   "'Work Sans', sans-serif",
    color:        "#FFFFFF",
    letterSpacing: "0.04em",
    whiteSpace:   "nowrap",
  };

  return (
    <div style={outer} onClick={onClick} role={onClick ? "button" : undefined}>
      <div style={pctPill}>
        <span style={{ fontSize: 10 }}>{TREND_ARROW[trend]}</span>
        {percent}
      </div>
      <span style={tickerLabel}>{ticker}</span>
    </div>
  );
}

// ─── CryptoBadgeRow — renders a horizontal row of badges ─────────────────────
export interface CryptoBadgeData {
  ticker:   string;
  percent:  string;
  trend?:   CryptoBadgeTrend;
  accentColor?: string;
}

export interface CryptoBadgeRowProps {
  items:       CryptoBadgeData[];
  activeIndex?: number;
  onSelect?:   (index: number) => void;
  style?:      CSSProperties;
}

export function CryptoBadgeRow({ items, activeIndex, onSelect, style }: CryptoBadgeRowProps) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", ...style }}>
      {items.map((item, i) => (
        <CryptoBadge
          key={item.ticker}
          {...item}
          active={activeIndex === i}
          onClick={onSelect ? () => onSelect(i) : undefined}
        />
      ))}
    </div>
  );
}
