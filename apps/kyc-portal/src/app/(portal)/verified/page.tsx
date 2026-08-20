"use client";

import React from "react";
import { DataTable, Badge, Button, toast } from "@vnkrvietnam/ui-kit";
import type { DataTableColumn } from "@vnkrvietnam/ui-kit";
import type { KYCProfile } from "@vnkrvietnam/types";

type VerifiedRow = KYCProfile & { name: string; email: string; verifiedAt: string };

const MOCK_VERIFIED: VerifiedRow[] = [
  { userId: "usr_a1b2c3d4", walletAddress: "0xA1B2C3D4E5F6A1B2C3D4E5F6A1B2C3D4E5F6A1B2", status: "VERIFIED", tier: 2, verifiedAt: "2024-12-01T08:30:00Z", name: "Nguyễn Văn An",  email: "an.nv@mail.com"   },
  { userId: "usr_d4e5f6a1", walletAddress: "0xD4E5F6A1B2C3D4E5F6A1B2C3D4E5F6A1B2C3D4E5", status: "VERIFIED", tier: 3, verifiedAt: "2024-11-30T14:00:00Z", name: "Phạm Minh Đức",  email: "duc.pm@mail.com"  },
  { userId: "usr_a7b8c9d0", walletAddress: "0xA7B8C9D0E1F2A7B8C9D0E1F2A7B8C9D0E1F2A7B8", status: "VERIFIED", tier: 2, verifiedAt: "2024-12-08T10:00:00Z", name: "Đinh Thúy Kiều", email: "kieu.dt@mail.com" },
  { userId: "usr_i2j3k4l5", walletAddress: "0xI2J3K4L5M6N7I2J3K4L5M6N7I2J3K4L5M6N7I2J3", status: "VERIFIED", tier: 1, verifiedAt: "2024-12-11T15:00:00Z", name: "Đỗ Thanh Long",   email: "long.dt@mail.com"  },
  { userId: "usr_j3k4l5m6", walletAddress: "0xJ3K4L5M6N7I2J3K4L5M6N7I2J3K4L5M6N7I2J3K4", status: "VERIFIED", tier: 2, verifiedAt: "2024-12-11T12:00:00Z", name: "Bùi Lan Anh",    email: "anh.bl@mail.com"   },
];

const COLUMNS: DataTableColumn<VerifiedRow>[] = [
  { key: "name",  label: "Họ và tên", render: (v) => <span style={{ fontWeight: 600, color: "#1A1F36" }}>{String(v)}</span> },
  { key: "email", label: "Email",      render: (v) => <span style={{ fontSize: 13, color: "#4A5568" }}>{String(v)}</span> },
  {
    key: "walletAddress", label: "Wallet",
    render: (v) => { const a = String(v); return <span style={{ fontFamily: "monospace", fontSize: 12, color: "#4A5568" }}>{a.slice(0,6)}…{a.slice(-4)}</span>; },
  },
  {
    key: "tier", label: "Tier", align: "center" as const,
    render: (v) => <Badge variant="label" color="info" label={`Tier ${v}`} />,
  },
  {
    key: "verifiedAt", label: "Xác minh lúc",
    render: (v) => new Date(String(v)).toLocaleString("vi-VN"),
  },
  {
    key: "userId", label: "Action",
    render: (_, row) => (
      <Button variant="outlined" color="dark" size="sm" onClick={() => toast.info(`Xem chi tiết: ${row.name}`)}>
        Xem
      </Button>
    ),
  },
];

export default function VerifiedPage() {
  return (
    <div style={{ padding: 24, fontFamily: "'Work Sans', sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1A1F36", margin: 0 }}>Đã xác minh</h1>
        <p style={{ fontSize: 14, color: "#8F9BB3", marginTop: 4 }}>
          Tổng cộng <span style={{ color: "#00D68F", fontWeight: 600 }}>{MOCK_VERIFIED.length} users</span> đã hoàn tất xác minh KYC
        </p>
      </div>

      <div style={{ background: "#FFF", borderRadius: 14, border: "1px solid #F3F4F6", boxShadow: "0 1px 4px rgba(0,0,0,0.05)", overflow: "hidden" }}>
        <div style={{ padding: "20px 24px 0" }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1A1F36", margin: 0 }}>Verified Users</h2>
        </div>
        <DataTable<VerifiedRow>
          columns={COLUMNS}
          data={MOCK_VERIFIED}
          rowKey="userId"
          pageSize={8}
          searchable={false}
        />
      </div>
    </div>
  );
}
