"use client";
/**
 * /tiers — Tier Matrix detail
 * Comparison table + BarChart TVL by tier
 */
import React, { useState } from "react";
import {
  BarChart,
  Badge,
  Text,
} from "@vnkrvietnam/ui-kit";
import type { ChartSeries } from "@vnkrvietnam/ui-kit";

// ─── Comparison table ─────────────────────────────────────────────────────────
const CRITERIA = [
  {
    label: "Thời gian",
    t1: "1–3 tháng",
    t2: "3–6 tháng",
    t3: "6–12 tháng",
    t4: "12–24 tháng",
  },
  {
    label: "Đối tượng người dùng",
    t1: "Nội bộ & Whitelist",
    t2: "Max 1.000 KYC",
    t3: "Max 50.000",
    t4: "Theo hạn mức cấp",
  },
  {
    label: "Hạn mức / Ví",
    t1: "5.000.000 VND",
    t2: "20.000.000 VND",
    t3: "100.000.000 VND",
    t4: "Theo cấp phép",
  },
  {
    label: "TVL tối đa",
    t1: "1 Tỷ VND",
    t2: "10 Tỷ VND",
    t3: "200 Tỷ VND",
    t4: "1.000 Tỷ VND",
  },
  {
    label: "Tần suất Báo cáo",
    t1: "Real-time SupTech",
    t2: "Real-time SupTech",
    t3: "Tuần + SupTech",
    t4: "Tháng + Audit",
  },
];

const TIER_LABELS = ["Tier 1\nAlpha", "Tier 2\nBeta", "Tier 3\nStaging", "Tier 4\nCommercial"];
const TIER_COLORS = ["#FFAA00", "#0095FF", "#00D68F", "#AF96FB"];

const TVL_SERIES: ChartSeries[] = [
  { name: "TVL tối đa (Tỷ VND)", data: [1, 10, 200, 1000], color: "#AF96FB" },
];
const TVL_LABELS = ["Tier 1", "Tier 2", "Tier 3", "Tier 4"];

const TIER_META = [
  { tier: "Tier 1", status: "ALPHA",   color: "warning" as const, active: false },
  { tier: "Tier 2", status: "ACTIVE",  color: "success" as const, active: true  },
  { tier: "Tier 3", status: "PENDING", color: "info"    as const, active: false },
  { tier: "Tier 4", status: "LOCKED",  color: "dark"    as const, active: false },
];

function DarkCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background:   "#161B22",
      border:       "1px solid #30363D",
      borderRadius: 14,
      padding:      "16px 20px",
      ...style,
    }}>
      {children}
    </div>
  );
}

export default function TiersPage() {
  const [activeTier] = useState(1); // Tier 2 is index 1 = currently active

  return (
    <div style={{ padding: "0 24px 32px" }}>

      {/* ── Active tier indicator ────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        {TIER_META.map((t, i) => (
          <div key={t.tier} style={{
            flex:         1,
            background:   t.active ? "#1A2A1A" : "#161B22",
            border:       `2px solid ${t.active ? "#00D68F" : "#30363D"}`,
            borderRadius: 12,
            padding:      "12px 14px",
            position:     "relative",
          }}>
            {t.active && (
              <div style={{
                position: "absolute", top: -10, right: 10,
                background: "#00D68F", color: "#000",
                fontSize: 10, fontWeight: 700,
                padding: "2px 8px", borderRadius: 99,
                fontFamily: "'Work Sans', sans-serif",
              }}>
                ĐANG CHẠY
              </div>
            )}
            <Text variant="subtitle2" weight="semibold" color={t.active ? "#00D68F" : "#E6EDF3"}>
              {t.tier}
            </Text>
            <div style={{ marginTop: 6 }}>
              <Badge variant="label" color={t.color} label={t.status} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Comparison table ─────────────────────────────────────────────── */}
      <DarkCard style={{ marginBottom: 20, overflowX: "auto" }}>
        <Text variant="subtitle2" weight="semibold" color="#E6EDF3" style={{ marginBottom: 14 }}>
          So sánh chi tiết các Tier
        </Text>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 580 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #30363D" }}>
              <th style={{ padding: "8px 12px", textAlign: "left", color: "#8B949E", fontWeight: 600,
                fontSize: 11, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                Tiêu chí
              </th>
              {TIER_META.map((t, i) => (
                <th key={t.tier} style={{
                  padding: "8px 12px", textAlign: "center",
                  color: t.active ? TIER_COLORS[i] : "#8B949E",
                  fontWeight: 700, fontSize: 12,
                }}>
                  {t.tier}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CRITERIA.map((row, ri) => (
              <tr key={ri} style={{ borderBottom: "1px solid #21262D" }}>
                <td style={{ padding: "10px 12px", color: "#8B949E", fontWeight: 500,
                  fontFamily: "'Work Sans', sans-serif", fontSize: 13 }}>
                  {row.label}
                </td>
                {[row.t1, row.t2, row.t3, row.t4].map((val, ci) => (
                  <td key={ci} style={{
                    padding: "10px 12px",
                    textAlign: "center",
                    color: ci === activeTier ? "#E6EDF3" : "#6E7681",
                    fontWeight: ci === activeTier ? 600 : 400,
                    fontFamily: "'Work Sans', sans-serif",
                    fontSize: 13,
                    background: ci === activeTier ? "rgba(0,214,143,0.05)" : "transparent",
                  }}>
                    {val}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </DarkCard>

      {/* ── TVL chart ────────────────────────────────────────────────────── */}
      <DarkCard>
        <Text variant="subtitle2" weight="semibold" color="#E6EDF3" style={{ marginBottom: 12 }}>
          TVL tối đa theo Tier (Tỷ VND)
        </Text>
        <BarChart
          series={TVL_SERIES}
          labels={TVL_LABELS}
          height={200}
          grid
          legend={false}
          barRadius={6}
        />
      </DarkCard>
    </div>
  );
}
