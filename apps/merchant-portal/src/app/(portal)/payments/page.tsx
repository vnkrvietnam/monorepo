"use client";
/**
 * /payments — Payment Checkout Demo
 * QR payment generation, WalletCard display, daily volume LineChart
 */
import React, { useState } from "react";
import {
  Text,
  Button,
  Input,
  WalletCard,
  LineChart,
  QRCodeModal,
} from "@vnkrvietnam/ui-kit";

// ─── Mock daily payment volume data ───────────────────────────────────────────

const DAILY_LABELS = ["11/6", "12/6", "13/6", "14/6", "15/6", "16/6", "17/6", "18/6"];
const DAILY_VOLUME = [2100000, 3400000, 1800000, 4200000, 3800000, 5100000, 4600000, 4820000];

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function PaymentsPage() {
  const [amount,      setAmount]      = useState("");
  const [description, setDescription] = useState("");
  const [qrOpen,      setQrOpen]      = useState(false);
  const [qrValue,     setQrValue]     = useState("");

  const handleCreateQR = () => {
    const amt    = parseFloat(amount.replace(/[^0-9.]/g, ""));
    const desc   = description.trim() || "VNKR Payment";
    const orderId = `ORD-${Date.now().toString(36).toUpperCase()}`;
    const value  = `https://pay.vnkr.vn/${orderId}?amount=${isNaN(amt) ? 0 : amt}&desc=${encodeURIComponent(desc)}`;
    setQrValue(value);
    setQrOpen(true);
  };

  return (
    <div style={{ padding: "24px 28px", maxWidth: 1100 }}>

      {/* ── Page title ─────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <Text variant="h5" weight="bold" color="#1A1F36">Payments</Text>
        <Text variant="body2" color="#718096">Tạo mã QR thanh toán & theo dõi lưu lượng</Text>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 24, alignItems: "start" }}>

        {/* ── Left: card + QR form ───────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Wallet card */}
          <div style={{
            background:   "#fff",
            borderRadius: 14,
            border:       "1px solid #F3F4F6",
            padding:      "20px",
            display:      "flex",
            justifyContent: "center",
          }}>
            <WalletCard
              name="Merchant"
              holder="MERCHANT PORTAL"
              last4="0011"
              expiry="12/27"
              bg="violet"
              width={300}
            />
          </div>

          {/* QR form */}
          <div style={{
            background:   "#fff",
            borderRadius: 14,
            border:       "1px solid #F3F4F6",
            padding:      "20px 22px",
          }}>
            <Text variant="subtitle2" weight="semibold" color="#1A1F36" style={{ marginBottom: 16 }}>Tạo QR Thanh toán</Text>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Input
                label="Số tiền (VND)"
                placeholder="e.g. 450000"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                type="number"
              />
              <Input
                label="Mô tả"
                placeholder="e.g. Thanh toán đơn hàng #001"
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
              <Button
                variant="filled"
                color="dark"
                size="lg"
                fullWidth
                onClick={handleCreateQR}
              >
                Tạo QR thanh toán
              </Button>
            </div>
          </div>
        </div>

        {/* ── Right: daily volume chart ──────────────────────────────────── */}
        <div style={{
          background:   "#fff",
          borderRadius: 14,
          border:       "1px solid #F3F4F6",
          padding:      "20px 24px",
        }}>
          <Text variant="subtitle1" weight="semibold" color="#1A1F36">Lưu lượng thanh toán theo ngày</Text>
          <Text variant="caption" color="#718096" style={{ display: "block", marginBottom: 16 }}>8 ngày gần nhất (VND)</Text>
          <LineChart
            series={[{
              name:  "Payment Volume",
              data:  DAILY_VOLUME,
              color: "#AF96FB",
              area:  true,
            }]}
            labels={DAILY_LABELS}
            height={280}
            grid
            dots
            legend={false}
          />

          {/* Summary row */}
          <div style={{
            display:             "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap:                 1,
            marginTop:           20,
            background:          "#F3F4F6",
            borderRadius:        10,
            overflow:            "hidden",
          }}>
            {[
              { label: "Tổng 8 ngày",    value: `₫${(DAILY_VOLUME.reduce((a, b) => a + b, 0) / 1_000_000).toFixed(1)}M` },
              { label: "Trung bình/ngày", value: `₫${(DAILY_VOLUME.reduce((a, b) => a + b, 0) / DAILY_VOLUME.length / 1_000_000).toFixed(1)}M` },
              { label: "Cao nhất",        value: `₫${(Math.max(...DAILY_VOLUME) / 1_000_000).toFixed(1)}M` },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: "#fff", padding: "14px 16px", textAlign: "center" }}>
                <Text variant="caption" color="#A0AEC0">{label}</Text>
                <div style={{ marginTop: 4 }}>
                  <Text variant="subtitle2" weight="bold" color="#1A1F36">{value}</Text>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── QR Code Modal ────────────────────────────────────────────────── */}
      <QRCodeModal
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        value={qrValue}
        label="Quét để thanh toán"
        subtitle={`${parseFloat(amount || "0").toLocaleString("vi-VN")} VND — ${description || "VNKR Payment"}`}
        scannable
      />

    </div>
  );
}
