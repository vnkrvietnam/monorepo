/**
 * @vnkrvietnam/ui — OtpInput
 * N-digit OTP box input with auto-advance focus.
 */
import React, { useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent, ChangeEvent, ClipboardEvent } from "react";

export interface OtpInputProps {
  /** Number of digits (default 4) */
  length?: number;
  onChange?: (val: string) => void;
  onComplete?: (val: string) => void;
  error?: boolean;
}

export function OtpInput({
  length = 4,
  onChange,
  onComplete,
  error = false,
}: OtpInputProps) {
  const [values, setValues] = useState<string[]>(Array(length).fill(""));
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  function update(next: string[]) {
    setValues(next);
    const joined = next.join("");
    onChange?.(joined);
    if (joined.length === length && next.every(v => v !== "")) {
      onComplete?.(joined);
    }
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>, i: number) {
    const char = e.target.value.replace(/\D/g, "").slice(-1);
    if (!char) return;
    const next = [...values];
    next[i] = char;
    update(next);
    if (i < length - 1) refs.current[i + 1]?.focus();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>, i: number) {
    if (e.key === "Backspace") {
      e.preventDefault();
      const next = [...values];
      if (values[i]) {
        next[i] = "";
        update(next);
      } else if (i > 0) {
        next[i - 1] = "";
        update(next);
        refs.current[i - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && i > 0) {
      refs.current[i - 1]?.focus();
    } else if (e.key === "ArrowRight" && i < length - 1) {
      refs.current[i + 1]?.focus();
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!text) return;
    const next = Array(length).fill("");
    for (let j = 0; j < text.length; j++) next[j] = text[j];
    update(next);
    const focusIdx = Math.min(text.length, length - 1);
    refs.current[focusIdx]?.focus();
  }

  function borderColor(i: number, focused: boolean): string {
    if (error) return "#FF3D71";
    if (focused) return "#0095FF";
    if (values[i]) return "#000000";
    return "#E5E7EB";
  }

  return (
    <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
      {values.map((val, i) => (
        <OtpCell
          key={i}
          value={val}
          inputRef={(el) => { refs.current[i] = el; }}
          error={error}
          borderColor={borderColor}
          index={i}
          onChange={(e) => handleChange(e, i)}
          onKeyDown={(e) => handleKeyDown(e, i)}
          onPaste={handlePaste}
        />
      ))}
    </div>
  );
}

function OtpCell({
  value, inputRef, error, borderColor, index, onChange, onKeyDown, onPaste,
}: {
  value: string;
  inputRef: (el: HTMLInputElement | null) => void;
  error: boolean;
  borderColor: (i: number, f: boolean) => string;
  index: number;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
  onPaste: (e: ClipboardEvent<HTMLInputElement>) => void;
}) {
  const [focused, setFocused] = useState(false);
  const style: CSSProperties = {
    width:         56,
    height:        64,
    border:        `1.5px solid ${borderColor(index, focused)}`,
    borderRadius:  12,
    background:    "#F5F6FA",
    textAlign:     "center",
    fontSize:      "1.5rem",
    fontWeight:    600,
    fontFamily:    "'Work Sans', sans-serif",
    color:         "#000000",
    outline:       "none",
    transition:    "border-color 0.15s",
    caretColor:    "#0095FF",
  };
  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      maxLength={1}
      value={value}
      style={style}
      onChange={onChange}
      onKeyDown={onKeyDown}
      onPaste={onPaste}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}
