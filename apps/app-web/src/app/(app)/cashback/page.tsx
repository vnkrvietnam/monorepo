"use client";
/**
 * /cashback — Cashback & Rewards
 * Features:
 *  - Minimum 10.000đ withdrawal
 *  - Fraud detection: duplicate voucher redemption blocked
 *  - Withdrawal routes through /enter-pin
 *  - Cashback balance management
 */
import React, { useState } from "react";
import {
  PieChart,
  ListItem,
  Badge,
  Button,
  Modal,
  Input,
  Text,
  ThumbnailFrame,
  toast,
  AlertCircle,
  CheckCircle,
} from "@vnkrvietnam/ui-kit";
import type { PieChartSegment } from "@vnkrvietnam/ui-kit";
import { useRouter } from "next/navigation";

const MIN_WITHDRAWAL = 10_000; // 10,000 VND

const PIE_DATA: PieChartSegment[] = [
  { label: "Ăn uống",   value: 42, color: "#AF96FB" },
  { label: "Mua sắm",   value: 28, color: "#BEFF6C" },
  { label: "Di chuyển", value: 15, color: "#49DBC8" },
  { label: "Giải trí",  value: 10, color: "#FC7339" },
  { label: "Khác",      value: 5,  color: "#FFF172" },
];

const CASHBACK_HISTORY = [
  { title: "Shopee",    subtitle: "Mua sắm Online", amount: "+12.500đ", meta: "Hôm nay", color: "#FC7339", initials: "SP" },
  { title: "Grab Food", subtitle: "Đồ ăn & Uống",  amount: "+3.200đ",  meta: "Hôm qua", color: "#00D68F", initials: "GF" },
  { title: "CGV Cinema",subtitle: "Giải trí",       amount: "+8.000đ",  meta: "23/06",   color: "#0095FF", initials: "CG" },
  { title: "Circle K",  subtitle: "Tiện lợi",       amount: "+1.500đ",  meta: "22/06",   color: "#FFAA00", initials: "CK" },
  { title: "Tiki",      subtitle: "Mua sắm Online", amount: "+5.000đ",  meta: "20/06",   color: "#AF96FB", initials: "TK" },
];

interface Voucher {
  id:       string;
  brand:    string;
  discount: string;
  code:     string;
  color:    "orange"|"greeny"|"violet";
  bg:       string;
  redeemed: boolean;
}

const VOUCHERS: Voucher[] = [
  { id: "v1", brand: "Shopee",   discount: "5%",  code: "SHOPEE5CB",  color: "orange", bg: "#FC7339", redeemed: false },
  { id: "v2", brand: "Grab",     discount: "3%",  code: "GRAB3CB",    color: "greeny", bg: "#BEFF6C", redeemed: false },
  { id: "v3", brand: "CGV",      discount: "10%", code: "CGV10CB",    color: "violet", bg: "#AF96FB", redeemed: false },
];

export default function CashbackPage() {
  const router = useRouter();
  const [tab,            setTab]           = useState<"overview"|"history">("overview");
  const [cashbackBal,    setCashbackBal]   = useState(30_200);
  const [withdrawAmount, setWithdrawAmount]= useState("");
  const [withdrawModal,  setWithdrawModal] = useState(false);
  const [vouchers,       setVouchers]      = useState<Voucher[]>(VOUCHERS);
  const [voucherModal,   setVoucherModal]  = useState<Voucher | null>(null);
  const [withdrawError,  setWithdrawError] = useState("");

  const withdrawNum = Number(withdrawAmount) || 0;

  const handleWithdrawRequest = () => {
    setWithdrawError("");
    if (withdrawNum < MIN_WITHDRAWAL) {
      setWithdrawError(`Số tiền tối thiểu là ${MIN_WITHDRAWAL.toLocaleString("vi-VN")}đ`);
      return;
    }
    if (withdrawNum > cashbackBal) {
      setWithdrawError("Số dư Cashback không đủ");
      return;
    }
    // Route to PIN confirmation
    if (typeof window !== "undefined") {
      sessionStorage.setItem("pending_cashback_withdraw", JSON.stringify({ amount: withdrawNum }));
    }
    setWithdrawModal(false);
    router.push("/enter-pin?returnUrl=/cashback&action=withdraw");
  };

  const handleVoucherRedeem = (v: Voucher) => {
    if (v.redeemed) {
      toast.error(`Mã ${v.code} đã được dùng rồi. Không thể sử dụng lại.`);
      return;
    }
    // Fraud check: mark as redeemed immediately to prevent double-use
    setVouchers(prev => prev.map(item => item.id === v.id ? { ...item, redeemed: true } : item));
    setVoucherModal(null);
    toast.success(`Đã áp dụng voucher ${v.code} — giảm ${v.discount}`);
  };

  return (
    <div style={{ paddingBottom: 24 }}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{ padding: "16px 20px 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <Text variant="h6" weight="semibold" color="#1A1F36">Cashback</Text>
          <Text variant="caption" color="#A0AEC0">Hoàn tiền từ giao dịch của bạn</Text>
        </div>
        <div style={{ background: "#000", borderRadius: 16, padding: "8px 16px", display: "flex", alignItems: "center", gap: 8 }}>
          <Text variant="subtitle2" weight="semibold" color="#BEFF6C">
            {cashbackBal.toLocaleString("vi-VN")}đ
          </Text>
        </div>
      </div>

      {/* ── Withdraw button ──────────────────────────────────────────────── */}
      <div style={{ padding: "4px 20px 12px" }}>
        <Button variant="filled" color="dark" size="md" fullWidth onClick={() => setWithdrawModal(true)}>
          Rút về ví chính (min {MIN_WITHDRAWAL.toLocaleString("vi-VN")}đ)
        </Button>
      </div>

      {/* ── Tab switcher ─────────────────────────────────────────────────── */}
      <div style={{ padding: "4px 20px 12px" }}>
        <div style={{ display: "flex", background: "#F5F6FA", borderRadius: 12, padding: 3, gap: 2 }}>
          {[{ id: "overview", label: "Tổng quan" }, { id: "history", label: "Lịch sử" }].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as typeof tab)}
              style={{
                flex: 1, height: 34, borderRadius: 9, border: "none",
                background: tab === t.id ? "#000" : "transparent",
                color: tab === t.id ? "#fff" : "#718096",
                fontSize: 13, fontWeight: tab === t.id ? 700 : 400,
                fontFamily: "'Work Sans', sans-serif", cursor: "pointer",
              }}
            >{t.label}</button>
          ))}
        </div>
      </div>

      {tab === "overview" && (
        <>
          {/* Donut chart */}
          <div style={{ margin: "0 16px 16px", background: "#fff", borderRadius: 16, padding: "16px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <Text variant="subtitle2" weight="semibold" color="#1A1F36" style={{ marginBottom: 12 }}>Phân bổ tháng 6</Text>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <PieChart segments={PIE_DATA} donut size={200} legend title="" />
            </div>
          </div>

          {/* Vouchers */}
          <div style={{ padding: "0 20px" }}>
            <Text variant="subtitle2" weight="semibold" color="#1A1F36" style={{ marginBottom: 10 }}>Đổi Voucher</Text>
            <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
              {vouchers.map(v => (
                <div key={v.id} style={{ flexShrink: 0, opacity: v.redeemed ? 0.5 : 1 }}>
                  <div onClick={() => !v.redeemed && setVoucherModal(v)} style={{ cursor: v.redeemed ? "default" : "pointer" }}>
                    <ThumbnailFrame ratio="1:1" bg={v.color} width={140} showLogo={false} showShapes title={v.brand} subtitle={v.redeemed ? "Đã dùng" : "Đổi ngay"}>
                      <div style={{ position: "absolute", top: 8, right: 8, background: "#000", borderRadius: 99, padding: "3px 8px", fontSize: 13, fontWeight: 700, color: "#BEFF6C", fontFamily: "'Work Sans', sans-serif", zIndex: 2 }}>
                        {v.discount}
                      </div>
                      {v.redeemed && (
                        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3, borderRadius: 12 }}>
                          <Text variant="caption" color="#fff" weight="semibold">Đã dùng</Text>
                        </div>
                      )}
                    </ThumbnailFrame>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {tab === "history" && (
        <div style={{ margin: "0 16px", background: "#fff", borderRadius: 16, padding: "4px 16px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <div style={{ padding: "10px 0 4px" }}>
            <Text variant="caption" weight="semibold" color="#A0AEC0" style={{ letterSpacing: "0.06em", textTransform: "uppercase" }}>Tháng 6, 2025</Text>
          </div>
          {CASHBACK_HISTORY.map((item, i) => (
            <ListItem
              key={i}
              title={item.title}
              subtitle={item.subtitle}
              amount={item.amount}
              amountColor="#00D68F"
              meta={item.meta}
              avatar={{ initials: item.initials, bg: item.color }}
              divider={i < CASHBACK_HISTORY.length - 1}
            />
          ))}
          <div style={{ padding: "12px 0 4px" }}>
            <Button variant="ghost" color="dark" size="sm" fullWidth>Xem thêm</Button>
          </div>
        </div>
      )}

      {/* ── Withdraw modal ─────────────────────────────────────────────── */}
      <Modal
        open={withdrawModal}
        onClose={() => { setWithdrawModal(false); setWithdrawError(""); }}
        variant="sheet"
        title="Rút Cashback về ví chính"
        subtitle={`Số dư: ${cashbackBal.toLocaleString("vi-VN")}đ · Tối thiểu ${MIN_WITHDRAWAL.toLocaleString("vi-VN")}đ`}
        footer={
          <Button variant="filled" color="dark" size="lg" fullWidth onClick={handleWithdrawRequest}>
            Xác nhận — Nhập PIN
          </Button>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Input
            label="Số tiền rút (đ)"
            placeholder={`Tối thiểu ${MIN_WITHDRAWAL.toLocaleString("vi-VN")}`}
            type="number"
            value={withdrawAmount}
            onChange={e => { setWithdrawAmount(e.target.value); setWithdrawError(""); }}
            error={withdrawError || undefined}
          />
          {/* Quick amounts */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[10000, 20000, 30200].map(v => (
              <Button key={v} variant="outlined" color="dark" size="sm" onClick={() => setWithdrawAmount(String(v))}>
                {v.toLocaleString("vi-VN")}đ
              </Button>
            ))}
          </div>
          {withdrawError && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#FFF1F2", borderRadius: 8, padding: "8px 12px" }}>
              <AlertCircle size={14} color="#FF3D71" />
              <Text variant="caption" color="#FF3D71">{withdrawError}</Text>
            </div>
          )}
          <div style={{ background: "#FFFBEB", borderRadius: 8, padding: "8px 12px", display: "flex", gap: 8 }}>
            <AlertCircle size={14} color="#FFAA00" />
            <Text variant="caption" color="#92400E">Cần xác thực PIN trước khi rút. Phòng chống gian lận.</Text>
          </div>
        </div>
      </Modal>

      {/* ── Voucher confirm modal ─────────────────────────────────────────── */}
      {voucherModal && (
        <Modal
          open={!!voucherModal}
          onClose={() => setVoucherModal(null)}
          variant="center"
          title={`Đổi Voucher ${voucherModal.brand}`}
          subtitle={`Mã: ${voucherModal.code} — Giảm ${voucherModal.discount}`}
          footer={
            <div style={{ display: "flex", gap: 10 }}>
              <Button variant="outlined" color="dark" size="lg" fullWidth onClick={() => setVoucherModal(null)}>Huỷ</Button>
              <Button variant="filled" color="dark" size="lg" fullWidth onClick={() => handleVoucherRedeem(voucherModal)}>
                Dùng ngay
              </Button>
            </div>
          }
        >
          <div style={{ textAlign: "center", padding: "12px 0" }}>
            <div style={{ display: "inline-flex", background: voucherModal.bg + "33", borderRadius: 12, padding: 16, marginBottom: 12 }}>
              <Text variant="h4" weight="semibold" color={voucherModal.bg}>{voucherModal.discount}</Text>
            </div>
            <Text variant="body2" color="#718096" style={{ display: "block" }}>Mỗi mã chỉ dùng được 1 lần. Hệ thống sẽ ghi nhận ngay khi bạn nhấn "Dùng ngay".</Text>
          </div>
        </Modal>
      )}
    </div>
  );
}
