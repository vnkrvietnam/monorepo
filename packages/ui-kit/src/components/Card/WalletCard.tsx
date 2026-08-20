/**
 * @vnkrvietnam/ui — WalletCard
 * Flip animation front/back — extracted from VNKR UI-screens/Card.png & Card-flipped.png
 *
 * Front: card name, balance, color pills, cardholder name, network logo
 * Back:  card number (grouped), expiry, CVV, copy action
 *
 * Brand colors from the design: greeny (#BEFF6C), violet (#AF96FB), pink (#FD9FDD)
 */
import React, { useState } from "react";
import type { CSSProperties, ReactNode } from "react";

export type CardBg = "greeny" | "violet" | "pink" | "dark" | "orange" | "yellow";
export type CardNetwork = "visa" | "mastercard" | "crypto";

const BG_MAP: Record<CardBg, { bg: string; fg: string; accent: string }> = {
  greeny:  { bg: "#BEFF6C", fg: "#000000", accent: "#FD9FDD" },
  violet:  { bg: "#AF96FB", fg: "#000000", accent: "#BEFF6C" },
  pink:    { bg: "#FD9FDD", fg: "#000000", accent: "#AF96FB" },
  dark:    { bg: "#1a1a1a", fg: "#FFFFFF", accent: "#BEFF6C" },
  orange:  { bg: "#FC7339", fg: "#000000", accent: "#FFF172" },
  yellow:  { bg: "#FFF172", fg: "#000000", accent: "#FC7339" },
};

// ─── Color-pill dot row (decorative, from the front card design) ──────────────
const PILL_COLORS = ["#FFF172", "#BEFF6C", "#49DBC8", "#FD9FDD", "#AF96FB", "#FC7339"];

function ColorPills() {
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
      {PILL_COLORS.map(c => (
        <div key={c} style={{
          width: 22, height: 32,
          borderRadius: 99,
          background: c,
          border: "1.5px solid rgba(0,0,0,0.08)",
        }} />
      ))}
    </div>
  );
}

// ─── Wi-Fi NFC icon (top-right of card front) ─────────────────────────────────
function NfcIcon({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M6 9a8 8 0 0 1 12 0"   stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M8.5 11.5a5 5 0 0 1 7 0" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M11 14a2 2 0 0 1 2 0"   stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// ─── VISA wordmark (SVG text) ─────────────────────────────────────────────────
function VisaMark({ color }: { color: string }) {
  return (
    <svg width="48" height="20" viewBox="0 0 48 20">
      <text x="0" y="16" fontFamily="'Times New Roman', serif"
        fontWeight="900" fontSize="18" fill={color} letterSpacing="1">
        VISA
      </text>
    </svg>
  );
}

// ─── Copy-to-clipboard icon ───────────────────────────────────────────────────
function CopyIcon({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

// ─── Props ─────────────────────────────────────────────────────────────────────
export interface WalletCardProps {
  /** Card display name */
  name?:       string;
  /** Cardholder full name */
  holder?:     string;
  /** Last 4 digits shown on front */
  last4?:      string;
  /** Full 16-digit card number (grouped on back) */
  cardNumber?: string;
  /** Expiry MM/YY */
  expiry?:     string;
  /** CVV 3-digit */
  cvv?:        string;
  /** Background color variant */
  bg?:         CardBg;
  /** Card network */
  network?:    CardNetwork;
  /** Card width in px — height auto 1.586:1 ratio */
  width?:      number;
  /** Force flipped state (controlled) */
  flipped?:    boolean;
  /** Callback on flip */
  onFlip?:     (flipped: boolean) => void;
  style?:      CSSProperties;
}

export function WalletCard({
  name       = "Cashie",
  holder     = "VNKR CARDHOLDER",
  last4      = "7890",
  cardNumber = "0823 4567 8900 2345",
  expiry     = "07/25",
  cvv        = "234",
  bg         = "greeny",
  network    = "visa",
  width      = 320,
  flipped: controlledFlipped,
  onFlip,
  style,
}: WalletCardProps) {
  const [internalFlipped, setInternalFlipped] = useState(false);
  const isFlipped = controlledFlipped !== undefined ? controlledFlipped : internalFlipped;
  const c = BG_MAP[bg];
  const h = Math.round(width / 1.586); // ISO 7810 card ratio

  const handleFlip = () => {
    const next = !isFlipped;
    setInternalFlipped(next);
    onFlip?.(next);
  };

  const container: CSSProperties = {
    width,
    height: h,
    perspective: "1200px",
    cursor: "pointer",
    userSelect: "none",
    flexShrink: 0,
    ...style,
  };

  const inner: CSSProperties = {
    position:       "relative",
    width:          "100%",
    height:         "100%",
    transformStyle: "preserve-3d",
    transition:     "transform 0.55s cubic-bezier(0.4, 0.2, 0.2, 1)",
    transform:      isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
  };

  const face: CSSProperties = {
    position:       "absolute",
    inset:          0,
    borderRadius:   20,
    backfaceVisibility: "hidden",
    WebkitBackfaceVisibility: "hidden",
    overflow:       "hidden",
    padding:        Math.round(width * 0.072),
    boxSizing:      "border-box",
    boxShadow:      "0 8px 32px rgba(0,0,0,0.15)",
  };

  const pad = Math.round(width * 0.072);
  const fgColor = c.fg;

  return (
    <div style={container} onClick={handleFlip} aria-label={`${name} card — click to flip`}>
      <div style={inner}>

        {/* ── FRONT ── */}
        <div style={{ ...face, background: c.bg }}>
          {/* Decorative blob */}
          <div style={{
            position: "absolute", right: -width * 0.12, top: -width * 0.05,
            width: width * 0.6, height: width * 0.6,
            borderRadius: "50%",
            background: c.accent,
            opacity: 0.55,
          }} />

          {/* Row 1: name + NFC */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, position: "relative" }}>
            <span style={{ fontSize: width * 0.065, fontWeight: 700, fontFamily: "'Work Sans', sans-serif", color: fgColor }}>
              {name}
            </span>
            <NfcIcon color={fgColor} />
          </div>

          {/* Balance */}
          <div style={{ fontSize: width * 0.13, fontWeight: 700, fontFamily: "'Work Sans', sans-serif", color: fgColor, marginBottom: 12, position: "relative", letterSpacing: "-0.02em" }}>
            $2500<span style={{ fontSize: width * 0.065 }}>.70</span>
          </div>

          {/* Color pills */}
          <div style={{ position: "relative" }}>
            <ColorPills />
          </div>

          {/* Row bottom: holder + network */}
          <div style={{
            position:   "absolute",
            bottom:     pad,
            left:       pad,
            right:      pad,
            display:    "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
          }}>
            <div>
              <div style={{ fontSize: width * 0.038, color: fgColor, opacity: 0.65, fontFamily: "'Work Sans', sans-serif", marginBottom: 2 }}>
                *{last4} · {expiry}
              </div>
              <div style={{ fontSize: width * 0.05, fontWeight: 600, fontFamily: "'Work Sans', sans-serif", color: fgColor }}>
                {holder}
              </div>
            </div>
            {network === "visa" && <VisaMark color={fgColor} />}
          </div>
        </div>

        {/* ── BACK ── */}
        <div style={{
          ...face,
          background: "#121212",
          transform:  "rotateY(180deg)",
          display:    "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}>
          {/* Magnetic stripe */}
          <div style={{
            position: "absolute",
            top: h * 0.18,
            left: 0, right: 0,
            height: h * 0.16,
            background: "#333",
          }} />

          {/* Color pills on left edge (vertical) */}
          <div style={{
            position:  "absolute",
            left:      pad,
            top:       "50%",
            transform: "translateY(-50%) rotate(90deg)",
            transformOrigin: "center",
            display:   "flex",
            gap:       4,
          }}>
            {PILL_COLORS.map(col => (
              <div key={col} style={{ width: 14, height: 22, borderRadius: 99, background: col }} />
            ))}
          </div>

          {/* Card details on right */}
          <div style={{
            position: "absolute",
            right:    pad,
            top:      "50%",
            transform: "translateY(-50%)",
            display:  "flex",
            flexDirection: "column",
            gap:      10,
            alignItems: "flex-start",
          }}>
            <div>
              <div style={{ fontSize: width * 0.032, color: "#888", fontFamily: "'Work Sans', sans-serif", letterSpacing: "0.1em", marginBottom: 3 }}>
                CARD NUMBER
              </div>
              <div style={{ fontSize: width * 0.056, fontWeight: 600, fontFamily: "monospace", color: "#fff", letterSpacing: "0.08em", lineHeight: 1.5 }}>
                {(cardNumber || "").replace(/(.{4})/g, "$1\n").trim()}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                <CopyIcon color="#888" />
              </div>
            </div>
            <div>
              <div style={{ fontSize: width * 0.032, color: "#888", fontFamily: "'Work Sans', sans-serif", letterSpacing: "0.1em", marginBottom: 2 }}>
                EXPIRY
              </div>
              <div style={{ fontSize: width * 0.056, fontWeight: 600, fontFamily: "monospace", color: "#fff" }}>{expiry}</div>
            </div>
            <div>
              <div style={{ fontSize: width * 0.032, color: "#888", fontFamily: "'Work Sans', sans-serif", letterSpacing: "0.1em", marginBottom: 2 }}>
                CVV
              </div>
              <div style={{ fontSize: width * 0.056, fontWeight: 600, fontFamily: "monospace", color: "#fff" }}>{cvv}</div>
            </div>
          </div>

          {/* Network bottom-right */}
          <div style={{ position: "absolute", bottom: pad, right: pad }}>
            <VisaMark color="#fff" />
          </div>

          {/* Card name vertical (left side) */}
          <div style={{
            position:  "absolute",
            left:      pad + 28,
            top:       "50%",
            transform: "translateY(-50%) rotate(-90deg)",
            fontSize:  width * 0.05,
            fontWeight: 600,
            color:     "#fff",
            fontFamily: "'Work Sans', sans-serif",
            whiteSpace: "nowrap",
            letterSpacing: "0.05em",
          }}>
            {name}
          </div>
        </div>

      </div>
    </div>
  );
}
