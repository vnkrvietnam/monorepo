"use client";

import React from "react";
import { DataTable, Badge, Button, toast } from "@vnkrvietnam/ui-kit";
import type { DataTableColumn } from "@vnkrvietnam/ui-kit";
import type { KYCProfile } from "@vnkrvietnam/types";

type RejectedRow = KYCProfile & { name: string; email: string; rejectedAt: string; reason: string };

const MOCK_REJECTED: RejectedRow[] = [
  { userId: "usr_c3d4e5f6", walletAddress: "0xC3D4E5F6A1B2C3D4E5F6A1B2C3D4E5F6A1B2C3D4", status: "REJECTED", tier: 1, name: "Lê Quốc Cường",   email: "cuong.lq@mail.com",  rejectedAt: "2024-12-09T13:00:00Z", reason: "Ảnh CCCD không rõ / mờ" },
  { userId: "usr_k4l5m6n7", walletAddress: "0xK4L5M6N7I2J3K4L5M6N7I2J3K4L5M6N7I2J3K4L5", status: "REJECTED", tier: 1, name: "Trương Hồng Nhung", email: "nhung.th@mail.com",  rejectedAt: "2024-12-10T11:00:00Z", reason: "Selfie không khớp với ảnh trên CCCD" },
  { userId: "usr_l5m6n7o8", walletAddress: "0xL5M6N7O8P9Q0L5M6N7O8P9Q0L5M6N7O8P9Q0L5M6", status: "REJECTED", tier: 1, name: "Đinh Xuân Bách",   email: "bach.dx@mail.com",   rejectedAt: "2024-12-08T09:30:00Z", reason: "Tài liệu hết hạn" },
];

const COLUMNS: DataTableColumn<RejectedRow>[] = [
  { key: "name",  label: "Họ và tên", render: (v) => <span style={{ fontWeight: 600, color: "#1A1F36" }}>{String(v)}</span> },
  { key: "email", label: "Email",      render: (v) => <span style={{ fontSize: 13, color: "#4A5568" }}>{String(v)}</span> },
  {
    key: "reason", label: "Lý do từ chối",
    render: (v) => <span style={{ fontSize: 13, color: "#FF3D71" }}>{String(v)}</span>,
  },
  {
    key: "rejectedAt", label: "Từ chối lúc",
    render: (v) => new Date(String(v)).toLocaleString("vi-VN"),
  },
  {
    key: "userId", label: "Thao tác",
    render: (_, row) => (
      <div style={{ display: "flex", gap: 8 }}>
        <Button variant="outlined" color="dark" size="sm" onClick={() => toast.info(`Xem hồ sơ: ${row.name}`)}>
          Xem
        </Button>
        <Button variant="outlined" color="success" size="sm" onClick={() => toast.success(`Đưa vào queue lại: ${row.name}`)}>
          Requeue
        </Button>
      </div>
    ),
  },
];

export default function RejectedPage() {
  return (
    <div style={{ padding: 24, fontFamily: "'Work Sans', sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1A1F36", margin: 0 }}>Đã từ chối</h1>
        <p style={{ fontSize: 14, color: "#8F9BB3", marginTop: 4 }}>
          <span style={{ color: "#FF3D71", fontWeight: 600 }}>{MOCK_REJECTED.length} hồ sơ</span> bị từ chối — có thể yêu cầu nộp lại
        </p>
      </div>

      <div style={{ background: "#FFF", borderRadius: 14, border: "1px solid #F3F4F6", boxShadow: "0 1px 4px rgba(0,0,0,0.05)", overflow: "hidden" }}>
        <div style={{ padding: "20px 24px 0" }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1A1F36", margin: 0 }}>Rejected KYC</h2>
        </div>
        <DataTable<RejectedRow>
          columns={COLUMNS}
          data={MOCK_REJECTED}
          rowKey="userId"
          pageSize={8}
          searchable={false}
        />
      </div>
    </div>
  );
}
