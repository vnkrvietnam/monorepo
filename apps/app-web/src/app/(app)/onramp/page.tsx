"use client";
/**
 * /onramp — Fiat On-Ramp / Off-Ramp
 * Features:
 *  - 30-second FX rate lock countdown before confirming
 *  - VND ↔ VNKR (1:1 peg)
 */
import React, { useState, useEffect, useRef } from "react";
import {
  Button, Text, Input, Modal, Badge,
  ArrowDown, ArrowUp, ArrowSwap, CheckCircle,
  Bank, ShieldCheck, AlertCircle, Clock,
} from "@vnkrvietnam/ui-kit";

type Tab      = "onramp" | "offramp";
type RampStep = "form" | "confirm" | "done";

const PAYMENT_METHODS = [
  { id: "vcb", label: "Vietcombank",  sub: "1234 5678 90",   color: "#0072BC" },
  { id: "mb",  label: "MB Bank",      sub: "9876 5432 10",   color: "#004B9B" },
  { id: "tcb", label: "Techcombank",  sub: "1111 2222 3333", color: "#EE0033" },
];

const RATE_INFO = {
  onramp:  { from: "VND",  to: "VNKR", rate: "1 VND = 1 VNKR",  fee: "0%", note: "Nạp tức thì, không mất phí" },
  offramp: { from: "VNKR", to: "VND",  rate: "1 VNKR = 1 VND",   fee: "0%", note: "Rút về ngân hàng trong vài phút" },
};

const FX_LOCK_DURATION = 30; // seconds

export default function OnRampPage() {
  const [tab,       setTab]       = useState<Tab>("onramp");
  const [step,      setStep]      = useState<RampStep>("form");
  const [amount,    setAmount]    = useState("");
  const [method,    setMethod]    = useState(PAYMENT_METHODS[0].id);
  const [loading,   setLoading]   = useState(false);

  // FX rate lock
  const [fxCountdown, setFxCountdown] = useState(0);
  const [fxLocked,    setFxLocked]    = useState(false);
  const fxTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const info    = RATE_INFO[tab];
  const receive = amount ? Number(amount).toLocaleString("vi-VN") : "—";

  // Start FX lock when entering confirm step
  useEffect(() => {
    if (step === "confirm") {
      startFxLock();
    }
    return () => { if (fxTimer.current) clearInterval(fxTimer.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const startFxLock = () => {
    if (fxTimer.current) clearInterval(fxTimer.current);
    setFxLocked(true);
    setFxCountdown(FX_LOCK_DURATION);
    fxTimer.current = setInterval(() => {
      setFxCountdown(c => {
        if (c <= 1) {
          clearInterval(fxTimer.current!);
          setFxLocked(false);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  const switchTab = (t: Tab) => {
    setTab(t);
    setStep("form");
    setAmount("");
    setFxLocked(false);
    if (fxTimer.current) clearInterval(fxTimer.current);
  };

  const submit = async () => {
    if (!fxLocked) {
      startFxLock(); // re-lock expired rate
      return;
    }
    setLoading(true);
    await new Promise(r => setTimeout(r, 1800));
    setLoading(false);
    if (fxTimer.current) clearInterval(fxTimer.current);
    setStep("done");
  };

  const selectedMethod = PAYMENT_METHODS.find(m => m.id === method)!;

  return (
    <div style={{ paddingBottom: 32 }}>
      {/* Header */}
      <div style={{ padding: "16px 20px 8px", display: "flex", alignItems: "center", gap: 10 }}>
        <ArrowSwap size={22} color="#1A1F36" />
        <div>
          <Text variant="h6" weight="semibold" color="#1A1F36">Nạp / Rút VNKR</Text>
          <Text variant="caption" color="#A0AEC0">1 VNKR = 1 VND · Tokenized Fiat</Text>
        </div>
      </div>

      {/* Tab switcher */}
      <div style={{ padding: "8px 20px 16px" }}>
        <div style={{ display: "flex", background: "#F5F6FA", borderRadius: 12, padding: 3 }}>
          {([
            { id: "onramp",  label: "Nạp VND → VNKR", icon: <ArrowDown size={14} /> },
            { id: "offramp", label: "Rút VNKR → VND",  icon: <ArrowUp size={14} />  },
          ] as const).map(t => (
            <button
              key={t.id}
              onClick={() => switchTab(t.id)}
              style={{
                flex: 1, height: 36, borderRadius: 9, border: "none",
                background: tab === t.id ? "#000" : "transparent",
                color: tab === t.id ? "#fff" : "#718096",
                fontSize: 12, fontWeight: 700, fontFamily: "'Work Sans', sans-serif", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}
            >
              {t.icon}{t.label}
            </button>
          ))}
        </div>
      </div>

      {step === "form" && (
        <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Rate info */}
          <div style={{ background: "#000", borderRadius: 16, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <Text variant="caption" color="rgba(255,255,255,0.5)">Tỷ lệ chuyển đổi</Text>
              <Text variant="subtitle2" weight="semibold" color="#BEFF6C">{info.rate}</Text>
            </div>
            <Badge variant="label" color="greeny" label={`Phí: ${info.fee}`} />
          </div>

          <div>
            <Input
              label={`Số ${info.from} muốn ${tab === "onramp" ? "nạp" : "rút"}`}
              placeholder="0"
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              caption={`Số dư: ${tab === "onramp" ? "5.000.000 VND" : "1.200.000 VNKR"}`}
            />
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
              {["100.000", "500.000", "1.000.000", "5.000.000"].map(v => (
                <Button key={v} variant="outlined" color="dark" size="sm"
                  onClick={() => setAmount(v.replace(/\./g, ""))}>
                  {v}đ
                </Button>
              ))}
            </div>
          </div>

          {amount && (
            <div style={{ background: "#ECFDF5", borderRadius: 12, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Text variant="body2" color="#065F46">Bạn nhận được</Text>
              <Text variant="h6" weight="semibold" color="#065F46">{receive} {info.to}</Text>
            </div>
          )}

          {/* Payment method */}
          <div>
            <Text variant="caption" weight="semibold" color="#57606a" style={{ display: "block", marginBottom: 8 }}>
              {tab === "onramp" ? "Ngân hàng nạp tiền từ" : "Ngân hàng nhận tiền về"}
            </Text>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {PAYMENT_METHODS.map(m => (
                <button
                  key={m.id}
                  onClick={() => setMethod(m.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 12, textAlign: "left",
                    border: `1.5px solid ${method === m.id ? "#000" : "#E5E7EB"}`,
                    background: method === m.id ? "#F5F6FA" : "#fff", cursor: "pointer",
                  }}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: m.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Bank size={18} color="#fff" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <Text variant="body2" weight="semibold" color="#1A1F36">{m.label}</Text>
                    <Text variant="caption" color="#A0AEC0">{m.sub}</Text>
                  </div>
                  {method === m.id && <CheckCircle size={18} color="#00D68F" />}
                </button>
              ))}
            </div>
          </div>

          <Button variant="filled" color="dark" size="lg" fullWidth
            disabled={!amount || Number(amount) <= 0}
            onClick={() => setStep("confirm")}
          >
            Tiếp tục
          </Button>
        </div>
      )}

      {step === "confirm" && (
        <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 14 }}>
          {/* 30s FX rate lock */}
          <div style={{
            background: fxLocked ? "#000" : "#FFF1F2",
            borderRadius: 14, padding: "14px 16px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div>
              <Text variant="caption" color={fxLocked ? "rgba(255,255,255,0.5)" : "#FF3D71"}>
                {fxLocked ? "Tỷ giá đang khoá (30s)" : "Tỷ giá đã hết hạn"}
              </Text>
              <Text variant="subtitle2" weight="semibold" color={fxLocked ? "#BEFF6C" : "#FF3D71"}>
                {info.rate}
              </Text>
            </div>
            {fxLocked ? (
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.1)", borderRadius: 8, padding: "4px 10px" }}>
                <Clock size={14} color="#BEFF6C" />
                <Text variant="caption" weight="semibold" color="#BEFF6C">{fxCountdown}s</Text>
              </div>
            ) : (
              <Button variant="filled" color="dark" size="sm" onClick={startFxLock}>Làm mới</Button>
            )}
          </div>

          <Text variant="subtitle2" weight="semibold" color="#1A1F36">Xác nhận giao dịch</Text>
          <div style={{ background: "#fff", borderRadius: 16, padding: "4px 16px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            {[
              { label: "Loại",      value: tab === "onramp" ? "Nạp tiền (On-Ramp)" : "Rút tiền (Off-Ramp)" },
              { label: "Số tiền",   value: `${Number(amount).toLocaleString("vi-VN")} ${info.from}` },
              { label: "Nhận được", value: `${receive} ${info.to}` },
              { label: "Ngân hàng", value: selectedMethod.label },
              { label: "Phí",       value: "0đ" },
              { label: "Tỷ lệ",     value: info.rate },
            ].map((r, i, arr) => (
              <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: i < arr.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                <Text variant="body2" color="#718096">{r.label}</Text>
                <Text variant="body2" weight="semibold" color="#1A1F36">{r.value}</Text>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Button variant="outlined" color="dark" size="lg" fullWidth onClick={() => setStep("form")}>Quay lại</Button>
            <Button
              variant="filled" color="dark" size="lg" fullWidth
              loading={loading}
              onClick={submit}
            >
              {fxLocked ? "Xác nhận" : "Làm mới tỷ giá"}
            </Button>
          </div>
        </div>
      )}

      {step === "done" && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "40px 24px", gap: 16 }}>
          <CheckCircle size={72} color="#00D68F" />
          <Text variant="h5" weight="semibold" color="#1A1F36">
            {tab === "onramp" ? "Nạp thành công!" : "Rút thành công!"}
          </Text>
          <Text variant="body2" color="#718096">
            {Number(amount).toLocaleString("vi-VN")} {info.from} → {receive} {info.to}
          </Text>
          <Button variant="filled" color="dark" size="lg" fullWidth style={{ marginTop: 8 }}
            onClick={() => { setStep("form"); setAmount(""); setFxLocked(false); }}>
            Giao dịch mới
          </Button>
          <Button variant="ghost" color="dark" size="sm" onClick={() => window.location.href = "/home"}>Về trang chủ</Button>
        </div>
      )}
    </div>
  );
}
