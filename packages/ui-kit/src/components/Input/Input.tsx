import React, { useState } from "react";
import type { CSSProperties, InputHTMLAttributes, ReactNode } from "react";

export type InputState = "default" | "focused" | "filled" | "error";

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  caption?: string;
  error?: string;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  fullWidth?: boolean;
}

export function Input({
  label,
  caption,
  error,
  iconLeft,
  iconRight,
  fullWidth = true,
  style,
  onFocus,
  onBlur,
  value,
  defaultValue,
  ...rest
}: InputProps) {
  const [focused, setFocused] = useState(false);
  const hasError = Boolean(error);

  const wrapStyle: CSSProperties = {
    display:    "flex",
    flexDirection: "column",
    gap:        "4px",
    width:      fullWidth ? "100%" : "auto",
    fontFamily: "'Work Sans', sans-serif",
    ...style,
  };

  const labelStyle: CSSProperties = {
    fontSize:    "0.75rem",
    fontWeight:  500,
    color:       hasError ? "#FF3D71" : "#2E3A59",
    marginBottom: "2px",
    letterSpacing: "0.01em",
  };

  const fieldWrapStyle: CSSProperties = {
    position:    "relative",
    display:     "flex",
    alignItems:  "center",
  };

  const inputStyle: CSSProperties = {
    width:         "100%",
    height:        "52px",
    padding:       `0 ${iconRight ? "44px" : "16px"} 0 ${iconLeft ? "44px" : "16px"}`,
    fontSize:      "0.875rem",
    fontWeight:    400,
    fontFamily:    "'Work Sans', sans-serif",
    color:         "#000000",
    background:    "#F5F6FA",
    border:        `1.5px solid ${hasError ? "#FF3D71" : focused ? "#0095FF" : "transparent"}`,
    borderRadius:  "12px",
    outline:       "none",
    transition:    "border-color 0.15s",
    boxSizing:     "border-box",
  };

  const iconBaseStyle: CSSProperties = {
    position:  "absolute",
    top:       "50%",
    transform: "translateY(-50%)",
    display:   "flex",
    alignItems:"center",
    color:     "#8F9BB3",
    pointerEvents: "none",
  };

  const captionStyle: CSSProperties = {
    fontSize: "0.75rem",
    color:    hasError ? "#FF3D71" : "#8F9BB3",
    marginTop: "2px",
  };

  return (
    <div style={wrapStyle}>
      {label && <label style={labelStyle}>{label}</label>}
      <div style={fieldWrapStyle}>
        {iconLeft && (
          <span style={{ ...iconBaseStyle, left: "14px" }}>{iconLeft}</span>
        )}
        <input
          style={inputStyle}
          onFocus={(e) => { setFocused(true); onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); onBlur?.(e); }}
          value={value}
          defaultValue={defaultValue}
          {...rest}
        />
        {iconRight && (
          <span style={{ ...iconBaseStyle, right: "14px" }}>{iconRight}</span>
        )}
      </div>
      {(caption || error) && (
        <span style={captionStyle}>{error ?? caption}</span>
      )}
    </div>
  );
}
