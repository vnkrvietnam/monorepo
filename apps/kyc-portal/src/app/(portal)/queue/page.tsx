"use client";

import React, { useState } from "react";
import { DataTable, Badge, Button, toast } from "@vnkrvietnam/ui-kit";
import type { DataTableColumn } from "@vnkrvietnam/ui-kit";
import type { KYCProfile } from "@vnkrvietnam/types";

type QueueRow = KYCProfile & { name: string; email: string; submittedAt: string; waitingMins: number };

const MOCK_QUEUE: QueueRow[] = [
  { userId: "usr_b2c3d4e5", walletAddress: "0xB2C3D4E5F6A1B2C3D4E5F6A1B2C3D4E5F6A1B2C3", status: "PENDING", tier: 1, name: "Trần Thị Bình", email: "binh.tt@mail.com", submittedAt: "2024-12-10T09:15:00Z", waitingMins: 47 },
  { userId: "usr_f6a1b2c3", walletAddress: "0xF6A1B2C3D4E5F6A1B2C3D4E5F6A1B2C3D4E5F6A1", status: "PENDING", tier: 2, name: "Vũ Thành Hưng",  email: "hung.vt@mail.com",  submittedAt: "2024-12-11T08:00:00Z", waitingMins: 112 },
  { userId: "usr_b8c9d0e1", walletAddress: "0xB8C9D0E1F2A7B8C9D0E1F2A7B8C9D0E1F2A7B8C9", status: "PENDING", tier: 1, name: "Ngô Văn Lâm",   email: "lam.nv@mail.com",   submittedAt: "2024-12-12T07:45:00Z", waitingMins: 23 },
  { userId: "usr_g9h0i1j2", walletAddress: "0xG9H0I1J2K3L4G9H0I1J2K3L4G9H0I1J2K3L4G9H0", status: "PENDING", tier: 1, name: "Phan Anh Tuấn",  email: "tuan.pa@mail.com",  submittedAt: "2024-12-12T10:00:00Z", waitingMins: 8 },
  { userId: "usr_h0i1j2k3", walletAddress: "0xH0I1J2K3L4G9H0I1J2K3L4G9H0I1J2K3L4G9H0I1", status: "PENDING", tier: 2, name: "Lý Mỹ Dung",    email: "dung.lm@mail.com",  submittedAt: "2024-12-12T09:30:00Z", waitingMins: 32 },
];

const COLUMNS: DataTableColumn<QueueRow>[] = [
  {
    key: "name", label: "Họ và tên",
    render: (v) => <span style={{ fontWeight: 600, color: "#1A1F36" }}>{String(v)}</span>,
  },
  { key: "email", label: "Email", render: (v) => <span style={{ fontSize: 13, color: "#4A5568" }}>{String(v)}</span> },
  {
    key: "tier", label: "Tier", align: "center" as const,
    render: (v) => <Badge variant="label" color="info" label={`Tier ${v}`} />,
  },
  {
    key: "submittedAt", label: "Nộp lúc",
    render: (v) => new Date(String(v)).toLocaleString("vi-VN"),
  },
  {
    key: "waitingMins", label: "Chờ (phút)", align: "center" as const,
    render: (v) => {
      const mins = Number(v);
      const color = mins > 60 ? "#FF3D71" : mins > 30 ? "#FFAA00" : "#00D68F";
      return <span style={{ fontWeight: 600, color }}>{mins} phút</span>;
    },
  },
  {
    key: "userId", label: "Thao tác",
    render: (_, row) => (
      <div style={{ display: "flex", gap: 8 }}>
        <Button variant="primary" color="success" size="sm" onClick={() => toast.success(`Đã xác minh: ${row.name}`)}>
          Duyệt ✓
        </Button>
        <Button variant="outlined" color="error" size="sm" onClick={() => toast.error(`Từ chối: ${row.name}`)}>
          Từ chối
        </Button>
      </div>
    ),
  },
];

export default function QueuePage() {
  return (
    <div style={{ padding: 24, fontFamily: "'Work Sans', sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1A1F36", margin: 0 }}>KYC Queue</h1>
        <p style={{ fontSize: 14, color: "#8F9BB3", marginTop: 4 }}>
          Hồ sơ đang chờ xét duyệt — <span style={{ color: "#FFAA00", fontWeight: 600 }}>{MOCK_QUEUE.length} trong hàng đợi</span>
        </p>
      </div>

      {/* Alert banner */}
      <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 10, padding: "12px 18px", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
        <Badge variant="label" color="warning" label="⚠ CẢNH BÁO" />
        <span style={{ fontSize: 13, color: "#92400E" }}>2 hồ sơ đang chờ hơn 1 giờ — cần xét duyệt ưu tiên</span>
      </div>

      <div style={{ background: "#FFF", borderRadius: 14, border: "1px solid #F3F4F6", boxShadow: "0 1px 4px rgba(0,0,0,0.05)", overflow: "hidden" }}>
        <div style={{ padding: "20px 24px 0" }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1A1F36", margin: 0 }}>Danh sách chờ duyệt</h2>
        </div>
        <DataTable<QueueRow>
          columns={COLUMNS}
          data={MOCK_QUEUE}
          rowKey="userId"
          pageSize={10}
          searchable={false}
        />
      </div>
    </div>
  );
}
