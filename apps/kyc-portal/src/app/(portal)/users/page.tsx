"use client";

import React, { useState } from "react";
import { DataTable, Badge, Button, Input, toast } from "@vnkrvietnam/ui-kit";
import type { DataTableColumn } from "@vnkrvietnam/ui-kit";
import type { KYCProfile, KYCStatus } from "@vnkrvietnam/types";

type UserRow = KYCProfile & { name: string; email: string; createdAt: string };

const MOCK_USERS: UserRow[] = [
  { userId: "usr_a1b2c3d4", walletAddress: "0xA1B2C3D4E5F6A1B2C3D4E5F6A1B2C3D4E5F6A1B2", status: "VERIFIED",  tier: 2, verifiedAt: "2024-12-01T08:30:00Z", name: "Nguyễn Văn An",  email: "an.nv@mail.com",     createdAt: "2024-11-28T00:00:00Z" },
  { userId: "usr_b2c3d4e5", walletAddress: "0xB2C3D4E5F6A1B2C3D4E5F6A1B2C3D4E5F6A1B2C3", status: "PENDING",   tier: 1,                              name: "Trần Thị Bình", email: "binh.tt@mail.com",   createdAt: "2024-12-09T00:00:00Z" },
  { userId: "usr_c3d4e5f6", walletAddress: "0xC3D4E5F6A1B2C3D4E5F6A1B2C3D4E5F6A1B2C3D4", status: "REJECTED",  tier: 1,                              name: "Lê Quốc Cường", email: "cuong.lq@mail.com",  createdAt: "2024-12-08T00:00:00Z" },
  { userId: "usr_d4e5f6a1", walletAddress: "0xD4E5F6A1B2C3D4E5F6A1B2C3D4E5F6A1B2C3D4E5", status: "VERIFIED",  tier: 3, verifiedAt: "2024-11-30T14:00:00Z", name: "Phạm Minh Đức",  email: "duc.pm@mail.com",    createdAt: "2024-11-25T00:00:00Z" },
  { userId: "usr_e5f6a1b2", walletAddress: "0xE5F6A1B2C3D4E5F6A1B2C3D4E5F6A1B2C3D4E5F6", status: "SUSPENDED", tier: 1,                              name: "Hoàng Thu Hà",  email: "ha.ht@mail.com",     createdAt: "2024-12-04T00:00:00Z" },
  { userId: "usr_f6a1b2c3", walletAddress: "0xF6A1B2C3D4E5F6A1B2C3D4E5F6A1B2C3D4E5F6A1", status: "PENDING",   tier: 2,                              name: "Vũ Thành Hưng",  email: "hung.vt@mail.com",   createdAt: "2024-12-10T00:00:00Z" },
  { userId: "usr_a7b8c9d0", walletAddress: "0xA7B8C9D0E1F2A7B8C9D0E1F2A7B8C9D0E1F2A7B8", status: "VERIFIED",  tier: 2, verifiedAt: "2024-12-08T10:00:00Z", name: "Đinh Thúy Kiều", email: "kieu.dt@mail.com",   createdAt: "2024-12-06T00:00:00Z" },
  { userId: "usr_b8c9d0e1", walletAddress: "0xB8C9D0E1F2A7B8C9D0E1F2A7B8C9D0E1F2A7B8C9", status: "PENDING",   tier: 1,                              name: "Ngô Văn Lâm",   email: "lam.nv@mail.com",    createdAt: "2024-12-11T00:00:00Z" },
];

const STATUS_MAP: Record<KYCStatus, { color: "warning" | "success" | "error" | "dark"; label: string }> = {
  PENDING:   { color: "warning", label: "PENDING" },
  VERIFIED:  { color: "success", label: "VERIFIED" },
  REJECTED:  { color: "error",   label: "REJECTED" },
  SUSPENDED: { color: "dark",    label: "SUSPENDED" },
};

const COLUMNS: DataTableColumn<UserRow>[] = [
  { key: "name",   label: "Họ và tên",  render: (v) => <span style={{ fontWeight: 600, color: "#1A1F36" }}>{String(v)}</span> },
  { key: "email",  label: "Email",      render: (v) => <span style={{ color: "#4A5568", fontSize: 13 }}>{String(v)}</span> },
  {
    key: "walletAddress", label: "Wallet",
    render: (v) => {
      const a = String(v);
      return <span style={{ fontFamily: "monospace", fontSize: 12, color: "#4A5568" }}>{a.slice(0, 6)}…{a.slice(-4)}</span>;
    },
  },
  {
    key: "status", label: "Trạng thái",
    render: (v) => {
      const cfg = STATUS_MAP[v as KYCStatus];
      return <Badge variant="label" color={cfg.color} label={cfg.label} />;
    },
  },
  {
    key: "tier", label: "Tier", align: "center" as const,
    render: (v) => <Badge variant="label" color="info" label={`Tier ${v}`} />,
  },
  {
    key: "createdAt", label: "Ngày tạo",
    render: (v) => new Date(String(v)).toLocaleDateString("vi-VN"),
  },
  {
    key: "userId", label: "Action",
    render: (_, row) => (
      <Button variant="outlined" color="dark" size="sm" onClick={() => toast.info(`Xem hồ sơ: ${row.name}`)}>
        Chi tiết
      </Button>
    ),
  },
];

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const filtered = MOCK_USERS.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.userId.includes(search)
  );

  return (
    <div style={{ padding: 24, fontFamily: "'Work Sans', sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1A1F36", margin: 0 }}>Quản lý Users</h1>
        <p style={{ fontSize: 14, color: "#8F9BB3", marginTop: 4 }}>Danh sách toàn bộ người dùng đã đăng ký — {MOCK_USERS.length} users</p>
      </div>

      <div style={{ background: "#FFF", borderRadius: 14, border: "1px solid #F3F4F6", boxShadow: "0 1px 4px rgba(0,0,0,0.05)", overflow: "hidden" }}>
        <div style={{ padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1A1F36", margin: 0 }}>Tất cả Users</h2>
          <div style={{ width: 280 }}>
            <Input
              placeholder="Tìm kiếm theo tên, email, user ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              size="sm"
            />
          </div>
        </div>
        <DataTable<UserRow>
          columns={COLUMNS}
          data={filtered}
          rowKey="userId"
          pageSize={6}
          searchable={false}
        />
      </div>
    </div>
  );
}
