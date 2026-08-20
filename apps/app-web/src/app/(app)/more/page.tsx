"use client";
/**
 * /more — Settings / Profile / All Features
 * Components: Toggle · ListItem (menu) · Modal · Badge · VnkrLogo
 */
import React, { useState } from "react";
import {
  ListItem,
  Toggle,
  Modal,
  Button,
  Text,
  Badge,
  VnkrLogo,
  UserCircle,
  ShieldCheck,
  Bell,
  Globe,
  Fingerprint,
  Settings2,
  UserShield,
  ChevronRight,
  AlertCircle,
  Lock,
  ArrowExport,
  Eye,
  ArrowRight,
  Receipt,
  Send,
  ArrowSwap,
  Bitcoin,
  ArrowDown,
  QrCode,
} from "@vnkrvietnam/ui-kit";

// MessageCircle not in ui-kit — use Bell as chat icon
const ChatIcon = Bell;

export default function SettingsPage() {
  const [biometric,     setBiometric]   = useState(true);
  const [pushNotif,     setPushNotif]   = useState(true);
  const [promoNotif,    setPromoNotif]  = useState(false);
  const [darkMode,      setDarkMode]    = useState(false);
  const [language,      setLanguage]    = useState<"vi" | "en">("vi");
  const [logoutModal,   setLogoutModal] = useState(false);

  return (
    <div style={{ paddingBottom: 40 }}>

      {/* ── Profile card ─────────────────────────────────────────────────── */}
      <div style={{
        margin:         "16px 16px 0",
        background:     "#000",
        borderRadius:   20,
        padding:        "20px",
        display:        "flex",
        alignItems:     "center",
        gap:            14,
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: "50%",
          background: "#AF96FB",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 20, fontWeight: 700, color: "#fff",
          fontFamily: "'Work Sans', sans-serif",
          flexShrink: 0,
        }}>
          NA
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Text variant="subtitle1" weight="semibold" color="#FFFFFF">Nguyễn Văn A</Text>
          <Text variant="caption" color="rgba(255,255,255,0.6)">nguyen.van.a@vnkr.vn</Text>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
            <Badge variant="label" color="greeny" label="KYC Cấp 2" />
          </div>
        </div>
        <div style={{ color: "#BEFF6C" }}>
          <ChevronRight size={20} color="rgba(255,255,255,0.5)" />
        </div>
      </div>

      {/* ── Quick Access — New Screens ────────────────────────────────── */}
      <div style={{ padding: "20px 20px 8px" }}>
        <Text variant="caption" weight="semibold" color="#A0AEC0"
          style={{ letterSpacing: "0.07em", textTransform: "uppercase" }}>
          Tính năng mới
        </Text>
      </div>
      <div style={{ margin: "0 16px 0", background: "#fff", borderRadius: 16, padding: "4px 16px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <ListItem
          title="Quét QR / VietQR"
          subtitle="Quét mã VietQR hoặc địa chỉ ví Crypto"
          avatar={{ icon: <QrCode size={18} color="#49DBC8" />, iconBg: "#ECFDF5", size: 40 }}
          showArrow divider
          onClick={() => window.location.href = "/qr-scan"}
        />
        <ListItem
          title="Chuyển tiền SWIFT"
          subtitle="Chuyển tiền quốc tế ISO 20022 • 180+ quốc gia"
          avatar={{ icon: <Send size={18} color="#0095FF" />, iconBg: "#EFF6FF", size: 40 }}
          showArrow divider
          onClick={() => window.location.href = "/swift"}
        />
        <ListItem
          title="UETR Tracker"
          subtitle="Theo dõi điện SWIFT gpi liên ngân hàng"
          avatar={{ icon: <ArrowRight size={18} color="#AF96FB" />, iconBg: "#F5F3FF", size: 40 }}
          showArrow divider
          onClick={() => window.location.href = "/uetr"}
        />
        <ListItem
          title="Nạp / Rút VNKR"
          subtitle="On-Ramp / Off-Ramp VND ↔ VNKR Stablecoin"
          avatar={{ icon: <ArrowSwap size={18} color="#FFAA00" />, iconBg: "#FFFBEB", size: 40 }}
          showArrow divider
          onClick={() => window.location.href = "/onramp"}
        />
        <ListItem
          title="Nạp / Rút Crypto On-chain"
          subtitle="TRC20 · Solana · EVM Deposit / Withdrawal"
          avatar={{ icon: <Bitcoin size={18} color="#FC7339" />, iconBg: "#FFF4EE", size: 40 }}
          showArrow divider
          onClick={() => window.location.href = "/crypto-deposit"}
        />
        <ListItem
          title="Thanh toán Tự động"
          subtitle="Auto-Debit hóa đơn điện, nước, internet…"
          avatar={{ icon: <Receipt size={18} color="#00D68F" />, iconBg: "#ECFDF5", size: 40 }}
          showArrow divider
          onClick={() => window.location.href = "/auto-debit"}
        />
        <ListItem
          title="Biên lai Giao dịch"
          subtitle="Xem & Xuất PDF biên lai chi tiết"
          avatar={{ icon: <ArrowDown size={18} color="#718096" />, iconBg: "#F5F6FA", size: 40 }}
          showArrow divider={false}
          onClick={() => window.location.href = "/receipt"}
        />
      </div>

      {/* ── Security section ─────────────────────────────────────────────── */}
      <div style={{ padding: "20px 20px 8px" }}>
        <Text variant="caption" weight="semibold" color="#A0AEC0"
          style={{ letterSpacing: "0.07em", textTransform: "uppercase" }}>
          Bảo mật
        </Text>
      </div>
      <div style={{ margin: "0 16px", background: "#fff", borderRadius: 16, padding: "4px 16px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <ListItem
          title="Trung tâm Bảo mật"
          subtitle="Thiết bị · Sinh trắc học · 2FA Google Authenticator"
          avatar={{ icon: <ShieldCheck size={18} color="#00D68F" />, iconBg: "#ECFDF5", size: 40 }}
          showArrow divider
          onClick={() => window.location.href = "/security"}
          rightSlot={
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Badge variant="label" color="success" label="Tốt" />
              <ChevronRight size={16} color="#CBD5E0" />
            </div>
          }
        />
        <ListItem
          title="Xác thực vân tay / Face ID"
          subtitle="Mở khoá và xác nhận giao dịch"
          avatar={{ icon: <Fingerprint size={18} color="#0095FF" />, iconBg: "#EFF6FF", size: 40 }}
          divider
          rightSlot={<Toggle checked={biometric} onChange={setBiometric} color="dark" size="sm" />}
        />
        <ListItem
          title="Quên / Đặt lại PIN"
          subtitle="Khôi phục PIN qua OTP & sinh trắc học"
          avatar={{ icon: <Lock size={18} color="#FFAA00" />, iconBg: "#FFFBEB", size: 40 }}
          showArrow divider
          onClick={() => window.location.href = "/reset-pin"}
        />
        <ListItem
          title="eKYC — Xác minh danh tính"
          subtitle="Chụp CCCD/Hộ chiếu + Liveness Detection"
          avatar={{ icon: <UserShield size={18} color="#AF96FB" />, iconBg: "#F5F3FF", size: 40 }}
          showArrow divider={false}
          onClick={() => window.location.href = "/ekyc"}
          rightSlot={
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Badge variant="label" color="success" label="Cấp 2" />
              <ChevronRight size={16} color="#CBD5E0" />
            </div>
          }
        />
      </div>

      {/* ── Notification section ─────────────────────────────────────────── */}
      <div style={{ padding: "20px 20px 8px" }}>
        <Text variant="caption" weight="semibold" color="#A0AEC0"
          style={{ letterSpacing: "0.07em", textTransform: "uppercase" }}>
          Thông báo
        </Text>
      </div>
      <div style={{ margin: "0 16px", background: "#fff", borderRadius: 16, padding: "4px 16px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <ListItem
          title="Thông báo giao dịch"
          subtitle="Nhận thông báo mỗi giao dịch"
          avatar={{ icon: <Bell size={18} color="#FF3D71" />, iconBg: "#FFF1F2", size: 40 }}
          divider
          rightSlot={<Toggle checked={pushNotif} onChange={setPushNotif} color="dark" size="sm" />}
        />
        <ListItem
          title="Khuyến mãi & Cashback"
          subtitle="Thông báo về ưu đãi mới"
          avatar={{ icon: <Bell size={18} color="#FFAA00" />, iconBg: "#FFFBEB", size: 40 }}
          divider={false}
          rightSlot={<Toggle checked={promoNotif} onChange={setPromoNotif} color="dark" size="sm" />}
        />
      </div>

      {/* ── Appearance section ───────────────────────────────────────────── */}
      <div style={{ padding: "20px 20px 8px" }}>
        <Text variant="caption" weight="semibold" color="#A0AEC0"
          style={{ letterSpacing: "0.07em", textTransform: "uppercase" }}>
          Giao diện & Ngôn ngữ
        </Text>
      </div>
      <div style={{ margin: "0 16px", background: "#fff", borderRadius: 16, padding: "4px 16px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <ListItem
          title="Chế độ tối"
          subtitle="Giao diện nền đen"
          avatar={{ icon: <Eye size={18} color="#718096" />, iconBg: "#F5F6FA", size: 40 }}
          divider
          rightSlot={<Toggle checked={darkMode} onChange={setDarkMode} color="dark" size="sm" />}
        />
        <ListItem
          title="Ngôn ngữ"
          subtitle={language === "vi" ? "Tiếng Việt" : "English"}
          avatar={{ icon: <Globe size={18} color="#49DBC8" />, iconBg: "#ECFDF5", size: 40 }}
          showArrow
          divider={false}
          rightSlot={
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ display: "flex", gap: 4 }}>
                {(["vi", "en"] as const).map(l => (
                  <button
                    key={l}
                    onClick={() => setLanguage(l)}
                    style={{
                      padding:      "2px 8px",
                      borderRadius: 6,
                      border:       "1px solid #E5E7EB",
                      background:   language === l ? "#000" : "#fff",
                      color:        language === l ? "#fff" : "#4A5568",
                      fontSize:     11,
                      fontWeight:   700,
                      cursor:       "pointer",
                      fontFamily:   "'Work Sans', sans-serif",
                    }}
                  >
                    {l.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          }
        />
      </div>

      {/* ── Account section ──────────────────────────────────────────────── */}
      <div style={{ padding: "20px 20px 8px" }}>
        <Text variant="caption" weight="semibold" color="#A0AEC0"
          style={{ letterSpacing: "0.07em", textTransform: "uppercase" }}>
          Tài khoản
        </Text>
      </div>
      <div style={{ margin: "0 16px", background: "#fff", borderRadius: 16, padding: "4px 16px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <ListItem
          title="Trợ lý AI 24/7"
          subtitle="Hỏi & hỗ trợ giao dịch qua chatbot AI"
          avatar={{ icon: <ChatIcon size={18} color="#AF96FB" />, iconBg: "#F5F3FF", size: 40 }}
          showArrow divider
          onClick={() => window.location.href = "/support"}
        />
        <ListItem
          title="Xác minh danh tính (KYC)"
          subtitle="VNeID Cấp 2 — Đã xác minh"
          avatar={{ icon: <UserShield size={18} color="#00D68F" />, iconBg: "#ECFDF5", size: 40 }}
          showArrow divider
          onClick={() => window.location.href = "/ekyc"}
          rightSlot={
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Badge variant="label" color="success" label="Cấp 2" />
              <ChevronRight size={16} color="#CBD5E0" />
            </div>
          }
        />
        <ListItem
          title="Cài đặt nâng cao"
          subtitle="Developer options, API keys"
          avatar={{ icon: <Settings2 size={18} color="#718096" />, iconBg: "#F5F6FA", size: 40 }}
          showArrow
          divider={false}
        />
      </div>

      {/* ── Logout ────────────────────────────────────────────────────────── */}
      <div style={{ padding: "16px 16px 0" }}>
        <Button
          variant="outlined"
          color="error"
          size="lg"
          fullWidth
          iconLeft={<ArrowExport size={18} />}
          onClick={() => setLogoutModal(true)}
        >
          Đăng xuất
        </Button>
      </div>

      {/* ── Version / logo ────────────────────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "20px 0 8px" }}>
        <VnkrLogo variant="dark" size="xs" />
        <Text variant="caption" color="#CBD5E0">v1.1.0 · app.vnkr.vn</Text>
      </div>

      {/* ── Logout modal ─────────────────────────────────────────────────── */}
      <Modal
        open={logoutModal}
        onClose={() => setLogoutModal(false)}
        variant="center"
        title="Đăng xuất?"
        subtitle="Bạn có chắc muốn đăng xuất khỏi tài khoản này không?"
        footer={
          <div style={{ display: "flex", gap: 10 }}>
            <Button variant="outlined" color="dark" size="lg" fullWidth onClick={() => setLogoutModal(false)}>
              Huỷ
            </Button>
            <Button variant="filled" color="error" size="lg" fullWidth>
              Đăng xuất
            </Button>
          </div>
        }
      />
    </div>
  );
}
