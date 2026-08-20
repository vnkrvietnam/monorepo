"use client";
/**
 * /security — Security Center
 * Quản lý thiết bị · Biometrics · 2FA Google Authenticator
 */
import React, { useState } from "react";
import {
  Button, Text, Modal, Badge, Toggle, ListItem,
  ShieldCheck, Fingerprint, Phone, Lock, Trash,
  AlertCircle, CheckCircle, Key, Eye, EyeOff,
  Monitor, Settings2,
} from "@vnkrvietnam/ui-kit";

interface DeviceEntry {
  id:       string;
  name:     string;
  os:       string;
  location: string;
  lastSeen: string;
  current:  boolean;
}

const DEVICES: DeviceEntry[] = [
  { id: "d1", name: "iPhone 15 Pro",       os: "iOS 17.4",        location: "TP.HCM, VN",   lastSeen: "Đang hoạt động", current: true  },
  { id: "d2", name: "MacBook Air M2",      os: "macOS 14.5",      location: "TP.HCM, VN",   lastSeen: "2 giờ trước",    current: false },
  { id: "d3", name: "Samsung Galaxy S24",  os: "Android 14",      location: "Hà Nội, VN",   lastSeen: "3 ngày trước",   current: false },
];

const TOTP_SECRET  = "JBSWY3DPEHPK3PXP";
const TOTP_QR      = `otpauth://totp/VNKR:nguyen.van.a%40vnkr.vn?secret=${TOTP_SECRET}&issuer=VNKR`;

export default function SecurityPage() {
  const [biometric,    setBiometric]    = useState(true);
  const [txnBio,       setTxnBio]       = useState(true);
  const [loginNotif,   setLoginNotif]   = useState(true);
  const [twoFA,        setTwoFA]        = useState(false);
  const [devices,      setDevices]      = useState<DeviceEntry[]>(DEVICES);
  const [revokeModal,  setRevokeModal]  = useState<string | null>(null);
  const [totpModal,    setTotpModal]    = useState(false);
  const [totpStep,     setTotpStep]     = useState<"scan" | "verify" | "done">("scan");
  const [totpCode,     setTotpCode]     = useState("");
  const [showSecret,   setShowSecret]   = useState(false);
  const [loading,      setLoading]      = useState(false);

  const secScore = [biometric, txnBio, loginNotif, twoFA].filter(Boolean).length;

  const revokeDevice = (id: string) => {
    setDevices(prev => prev.filter(d => d.id !== id));
    setRevokeModal(null);
  };

  const enableTOTP = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    setLoading(false);
    setTotpStep("done");
    setTwoFA(true);
  };

  const scoreColor = secScore <= 1 ? "#FF3D71" : secScore <= 2 ? "#FFAA00" : "#00D68F";
  const scoreLabel = secScore <= 1 ? "Yếu" : secScore <= 2 ? "Trung bình" : secScore === 3 ? "Tốt" : "Rất tốt";

  return (
    <div style={{ paddingBottom: 32 }}>
      {/* Header */}
      <div style={{ padding: "16px 20px 8px", display: "flex", alignItems: "center", gap: 10 }}>
        <ShieldCheck size={22} color="#1A1F36" />
        <div>
          <Text variant="h6" weight="semibold" color="#1A1F36">Trung tâm Bảo mật</Text>
          <Text variant="caption" color="#A0AEC0">Security Center</Text>
        </div>
      </div>

      {/* Security score */}
      <div style={{
        margin:     "8px 16px 16px",
        background: "#000",
        borderRadius: 20, padding: "18px 20px",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <Text variant="subtitle2" weight="semibold" color="#fff">Điểm bảo mật</Text>
          <Text variant="h5" weight="semibold" color={scoreColor}>{secScore}/4 — {scoreLabel}</Text>
        </div>
        {/* Progress */}
        <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 99, height: 8, overflow: "hidden" }}>
          <div style={{ width: `${(secScore / 4) * 100}%`, background: scoreColor, height: "100%", borderRadius: 99, transition: "width 0.4s" }} />
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
          {[
            { label: "Vân tay/FaceID",  ok: biometric   },
            { label: "PIN xác nhận",    ok: txnBio       },
            { label: "Cảnh báo login",  ok: loginNotif   },
            { label: "2FA Auth",        ok: twoFA        },
          ].map(i => (
            <div key={i.label} style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(255,255,255,0.07)", borderRadius: 6, padding: "3px 8px" }}>
              {i.ok
                ? <CheckCircle size={12} color="#00D68F" />
                : <AlertCircle size={12} color="#718096" />}
              <Text variant="caption" color={i.ok ? "#00D68F" : "rgba(255,255,255,0.4)"}>{i.label}</Text>
            </div>
          ))}
        </div>
      </div>

      {/* ── Biometric & Auth ──────────────────────────────────────── */}
      <div style={{ padding: "0 20px 8px" }}>
        <Text variant="caption" weight="semibold" color="#A0AEC0" style={{ letterSpacing: "0.07em", textTransform: "uppercase" }}>
          Xác thực & Sinh trắc học
        </Text>
      </div>
      <div style={{ margin: "0 16px 16px", background: "#fff", borderRadius: 16, padding: "4px 16px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <ListItem
          title="Vân tay / Face ID"
          subtitle="Mở khoá & xác nhận giao dịch nhanh"
          avatar={{ icon: <Fingerprint size={18} color="#0095FF" />, iconBg: "#EFF6FF", size: 40 }}
          divider
          rightSlot={<Toggle checked={biometric} onChange={setBiometric} color="dark" size="sm" />}
        />
        <ListItem
          title="Yêu cầu sinh trắc học mỗi giao dịch"
          subtitle="Xác nhận bằng vân tay/FaceID khi chuyển tiền"
          avatar={{ icon: <Lock size={18} color="#FFAA00" />, iconBg: "#FFFBEB", size: 40 }}
          divider
          rightSlot={<Toggle checked={txnBio} onChange={setTxnBio} color="dark" size="sm" />}
        />
        <ListItem
          title="Google Authenticator (2FA)"
          subtitle={twoFA ? "Đã bật — TOTP 6 chữ số" : "Chưa bật — Bảo mật tốt hơn"}
          avatar={{ icon: <Key size={18} color={twoFA ? "#00D68F" : "#A0AEC0"} />, iconBg: twoFA ? "#ECFDF5" : "#F5F6FA", size: 40 }}
          divider={false}
          rightSlot={
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {twoFA && <Badge variant="label" color="success" label="Bật" />}
              <Button variant={twoFA ? "outlined" : "filled"} color="dark" size="sm"
                onClick={() => { setTotpModal(true); setTotpStep(twoFA ? "scan" : "scan"); }}>
                {twoFA ? "Quản lý" : "Kích hoạt"}
              </Button>
            </div>
          }
        />
      </div>

      {/* ── Notifications ─────────────────────────────────────────── */}
      <div style={{ padding: "0 20px 8px" }}>
        <Text variant="caption" weight="semibold" color="#A0AEC0" style={{ letterSpacing: "0.07em", textTransform: "uppercase" }}>
          Cảnh báo bảo mật
        </Text>
      </div>
      <div style={{ margin: "0 16px 16px", background: "#fff", borderRadius: 16, padding: "4px 16px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <ListItem
          title="Thông báo đăng nhập thiết bị mới"
          subtitle="Cảnh báo ngay khi phát hiện đăng nhập lạ"
          avatar={{ icon: <Phone size={18} color="#FF3D71" />, iconBg: "#FFF1F2", size: 40 }}
          divider={false}
          rightSlot={<Toggle checked={loginNotif} onChange={setLoginNotif} color="dark" size="sm" />}
        />
      </div>

      {/* ── Devices ───────────────────────────────────────────────── */}
      <div style={{ padding: "0 20px 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Text variant="caption" weight="semibold" color="#A0AEC0" style={{ letterSpacing: "0.07em", textTransform: "uppercase" }}>
          Thiết bị đã đăng nhập
        </Text>
        <Badge variant="count" count={devices.length} color="info" />
      </div>
      <div style={{ margin: "0 16px 16px", background: "#fff", borderRadius: 16, padding: "4px 16px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        {devices.map((dev, i) => (
          <div key={dev.id} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 0", borderBottom: i < devices.length - 1 ? "1px solid #F3F4F6" : "none" }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: dev.current ? "#000" : "#F5F6FA", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Monitor size={18} color={dev.current ? "#BEFF6C" : "#A0AEC0"} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Text variant="body2" weight="semibold" color="#1A1F36">{dev.name}</Text>
                {dev.current && <Badge variant="label" color="success" label="Thiết bị này" />}
              </div>
              <Text variant="caption" color="#A0AEC0">{dev.os} · {dev.location}</Text>
              <Text variant="caption" color="#A0AEC0">{dev.lastSeen}</Text>
            </div>
            {!dev.current && (
              <button
                onClick={() => setRevokeModal(dev.id)}
                style={{ background: "none", border: "none", cursor: "pointer", padding: "4px" }}
              >
                <Trash size={16} color="#FF3D71" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* ── Revoke confirm ───────────────────────────────────────── */}
      <Modal
        open={!!revokeModal}
        onClose={() => setRevokeModal(null)}
        variant="center"
        title="Thu hồi quyền truy cập?"
        subtitle="Thiết bị này sẽ bị đăng xuất ngay lập tức và cần đăng nhập lại."
        footer={
          <div style={{ display: "flex", gap: 10 }}>
            <Button variant="outlined" color="dark" size="lg" fullWidth onClick={() => setRevokeModal(null)}>Huỷ</Button>
            <Button variant="filled" color="error" size="lg" fullWidth
              onClick={() => revokeModal && revokeDevice(revokeModal)}>
              Thu hồi
            </Button>
          </div>
        }
      />

      {/* ── 2FA TOTP Setup Modal ─────────────────────────────────── */}
      <Modal
        open={totpModal}
        onClose={() => setTotpModal(false)}
        variant="sheet"
        title="Google Authenticator (2FA)"
        subtitle="Bảo vệ tài khoản bằng mã xác thực 2 lớp"
        footer={
          totpStep === "scan" ? (
            <Button variant="filled" color="dark" size="lg" fullWidth onClick={() => setTotpStep("verify")}>
              Đã quét QR — Tiếp tục
            </Button>
          ) : totpStep === "verify" ? (
            <Button variant="filled" color="dark" size="lg" fullWidth
              disabled={totpCode.length < 6}
              loading={loading}
              onClick={enableTOTP}
            >
              Xác nhận kích hoạt
            </Button>
          ) : (
            <Button variant="filled" color="dark" size="lg" fullWidth onClick={() => setTotpModal(false)}>
              Hoàn tất
            </Button>
          )
        }
      >
        {totpStep === "scan" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Text variant="body2" color="#718096">
              1. Mở Google Authenticator<br />
              2. Nhấn <strong>+</strong> → <strong>Quét QR</strong><br />
              3. Quét mã bên dưới
            </Text>
            <div style={{ background: "#F5F6FA", borderRadius: 12, padding: "24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
              {/* Placeholder QR visual */}
              <div style={{ width: 160, height: 160, background: "#fff", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #E5E7EB" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(8,1fr)", gap: 3 }}>
                  {Array(64).fill(0).map((_, i) => (
                    <div key={i} style={{ width: 14, height: 14, background: Math.random() > 0.5 ? "#000" : "#fff", borderRadius: 1 }} />
                  ))}
                </div>
              </div>
              <Text variant="caption" color="#A0AEC0">VNKR: nguyen.van.a@vnkr.vn</Text>
            </div>
            <div style={{ background: "#F5F6FA", borderRadius: 10, padding: "10px 12px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Text variant="caption" color="#A0AEC0">Khoá bí mật thủ công</Text>
                <button onClick={() => setShowSecret(s => !s)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                  {showSecret ? <EyeOff size={14} color="#718096" /> : <Eye size={14} color="#718096" />}
                </button>
              </div>
              <Text variant="caption" color="#1A1F36" style={{ fontFamily: "monospace", letterSpacing: 2 }}>
                {showSecret ? TOTP_SECRET : "•••• •••• •••• ••••"}
              </Text>
            </div>
          </div>
        )}

        {totpStep === "verify" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Text variant="body2" color="#718096">Nhập mã 6 chữ số từ Google Authenticator để xác nhận kích hoạt.</Text>
            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              {Array(6).fill(0).map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: 42, height: 50, borderRadius: 10, border: `2px solid ${totpCode[i] ? "#000" : "#CBD5E0"}`,
                    background: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 20, fontWeight: 700, fontFamily: "'Work Sans', sans-serif",
                  }}
                >
                  {totpCode[i] || ""}
                </div>
              ))}
            </div>
            <input
              type="number"
              maxLength={6}
              value={totpCode}
              onChange={e => setTotpCode(e.target.value.slice(0, 6))}
              placeholder="123456"
              style={{
                width: "100%", height: 48, borderRadius: 12, border: "1.5px solid #E5E7EB",
                textAlign: "center", fontSize: 18, fontWeight: 700,
                fontFamily: "'Work Sans', sans-serif",
                outline: "none", boxSizing: "border-box",
              }}
            />
          </div>
        )}

        {totpStep === "done" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "20px 0" }}>
            <CheckCircle size={56} color="#00D68F" />
            <Text variant="subtitle1" weight="semibold" color="#1A1F36">2FA đã được kích hoạt!</Text>
            <Text variant="body2" color="#718096" style={{ textAlign: "center" }}>
              Tài khoản của bạn được bảo vệ bằng Google Authenticator. Đừng mất ứng dụng này.
            </Text>
          </div>
        )}
      </Modal>
    </div>
  );
}
