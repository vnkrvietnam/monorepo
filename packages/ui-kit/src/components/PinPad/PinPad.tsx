/**
 * @vnkrvietnam/ui — PinPad
 * 3×4 numeric keypad for PIN entry.
 * Rows: [1,2,3] [4,5,6] [7,8,9] [⌫,0,✓]
 */
import React, { useState } from "react";
import type { CSSProperties } from "react";

export interface PinPadProps {
  /** Expected PIN length (default 4) */
  length?: number;
  /** Called when full PIN is entered */
  onComplete: (pin: string) => void;
  /** Show error styling */
  error?: boolean;
  errorMessage?: string;
  /** Allow parent to reset/control the current value */
  value?: string;
  onChange?: (val: string) => void;
}

const BTN_SIZE = 68;

export function PinPad({
  length = 4,
  onComplete,
  error = false,
  errorMessage,
  value,
  onChange,
}: PinPadProps) {
  const [internal, setInternal] = useState("");
  const pin = value !== undefined ? value : internal;

  function update(next: string) {
    if (value === undefined) setInternal(next);
    onChange?.(next);
    if (next.length === length) onComplete(next);
  }

  function press(key: string) {
    if (key === "del") {
      update(pin.slice(0, -1));
    } else if (key === "confirm") {
      if (pin.length === length) onComplete(pin);
    } else {
      if (pin.length < length) update(pin + key);
    }
  }

  const keys: (string | null)[] = [
    "1","2","3",
    "4","5","6",
    "7","8","9",
    "del","0","confirm",
  ];

  const btnBase: CSSProperties = {
    width:           BTN_SIZE,
    height:          BTN_SIZE,
    borderRadius:    "50%",
    border:          "none",
    cursor:          "pointer",
    display:         "flex",
    alignItems:      "center",
    justifyContent:  "center",
    fontFamily:      "'Work Sans', sans-serif",
    fontSize:        "1.5rem",
    fontWeight:      500,
    background:      "#F5F6FA",
    color:           "#000000",
    transition:      "background 0.12s",
    outline:         "none",
    userSelect:      "none",
  };

  const iconBtnBase: CSSProperties = {
    ...btnBase,
    fontSize: "1.1rem",
    background: "#EBEBEB",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      {/* Grid */}
      <div style={{
        display:             "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap:                 12,
      }}>
        {keys.map((key, i) => {
          if (key === null) {
            return <div key={i} style={{ width: BTN_SIZE, height: BTN_SIZE }} />;
          }

          if (key === "del") {
            return (
              <PinButton
                key={key}
                style={iconBtnBase}
                onPress={() => press("del")}
                activeStyle={{ background: "#D0D0D0" }}
              >
                {/* Backspace SVG */}
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M21 4H7l-5.5 8 5.5 8H21V4Z" stroke="#000" strokeWidth="1.5" strokeLinejoin="round"/>
                  <path d="M16 9l-4 6M12 9l4 6" stroke="#000" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </PinButton>
            );
          }

          if (key === "confirm") {
            return (
              <PinButton
                key={key}
                style={{
                  ...iconBtnBase,
                  background: pin.length === length
                    ? (error ? "#FF3D71" : "#000000")
                    : "#E0E0E0",
                }}
                onPress={() => press("confirm")}
                activeStyle={{ background: "#333333" }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12l5 5L19 7" stroke={pin.length === length ? "#fff" : "#999"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </PinButton>
            );
          }

          return (
            <PinButton
              key={key}
              style={btnBase}
              onPress={() => press(key)}
              activeStyle={{ background: "#000", color: "#fff" }}
            >
              {key}
            </PinButton>
          );
        })}
      </div>

      {/* Error message */}
      {error && errorMessage && (
        <p style={{
          marginTop:  8,
          fontSize:   "0.8125rem",
          color:      "#FF3D71",
          fontFamily: "'Work Sans', sans-serif",
          textAlign:  "center",
        }}>
          {errorMessage}
        </p>
      )}
    </div>
  );
}

// ─── Helper: pressable button with active state ───────────────────────────────
function PinButton({
  style,
  activeStyle,
  onPress,
  children,
}: {
  style:       CSSProperties;
  activeStyle: CSSProperties;
  onPress:     () => void;
  children:    React.ReactNode;
}) {
  const [active, setActive] = React.useState(false);
  return (
    <button
      style={{ ...style, ...(active ? activeStyle : {}) }}
      onPointerDown={() => setActive(true)}
      onPointerUp={() => { setActive(false); onPress(); }}
      onPointerLeave={() => setActive(false)}
    >
      {children}
    </button>
  );
}
