"use client";
/**
 * /home — Home Dashboard
 * Features:
 *  - Balance hide/show toggle persisted in localStorage
 *  - Chart income/expense with empty/error states + Toast
 *  - Notification center with unread badge
 */
import React, { useState, useEffect } from "react";
import {
  WalletCard,
  CryptoBadgeRow,
  Button,
  Text,
  QRCodeModal,
  LineChart,
  toast,
  ArrowUp,
  ArrowDown,
  ArrowSwap,
  QrCode,
  Bell,
  Eye,
  EyeOff,
} from "@vnkrvietnam/ui-kit";
import type { CryptoBadgeData } from "@vnkrvietnam/ui-kit";

const BALANCE_VISIBLE_KEY = "home_balance_visible";
const BALANCE_VND = 2_500_000;

const CRYPTO_BADGES: CryptoBadgeData[] = [
  { ticker: "BTC",  percent: "12.7%", trend: "up"      },
  { ticker: "ETH",  percent: "5.2%",  trend: "up"      },
  { ticker: "SOL",  percent: "−3.1%", trend: "down"    },
  { ticker: "AXVN", percent: "8.4%",  trend: "up"      },
  { ticker: "GLD",  percent: "0.3%",  trend: "neutral" },
];

// Chart data: last 7 days income vs expense
const CHART_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const CHART_INCOME  = [1200000, 0, 2500000, 500000, 0, 1800000, 300000];
const CHART_EXPENSE = [450000, 320000, 800000, 200000, 150000, 600000, 80000];

function QuickAction({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, cursor: "pointer", userSelect: "none" }}
    >
      <div style={{ width: 52, height: 52, borderRadius: 16, background: "#000", display: "flex", alignItems: "center", justifyContent: "center", color: "#BEFF6C" }}>
        {icon}
      </div>
      <Text variant="caption" color="#4A5568" weight="medium">{label}</Text>
    </div>
  );
}

export default function HomePage() {
  const [activeBadge,    setActiveBadge]   = useState(0);
  const [qrOpen,         setQrOpen]        = useState(false);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [chartError,     setChartError]    = useState(false);
  const [chartLoading,   setChartLoading]  = useState(false);
  const [notifCount,     setNotifCount]    = useState(3);

  // Persist balance visibility in localStorage
  useEffect(() => {
    const stored = localStorage.getItem(BALANCE_VISIBLE_KEY);
    if (stored !== null) setBalanceVisible(stored === "true");
  }, []);

  const toggleBalance = () => {
    setBalanceVisible(v => {
      const next = !v;
      localStorage.setItem(BALANCE_VISIBLE_KEY, String(next));
      return next;
    });
  };

  // Simulate chart data loading with error handling
  useEffect(() => {
    setChartLoading(true);
    const t = setTimeout(() => {
      setChartLoading(false);
      // Simulate occasional network error
      if (Math.random() < 0.05) {
        setChartError(true);
        toast.error("Không thể tải dữ liệu biểu đồ. Vui lòng thử lại.");
      }
    }, 800);
    return () => clearTimeout(t);
  }, []);

  const retryChart = () => {
    setChartError(false);
    setChartLoading(true);
    setTimeout(() => setChartLoading(false), 800);
  };

  const formattedBalance = balanceVisible
    ? `${BALANCE_VND.toLocaleString("vi-VN")}đ`
    : "•••••• VNĐ";

  return (
    <div style={{ paddingBottom: 24 }}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px 8px" }}>
        <div>
          <Text variant="caption" color="#A0AEC0">Xin chào 👋</Text>
          <Text variant="h6" weight="semibold" color="#1A1F36">Nguyễn Văn A</Text>
        </div>
        <button
          onClick={() => { setNotifCount(0); window.location.href = "/more#notifications"; }}
          style={{ width: 40, height: 40, borderRadius: "50%", background: "#fff", border: "1px solid #F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", position: "relative" }}
          aria-label="Notifications"
        >
          <Bell size={20} color="#1A1F36" />
          {notifCount > 0 && (
            <span style={{ position: "absolute", top: 6, right: 6, width: 8, height: 8, borderRadius: "50%", background: "#FF3D71", border: "2px solid #fff" }} />
          )}
        </button>
      </div>

      {/* ── Balance + toggle ────────────────────────────────────────────── */}
      <div style={{ padding: "4px 20px 12px" }}>
        <div style={{ background: "#000", borderRadius: 16, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <Text variant="caption" color="rgba(255,255,255,0.5)">Số dư khả dụng</Text>
            <Text variant="h5" weight="semibold" color="#BEFF6C" style={{ letterSpacing: balanceVisible ? undefined : 2 }}>
              {formattedBalance}
            </Text>
          </div>
          <button
            onClick={toggleBalance}
            style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 8, padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
            aria-label={balanceVisible ? "Ẩn số dư" : "Hiện số dư"}
          >
            {balanceVisible ? <EyeOff size={16} color="rgba(255,255,255,0.7)" /> : <Eye size={16} color="rgba(255,255,255,0.7)" />}
            <Text variant="caption" color="rgba(255,255,255,0.6)">{balanceVisible ? "Ẩn" : "Hiện"}</Text>
          </button>
        </div>
      </div>

      {/* ── Wallet Card ─────────────────────────────────────────────────── */}
      <div style={{ padding: "0 20px 16px", overflowX: "hidden" }}>
        <WalletCard
          name="Cashie"
          holder="NGUYỄN VĂN A"
          last4="7890"
          expiry="07/27"
          bg="greeny"
          width={Math.min(340, typeof window !== "undefined" ? window.innerWidth - 40 : 340)}
          style={{ margin: "0 auto" }}
        />
      </div>

      {/* ── Quick actions ────────────────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-around", padding: "0 20px 20px" }}>
        <QuickAction icon={<ArrowUp size={22} />}   label="Gửi"   onClick={() => window.location.href = "/transfer"} />
        <QuickAction icon={<ArrowDown size={22} />} label="Nhận"  onClick={() => setQrOpen(true)} />
        <QuickAction icon={<ArrowSwap size={22} />} label="P2P"   onClick={() => window.location.href = "/p2p"} />
        <QuickAction icon={<QrCode size={22} />}    label="QR"    onClick={() => setQrOpen(true)} />
      </div>

      {/* ── Crypto badges ───────────────────────────────────────────────── */}
      <div style={{ padding: "0 20px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <Text variant="subtitle2" weight="semibold" color="#1A1F36">Thị trường</Text>
          <Button variant="ghost" color="dark" size="sm" onClick={() => window.location.href = "/crypto"}>Xem tất cả</Button>
        </div>
        <div style={{ overflowX: "auto", paddingBottom: 4 }}>
          <CryptoBadgeRow items={CRYPTO_BADGES} activeIndex={activeBadge} onSelect={setActiveBadge} />
        </div>
      </div>

      {/* ── Income/Expense Chart ─────────────────────────────────────────── */}
      <div style={{ margin: "0 16px 16px", background: "#fff", borderRadius: 16, padding: "16px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <Text variant="subtitle2" weight="semibold" color="#1A1F36">Thu chi 7 ngày</Text>
          {chartError && (
            <Button variant="ghost" color="dark" size="sm" onClick={retryChart}>Tải lại</Button>
          )}
        </div>
        {chartLoading ? (
          <div style={{ height: 140, background: "#F5F6FA", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Text variant="caption" color="#A0AEC0">Đang tải...</Text>
          </div>
        ) : chartError ? (
          <div style={{ height: 140, background: "#FFF1F2", borderRadius: 10, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Text variant="caption" color="#FF3D71">Không thể tải biểu đồ</Text>
            <Button variant="outlined" color="error" size="sm" onClick={retryChart}>Thử lại</Button>
          </div>
        ) : (
          <LineChart
            labels={CHART_LABELS}
            series={[
              { name: "Thu", data: CHART_INCOME,  color: "#00D68F", area: true },
              { name: "Chi", data: CHART_EXPENSE, color: "#FF3D71", area: true },
            ]}
            height={140}
            grid
          />
        )}
      </div>

      {/* ── QR Modal ─────────────────────────────────────────────────────── */}
      <QRCodeModal
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        value="vnkr:0x1234567890abcdef1234567890abcdef12345678"
        label="Địa chỉ ví của bạn"
        subtitle="VNKR App — Solana / EVM"
        scannable
      />
    </div>
  );
}
