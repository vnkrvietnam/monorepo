/**
 * @vnkrvietnam/ui — Toggle / Switch
 * iOS-style on/off toggle — extracted from Appearance.png (Settings screen)
 *
 * States: checked / unchecked / disabled
 * Colors: success (green), info (blue), dark, warning, error
 */
import React, { useId } from "react";
import type { CSSProperties } from "react";

export type ToggleColor = "success" | "info" | "dark" | "warning" | "error";
export type ToggleSize  = "sm" | "md" | "lg";

const COLOR_MAP: Record<ToggleColor, string> = {
  success: "#00D68F",
  info:    "#0095FF",
  dark:    "#000000",
  warning: "#FFAA00",
  error:   "#FF3D71",
};

const SIZE_MAP: Record<ToggleSize, { w: number; h: number; thumb: number; offset: number }> = {
  sm: { w: 38, h: 22, thumb: 16, offset: 3 },
  md: { w: 50, h: 28, thumb: 22, offset: 3 },
  lg: { w: 62, h: 34, thumb: 27, offset: 3.5 },
};

export interface ToggleProps {
  checked?:   boolean;
  defaultChecked?: boolean;
  onChange?:  (checked: boolean) => void;
  color?:     ToggleColor;
  size?:      ToggleSize;
  disabled?:  boolean;
  label?:     string;
  /** Label position */
  labelSide?: "left" | "right";
  id?:        string;
  style?:     CSSProperties;
}

export function Toggle({
  checked: controlledChecked,
  defaultChecked = false,
  onChange,
  color     = "success",
  size      = "md",
  disabled  = false,
  label,
  labelSide = "right",
  id: idProp,
  style,
}: ToggleProps) {
  const [internalChecked, setInternalChecked] = React.useState(defaultChecked);
  const isChecked = controlledChecked !== undefined ? controlledChecked : internalChecked;
  const uid = useId();
  const inputId = idProp ?? uid;

  const s = SIZE_MAP[size];
  const trackColor = isChecked ? COLOR_MAP[color] : "#CBD5E0";

  const trackStyle: CSSProperties = {
    position:      "relative",
    width:         s.w,
    height:        s.h,
    borderRadius:  s.h,
    background:    trackColor,
    transition:    "background 0.2s",
    opacity:       disabled ? 0.45 : 1,
    cursor:        disabled ? "not-allowed" : "pointer",
    flexShrink:    0,
  };

  const thumbStyle: CSSProperties = {
    position:    "absolute",
    top:         s.offset,
    left:        isChecked ? s.w - s.thumb - s.offset : s.offset,
    width:       s.thumb,
    height:      s.thumb,
    borderRadius:"50%",
    background:  "#FFFFFF",
    boxShadow:   "0 1px 4px rgba(0,0,0,0.2)",
    transition:  "left 0.2s cubic-bezier(0.4, 0.0, 0.2, 1)",
  };

  const handleChange = () => {
    if (disabled) return;
    const next = !isChecked;
    setInternalChecked(next);
    onChange?.(next);
  };

  const labelStyle: CSSProperties = {
    fontSize:   14,
    fontWeight: 500,
    color:      disabled ? "#A0AEC0" : "#1A1F36",
    fontFamily: "'Work Sans', sans-serif",
    cursor:     disabled ? "not-allowed" : "pointer",
    userSelect: "none",
  };

  const wrapper: CSSProperties = {
    display:    "inline-flex",
    alignItems: "center",
    gap:        10,
    flexDirection: labelSide === "left" ? "row-reverse" : "row",
    ...style,
  };

  return (
    <label htmlFor={inputId} style={wrapper}>
      {label && <span style={labelStyle}>{label}</span>}
      <input
        id={inputId}
        type="checkbox"
        checked={isChecked}
        disabled={disabled}
        onChange={handleChange}
        style={{ position: "absolute", opacity: 0, width: 0, height: 0 }}
        aria-checked={isChecked}
      />
      <div style={trackStyle} onClick={handleChange} role="switch" aria-checked={isChecked}>
        <div style={thumbStyle} />
      </div>
    </label>
  );
}
