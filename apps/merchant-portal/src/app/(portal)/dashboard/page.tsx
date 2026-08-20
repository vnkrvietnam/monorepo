"use client";
/**
 * /dashboard — Merchant Dashboard
 * KPI cards · BarChart weekly revenue · Recent orders DataTable
 */
import React, { useState } from "react";
import {
  Text,
  Button,
  Badge,
  BarChart,
  DataTable,
  Modal,
} from "@vnkrvietnam/ui-kit";
import type { DataTableColumn } from "@vnkrvietnam/ui-kit";
import type { MerchantOrderResponse } from "@vnkrvietnam/types";

// ─── Mock data ────────────────────────────────────────────────────────────────

interface KpiCard {
  label:    string;
  value:    string;
  sub:      string;
  color:    string;
}

const KPI_CARDS: KpiCard[] = [
  { label: "Today Revenue",  value: "₫4,820,000", sub: "+12.5% vs yesterday",  color: "#00D68F" },
  { label: "Total Orders",   value: "1,247",       sub: "+38 today",            color: "#0095FF" },
  { label: "Success Rate",   value: "97.4%",       sub: "last 7 days",          color: "#AF96FB" },
  { label: "Active APIs",    value: "3",           sub: "keys in use",          color: "#FFAA00" },
];

const WEEKLY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WEEKLY_DATA   = [3200000, 4100000, 2800000, 5500000, 4820000, 6100000, 3900000];

interface RecentOrder extends Record<string, unknown> {
  orderId:   string;
  amount:    number;
  currency:  string;
  status:    MerchantOrderResponse["status"];
  createdAt: string;
}

const RECENT_ORDERS: RecentOrder[] = [
  { orderId: "ORD-0081", amount: 450000,  currency: "VND", status: "PAID",    createdAt: "2025-06-18 14:32" },
  { orderId: "ORD-0080", amount: 1200000, currency: "VND", status: "PENDING", createdAt: "2025-06-18 14:18" },
  { orderId: "ORD-0079", amount: 89000,   currency: "VND", status: "PAID",    createdAt: "2025-06-18 13:55" },
  { orderId: "ORD-0078", amount: 320000,  currency: "VND", status: "EXPIRED", createdAt: "2025-06-18 13:10" },
  { orderId: "ORD-0077", amount: 750000,  currency: "VND", status: "PAID",    createdAt: "2025-06-18 12:44" },
  { orderId: "ORD-0076", amount: 2100000, currency: "VND", status: "PAID",    createdAt: "2025-06-18 11:30" },
  { orderId: "ORD-0075", amount: 60000,   currency: "VND", status: "PENDING", createdAt: "2025-06-18 11:05" },
  { orderId: "ORD-0074", amount: 980000,  currency: "VND", status: "EXPIRED", createdAt: "2025-06-18 10:22" },
];

const STATUS_BADGE: Record<MerchantOrderResponse["status"], { color: "success" | "warning" | "error" | "info"; label: string }> = {
  PAID:    { color: "success", label: "PAID"    },
  PENDING: { color: "warning", label: "PENDING" },
  EXPIRED: { color: "error",   label: "EXPIRED" },
  FAILED:  { color: "error",   label: "FAILED"  },
};

// ─── Columns ──────────────────────────────────────────────────────────────────

const COLUMNS: DataTableColumn<RecentOrder>[] = [
  {
    key:   "orderId",
    label: "Order ID",
    render: (v) => (
      <span style={{ fontFamily: "monospace", fontSize: 13, color: "#2E3A59" }}>{v as string}</span>
    ),
  },
  {
    key:     "amount",
    label:   "Amount",
    sortable: true,
    align:   "right",
    render:  (v) => (
      <span style={{ fontWeight: 600, color: "#1A1F36" }}>
        {(v as number).toLocaleString("vi-VN")}
      </span>
    ),
  },
  {
    key:   "currency",
    label: "Currency",
    align: "center",
    width: 80,
  },
  {
    key:   "status",
    label: "Status",
    align: "center",
    render: (v) => {
      const s = STATUS_BADGE[v as MerchantOrderResponse["status"]];
      return <Badge variant="label" color={s.color} label={s.label} />;
    },
  },
  {
    key:   "createdAt",
    label: "Created",
    render: (v) => (
      <span style={{ fontSize: 13, color: "#718096" }}>{v as string}</span>
    ),
  },
  {
    key:   "_action",
    label: "",
    width: 80,
    render: (_v, row) => (
      <Button
        variant="ghost"
        color="dark"
        size="sm"
        onClick={(e) => { e.stopPropagation(); alert(`View ${row.orderId as string}`); }}
      >
        View
      </Button>
    ),
  },
];

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [selectedOrder, setSelectedOrder] = useState<RecentOrder | null>(null);

  return (
    <div style={{ padding: "24px 28px", maxWidth: 1200 }}>

      {/* ── Page title ─────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <Text variant="h5" weight="bold" color="#1A1F36">Dashboard</Text>
        <Text variant="body2" color="#718096">Tổng quan hoạt động merchant — hôm nay</Text>
      </div>

      {/* ── KPI cards ──────────────────────────────────────────────────── */}
      <div style={{
        display:             "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
        gap:                 16,
        marginBottom:        28,
      }}>
        {KPI_CARDS.map((kpi) => (
          <div key={kpi.label} style={{
            background:   "#fff",
            borderRadius: 14,
            padding:      "20px 22px",
            border:       "1px solid #F3F4F6",
          }}>
            <Text variant="caption" color="#A0AEC0" weight="medium">{kpi.label}</Text>
            <div style={{ marginTop: 6, marginBottom: 4 }}>
              <Text variant="h4" weight="bold" color={kpi.color}>{kpi.value}</Text>
            </div>
            <Text variant="caption" color="#718096">{kpi.sub}</Text>
          </div>
        ))}
      </div>

      {/* ── Weekly Revenue Chart ────────────────────────────────────────── */}
      <div style={{
        background:   "#fff",
        borderRadius: 14,
        border:       "1px solid #F3F4F6",
        padding:      "20px 24px",
        marginBottom: 28,
      }}>
        <Text variant="subtitle1" weight="semibold" color="#1A1F36">Doanh thu 7 ngày gần nhất</Text>
        <div style={{ marginTop: 16 }}>
          <BarChart
            series={[{ name: "Doanh thu", data: WEEKLY_DATA, color: "#AF96FB" }]}
            labels={WEEKLY_LABELS}
            height={220}
            grid
            legend={false}
            barRadius={6}
          />
        </div>
      </div>

      {/* ── Recent orders ───────────────────────────────────────────────── */}
      <div style={{
        background:   "#fff",
        borderRadius: 14,
        border:       "1px solid #F3F4F6",
        padding:      "20px 24px",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <Text variant="subtitle1" weight="semibold" color="#1A1F36">Đơn hàng gần đây</Text>
          <Button variant="ghost" color="dark" size="sm" onClick={() => window.location.href = "/orders"}>
            Xem tất cả
          </Button>
        </div>
        <DataTable<RecentOrder>
          columns={COLUMNS}
          data={RECENT_ORDERS}
          rowKey="orderId"
          pageSize={5}
          onRowClick={(row) => setSelectedOrder(row)}
        />
      </div>

      {/* ── Order detail modal ───────────────────────────────────────────── */}
      <Modal
        open={selectedOrder !== null}
        onClose={() => setSelectedOrder(null)}
        variant="center"
        title={`Order ${selectedOrder?.orderId ?? ""}`}
        maxWidth={440}
      >
        {selectedOrder && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14, paddingBottom: 8 }}>
            {(
              [
                ["Order ID",  selectedOrder.orderId],
                ["Amount",    `${selectedOrder.amount.toLocaleString("vi-VN")} ${selectedOrder.currency}`],
                ["Status",    selectedOrder.status],
                ["Created",   selectedOrder.createdAt],
              ] as [string, string][]
            ).map(([label, val]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #F3F4F6", paddingBottom: 10 }}>
                <Text variant="body2" color="#718096">{label}</Text>
                <Text variant="body2" weight="semibold" color="#1A1F36">{val}</Text>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 4 }}>
              <Text variant="body2" color="#718096">Status Badge</Text>
              <Badge
                variant="label"
                color={STATUS_BADGE[selectedOrder.status].color}
                label={STATUS_BADGE[selectedOrder.status].label}
              />
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}
