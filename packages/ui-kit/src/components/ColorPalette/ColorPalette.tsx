import React from "react";
import type { CSSProperties } from "react";
import {
  colorBrand, colorShades, colorWhite,
  colorInfo, colorSuccess, colorWarning, colorError,
  colorBackground,
} from "../../tokens/colors";

// ─── Single swatch ────────────────────────────────────────────────────────────
interface SwatchProps {
  color: string;
  label?: string;
  hex?: string;
  size?: number;
}

function Swatch({ color, label, hex, size = 56 }: SwatchProps) {
  const isLight = isColorLight(color);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div style={{
        width: size, height: size,
        borderRadius: 12,
        background: color,
        border: "1px solid rgba(0,0,0,0.06)",
        boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
      }} />
      {label && (
        <span style={{ fontSize: 11, fontWeight: 600, color: "#2E3A59", textAlign: "center", lineHeight: 1.3 }}>
          {label}
        </span>
      )}
      {hex && (
        <span style={{ fontSize: 10, color: "#8F9BB3", fontFamily: "monospace" }}>
          {hex}
        </span>
      )}
    </div>
  );
}

// ─── Shade row ────────────────────────────────────────────────────────────────
interface ShadeRowProps {
  label: string;
  shades: readonly string[];
}

function ShadeRow({ label, shades }: ShadeRowProps) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: "#2E3A59", marginBottom: 10, textTransform: "capitalize" }}>
        {label}
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {shades.map((hex, i) => (
          <div key={hex} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{
              width: 52, height: 52,
              borderRadius: 10,
              background: hex,
              border: "1px solid rgba(0,0,0,0.06)",
            }} />
            <span style={{ fontSize: 9, color: "#8F9BB3", fontFamily: "monospace" }}>{hex}</span>
            <span style={{ fontSize: 9, color: "#A0AEC0" }}>{i * 100 || "base"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 48 }}>
      <div style={{
        fontSize: "0.7rem",
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: "#8F9BB3",
        borderBottom: "1px solid #EDF2F7",
        paddingBottom: 8,
        marginBottom: 20,
      }}>
        {title}
      </div>
      {children}
    </div>
  );
}

// ─── ColorPalette component ───────────────────────────────────────────────────
export function ColorPalette() {
  return (
    <div style={{ fontFamily: "'Work Sans', sans-serif", padding: 40, background: "#FFFFFF", maxWidth: 960 }}>
      <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 4, color: "#000" }}>Color Palette</div>
      <div style={{ fontSize: 13, color: "#8F9BB3", marginBottom: 48 }}>VNKR Design System — Brand & Semantic Colors</div>

      {/* Brand Accents */}
      <Section title="Brand Palette">
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          {Object.entries(colorBrand).map(([name, hex]) => (
            <Swatch key={name} color={hex} label={name.charAt(0).toUpperCase() + name.slice(1)} hex={hex} size={64} />
          ))}
        </div>
      </Section>

      {/* Semantic base */}
      <Section title="Semantic Colors">
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          {[
            { label: "Info",      hex: colorInfo    },
            { label: "Success",   hex: colorSuccess  },
            { label: "Warning",   hex: colorWarning  },
            { label: "Error",     hex: colorError    },
          ].map(({ label, hex }) => (
            <Swatch key={label} color={hex} label={label} hex={hex} size={64} />
          ))}
        </div>
      </Section>

      {/* Background / surface */}
      <Section title="Background / Surface">
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          {Object.entries(colorBackground).map(([name, hex]) => (
            <Swatch key={name} color={hex} label={name.charAt(0).toUpperCase() + name.slice(1)} hex={hex} size={64} />
          ))}
        </div>
      </Section>

      {/* Shade scales */}
      <Section title="Shade Scales">
        {Object.entries(colorShades).map(([key, arr]) => (
          <ShadeRow key={key} label={key} shades={arr} />
        ))}
      </Section>
    </div>
  );
}

// ─── Helper ───────────────────────────────────────────────────────────────────
function isColorLight(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) > 160;
}
