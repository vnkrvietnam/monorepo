/**
 * ButtonShowcase — visual reference for all Button variants, colors, states & sizes
 */
import React, { useState } from "react";
import { Button } from "./Button";
import type { ButtonColor, ButtonVariant, ButtonSize } from "./Button";
import { Star, ArrowRight } from "../Icon/icons";

const COLORS: ButtonColor[]  = ["dark","grey","info","success","warning","error","navy","white"];
const VARIANTS: ButtonVariant[] = ["filled","outlined","ghost"];
const SIZES: ButtonSize[]    = ["sm","md","lg","giant"];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 48 }}>
      <div style={{
        fontSize:"0.7rem", fontWeight:700, letterSpacing:"0.08em",
        textTransform:"uppercase", color:"#8F9BB3",
        borderBottom:"1px solid #EDF2F7", paddingBottom:8, marginBottom:20,
      }}>{title}</div>
      {children}
    </div>
  );
}

export function ButtonShowcase() {
  const [loading, setLoading] = useState(false);

  return (
    <div style={{ fontFamily:"'Work Sans', sans-serif", padding:40, background:"#FFFFFF", maxWidth:960 }}>
      <div style={{ fontSize:28, fontWeight:700, marginBottom:4, color:"#000" }}>Buttons & Inputs</div>
      <div style={{ fontSize:13, color:"#8F9BB3", marginBottom:48 }}>
        VNKR Design System — Button variants, states & sizes
      </div>

      {/* ── Variant × Color matrix ── */}
      <Section title="Button Types — 3 Variants × 8 Colors">
        <div style={{ display:"grid", gridTemplateColumns:"120px repeat(3, 1fr)", gap:16, alignItems:"center" }}>
          {/* Header row */}
          <div />
          {VARIANTS.map(v => (
            <div key={v} style={{ fontSize:12, fontWeight:700, color:"#2E3A59", textAlign:"center", textTransform:"capitalize" }}>
              {v}
            </div>
          ))}
          {/* Data rows */}
          {COLORS.map(c => (
            <React.Fragment key={c}>
              <div style={{ fontSize:12, color:"#8F9BB3", textTransform:"capitalize" }}>{c}</div>
              {VARIANTS.map(v => (
                <div key={v} style={{
                  padding:12, borderRadius:8,
                  background: c === "white" && v === "filled" ? "#2E3A59"
                            : c === "white" ? "#2E3A59"
                            : v === "ghost" ? "#F9FAFB" : "#FFFFFF",
                  display:"flex", justifyContent:"center",
                  border:"1px solid #EDF2F7",
                }}>
                  <Button variant={v} color={c} size="md"
                    iconLeft={<Star size={14} />}
                    iconRight={<Star size={14} />}
                    elevate={v === "filled"}>
                    Button
                  </Button>
                </div>
              ))}
            </React.Fragment>
          ))}
        </div>
      </Section>

      {/* ── Size scale ── */}
      <Section title="Size Scale">
        <div style={{ display:"flex", gap:16, flexWrap:"wrap", alignItems:"flex-end" }}>
          {SIZES.map(sz => (
            <div key={sz} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
              <Button size={sz} color="dark" iconRight={<ArrowRight size={sz === "sm" ? 12 : sz === "md" ? 14 : sz === "lg" ? 16 : 18} />}>
                {sz.charAt(0).toUpperCase() + sz.slice(1)}
              </Button>
              <span style={{ fontSize:10, color:"#A0AEC0", fontFamily:"monospace" }}>{sz}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* ── States ── */}
      <Section title="States">
        <div style={{ display:"flex", gap:16, flexWrap:"wrap", alignItems:"flex-end" }}>
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
            <Button color="info" elevate>Default</Button>
            <span style={{ fontSize:10, color:"#A0AEC0" }}>Default</span>
          </div>
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
            <Button color="info" disabled>Disabled</Button>
            <span style={{ fontSize:10, color:"#A0AEC0" }}>Disabled</span>
          </div>
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
            <Button color="info" loading={loading} onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 2000); }}>
              {loading ? "Loading..." : "Click to Load"}
            </Button>
            <span style={{ fontSize:10, color:"#A0AEC0" }}>Loading</span>
          </div>
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
            <Button color="success" elevate>Elevated</Button>
            <span style={{ fontSize:10, color:"#A0AEC0" }}>Elevated</span>
          </div>
        </div>
      </Section>

      {/* ── Full width ── */}
      <Section title="Full Width">
        <div style={{ display:"flex", flexDirection:"column", gap:12, maxWidth:480 }}>
          <Button color="dark" fullWidth size="lg">Tiếp tục</Button>
          <Button color="dark" variant="outlined" fullWidth size="lg">Đăng nhập bằng SĐT</Button>
          <Button color="error" variant="ghost" fullWidth size="md">Đăng xuất</Button>
        </div>
      </Section>
    </div>
  );
}
