"use client";

import React from "react";
import { DataTable, Badge, Button, toast } from "@vnkrvietnam/ui-kit";
import type { DataTableColumn } from "@vnkrvietnam/ui-kit";

interface AttestationRow {
  id: string;
  userId: string;
  walletAddress: string;
  scheme: string;
  claimHash: string;
  issuedAt: string;
  expiresAt: string;
  active: boolean;
}

const MOCK_ATTESTATIONS: AttestationRow[] = [
  { id: "attest_001", userId: "usr_a1b2c3d4", walletAddress: "0xA1B2C3D4…A1B2", scheme: "ZKP-KYC-TIER2",  claimHash: "0x3f4a9b…c1d2", issuedAt: "2024-12-01T08:30:00Z", expiresAt: "2025-12-01T08:30:00Z", active: true  },
  { id: "attest_002", userId: "usr_d4e5f6a1", walletAddress: "0xD4E5F6A1…D4E5", scheme: "ZKP-KYC-TIER3",  claimHash: "0x7a2c1d…e4f5", issuedAt: "2024-11-30T14:00:00Z", expiresAt: "2025-11-30T14:00:00Z", active: true  },
  { id: "attest_003", userId: "usr_a7b8c9d0", walletAddress: "0xA7B8C9D0…A7B8", scheme: "ZKP-KYC-TIER2",  claimHash: "0x1b3d5e…f6a7", issuedAt: "2024-12-08T10:00:00Z", expiresAt: "2025-12-08T10:00:00Z", active: true  },
  { id: "attest_004", userId: "usr_b2c3d4e5", walletAddress: "0xB2C3D4E5…B2C3", scheme: "ZKP-AML-BASIC",  claimHash: "0x9c0e2f…g8h9", issuedAt: "2024-10-15T12:00:00Z", expiresAt: "2024-12-15T12:00:00Z", active: false },
];

const COLUMNS: DataTableColumn<AttestationRow>[] = [
  { key: "id",     label: "Attestation ID", render: (v) => <span style={{ fontFamily: "monospace", fontSize: 12, color: "#4A5568" }}>{String(v)}</span> },
  { key: "userId", label: "User ID",        render: (v) => <span style={{ fontFamily: "monospace", fontSize: 12, color: "#4A5568" }}>{String(v).slice(0, 12)}…</span> },
  { key: "scheme", label: "ZKP Scheme",     render: (v) => <Badge variant="label" color="info" label={String(v)} /> },
  { key: "claimHash", label: "Claim Hash",  render: (v) => <span style={{ fontFamily: "monospace", fontSize: 12, color: "#4A5568" }}>{String(v)}</span> },
  { key: "issuedAt",  label: "Phát hành",   render: (v) => new Date(String(v)).toLocaleDateString("vi-VN") },
  { key: "expiresAt", label: "Hết hạn",     render: (v) => new Date(String(v)).toLocaleDateString("vi-VN") },
  {
    key: "active", label: "Trạng thái", align: "center" as const,
    render: (v) => <Badge variant="label" color={v ? "success" : "error"} label={v ? "ACTIVE" : "EXPIRED"} />,
  },
  {
    key: "id", label: "Action",
    render: (_, row) => (
      <Button variant="outlined" color="dark" size="sm" onClick={() => toast.info(`Xem attestation: ${row.id}`)}>
        Verify
      </Button>
    ),
  },
];

export default function AttestationsPage() {
  return (
    <div style={{ padding: 24, fontFamily: "'Work Sans', sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1A1F36", margin: 0 }}>ZKP Attestations</h1>
        <p style={{ fontSize: 14, color: "#8F9BB3", marginTop: 4 }}>
          Danh sách chứng thực Zero-Knowledge Proof đã phát hành — {MOCK_ATTESTATIONS.length} attestations
        </p>
      </div>

      <div style={{ background: "#FFF", borderRadius: 14, border: "1px solid #F3F4F6", boxShadow: "0 1px 4px rgba(0,0,0,0.05)", overflow: "hidden" }}>
        <div style={{ padding: "20px 24px 0" }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1A1F36", margin: 0 }}>On-Chain Attestations</h2>
        </div>
        <DataTable<AttestationRow>
          columns={COLUMNS}
          data={MOCK_ATTESTATIONS}
          rowKey="id"
          pageSize={8}
          searchable={false}
        />
      </div>
    </div>
  );
}
