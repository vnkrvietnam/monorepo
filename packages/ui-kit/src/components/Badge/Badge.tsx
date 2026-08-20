/**
 * @vnkrvietnam/ui — Badge
 * Status / notification / count badge
 */
import React from "react";
import type { CSSProperties, ReactNode } from "react";

export type BadgeVariant = "dot" | "count" | "label";
export type BadgeColor   = "info" | "success" | "warning" | "error" | "dark" | "greeny" | "violet";

const COLOR_MAP: Record<BadgeColor, { bg: string; fg: string }> = {
  info:    { bg: "#0095FF", fg: "#fff" },
  success: { bg: "#00D68F", fg: "#fff" },
  warning: { bg: "#FFAA00", fg: "#fff" },
  error:   { bg: "#FF3D71", fg: "#fff" },
  dark:    { bg: "#000000", fg: "#fff" },
  greeny:  { bg: "#BEFF6C", fg: "#000" },
  violet:  { bg: "#AF96FB", fg: "#fff" },
};

export interface BadgeProps {
  variant?:  BadgeVariant;
  color?:    BadgeColor;
  count?:    number;
  /** Max count before showing "99+" */
  max?:      number;
  label?:    string;
  children?: ReactNode;
  style?:    CSSProperties;
}

/** Standalone badge — can also wrap children with badge overlay */
export function Badge({
  variant  = "count",
  color    = "error",
  count,
  max      = 99,
  label,
  children,
  style,
}: BadgeProps) {
  const c   = COLOR_MAP[color];
  const txt = variant === "count"
    ? (count !== undefined ? (count > max ? `${max}+` : String(count)) : "")
    : label ?? "";

  const badgeStyle: CSSProperties = {
    display:       "inline-flex",
    alignItems:    "center",
    justifyContent:"center",
    background:    c.bg,
    color:         c.fg,
    fontFamily:    "'Work Sans', sans-serif",
    fontWeight:    700,
    letterSpacing: "0.01em",
    borderRadius:  99,
    fontSize:      10,
    minWidth:      variant === "dot" ? 8  : 18,
    height:        variant === "dot" ? 8  : 18,
    padding:       variant === "dot" ? 0  : "0 5px",
    lineHeight:    1,
    ...style,
  };

  if (!children) return <span style={badgeStyle}>{txt}</span>;

  return (
    <span style={{ position: "relative", display: "inline-flex" }}>
      {children}
      <span style={{
        ...badgeStyle,
        position:  "absolute",
        top:       -4,
        right:     -4,
        border:    "2px solid #fff",
      }}>
        {txt}
      </span>
    </span>
  );
}
