"use client";

import React from "react";
import { DataTable, Badge } from "@vnkrvietnam/ui-kit";
import type { DataTableColumn } from "@vnkrvietnam/ui-kit";

interface AuditEntry {
  id: string;
  actor: string;
  action: string;
  target: string;
  result: "SUCCESS" | "FAILURE" | "WARNING";
  ip: string;
  timestamp: string;
}

const MOCK_AUDIT: AuditEntry[] = [
  { id: "log_001", actor: "admin@vnkr.vn",     action: "KYC_APPROVE",        target: "usr_a1b2c3d4", result: "SUCCESS", ip: "192.168.1.10", timestamp: "2024-12-01T08:30:00Z" },
  { id: "log_002", actor: "admin@vnkr.vn",     action: "KYC_REJECT",         target: "usr_c3d4e5f6", result: "SUCCESS", ip: "192.168.1.10", timestamp: "2024-12-09T13:00:00Z" },
  { id: "log_003", actor: "system",             action: "ZKP_MINT_ATTEST",    target: "attest_001",   result: "SUCCESS", ip: "10.0.0.1",     timestamp: "2024-12-01T08:31:00Z" },
  { id: "log_004", actor: "ops@vnkr.vn",        action: "USER_SUSPEND",       target: "usr_e5f6a1b2", result: "SUCCESS", ip: "192.168.1.12", timestamp: "2024-12-05T17:00:00Z" },
  { id: "log_005", actor: "system",             action: "LOGIN_ATTEMPT",      target: "unknown@anon", result: "FAILURE", ip: "94.12.55.201", timestamp: "2024-12-12T03:15:00Z" },
  { id: "log_006", actor: "admin@vnkr.vn",     action: "SETTINGS_CHANGE",    target: "config.rate_limit", result: "SUCCESS", ip: "192.168.1.10", timestamp: "2024-12-11T10:00:00Z" },
  { id: "log_007", actor: "system",             action: "EMAIL_OTP_SENT",     target: "binh.tt@mail.com", result: "SUCCESS", ip: "10.0.0.1",     timestamp: "2024-12-10T09:14:00Z" },
];

const RESULT_MAP: Record<"SUCCESS" | "FAILURE" | "WARNING", { color: "success" | "error" | "warning" }> = {
  SUCCESS: { color: "success" },
  FAILURE: { color: "error" },
  WARNING: { color: "warning" },
};

const COLUMNS: DataTableColumn<AuditEntry>[] = [
  { key: "timestamp", label: "Thời điểm",  render: (v) => <span style={{ fontSize: 12, color: "#4A5568", fontFamily: "monospace" }}>{new Date(String(v)).toLocaleString("vi-VN")}</span> },
  { key: "actor",     label: "Actor",       render: (v) => <span style={{ fontSize: 13, color: "#1A1F36" }}>{String(v)}</span> },
  { key: "action",    label: "Hành động",   render: (v) => <span style={{ fontFamily: "monospace", fontSize: 12, color: "#0095FF", fontWeight: 600 }}>{String(v)}</span> },
  { key: "target",    label: "Đối tượng",   render: (v) => <span style={{ fontFamily: "monospace", fontSize: 12, color: "#4A5568" }}>{String(v)}</span> },
  {
    key: "result", label: "Kết quả", align: "center" as const,
    render: (v) => {
      const cfg = RESULT_MAP[v as "SUCCESS" | "FAILURE" | "WARNING"] ?? RESULT_MAP.SUCCESS;
      return <Badge variant="label" color={cfg.color} label={String(v)} />;
    },
  },
  { key: "ip", label: "IP",      render: (v) => <span style={{ fontFamily: "monospace", fontSize: 12, color: "#8F9BB3" }}>{String(v)}</span> },
];

export default function AuditLogPage() {
  return (
    <div style={{ padding: 24, fontFamily: "'Work Sans', sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1A1F36", margin: 0 }}>Audit Log</h1>
        <p style={{ fontSize: 14, color: "#8F9BB3", marginTop: 4 }}>
          Nhật ký toàn bộ hành động của hệ thống và operators — bất biến, chỉ đọc
        </p>
      </div>

      <div style={{ background: "#FFF", borderRadius: 14, border: "1px solid #F3F4F6", boxShadow: "0 1px 4px rgba(0,0,0,0.05)", overflow: "hidden" }}>
        <div style={{ padding: "20px 24px 0" }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1A1F36", margin: 0 }}>System Audit Trail</h2>
        </div>
        <DataTable<AuditEntry>
          columns={COLUMNS}
          data={MOCK_AUDIT}
          rowKey="id"
          pageSize={8}
          searchable={false}
        />
      </div>
    </div>
  );
}
