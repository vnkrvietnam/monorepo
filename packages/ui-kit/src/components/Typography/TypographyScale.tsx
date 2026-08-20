/**
 * TypographyScale — visual reference component
 * Renders every variant of the VNKR type scale side by side (for docs / Storybook).
 */
import React from "react";
import { Text } from "./Text";

const HEADLINES = ["h1", "h2", "h3", "h4", "h5", "h6"] as const;
const WEIGHTS   = ["semibold", "medium", "regular"] as const;
const SUBTITLES = ["subtitle1", "subtitle2"] as const;
const BODIES    = ["body1", "body2", "caption", "overline"] as const;
const BUTTONS   = ["btnGiant", "btnLarge", "btnMedium", "btnSmall"] as const;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 48 }}>
      <div style={{
        fontSize: "0.75rem",
        fontWeight: 600,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: "#8F9BB3",
        marginBottom: 16,
        borderBottom: "1px solid #EDF2F7",
        paddingBottom: 8,
      }}>
        {title}
      </div>
      {children}
    </div>
  );
}

export function TypographyScale() {
  return (
    <div style={{ fontFamily: "'Work Sans', sans-serif", padding: 40, background: "#FFFFFF", maxWidth: 900 }}>
      <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, color: "#000" }}>Typography</div>
      <div style={{ fontSize: 14, color: "#8F9BB3", marginBottom: 48 }}>
        Font type: <strong>Work Sans</strong> — Semibold / Medium / Regular
      </div>

      {/* Font weights */}
      <Section title="Font type">
        <div style={{ display: "flex", gap: 24 }}>
          {WEIGHTS.map(w => (
            <div key={w} style={{
              border: "1px solid #EDF2F7",
              borderRadius: 12,
              padding: "16px 24px",
              minWidth: 180,
            }}>
              <div style={{ fontSize: 22, fontWeight: w === "semibold" ? 600 : w === "medium" ? 500 : 400, color: "#2E3A59" }}>
                Aa
              </div>
              <div style={{ fontSize: 14, fontWeight: w === "semibold" ? 600 : w === "medium" ? 500 : 400, color: "#2E3A59", marginTop: 4 }}>
                Work Sans
              </div>
              <div style={{ fontSize: 12, color: "#8F9BB3", marginTop: 2, textTransform: "capitalize" }}>{w}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* Headlines */}
      <Section title="Headlines">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0 32px" }}>
          {WEIGHTS.map(w =>
            HEADLINES.map(h => (
              <div key={`${h}-${w}`} style={{ marginBottom: 24 }}>
                <Text variant={h} weight={w} color="#2E3A59">
                  {h.toUpperCase()}
                </Text>
                <div style={{ fontSize: 11, color: "#8F9BB3", marginTop: 2 }}>
                  {h.toUpperCase()} / {w.charAt(0).toUpperCase() + w.slice(1)} / {VARIANT_PX[h]}px
                </div>
              </div>
            ))
          )}
        </div>
      </Section>

      {/* Subtitles */}
      <Section title="Subtitle">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0 32px" }}>
          {(["medium", "regular"] as const).map(w =>
            SUBTITLES.map(s => (
              <div key={`${s}-${w}`} style={{ marginBottom: 20 }}>
                <Text variant={s} weight={w} color="#2E3A59">
                  {s === "subtitle1" ? "S1" : "S2"}
                </Text>
                <div style={{ fontSize: 11, color: "#8F9BB3" }}>
                  {s === "subtitle1" ? "Subtitle 1" : "Subtitle 2"} / {w.charAt(0).toUpperCase() + w.slice(1)} / {VARIANT_PX[s]}px
                </div>
              </div>
            ))
          )}
        </div>
      </Section>

      {/* Body */}
      <Section title="Body">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0 32px" }}>
          {BODIES.map(b => (
            <div key={b} style={{ marginBottom: 16 }}>
              <Text variant={b} color="#2E3A59">{BODY_LABELS[b]}</Text>
              <div style={{ fontSize: 11, color: "#8F9BB3" }}>
                {BODY_LABELS[b]} / {b.includes("body") ? "Medium" : "Regular"} / {VARIANT_PX[b]}px
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Button */}
      <Section title="Button">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0 32px" }}>
          {BUTTONS.map(b => (
            <div key={b} style={{ marginBottom: 16 }}>
              <Text variant={b} color="#2E3A59" style={{ textTransform: "uppercase" }}>
                {BTN_LABELS[b]}
              </Text>
              <div style={{ fontSize: 11, color: "#8F9BB3", marginTop: 2 }}>
                Button / AA / {VARIANT_PX[b]}px
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

const VARIANT_PX: Record<string, number> = {
  h1: 96, h2: 60, h3: 48, h4: 34, h5: 24, h6: 20,
  subtitle1: 16, subtitle2: 14,
  body1: 16, body2: 14, caption: 12, overline: 10,
  btnGiant: 20, btnLarge: 16, btnMedium: 14, btnSmall: 12,
};

const BODY_LABELS: Record<string, string> = {
  body1: "B1", body2: "B2", caption: "Caption", overline: "OVERLINE",
};

const BTN_LABELS: Record<string, string> = {
  btnGiant: "Giant", btnLarge: "Large", btnMedium: "Medium", btnSmall: "Small",
};
