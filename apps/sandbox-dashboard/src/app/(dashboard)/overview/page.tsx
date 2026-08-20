"use client";
/**
 * /overview — Sandbox Overview
 * KPI cards · TVL LineChart · Tier Matrix DataTable
 */
import React from "react";
import {
  LineChart,
  DataTable,
  Badge,
  Text,
} from "@vnkrvietnam/ui-kit";
import type { ChartSeries, DataTableColumn } from "@vnkrvietnam/ui-kit";

// ─── Dark card wrapper ────────────────────────────────────────────────────────
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

// ─── KPI card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent: string }) {
  return (
    <DarkCard style={{ flex: 1 }}>
      <Text variant="caption" color="#8B949E" weight="semibold"
        style={{ letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>
        {label}
      </Text>
      <Text variant="h5" weight="semibold" color={accent}>{value}</Text>
      {sub && <Text variant="caption" color="#8B949E" style={{ marginTop: 4, display: "block" }}>{sub}</Text>}
    </DarkCard>
  );
}

// ─── Mock data ────────────────────────────────────────────────────────────────
const TVL_SERIES: ChartSeries[] = [
  {
    name:  "TVL (tỷ VND)",
    data:  [82,91,88,96,103,110,118,122,115,129,134,141,138,145,152,160,157,163,170,174,169,178,183,191,185,194,198,200,197,200],
    color: "#BEFF6C",
    area:  true,
  },
];
const TVL_LABELS = Array.from({ length: 30 }, (_, i) => `${i + 1}`);

interface TierRow {
  id:       string;
  tier:     string;
  duration: string;
  users:    string;
  txLimit:  string;
  tvlCap:   string;
  status:   string;
}

const TIER_ROWS: TierRow[] = [
  { id: "t1", tier: "Tier 1 — Alpha",     duration: "1–3 tháng",  users: "Nội bộ",        txLimit: "5.000.000đ/ví",   tvlCap: "1 Tỷ VND",    status: "ALPHA"      },
  { id: "t2", tier: "Tier 2 — Beta",      duration: "3–6 tháng",  users: "Max 1.000",     txLimit: "20.000.000đ/ví",  tvlCap: "10 Tỷ VND",   status: "ACTIVE"     },
  { id: "t3", tier: "Tier 3 — Staging",   duration: "6–12 tháng", users: "Max 50.000",    txLimit: "100.000.000đ/ví", tvlCap: "200 Tỷ VND",  status: "PENDING"    },
  { id: "t4", tier: "Tier 4 — Commercial",duration: "12–24 tháng",users: "Theo cấp phép", txLimit: "Theo thương mại", tvlCap: "1.000 Tỷ VND",status: "LOCKED"     },
];

const STATUS_COLOR = {
  ALPHA:   { color: "warning" as const, label: "Alpha"    },
  ACTIVE:  { color: "success" as const, label: "Đang chạy"},
  PENDING: { color: "info"    as const, label: "Chờ duyệt"},
  LOCKED:  { color: "dark"    as const, label: "Chưa mở"  },
};

const TIER_COLS: DataTableColumn<TierRow>[] = [
  { key: "tier",     label: "Tier",        sortable: false, width: 220 },
  { key: "duration", label: "Thời gian",   sortable: false },
  { key: "users",    label: "Người dùng",  sortable: false },
  { key: "txLimit",  label: "Hạn mức/Ví",  sortable: false },
  { key: "tvlCap",   label: "TVL tối đa",  sortable: false },
  {
    key: "status", label: "Trạng thái",
    render: (v) => {
      const s = STATUS_COLOR[v as keyof typeof STATUS_COLOR];
      return <Badge variant="label" color={s.color} label={s.label} />;
    },
  },
];

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function OverviewPage() {
  return (
    <div style={{ padding: "0 24px 32px" }}>

      {/* ── KPI row ─────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
        <KpiCard label="Total TVL"      value="200 Tỷ VND"  sub="↑ 4.2% tuần này"   accent="#BEFF6C" />
        <KpiCard label="Active Users"   value="48.231"      sub="Tier 2 Sandbox"     accent="#49DBC8" />
        <KpiCard label="Tx Hôm nay"     value="12.847"      sub="Avg 534/giờ"        accent="#AF96FB" />
        <KpiCard label="System Status"  value="ONLINE"      sub="Uptime 99.98%"      accent="#00D68F" />
      </div>

      {/* ── TVL Chart ───────────────────────────────────────────────────── */}
      <DarkCard style={{ marginBottom: 20 }}>
        <Text variant="subtitle2" weight="semibold" color="#E6EDF3" style={{ marginBottom: 16 }}>
          TVL 30 ngày gần nhất
        </Text>
        <LineChart
          series={TVL_SERIES}
          labels={TVL_LABELS}
          height={200}
          grid
          dots={false}
          legend={false}
        />
      </DarkCard>

      {/* ── Tier matrix table ────────────────────────────────────────────── */}
      <div style={{ marginBottom: 4 }}>
        <Text variant="subtitle2" weight="semibold" color="#E6EDF3" style={{ marginBottom: 12 }}>
          Tier Matrix — Risk Cap
        </Text>
        <DataTable<TierRow>
          columns={TIER_COLS}
          data={TIER_ROWS}
          rowKey="id"
          searchable={false}
          pageSize={4}
          pageSizeOptions={[4]}
          style={{ background: "#161B22", borderColor: "#30363D" }}
        />
      </div>
    </div>
  );
}
