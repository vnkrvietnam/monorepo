"use client";
/**
 * /set-pin — Set PIN Page
 */
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { PinPad } from "@vnkrvietnam/ui-kit";

const PIN_LENGTH = 4;

export default function SetPinPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");

  function handleComplete(value: string) {
    if (value.length === PIN_LENGTH) {
      // Save temporarily in sessionStorage for confirm step
      sessionStorage.setItem("vnkr_pin_temp", value);
      router.push("/confirm-pin");
    }
  }

  return (
    <div style={{
      minHeight:     "100vh",
      background:    "#FFFFFF",
      display:       "flex",
      flexDirection: "column",
      alignItems:    "center",
      fontFamily:    "'Work Sans', sans-serif",
      padding:       "64px 24px 48px",
    }}>
      {/* Title */}
      <div style={{ width: "100%", maxWidth: 360, textAlign: "center", marginBottom: 40 }}>
        <h1 style={{ margin: 0, fontSize: "1.625rem", fontWeight: 700, color: "#000" }}>
          Đặt mã PIN
        </h1>
        <p style={{ margin: "10px 0 0", fontSize: "0.9375rem", color: "#8F9BB3" }}>
          PIN gồm 4 chữ số, dùng để đăng nhập lại
        </p>
      </div>

      {/* Dot indicators */}
      <PinDots filled={pin.length} total={PIN_LENGTH} />

      <div style={{ marginTop: 48 }}>
        <PinPad
          length={PIN_LENGTH}
          value={pin}
          onChange={setPin}
          onComplete={handleComplete}
        />
      </div>
    </div>
  );
}

function PinDots({ filled, total }: { filled: number; total: number }) {
  return (
    <div style={{ display: "flex", gap: 16 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            width:        16,
            height:       16,
            borderRadius: "50%",
            background:   i < filled ? "#000000" : "#E5E7EB",
            transition:   "background 0.15s",
            border:       `2px solid ${i < filled ? "#000000" : "#CBD5E0"}`,
          }}
        />
      ))}
    </div>
  );
}
