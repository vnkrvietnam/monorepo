"use client";
/**
 * /p2p — P2P Trading
 * Features:
 *  - Escrow mechanism: funds locked when order matched
 *  - 15-minute payment countdown per matched order
 *  - Dispute button → /support
 *  - Live rate ticker
 */
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  DataTable,
  Badge,
  Button,
  Modal,
  Input,
  Text,
  toast,
  ArrowSwap,
  Plus,
  Filter,
  TrendUp,
  TrendDown,
  AlertCircle,
  Clock,
  ShieldCheck,
} from "@vnkrvietnam/ui-kit";
import type { DataTableColumn } from "@vnkrvietnam/ui-kit";
import { useRouter } from "next/navigation";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyCol = DataTableColumn<any>[];

const ESCROW_DURATION_S = 15 * 60; // 15 minutes

interface TokenRate {
  bid: number; ask: number; change: number; unit: string;
}

const BASE_RATES: Record<string, TokenRate> = {
  AXVN: { bid: 1,       ask: 1,       change: 0,    unit: "1 AXVN = 1 VND (Pegged)" },
  VNKR: { bid: 1,       ask: 1,       change: 0,    unit: "1 VNKR = 1 VND (Stablecoin)" },
  USDT: { bid: 26149,   ask: 26164,   change: 0.06, unit: "1 USDT = 26.149–26.164 VND" },
  SOL:  { bid: 3580000, ask: 3612000, change: 2.14, unit: "1 SOL ≈ 3.580.000–3.612.000 VND" },
};

function useLiveRates() {
  const [rates, setRates] = useState<Record<string, TokenRate>>(BASE_RATES);
  useEffect(() => {
    const id = setInterval(() => {
      setRates(prev => ({
        ...prev,
        USDT: { ...prev.USDT, bid: Math.round(26149 + (Math.random() - 0.5) * 30), ask: Math.round(26164 + (Math.random() - 0.5) * 30) },
        SOL:  { ...prev.SOL,  bid: Math.round(3580000 + (Math.random() - 0.5) * 20000), ask: Math.round(3612000 + (Math.random() - 0.5) * 20000) },
      }));
    }, 8000);
    return () => clearInterval(id);
  }, []);
  return rates;
}

type OrderStatus = "OPEN" | "MATCHED" | "COMPLETED" | "CANCELLED" | "DISPUTED";

interface P2PRow {
  id: string; side: "MUA"|"BÁN"; token: string; amount: string; price: string;
  total: string; payment: string; status: OrderStatus; trader: string; time: string;
}

const ORDERS: P2PRow[] = [
  { id:"ORD001", side:"MUA",  token:"AXVN", amount:"500",  price:"16.800đ",  total:"8.400.000đ",  payment:"Vietcombank", status:"OPEN",      trader:"ThuanNV", time:"14:30" },
  { id:"ORD002", side:"BÁN",  token:"AXVN", amount:"200",  price:"17.200đ",  total:"3.440.000đ",  payment:"MB Bank",     status:"MATCHED",   trader:"MinhTT",  time:"13:45" },
  { id:"ORD003", side:"MUA",  token:"USDT", amount:"100",  price:"25.400đ",  total:"2.540.000đ",  payment:"Techcombank", status:"COMPLETED", trader:"LanHT",   time:"12:00" },
  { id:"ORD004", side:"BÁN",  token:"USDT", amount:"500",  price:"25.350đ",  total:"12.675.000đ", payment:"ACB",         status:"OPEN",      trader:"QuangPM", time:"11:20" },
  { id:"ORD005", side:"MUA",  token:"AXVN", amount:"1000", price:"16.750đ",  total:"16.750.000đ", payment:"Vietinbank",  status:"CANCELLED", trader:"AnhDN",   time:"10:05" },
];

const STATUS_MAP: Record<OrderStatus, { color: "info"|"warning"|"success"|"dark"|"error"; label: string }> = {
  OPEN:      { color: "info",    label: "Mở"        },
  MATCHED:   { color: "warning", label: "Khớp lệnh" },
  COMPLETED: { color: "success", label: "Hoàn thành"},
  CANCELLED: { color: "dark",    label: "Huỷ"       },
  DISPUTED:  { color: "error",   label: "Khiếu nại" },
};

const COLUMNS: AnyCol = [
  { key: "side", label: "Loại", width: 60, sortable: true,
    render: (v) => <span style={{ fontWeight: 700, fontSize: 12, color: v === "MUA" ? "#00D68F" : "#FF3D71" }}>{String(v)}</span> },
  { key: "token",   label: "Token",    sortable: true },
  { key: "amount",  label: "Số lượng", sortable: true },
  { key: "price",   label: "Giá (VND)",sortable: true },
  { key: "total",   label: "Tổng",     sortable: true, hideOnMobile: true },
  { key: "payment", label: "TT",       hideOnMobile: true },
  { key: "status",  label: "Trạng thái",
    render: (v) => { const s = STATUS_MAP[v as OrderStatus]; return <Badge variant="label" color={s.color} label={s.label} />; } },
  { key: "trader",  label: "Trader",   hideOnMobile: true },
  { key: "time",    label: "Giờ" },
];

/** Format seconds as MM:SS */
function fmtCountdown(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export default function P2PPage() {
  const router = useRouter();
  const rates = useLiveRates();
  const [orders,        setOrders]       = useState<P2PRow[]>(ORDERS);
  const [createModal,   setCreateModal]  = useState(false);
  const [escrowModal,   setEscrowModal]  = useState<P2PRow | null>(null);
  const [disputeModal,  setDisputeModal] = useState<P2PRow | null>(null);
  const [escrowCountdown, setEscrowCountdown] = useState(ESCROW_DURATION_S);
  const [side,          setSide]         = useState<"MUA"|"BÁN">("MUA");
  const [token,         setToken]        = useState("AXVN");
  const [amount,        setAmount]       = useState("");
  const [price,         setPrice]        = useState("");
  const escrowTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start escrow countdown when escrow modal is open
  useEffect(() => {
    if (!escrowModal) { if (escrowTimerRef.current) clearInterval(escrowTimerRef.current); return; }
    setEscrowCountdown(ESCROW_DURATION_S);
    escrowTimerRef.current = setInterval(() => {
      setEscrowCountdown(c => {
        if (c <= 1) {
          clearInterval(escrowTimerRef.current!);
          toast.error("Hết thời gian thanh toán! Lệnh bị huỷ tự động.");
          setEscrowModal(null);
          setOrders(prev => prev.map(o => o.id === escrowModal.id ? { ...o, status: "CANCELLED" } : o));
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => { if (escrowTimerRef.current) clearInterval(escrowTimerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [escrowModal?.id]);

  const handleTokenChange = useCallback((t: string) => {
    setToken(t);
    const r = rates[t];
    if (r) setPrice(String(Math.round((r.bid + r.ask) / 2)));
  }, [rates]);

  const handleSideChange = useCallback((s: "MUA"|"BÁN") => {
    setSide(s);
    const r = rates[token];
    if (r) setPrice(String(s === "MUA" ? r.ask : r.bid));
  }, [rates, token]);

  const handleConfirmPayment = () => {
    if (!escrowModal) return;
    if (escrowTimerRef.current) clearInterval(escrowTimerRef.current);
    setOrders(prev => prev.map(o => o.id === escrowModal.id ? { ...o, status: "COMPLETED" } : o));
    setEscrowModal(null);
    toast.success("Đã xác nhận thanh toán! Escrow đã được giải phóng.");
  };

  const openMatchedOrder = (row: P2PRow) => {
    if (row.status === "MATCHED") setEscrowModal(row);
  };

  return (
    <div style={{ paddingBottom: 24 }}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{ padding: "16px 20px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <Text variant="h6" weight="semibold" color="#1A1F36">P2P Trading</Text>
          <Text variant="caption" color="#A0AEC0">Mua bán peer-to-peer không qua trung gian</Text>
        </div>
        <Button variant="filled" color="dark" size="md" iconLeft={<Plus size={16} />} onClick={() => setCreateModal(true)}>
          Tạo lệnh
        </Button>
      </div>

      {/* ── Stats row ────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 10, padding: "0 20px 16px" }}>
        {[
          { label: "Lệnh mở",    value: String(orders.filter(o => o.status === "OPEN").length),    color: "#0095FF" },
          { label: "Khớp lệnh",  value: String(orders.filter(o => o.status === "MATCHED").length), color: "#FFAA00" },
          { label: "Hoàn thành", value: String(orders.filter(o => o.status === "COMPLETED").length),color: "#00D68F" },
          { label: "Vol hôm nay",value: "28.6M đ",  color: "#AF96FB" },
        ].map(s => (
          <div key={s.label} style={{ flex: 1, background: "#fff", borderRadius: 12, padding: "10px 12px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: s.color, fontFamily: "'Work Sans', sans-serif" }}>{s.value}</div>
            <div style={{ fontSize: 10, color: "#A0AEC0", fontFamily: "'Work Sans', sans-serif", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Matched orders banner */}
      {orders.some(o => o.status === "MATCHED") && (
        <div style={{ margin: "0 16px 12px", background: "#FFFBEB", borderRadius: 12, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
          <AlertCircle size={16} color="#FFAA00" />
          <Text variant="caption" color="#92400E">
            Bạn có lệnh đã khớp. Nhấn vào lệnh để xác nhận thanh toán (còn 15 phút).
          </Text>
        </div>
      )}

      {/* ── Order table ──────────────────────────────────────────────────── */}
      <div style={{ padding: "0 16px" }}>
        <DataTable
          columns={COLUMNS}
          data={orders as unknown as Record<string, unknown>[]}
          rowKey="id"
          caption="Sổ lệnh P2P"
          searchable
          searchPlaceholder="Tìm lệnh…"
          pageSize={5}
          toolbarSlot={
            <Button variant="outlined" color="dark" size="sm" iconLeft={<Filter size={14} />}>Lọc</Button>
          }
          onRowClick={(row) => openMatchedOrder(row as unknown as P2PRow)}
        />
      </div>

      {/* ── Create order modal ───────────────────────────────────────────── */}
      <Modal
        open={createModal}
        onClose={() => setCreateModal(false)}
        variant="sheet"
        title="Tạo lệnh P2P"
        subtitle="Đặt lệnh mua hoặc bán token"
        footer={
          <Button variant="filled" color="dark" size="lg" fullWidth iconLeft={<ArrowSwap size={18} />}
            disabled={!amount || !price}
            onClick={() => { setCreateModal(false); toast.success("Lệnh đã được tạo!"); }}>
            Xác nhận tạo lệnh
          </Button>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <Text variant="caption" weight="semibold" color="#57606a" style={{ marginBottom: 8, display: "block" }}>Loại lệnh</Text>
            <div style={{ display: "flex", gap: 8 }}>
              {(["MUA", "BÁN"] as const).map(s => (
                <Button key={s} variant={side === s ? "filled" : "outlined"} color={side === s ? (s === "MUA" ? "success" : "error") : "dark"} size="md" fullWidth onClick={() => handleSideChange(s)}>
                  {s}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <Text variant="caption" weight="semibold" color="#57606a" style={{ marginBottom: 8, display: "block" }}>Token</Text>
            <div style={{ display: "flex", gap: 8 }}>
              {["AXVN", "VNKR", "USDT", "SOL"].map(t => (
                <Button key={t} variant={token === t ? "filled" : "outlined"} color="dark" size="sm" onClick={() => handleTokenChange(t)}>
                  {t}
                </Button>
              ))}
            </div>
          </div>
          <div style={{ background: "#EFF6FF", borderRadius: 10, padding: "10px 14px" }}>
            <Text variant="caption" color="#1E40AF">{rates[token]?.unit}</Text>
          </div>
          <Input label="Số lượng" placeholder="VD: 500" type="number" value={amount} onChange={e => setAmount(e.target.value)} />
          <Input label="Giá mỗi token (VND)" placeholder="Giá thị trường" type="number" value={price} onChange={e => setPrice(e.target.value)} />
          <div style={{ background: "#000", borderRadius: 12, padding: "12px 14px", display: "flex", justifyContent: "space-between" }}>
            <Text variant="caption" color="rgba(255,255,255,0.5)">Tổng giá trị lệnh</Text>
            <Text variant="subtitle2" weight="semibold" color="#BEFF6C">
              {amount && price ? (Number(amount) * Number(price)).toLocaleString("vi-VN") + "đ" : "—"}
            </Text>
          </div>
        </div>
      </Modal>

      {/* ── Escrow / Matched order modal ─────────────────────────────────── */}
      {escrowModal && (
        <Modal
          open={!!escrowModal}
          onClose={() => setEscrowModal(null)}
          variant="sheet"
          title="Xác nhận Thanh toán"
          subtitle={`Lệnh ${escrowModal.id} — Tiền đang khoá Escrow`}
          footer={
            <div style={{ display: "flex", gap: 10 }}>
              <Button variant="outlined" color="error" size="lg" fullWidth onClick={() => setDisputeModal(escrowModal)}>
                Khiếu nại
              </Button>
              <Button variant="filled" color="success" size="lg" fullWidth onClick={handleConfirmPayment}>
                Đã nhận tiền
              </Button>
            </div>
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Countdown */}
            <div style={{
              background: escrowCountdown > 60 ? "#000" : "#FFF1F2",
              borderRadius: 14, padding: "14px 16px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div>
                <Text variant="caption" color={escrowCountdown > 60 ? "rgba(255,255,255,0.5)" : "#FF3D71"}>
                  Thời gian thanh toán còn lại
                </Text>
                <Text variant="h4" weight="semibold" color={escrowCountdown > 60 ? "#BEFF6C" : "#FF3D71"}>
                  {fmtCountdown(escrowCountdown)}
                </Text>
              </div>
              <Clock size={28} color={escrowCountdown > 60 ? "#BEFF6C" : "#FF3D71"} />
            </div>

            <div style={{ background: "#ECFDF5", borderRadius: 10, padding: "10px 14px", display: "flex", gap: 8 }}>
              <ShieldCheck size={16} color="#00D68F" style={{ flexShrink: 0 }} />
              <Text variant="caption" color="#065F46">
                Tiền đang được giữ trong Escrow. Chỉ được giải phóng khi bạn xác nhận đã nhận thanh toán từ người {escrowModal.side === "MUA" ? "mua" : "bán"}.
              </Text>
            </div>

            {[
              { label: "Loại",        value: escrowModal.side },
              { label: "Token",       value: escrowModal.token },
              { label: "Số lượng",    value: escrowModal.amount },
              { label: "Giá",         value: escrowModal.price },
              { label: "Tổng",        value: escrowModal.total },
              { label: "Thanh toán",  value: escrowModal.payment },
              { label: "Trader",      value: escrowModal.trader },
            ].map((r, i, arr) => (
              <div key={r.label} style={{ display: "flex", justifyContent: "space-between", borderBottom: i < arr.length - 1 ? "1px solid #F3F4F6" : "none", paddingBottom: 8 }}>
                <Text variant="body2" color="#718096">{r.label}</Text>
                <Text variant="body2" weight="semibold" color="#1A1F36">{r.value}</Text>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {/* ── Dispute modal ─────────────────────────────────────────────────── */}
      <Modal
        open={!!disputeModal}
        onClose={() => setDisputeModal(null)}
        variant="center"
        title="Mở khiếu nại?"
        subtitle="Bạn chưa nhận được thanh toán hoặc có tranh chấp với lệnh này?"
        footer={
          <div style={{ display: "flex", gap: 10 }}>
            <Button variant="outlined" color="dark" size="lg" fullWidth onClick={() => setDisputeModal(null)}>Huỷ</Button>
            <Button variant="filled" color="error" size="lg" fullWidth onClick={() => {
              if (!disputeModal) return;
              setOrders(prev => prev.map(o => o.id === disputeModal.id ? { ...o, status: "DISPUTED" } : o));
              setDisputeModal(null);
              setEscrowModal(null);
              if (escrowTimerRef.current) clearInterval(escrowTimerRef.current);
              router.push("/support");
            }}>
              Xác nhận Khiếu nại
            </Button>
          </div>
        }
      >
        <Text variant="body2" color="#718096" style={{ padding: "8px 0" }}>
          Khiếu nại sẽ được gửi đến đội hỗ trợ VNKR. Tiền sẽ tiếp tục được giữ trong Escrow cho đến khi vụ việc được giải quyết.
        </Text>
      </Modal>
    </div>
  );
}
