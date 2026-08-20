"use client";
/**
 * /swift — SWIFT / Cross-Border Transfer (ISO 20022)
 * Features:
 *  - BIC Code validation (8 or 11 chars, uppercase alphanumeric)
 *  - Fee type: SHA / OUR / BEN
 *  - 60-second FX rate lock countdown
 *  - 4-step progress: Beneficiary → Amount → Review → Done
 */
import React, { useState, useEffect, useRef } from "react";
import {
  Button, Text, Input, Modal, Badge,
  ArrowRight, ArrowLeft, CheckCircle,
  Globe, Building, AlertCircle, Bank,
  Clock,
} from "@vnkrvietnam/ui-kit";
import { useRouter } from "next/navigation";

type SWIFTStep = "beneficiary" | "amount" | "review" | "done";
type FeeType    = "SHA" | "OUR" | "BEN";

const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "SGD", "AUD"];
const COUNTRIES = [
  { code: "US", name: "United States",  flag: "🇺🇸" },
  { code: "DE", name: "Germany",        flag: "🇩🇪" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
  { code: "SG", name: "Singapore",      flag: "🇸🇬" },
  { code: "JP", name: "Japan",          flag: "🇯🇵" },
];

const FEE_TYPES: { id: FeeType; label: string; desc: string }[] = [
  { id: "SHA", label: "SHA — Chia sẻ phí", desc: "Người gửi và người nhận mỗi bên chịu phí ngân hàng của mình" },
  { id: "OUR", label: "OUR — Gửi chịu tất cả", desc: "Người gửi chịu toàn bộ phí, người nhận nhận đủ số tiền" },
  { id: "BEN", label: "BEN — Nhận chịu tất cả", desc: "Người nhận chịu toàn bộ phí, nhận ít hơn số gốc" },
];

const FX_RATE_BY_CURRENCY: Record<string, number> = {
  USD: 25400, EUR: 27200, GBP: 32100, JPY: 168, SGD: 18900, AUD: 16300,
};

const FX_LOCK_DURATION = 60; // seconds

/** Validate BIC code: 8 or 11 uppercase alphanumeric characters */
function validateBIC(bic: string): string | null {
  const clean = bic.trim().toUpperCase();
  if (!clean) return null;
  if (!/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(clean)) {
    return "BIC/SWIFT không hợp lệ. Phải là 8 hoặc 11 ký tự (VD: VCBVVNVX)";
  }
  return null;
}

function StepIndicator({ step }: { step: SWIFTStep }) {
  const steps: { id: SWIFTStep; label: string }[] = [
    { id: "beneficiary", label: "Người nhận" },
    { id: "amount",      label: "Số tiền"    },
    { id: "review",      label: "Xem lại"    },
  ];
  const idx = steps.findIndex(s => s.id === step);
  return (
    <div style={{ display: "flex", padding: "0 20px 20px", gap: 0 }}>
      {steps.map((s, i) => (
        <React.Fragment key={s.id}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ width: 24, height: 24, borderRadius: "50%", background: i <= idx ? "#000" : "#E5E7EB", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4 }}>
              {i < idx
                ? <CheckCircle size={12} color="#fff" />
                : <Text variant="caption" color={i <= idx ? "#BEFF6C" : "#A0AEC0"} weight="semibold">{i + 1}</Text>
              }
            </div>
            <Text variant="caption" color={i <= idx ? "#1A1F36" : "#A0AEC0"} weight={i === idx ? "semibold" : "regular"}>
              {s.label}
            </Text>
          </div>
          {i < steps.length - 1 && (
            <div style={{ height: 2, flex: 0.5, background: i < idx ? "#000" : "#E5E7EB", marginTop: 11, marginBottom: 18 }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

export default function SWIFTPage() {
  const router = useRouter();
  const [step,         setStep]        = useState<SWIFTStep>("beneficiary");
  const [beneName,     setBeneName]    = useState("");
  const [beneAccount,  setBeneAccount] = useState("");
  const [beneBank,     setBeneBank]    = useState("");
  const [swiftCode,    setSwiftCode]   = useState("");
  const [bicError,     setBicError]    = useState<string | null>(null);
  const [country,      setCountry]     = useState(COUNTRIES[0]);
  const [currency,     setCurrency]    = useState("USD");
  const [amount,       setAmount]      = useState("");
  const [purpose,      setPurpose]     = useState("");
  const [feeType,      setFeeType]     = useState<FeeType>("SHA");
  const [loading,      setLoading]     = useState(false);

  // FX rate lock
  const [fxLockCountdown, setFxLockCountdown] = useState(0);
  const [fxRateLocked,    setFxRateLocked]    = useState(false);
  const [lockedRate,      setLockedRate]      = useState(0);
  const fxTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Computed values
  const currentRate = FX_RATE_BY_CURRENCY[currency] ?? 25400;
  const displayRate = fxRateLocked ? lockedRate : currentRate;
  const feeUSD  = amount ? (Number(amount) * 0.002 + 15).toFixed(2) : "—";
  const feeVND  = amount ? `${(Number(amount) * 0.002 * displayRate + 15 * displayRate).toLocaleString("vi-VN")}đ` : "—";
  const rateStr = `1 ${currency} = ${displayRate.toLocaleString("vi-VN")} VND`;

  // Start FX rate lock countdown when entering review step
  useEffect(() => {
    if (step === "review") {
      lockFxRate();
    }
    return () => {
      if (fxTimerRef.current) clearInterval(fxTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const lockFxRate = () => {
    if (fxTimerRef.current) clearInterval(fxTimerRef.current);
    setLockedRate(currentRate);
    setFxRateLocked(true);
    setFxLockCountdown(FX_LOCK_DURATION);
    fxTimerRef.current = setInterval(() => {
      setFxLockCountdown(c => {
        if (c <= 1) {
          clearInterval(fxTimerRef.current!);
          setFxRateLocked(false);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  const handleBicChange = (val: string) => {
    const upper = val.toUpperCase();
    setSwiftCode(upper);
    setBicError(validateBIC(upper));
  };

  const handleStepToAmount = () => {
    const err = validateBIC(swiftCode);
    if (err) { setBicError(err); return; }
    setStep("amount");
  };

  const submit = async () => {
    if (!fxRateLocked) {
      // Rate expired — re-lock before submitting
      lockFxRate();
      return;
    }
    setLoading(true);
    await new Promise(r => setTimeout(r, 2000));
    setLoading(false);
    if (fxTimerRef.current) clearInterval(fxTimerRef.current);
    setStep("done");
  };

  return (
    <div style={{ paddingBottom: 32 }}>
      {/* Header */}
      <div style={{ padding: "16px 20px 8px", display: "flex", alignItems: "center", gap: 12 }}>
        {(step === "amount" || step === "review") && (
          <button onClick={() => {
            if (step === "amount") setStep("beneficiary");
            if (step === "review") setStep("amount");
          }} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            <ArrowLeft size={22} color="#1A1F36" />
          </button>
        )}
        <Globe size={22} color="#1A1F36" />
        <div>
          <Text variant="h6" weight="semibold" color="#1A1F36">Chuyển tiền SWIFT</Text>
          <Text variant="caption" color="#A0AEC0">ISO 20022 · Cross-Border</Text>
        </div>
        {step !== "done" && (
          <div style={{ marginLeft: "auto" }}>
            <Badge variant="label" color="info" label="SWIFT gpi" />
          </div>
        )}
      </div>

      {step !== "done" && <StepIndicator step={step} />}

      {/* ── Beneficiary ──────────────────────────────────────────── */}
      {step === "beneficiary" && (
        <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 14 }}>
          <Input
            label="Tên người nhận"
            placeholder="JOHN DOE"
            value={beneName}
            onChange={e => setBeneName(e.target.value.toUpperCase())}
            caption="Đúng như trong tài khoản ngân hàng quốc tế"
          />
          <Input
            label="Số tài khoản / IBAN"
            placeholder="DE89 3704 0044 0532 0130 00"
            value={beneAccount}
            onChange={e => setBeneAccount(e.target.value)}
          />
          <Input
            label="Tên ngân hàng thụ hưởng"
            placeholder="Deutsche Bank AG"
            value={beneBank}
            onChange={e => setBeneBank(e.target.value)}
            iconLeft={<Bank size={16} />}
          />
          <Input
            label="SWIFT / BIC Code"
            placeholder="DEUTDEDB"
            value={swiftCode}
            onChange={e => handleBicChange(e.target.value)}
            iconLeft={<Building size={16} />}
            caption={bicError ?? "8 hoặc 11 ký tự (VD: VCBVVNVX hoặc VCBVVNVXXXX)"}
            error={bicError ?? undefined}
          />

          {/* Country selector */}
          <div>
            <Text variant="caption" weight="semibold" color="#57606a" style={{ display: "block", marginBottom: 8 }}>Quốc gia thụ hưởng</Text>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {COUNTRIES.map(c => (
                <button
                  key={c.code}
                  onClick={() => setCountry(c)}
                  style={{
                    padding: "6px 12px", borderRadius: 8,
                    border: `1.5px solid ${country.code === c.code ? "#000" : "#E5E7EB"}`,
                    background: country.code === c.code ? "#000" : "#fff",
                    color: country.code === c.code ? "#fff" : "#4A5568",
                    fontSize: 13, fontFamily: "'Work Sans', sans-serif", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 6,
                  }}
                >
                  {c.flag} {c.code}
                </button>
              ))}
            </div>
          </div>

          <Button
            variant="filled" color="dark" size="lg" fullWidth
            disabled={!beneName || !beneAccount || !swiftCode || !!bicError}
            onClick={handleStepToAmount}
          >
            Tiếp theo
          </Button>
        </div>
      )}

      {/* ── Amount & Fee Type ────────────────────────────────────── */}
      {step === "amount" && (
        <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Currency picker */}
          <div>
            <Text variant="caption" weight="semibold" color="#57606a" style={{ display: "block", marginBottom: 8 }}>Loại tiền tệ</Text>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {CURRENCIES.map(c => (
                <button
                  key={c}
                  onClick={() => { setCurrency(c); setFxRateLocked(false); }}
                  style={{
                    padding: "6px 14px", borderRadius: 8,
                    border: `1.5px solid ${currency === c ? "#000" : "#E5E7EB"}`,
                    background: currency === c ? "#000" : "#fff",
                    color: currency === c ? "#BEFF6C" : "#4A5568",
                    fontSize: 13, fontWeight: 700, fontFamily: "'Work Sans', sans-serif", cursor: "pointer",
                  }}
                >{c}</button>
              ))}
            </div>
          </div>

          <Input
            label={`Số tiền (${currency})`}
            placeholder="0.00"
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            caption={`Tỷ giá tham chiếu: 1 ${currency} = ${currentRate.toLocaleString("vi-VN")} VND`}
          />

          {/* Fee type: SHA / OUR / BEN */}
          <div>
            <Text variant="caption" weight="semibold" color="#57606a" style={{ display: "block", marginBottom: 8 }}>Loại phí chuyển tiền</Text>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {FEE_TYPES.map(ft => (
                <button
                  key={ft.id}
                  onClick={() => setFeeType(ft.id)}
                  style={{
                    display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 14px", borderRadius: 12, textAlign: "left",
                    border: `1.5px solid ${feeType === ft.id ? "#000" : "#E5E7EB"}`,
                    background: feeType === ft.id ? "#000" : "#fff", cursor: "pointer",
                  }}
                >
                  <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${feeType === ft.id ? "#BEFF6C" : "#CBD5E0"}`, flexShrink: 0, marginTop: 2, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {feeType === ft.id && <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#BEFF6C" }} />}
                  </div>
                  <div>
                    <Text variant="body2" weight="semibold" color={feeType === ft.id ? "#BEFF6C" : "#1A1F36"}>{ft.label}</Text>
                    <Text variant="caption" color={feeType === ft.id ? "rgba(255,255,255,0.6)" : "#718096"} style={{ display: "block" }}>{ft.desc}</Text>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <Input
            label="Mục đích chuyển tiền"
            placeholder="VD: Học phí, Hợp đồng dịch vụ"
            value={purpose}
            onChange={e => setPurpose(e.target.value)}
          />

          {/* Fee estimate */}
          {amount && (
            <div style={{ background: "#FFFBEB", borderRadius: 12, padding: "12px 14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <Text variant="caption" color="#92400E">Phí SWIFT ước tính</Text>
                <Text variant="caption" weight="semibold" color="#92400E">{feeUSD} {currency}</Text>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Text variant="caption" color="#92400E">Quy VND</Text>
                <Text variant="caption" weight="semibold" color="#92400E">≈ {feeVND}</Text>
              </div>
            </div>
          )}

          <Button variant="filled" color="dark" size="lg" fullWidth
            disabled={!amount || Number(amount) <= 0}
            onClick={() => setStep("review")}
          >
            Xem lại lệnh
          </Button>
        </div>
      )}

      {/* ── Review ───────────────────────────────────────────────── */}
      {step === "review" && (
        <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 14 }}>
          {/* FX Rate lock countdown */}
          <div style={{
            background: fxRateLocked ? "#000" : "#FFF1F2",
            borderRadius: 14, padding: "14px 16px",
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
          }}>
            <div>
              <Text variant="caption" color={fxRateLocked ? "rgba(255,255,255,0.5)" : "#FF3D71"}>
                {fxRateLocked ? "Tỷ giá đang khoá" : "Tỷ giá đã hết hạn"}
              </Text>
              <Text variant="subtitle2" weight="semibold" color={fxRateLocked ? "#BEFF6C" : "#FF3D71"}>
                {rateStr}
              </Text>
            </div>
            {fxRateLocked ? (
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.1)", borderRadius: 8, padding: "4px 10px" }}>
                <Clock size={14} color="#BEFF6C" />
                <Text variant="caption" weight="semibold" color="#BEFF6C">{fxLockCountdown}s</Text>
              </div>
            ) : (
              <Button variant="filled" color="dark" size="sm" onClick={lockFxRate}>Làm mới tỷ giá</Button>
            )}
          </div>

          <div style={{ background: "#000", borderRadius: 16, padding: "16px", color: "#fff" }}>
            <Text variant="caption" color="rgba(255,255,255,0.5)" weight="semibold" style={{ letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Lệnh SWIFT
            </Text>
            <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <Text variant="h4" weight="semibold" color="#BEFF6C">{amount} {currency}</Text>
              <Badge variant="label" color="info" label="gpi Tracked" />
            </div>
          </div>

          <div style={{ background: "#fff", borderRadius: 16, padding: "4px 16px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            {[
              { label: "Người nhận",  value: beneName },
              { label: "SWIFT/BIC",   value: swiftCode },
              { label: "Tài khoản",   value: beneAccount },
              { label: "Ngân hàng",   value: beneBank || "—" },
              { label: "Quốc gia",    value: `${country.flag} ${country.name}` },
              { label: "Loại phí",    value: FEE_TYPES.find(f => f.id === feeType)?.label ?? feeType },
              { label: "Mục đích",    value: purpose || "—" },
              { label: "Phí dự kiến", value: `${feeUSD} ${currency}` },
              { label: "Tỷ giá",      value: rateStr },
            ].map((r, i, arr) => (
              <div key={r.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < arr.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                <Text variant="body2" color="#718096">{r.label}</Text>
                <Text variant="body2" weight="semibold" color="#1A1F36">{r.value}</Text>
              </div>
            ))}
          </div>

          <div style={{ background: "#EFF6FF", borderRadius: 12, padding: "12px 14px", display: "flex", gap: 10 }}>
            <AlertCircle size={18} color="#0095FF" style={{ flexShrink: 0 }} />
            <Text variant="caption" color="#1E40AF">
              Giao dịch SWIFT thường xử lý trong 1–3 ngày làm việc. Mã UETR sẽ được cấp để theo dõi trạng thái.
            </Text>
          </div>

          <Button
            variant="filled" color="dark" size="lg" fullWidth loading={loading}
            onClick={submit}
          >
            {fxRateLocked ? "Gửi lệnh SWIFT" : "Làm mới tỷ giá trước"}
          </Button>
        </div>
      )}

      {/* ── Done ─────────────────────────────────────────────────── */}
      {step === "done" && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "40px 24px", gap: 16 }}>
          <CheckCircle size={72} color="#00D68F" />
          <Text variant="h5" weight="semibold" color="#1A1F36">Lệnh đã được gửi!</Text>
          <Text variant="body2" color="#718096">
            Lệnh SWIFT của bạn đã được khởi tạo.<br />Nhấn "Theo dõi UETR" để xem trạng thái điện thanh toán.
          </Text>
          <div style={{ background: "#F5F6FA", borderRadius: 12, padding: "12px 20px", width: "100%" }}>
            <Text variant="caption" color="#A0AEC0">Mã UETR</Text>
            <Text variant="body2" weight="semibold" color="#1A1F36" style={{ fontFamily: "monospace", wordBreak: "break-all" }}>
              b916b5ce-8e7d-42f3-8e73-f5f17e2e9a0b
            </Text>
          </div>
          <Button variant="filled" color="dark" size="lg" fullWidth onClick={() => router.push("/uetr")}>
            Theo dõi UETR
          </Button>
          <Button variant="ghost" color="dark" size="sm" onClick={() => router.push("/home")}>
            Về trang chủ
          </Button>
        </div>
      )}
    </div>
  );
}
