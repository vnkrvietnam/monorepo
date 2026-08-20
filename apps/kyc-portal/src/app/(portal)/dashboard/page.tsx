"use client";

import React, { useState } from "react";
import {
  BarChart,
  PieChart,
  DataTable,
  Badge,
  Button,
  toast,
} from "@vnkrvietnam/ui-kit";
import type { DataTableColumn } from "@vnkrvietnam/ui-kit";
import type { KYCProfile, KYCStatus } from "@vnkrvietnam/types";

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_SUBMISSIONS: (KYCProfile & {
  name: string;
  email: string;
  submittedAt: string;
})[] = [
  {
    userId: "usr_a1b2c3d4",
    walletAddress: "0xA1B2C3D4E5F6A1B2C3D4E5F6A1B2C3D4E5F6A1B2",
    status: "VERIFIED",
    tier: 2,
    verifiedAt: "2024-12-01T08:30:00Z",
    name: "Nguyễn Văn An",
    email: "an.nv@mail.com",
    submittedAt: "2024-12-01T07:00:00Z",
  },
  {
    userId: "usr_b2c3d4e5",
    walletAddress: "0xB2C3D4E5F6A1B2C3D4E5F6A1B2C3D4E5F6A1B2C3",
    status: "PENDING",
    tier: 1,
    submittedAt: "2024-12-10T09:15:00Z",
    name: "Trần Thị Bình",
    email: "binh.tt@mail.com",
  },
  {
    userId: "usr_c3d4e5f6",
    walletAddress: "0xC3D4E5F6A1B2C3D4E5F6A1B2C3D4E5F6A1B2C3D4",
    status: "REJECTED",
    tier: 1,
    submittedAt: "2024-12-09T11:00:00Z",
    name: "Lê Quốc Cường",
    email: "cuong.lq@mail.com",
  },
  {
    userId: "usr_d4e5f6a1",
    walletAddress: "0xD4E5F6A1B2C3D4E5F6A1B2C3D4E5F6A1B2C3D4E5",
    status: "VERIFIED",
    tier: 3,
    verifiedAt: "2024-11-30T14:00:00Z",
    submittedAt: "2024-11-29T10:00:00Z",
    name: "Phạm Minh Đức",
    email: "duc.pm@mail.com",
  },
  {
    userId: "usr_e5f6a1b2",
    walletAddress: "0xE5F6A1B2C3D4E5F6A1B2C3D4E5F6A1B2C3D4E5F6",
    status: "SUSPENDED",
    tier: 1,
    submittedAt: "2024-12-05T16:30:00Z",
    name: "Hoàng Thu Hà",
    email: "ha.ht@mail.com",
  },
  {
    userId: "usr_f6a1b2c3",
    walletAddress: "0xF6A1B2C3D4E5F6A1B2C3D4E5F6A1B2C3D4E5F6A1",
    status: "PENDING",
    tier: 2,
    submittedAt: "2024-12-11T08:00:00Z",
    name: "Vũ Thành Hưng",
    email: "hung.vt@mail.com",
  },
  {
    userId: "usr_a7b8c9d0",
    walletAddress: "0xA7B8C9D0E1F2A7B8C9D0E1F2A7B8C9D0E1F2A7B8",
    status: "VERIFIED",
    tier: 2,
    verifiedAt: "2024-12-08T10:00:00Z",
    submittedAt: "2024-12-07T09:00:00Z",
    name: "Đinh Thúy Kiều",
    email: "kieu.dt@mail.com",
  },
  {
    userId: "usr_b8c9d0e1",
    walletAddress: "0xB8C9D0E1F2A7B8C9D0E1F2A7B8C9D0E1F2A7B8C9",
    status: "PENDING",
    tier: 1,
    submittedAt: "2024-12-12T07:45:00Z",
    name: "Ngô Văn Lâm",
    email: "lam.nv@mail.com",
  },
];

// ─── KPI cards data ───────────────────────────────────────────────────────────
const KPI_CARDS = [
  {
    label: "Total Users",
    value: "2,847",
    sub: "+128 this month",
    color: "#0095FF",
    bg: "#EFF6FF",
  },
  {
    label: "Pending KYC",
    value: "184",
    sub: "12 in queue now",
    color: "#FFAA00",
    bg: "#FFFBEB",
    warning: true,
  },
  {
    label: "Verified Today",
    value: "37",
    sub: "↑ 12% vs yesterday",
    color: "#00D68F",
    bg: "#ECFDF5",
  },
  {
    label: "Rejection Rate",
    value: "6.3%",
    sub: "↓ 0.8% this week",
    color: "#FF3D71",
    bg: "#FFF1F2",
  },
];

// ─── Chart data ───────────────────────────────────────────────────────────────
const PIE_SEGMENTS = [
  { label: "Verified", value: 1847, color: "#00D68F" },
  { label: "Pending", value: 184, color: "#FFAA00" },
  { label: "Rejected", value: 523, color: "#FF3D71" },
  { label: "Suspended", value: 293, color: "#8F9BB3" },
];

const BAR_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const BAR_SERIES = [
  {
    name: "KYC Submissions",
    data: [28, 42, 35, 61, 47, 38, 22],
    color: "#0095FF",
  },
];

// ─── Status badge helper ──────────────────────────────────────────────────────
function StatusBadge({ status }: { status: KYCStatus }) {
  const map: Record<KYCStatus, { color: "warning" | "success" | "error" | "dark"; label: string }> = {
    PENDING:   { color: "warning", label: "PENDING" },
    VERIFIED:  { color: "success", label: "VERIFIED" },
    REJECTED:  { color: "error",   label: "REJECTED" },
    SUSPENDED: { color: "dark",    label: "SUSPENDED" },
  };
  const cfg = map[status];
  return <Badge variant="label" color={cfg.color} label={cfg.label} />;
}

// ─── Table columns ────────────────────────────────────────────────────────────
type SubmissionRow = KYCProfile & { name: string; email: string; submittedAt: string };

const COLUMNS: DataTableColumn<SubmissionRow>[] = [
  {
    key: "userId",
    label: "User ID",
    render: (v) => (
      <span style={{ fontFamily: "monospace", fontSize: 12, color: "#4A5568" }}>
        {String(v).slice(0, 12)}…
      </span>
    ),
  },
  {
    key: "walletAddress",
    label: "Wallet",
    render: (v) => {
      const addr = String(v);
      return (
        <span style={{ fontFamily: "monospace", fontSize: 12, color: "#4A5568" }}>
          {addr.slice(0, 6)}…{addr.slice(-4)}
        </span>
      );
    },
  },
  {
    key: "status",
    label: "Status",
    render: (v) => <StatusBadge status={v as KYCStatus} />,
  },
  {
    key: "tier",
    label: "Tier",
    align: "center",
    render: (v) => (
      <Badge variant="label" color="info" label={`Tier ${v}`} />
    ),
  },
  {
    key: "verifiedAt",
    label: "Verified At",
    render: (v) =>
      v
        ? new Date(String(v)).toLocaleDateString("vi-VN")
        : <span style={{ color: "#8F9BB3" }}>—</span>,
  },
  {
    key: "userId",
    label: "Action",
    render: (_, row) => (
      <Button
        variant="outlined"
        color="dark"
        size="sm"
        onClick={() => toast.info(`Đang mở hồ sơ: ${row.userId}`)}
      >
        Review
      </Button>
    ),
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  return (
    <div style={{ padding: "24px", fontFamily: "'Work Sans', sans-serif" }}>
      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1A1F36", margin: 0 }}>
          KYC Dashboard
        </h1>
        <p style={{ fontSize: 14, color: "#8F9BB3", marginTop: 4 }}>
          Tổng quan hệ thống xác minh danh tính — {new Date().toLocaleDateString("vi-VN")}
        </p>
      </div>

      {/* KPI Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16,
          marginBottom: 28,
        }}
      >
        {KPI_CARDS.map((kpi) => (
          <div
            key={kpi.label}
            style={{
              background: "#FFFFFF",
              borderRadius: 14,
              padding: "20px 22px",
              border: "1px solid #F3F4F6",
              boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: "#8F9BB3", fontWeight: 500 }}>{kpi.label}</span>
              {kpi.warning && <Badge variant="label" color="warning" label="⚠" />}
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: kpi.color, lineHeight: 1 }}>
              {kpi.value}
            </div>
            <div style={{ fontSize: 12, color: "#8F9BB3", marginTop: 6 }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 2fr",
          gap: 20,
          marginBottom: 28,
        }}
      >
        {/* Pie chart */}
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: 14,
            padding: 20,
            border: "1px solid #F3F4F6",
            boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
          }}
        >
          <PieChart
            segments={PIE_SEGMENTS}
            donut={true}
            legend={true}
            showValues={true}
            title="KYC Status Distribution"
            size={200}
          />
        </div>

        {/* Bar chart */}
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: 14,
            padding: 20,
            border: "1px solid #F3F4F6",
            boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
          }}
        >
          <BarChart
            series={BAR_SERIES}
            labels={BAR_LABELS}
            title="KYC Submissions (7 ngày qua)"
            grid={true}
            legend={false}
            barRadius={6}
            height={220}
          />
        </div>
      </div>

      {/* Recent submissions table */}
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: 14,
          border: "1px solid #F3F4F6",
          boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "20px 24px 0" }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1A1F36", margin: 0 }}>
            Recent Submissions
          </h2>
        </div>
        <DataTable<SubmissionRow>
          columns={COLUMNS}
          data={MOCK_SUBMISSIONS}
          rowKey="userId"
          pageSize={5}
          searchable={false}
        />
      </div>
    </div>
  );
}
