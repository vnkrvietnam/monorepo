"use client";
/**
 * /qr-scan — Full-screen QR Scanner + Generator
 * Features:
 *  - Dynamic QR code with 60s expiry countdown
 *  - Static QR option
 *  - VietQR and Crypto address parser
 *  - Upload from gallery fallback
 */
import React, { useState, useEffect, useRef } from "react";
import {
  Button, Text, Badge, Modal, QRCodeModal,
  QrCode, CheckCircle, X, ArrowLeft,
  Copy, Clock, AlertCircle,
} from "@vnkrvietnam/ui-kit";

const QR_DYNAMIC_TTL = 60; // seconds

type QRMode     = "scan" | "generate";
type QRType     = "dynamic" | "static";
type ScanResult = { type: "vietqr"|"crypto"|"unknown"; raw: string; parsed?: Record<string, string> };

const MOCK_SCANS: ScanResult[] = [
  {
    type: "vietqr",
    raw: "00020101021238600010A000000727012700069704020113ACCOUNT_NUM0208QRIBFTTA5303704540810000005802VN6007Ha_Noi6304ABCD",
    parsed: { bank: "Vietcombank", account: "1234567890", name: "NGUYEN VAN A", amount: "100.000đ" },
  },
  {
    type: "crypto",
    raw: "0x1A2b3C4d5E6f7A8b9C0d1E2f3A4b5C6d7E8f9A0b",
    parsed: { network: "EVM / Solana", address: "0x1A2b3C4d...9A0b" },
  },
];

function generateDynamicToken() {
  return `DYN-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export default function QRScanPage() {
  const [mode,         setMode]         = useState<QRMode>("scan");
  const [qrType,       setQrType]       = useState<QRType>("dynamic");
  const [scanning,     setScanning]     = useState(true);
  const [result,       setResult]       = useState<ScanResult | null>(null);
  const [payModal,     setPayModal]     = useState(false);
  const [scanCount,    setScanCount]    = useState(0);
  const [frame,        setFrame]        = useState(0);

  // Dynamic QR state
  const [dynamicToken,   setDynamicToken]   = useState(generateDynamicToken());
  const [qrCountdown,    setQrCountdown]    = useState(QR_DYNAMIC_TTL);
  const [qrExpired,      setQrExpired]      = useState(false);
  const [showQRModal,    setShowQRModal]    = useState(false);
  const qrTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Scan line animation
  useEffect(() => {
    if (!scanning) return;
    const id = setInterval(() => setFrame(f => (f + 1) % 60), 50);
    return () => clearInterval(id);
  }, [scanning]);

  // Auto-detect scan after 3s
  useEffect(() => {
    if (!scanning) return;
    const t = setTimeout(() => {
      const res = MOCK_SCANS[scanCount % MOCK_SCANS.length];
      setResult(res);
      setScanning(false);
    }, 3000);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanning, scanCount]);

  // Dynamic QR countdown
  useEffect(() => {
    if (mode !== "generate" || qrType !== "dynamic") return;
    if (qrTimerRef.current) clearInterval(qrTimerRef.current);
    setQrExpired(false);
    setQrCountdown(QR_DYNAMIC_TTL);
    qrTimerRef.current = setInterval(() => {
      setQrCountdown(c => {
        if (c <= 1) {
          clearInterval(qrTimerRef.current!);
          setQrExpired(true);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => { if (qrTimerRef.current) clearInterval(qrTimerRef.current); };
  }, [mode, qrType, dynamicToken]);

  const refreshDynamicQR = () => {
    setDynamicToken(generateDynamicToken());
    setQrExpired(false);
    setQrCountdown(QR_DYNAMIC_TTL);
  };

  const reset = () => {
    setResult(null);
    setScanning(true);
    setScanCount(c => c + 1);
  };

  const lineY = (frame / 59) * 220;

  // QR value: dynamic includes token + timestamp for uniqueness
  const qrValue = qrType === "dynamic"
    ? `vnkr:pay?to=0x1234&token=${dynamicToken}`
    : "vnkr:pay?to=0x1234&type=static";

  const [copied, setCopied] = useState(false);
  const copyAddress = async () => {
    await navigator.clipboard.writeText(qrValue).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ paddingBottom: 24 }}>
      {/* Header */}
      <div style={{ padding: "16px 20px 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <QrCode size={22} color="#1A1F36" />
          <Text variant="h6" weight="semibold" color="#1A1F36">QR Code</Text>
        </div>
        <Button variant="ghost" color="dark" size="sm" iconLeft={<ArrowLeft size={16} />} onClick={() => window.location.href = "/home"}>
          Quay lại
        </Button>
      </div>

      {/* Mode switcher */}
      <div style={{ padding: "4px 20px 12px" }}>
        <div style={{ display: "flex", background: "#F5F6FA", borderRadius: 12, padding: 3 }}>
          {([
            { id: "scan",     label: "Quét QR" },
            { id: "generate", label: "Tạo QR"  },
          ] as const).map(t => (
            <button
              key={t.id}
              onClick={() => setMode(t.id)}
              style={{
                flex: 1, height: 34, borderRadius: 9, border: "none",
                background: mode === t.id ? "#000" : "transparent",
                color: mode === t.id ? "#fff" : "#718096",
                fontSize: 13, fontWeight: mode === t.id ? 700 : 400,
                fontFamily: "'Work Sans', sans-serif", cursor: "pointer",
              }}
            >{t.label}</button>
          ))}
        </div>
      </div>

      {/* ── SCAN MODE ─────────────────────────────────────────────── */}
      {mode === "scan" && (
        <>
          {/* Camera viewfinder */}
          <div style={{ padding: "0 20px 16px" }}>
            <div style={{ position: "relative", background: "#0a0a0a", borderRadius: 20, overflow: "hidden", height: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {[
                { top: 16,    left: 16,  borderTop: "3px solid #BEFF6C",    borderLeft: "3px solid #BEFF6C" },
                { top: 16,    right: 16, borderTop: "3px solid #BEFF6C",    borderRight: "3px solid #BEFF6C" },
                { bottom: 16, left: 16,  borderBottom: "3px solid #BEFF6C", borderLeft: "3px solid #BEFF6C" },
                { bottom: 16, right: 16, borderBottom: "3px solid #BEFF6C", borderRight: "3px solid #BEFF6C" },
              ].map((s, i) => (
                <div key={i} style={{ position: "absolute", width: 28, height: 28, borderRadius: 3, ...s }} />
              ))}
              <div style={{ position: "relative", width: 220, height: 220, overflow: "hidden" }}>
                {scanning && (
                  <div style={{ position: "absolute", left: 0, right: 0, top: lineY, height: 2, background: "linear-gradient(90deg, transparent, #BEFF6C, transparent)", boxShadow: "0 0 8px #BEFF6C", transition: "top 0.05s linear" }} />
                )}
                {result && (
                  <div style={{ position: "absolute", inset: 0, background: result.type === "vietqr" ? "rgba(0,214,143,0.15)" : "rgba(175,150,251,0.15)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
                    <CheckCircle size={48} color={result.type === "vietqr" ? "#00D68F" : "#AF96FB"} />
                    <Badge variant="label" color={result.type === "vietqr" ? "success" : "violet"} label={result.type === "vietqr" ? "VietQR" : "Crypto Address"} />
                  </div>
                )}
              </div>
              <div style={{ position: "absolute", bottom: 14, left: 0, right: 0, textAlign: "center" }}>
                <Text variant="caption" color={scanning ? "#BEFF6C" : "#fff"}>
                  {scanning ? "Đang quét…" : "Đã nhận dạng thành công"}
                </Text>
              </div>
            </div>
          </div>

          {/* Result card */}
          {result && (
            <div style={{ margin: "0 20px 16px", background: "#fff", borderRadius: 16, padding: "16px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <Text variant="subtitle2" weight="semibold" color="#1A1F36">Kết quả quét</Text>
                <Badge variant="label" color={result.type === "vietqr" ? "success" : "info"} label={result.type === "vietqr" ? "VietQR" : "Crypto"} />
              </div>
              {result.parsed && Object.entries(result.parsed).map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #F3F4F6", paddingBottom: 8, marginBottom: 8 }}>
                  <Text variant="caption" color="#718096">{k}</Text>
                  <Text variant="caption" weight="semibold" color="#1A1F36">{v}</Text>
                </div>
              ))}
            </div>
          )}

          <div style={{ padding: "0 20px", display: "flex", gap: 10 }}>
            {result ? (
              <>
                <Button variant="outlined" color="dark" size="lg" fullWidth iconLeft={<QrCode size={18} />} onClick={reset}>Quét lại</Button>
                <Button variant="filled" color="dark" size="lg" fullWidth onClick={() => setPayModal(true)}>
                  {result.type === "vietqr" ? "Thanh toán ngay" : "Gửi Crypto"}
                </Button>
              </>
            ) : (
              <Button variant="outlined" color="dark" size="lg" fullWidth iconLeft={<X size={18} />} onClick={() => window.location.href = "/home"}>Huỷ</Button>
            )}
          </div>
        </>
      )}

      {/* ── GENERATE MODE ─────────────────────────────────────────── */}
      {mode === "generate" && (
        <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 14 }}>
          {/* QR type selector */}
          <div style={{ display: "flex", gap: 8 }}>
            {([
              { id: "dynamic", label: "QR Động (60s)" },
              { id: "static",  label: "QR Tĩnh" },
            ] as const).map(t => (
              <button
                key={t.id}
                onClick={() => setQrType(t.id)}
                style={{
                  flex: 1, padding: "8px 12px", borderRadius: 10,
                  border: `1.5px solid ${qrType === t.id ? "#000" : "#E5E7EB"}`,
                  background: qrType === t.id ? "#000" : "#fff",
                  color: qrType === t.id ? "#BEFF6C" : "#4A5568",
                  fontSize: 13, fontWeight: 700, fontFamily: "'Work Sans', sans-serif", cursor: "pointer",
                }}
              >{t.label}</button>
            ))}
          </div>

          {/* Dynamic QR countdown */}
          {qrType === "dynamic" && (
            <div style={{
              background: qrExpired ? "#FFF1F2" : "#000",
              borderRadius: 14, padding: "12px 16px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div>
                <Text variant="caption" color={qrExpired ? "#FF3D71" : "rgba(255,255,255,0.5)"}>
                  {qrExpired ? "QR đã hết hạn" : "QR hết hạn sau"}
                </Text>
                <Text variant="h5" weight="semibold" color={qrExpired ? "#FF3D71" : "#BEFF6C"}>
                  {qrExpired ? "00:00" : `${String(Math.floor(qrCountdown / 60)).padStart(2, "0")}:${String(qrCountdown % 60).padStart(2, "0")}`}
                </Text>
              </div>
              {qrExpired ? (
                <Button variant="filled" color="dark" size="sm" onClick={refreshDynamicQR}>Làm mới QR</Button>
              ) : (
                <Clock size={24} color="#BEFF6C" />
              )}
            </div>
          )}

          {/* QR display */}
          {!qrExpired && (
            <div style={{ background: "#fff", borderRadius: 16, padding: "20px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
              <div
                onClick={() => setShowQRModal(true)}
                style={{ cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}
              >
                <div style={{ width: 180, height: 180, background: "#F5F6FA", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <QrCode size={100} color="#1A1F36" />
                </div>
                <Text variant="caption" color="#A0AEC0">Nhấn để phóng to</Text>
              </div>
              <Badge variant="label" color={qrType === "dynamic" ? "warning" : "info"} label={qrType === "dynamic" ? "QR Động" : "QR Tĩnh"} />
              <div style={{ background: "#F5F6FA", borderRadius: 8, padding: "8px 12px", width: "100%", wordBreak: "break-all" }}>
                <Text variant="caption" color="#718096" style={{ fontFamily: "monospace", fontSize: 11 }}>{qrValue.slice(0, 50)}...</Text>
              </div>
              <Button variant="outlined" color="dark" size="sm" fullWidth onClick={copyAddress}>
                {copied ? "Đã sao chép!" : "Sao chép địa chỉ"}
              </Button>
            </div>
          )}

          {qrExpired && (
            <div style={{ background: "#FFF1F2", borderRadius: 12, padding: "20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 10, textAlign: "center" }}>
              <AlertCircle size={32} color="#FF3D71" />
              <Text variant="subtitle2" weight="semibold" color="#FF3D71">QR đã hết hạn sau 60 giây</Text>
              <Text variant="caption" color="#718096">Vì lý do bảo mật, QR động hết hạn sau 60 giây. Tạo mã mới để tiếp tục.</Text>
              <Button variant="filled" color="dark" size="md" onClick={refreshDynamicQR}>Tạo QR mới</Button>
            </div>
          )}
        </div>
      )}

      {/* Pay confirm modal */}
      <Modal
        open={payModal}
        onClose={() => setPayModal(false)}
        variant="sheet"
        title={result?.type === "vietqr" ? "Xác nhận thanh toán VietQR" : "Xác nhận gửi Crypto"}
        footer={
          <div style={{ display: "flex", gap: 10 }}>
            <Button variant="outlined" color="dark" size="lg" fullWidth onClick={() => setPayModal(false)}>Huỷ</Button>
            <Button variant="filled" color="dark" size="lg" fullWidth
              onClick={() => { setPayModal(false); window.location.href = "/transfer"; }}>
              Xác nhận
            </Button>
          </div>
        }
      >
        {result?.parsed && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {Object.entries(result.parsed).map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between" }}>
                <Text variant="body2" color="#718096">{k}</Text>
                <Text variant="body2" weight="semibold" color="#1A1F36">{v}</Text>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Enlarged QR modal */}
      <QRCodeModal
        open={showQRModal}
        onClose={() => setShowQRModal(false)}
        value={qrValue}
        label="Địa chỉ nhận tiền VNKR"
        subtitle={qrType === "dynamic" ? `Hết hạn sau ${qrCountdown}s` : "QR Tĩnh — Không hết hạn"}
      />
    </div>
  );
}
