import React from "react";
import type { CSSProperties, ReactNode, ButtonHTMLAttributes } from "react";
import { shadows } from "../../tokens/shadows";

// ─── Types ────────────────────────────────────────────────────────────────────
export type ButtonVariant = "filled" | "outlined" | "ghost";
export type ButtonColor =
  | "dark" | "grey" | "info" | "success"
  | "warning" | "error" | "navy" | "white";
export type ButtonSize = "sm" | "md" | "lg" | "giant";
export type ButtonState = "default" | "hover" | "active" | "disabled" | "loading";

// ─── Color map ────────────────────────────────────────────────────────────────
const COLOR_MAP: Record<ButtonColor, {
  bg: string; text: string; border: string;
  bgHover: string; bgActive: string; shadow: string;
}> = {
  dark:    { bg:"#000000", text:"#FFFFFF", border:"#000000", bgHover:"#1a1a1a", bgActive:"#333333", shadow: shadows.dark    },
  grey:    { bg:"#8F9BB3", text:"#FFFFFF", border:"#8F9BB3", bgHover:"#7a86a0", bgActive:"#67738d", shadow: shadows.none    },
  info:    { bg:"#0095FF", text:"#FFFFFF", border:"#0095FF", bgHover:"#0080e0", bgActive:"#006bb8", shadow: shadows.info    },
  success: { bg:"#00D68F", text:"#FFFFFF", border:"#00D68F", bgHover:"#00bd7a", bgActive:"#00a366", shadow: shadows.success },
  warning: { bg:"#FFAA00", text:"#FFFFFF", border:"#FFAA00", bgHover:"#e09600", bgActive:"#c08000", shadow: shadows.warning },
  error:   { bg:"#FF3D71", text:"#FFFFFF", border:"#FF3D71", bgHover:"#e03463", bgActive:"#c02855", shadow: shadows.error   },
  navy:    { bg:"#2E3A59", text:"#FFFFFF", border:"#2E3A59", bgHover:"#243050", bgActive:"#1a2442", shadow: shadows.dark    },
  white:   { bg:"#FFFFFF", text:"#000000", border:"#E0E0E0", bgHover:"#F5F5F5", bgActive:"#EBEBEB", shadow: shadows.none   },
};

// ─── Size map ─────────────────────────────────────────────────────────────────
const SIZE_MAP: Record<ButtonSize, {
  height: string; px: string; fontSize: string;
  iconSize: number; gap: string;
}> = {
  sm:    { height:"32px",  px:"14px", fontSize:"0.75rem",  iconSize:14, gap:"4px"  },
  md:    { height:"44px",  px:"20px", fontSize:"0.875rem", iconSize:16, gap:"6px"  },
  lg:    { height:"52px",  px:"24px", fontSize:"1rem",     iconSize:18, gap:"8px"  },
  giant: { height:"60px",  px:"32px", fontSize:"1.125rem", iconSize:20, gap:"10px" },
};

// ─── Props ────────────────────────────────────────────────────────────────────
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:   ButtonVariant;
  color?:     ButtonColor;
  size?:      ButtonSize;
  fullWidth?: boolean;
  /** Show branded colored shadow */
  elevate?:   boolean;
  iconLeft?:  ReactNode;
  iconRight?: ReactNode;
  loading?:   boolean;
  children?:  ReactNode;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function Button({
  variant   = "filled",
  color     = "dark",
  size      = "md",
  fullWidth = false,
  elevate   = false,
  iconLeft,
  iconRight,
  loading   = false,
  children,
  disabled,
  style,
  onMouseEnter,
  onMouseLeave,
  onMouseDown,
  onMouseUp,
  ...rest
}: ButtonProps) {
  const [hovered, setHovered] = React.useState(false);
  const [pressed, setPressed] = React.useState(false);

  const c = COLOR_MAP[color];
  const s = SIZE_MAP[size];
  const isDisabled = disabled || loading;

  let bg    = c.bg;
  let text  = c.text;
  let border = c.border;
  let boxShadow = elevate && !isDisabled && variant === "filled" ? c.shadow : "none";

  if (variant === "outlined") {
    bg     = "transparent";
    text   = color === "white" ? "#000000" : c.bg;
    border = color === "white" ? "#000000" : c.border;
    boxShadow = "none";
  } else if (variant === "ghost") {
    bg     = "transparent";
    text   = color === "white" ? "#000000" : c.bg;
    border = "transparent";
    boxShadow = "none";
  }

  // Hover / pressed color shift for filled
  if (variant === "filled" && !isDisabled) {
    if (pressed) bg = c.bgActive;
    else if (hovered) bg = c.bgHover;
  }

  const computedStyle: CSSProperties = {
    display:        "inline-flex",
    alignItems:     "center",
    justifyContent: "center",
    gap:            s.gap,
    height:         s.height,
    padding:        `0 ${s.px}`,
    fontSize:       s.fontSize,
    fontFamily:     "'Work Sans', sans-serif",
    fontWeight:     600,
    letterSpacing:  "0.01em",
    borderRadius:   "9999px",
    border:         `1.5px solid ${border}`,
    background:     bg,
    color:          text,
    cursor:         isDisabled ? "not-allowed" : "pointer",
    opacity:        isDisabled ? 0.45 : 1,
    transition:     "background 0.15s, opacity 0.15s, box-shadow 0.15s",
    width:          fullWidth ? "100%" : undefined,
    outline:        "none",
    whiteSpace:     "nowrap",
    userSelect:     "none",
    boxShadow,
    transform:      pressed && !isDisabled ? "scale(0.97)" : "scale(1)",
    ...style,
  };

  return (
    <button
      disabled={isDisabled}
      style={computedStyle}
      onMouseEnter={e => { setHovered(true);  onMouseEnter?.(e); }}
      onMouseLeave={e => { setHovered(false); setPressed(false); onMouseLeave?.(e); }}
      onMouseDown={e  => { setPressed(true);  onMouseDown?.(e);  }}
      onMouseUp={e    => { setPressed(false); onMouseUp?.(e);    }}
      {...rest}
    >
      {loading ? (
        <SpinnerIcon size={s.iconSize} color={text} />
      ) : (
        <>
          {iconLeft}
          {children}
          {iconRight}
        </>
      )}
    </button>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
function SpinnerIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      style={{ animation: "vnkr-btn-spin 0.75s linear infinite" }}>
      <style>{`@keyframes vnkr-btn-spin { to { transform: rotate(360deg); } }`}</style>
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="3" strokeOpacity="0.2" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke={color} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
