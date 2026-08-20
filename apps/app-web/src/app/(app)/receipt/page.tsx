"use client";
/**
 * /receipt — Transaction Receipt
 * Detailed invoice form + "Export PDF" (print) action
 */
import React, { useState } from "react";
import {
  Button, Text, Badge,
  CheckCircle, Download, Share, ArrowLeft,
  Receipt as ReceiptIcon,
} from "@vnkrvietnam/ui-kit";

interface ReceiptData {
  id:        string;
  date:      string;
  time:      string;
  type:      string;
  from:      string;
  to:        string;
  bank:      string;
  amount:    string;
  fee:       string;
  total:     string;
  note:      string;
  status:    "success" | "pending" | "failed";
  txHash:    string;
}

const RECEIPT: ReceiptData = {
  id:       "TXN-20250627-009421",
  date:     "27/06/2025",
  time:     "14:23:07",
  type:     "Chuyển tiền nội địa",
  from:     "Nguyễn Văn A · 0901 234 567",
  to:       "Trần Thị B · 0912 345 678",
  bank:     "Vietcombank — 1234567890",
  amount:   "500.000đ",
  fee:      "0đ",
  total:    "500.000đ",
  note:     "Trả tiền ăn trưa",
  status:   "success",
  txHash:   "0xabc123def456789abcdef0123456789abcdef012345",
};

const STATUS_CFG = {
  success: { label: "Thành công", color: "success" as const, icon: <CheckCircle size={16} color="#00D68F" /> },
  pending: { label: "Đang xử lý", color: "warning" as const, icon: null },
  failed:  { label: "Thất bại",   color: "error"   as const, icon: null },
};

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{
      display:       "flex",
      justifyContent:"space-between",
      alignItems:    "flex-start",
      padding:       "10px 0",
      borderBottom:  "1px solid #F3F4F6",
    }}>
      <Text variant="body2" color="#718096" style={{ flex: "0 0 auto", marginRight: 8 }}>{label}</Text>
      <Text
        variant="body2"
        weight={highlight ? "semibold" : "regular"}
        color={highlight ? "#1A1F36" : "#4A5568"}
        style={{ textAlign: "right", wordBreak: "break-all" }}
      >
        {value}
      </Text>
    </div>
  );
}

export default function ReceiptPage() {
  const r   = RECEIPT;
  const cfg = STATUS_CFG[r.status];

  const handlePrint = () => window.print();

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ padding: "16px 20px 8px", display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={() => window.history.back()}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
        >
          <ArrowLeft size={22} color="#1A1F36" />
        </button>
        <ReceiptIcon size={22} color="#1A1F36" />
        <Text variant="h6" weight="semibold" color="#1A1F36">Biên lai giao dịch</Text>
      </div>

      {/* Status card */}
      <div style={{
        margin:         "0 16px 16px",
        background:     "#000",
        borderRadius:   20,
        padding:        "24px 20px",
        display:        "flex",
        flexDirection:  "column",
        alignItems:     "center",
        gap:            12,
        textAlign:      "center",
      }}>
        <div style={{
          width: 60, height: 60, borderRadius: "50%",
          background: "rgba(0,214,143,0.15)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <CheckCircle size={32} color="#00D68F" />
        </div>
        <Text variant="h4" weight="semibold" color="#BEFF6C">{r.amount}</Text>
        <Text variant="body2" color="rgba(255,255,255,0.6)">{r.type}</Text>
        <Badge variant="label" color={cfg.color} label={cfg.label} />
        <Text variant="caption" color="rgba(255,255,255,0.4)">{r.date} · {r.time}</Text>
      </div>

      {/* Detail rows */}
      <div style={{
        margin:       "0 16px 16px",
        background:   "#fff",
        borderRadius: 16,
        padding:      "4px 16px",
        boxShadow:    "0 1px 4px rgba(0,0,0,0.06)",
      }}>
        <Row label="Mã giao dịch"    value={r.id}     highlight />
        <Row label="Từ"              value={r.from}   highlight />
        <Row label="Đến"             value={r.to}     highlight />
        <Row label="Ngân hàng"       value={r.bank}               />
        <Row label="Số tiền"         value={r.amount} highlight />
        <Row label="Phí giao dịch"   value={r.fee}                />
        <Row label="Lời nhắn"        value={r.note}               />
      </div>

      {/* Total */}
      <div style={{
        margin:       "0 16px 16px",
        background:   "#F5F6FA",
        borderRadius: 16,
        padding:      "14px 16px",
        display:      "flex",
        justifyContent: "space-between",
        alignItems:   "center",
      }}>
        <Text variant="subtitle2" weight="semibold" color="#1A1F36">Tổng cộng</Text>
        <Text variant="h6" weight="semibold" color="#1A1F36">{r.total}</Text>
      </div>

      {/* On-chain hash */}
      <div style={{
        margin:       "0 16px 16px",
        background:   "#fff",
        borderRadius: 16,
        padding:      "14px 16px",
        boxShadow:    "0 1px 4px rgba(0,0,0,0.06)",
      }}>
        <Text variant="caption" weight="semibold" color="#A0AEC0" style={{ textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>
          Mã giao dịch On-chain
        </Text>
        <Text variant="caption" color="#4A5568" style={{ wordBreak: "break-all", fontFamily: "monospace" }}>
          {r.txHash}
        </Text>
      </div>

      {/* Actions */}
      <div style={{ padding: "0 16px", display: "flex", gap: 10 }}>
        <Button
          variant="outlined" color="dark" size="lg" fullWidth
          iconLeft={<Share size={18} />}
        >
          Chia sẻ
        </Button>
        <Button
          variant="filled" color="dark" size="lg" fullWidth
          iconLeft={<Download size={18} />}
          onClick={handlePrint}
        >
          Xuất PDF
        </Button>
      </div>

      {/* Print-only styles */}
      <style>{`
        @media print {
          nav, button, .no-print { display: none !important; }
          body { background: #fff; }
        }
      `}</style>
    </div>
  );
}
