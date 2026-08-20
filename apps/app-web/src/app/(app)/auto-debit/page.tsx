"use client";
/**
 * /auto-debit — Auto-Debit Setup
 * Features:
 *  - Overdue/failed warnings
 *  - Retry 3 times (T, T+1, T+3) with auto-cancel after 3 failures
 *  - Abnormal bill spike warning (>200% of 3-month average)
 *  - Pending state handling
 */
import React, { useState } from "react";
import {
  Button, Text, Input, Modal, Badge, Toggle,
  Plus, Trash, ArrowRight,
  ShieldCheck, AlertCircle, Receipt,
} from "@vnkrvietnam/ui-kit";

type BillStatus = "active" | "paused" | "failed" | "pending" | "cancelled";
type RetrySchedule = { attempt: number; date: string }[];

interface BillSubscription {
  id:            string;
  name:          string;
  provider:      string;
  amount:        number;          // raw VND number
  avgAmount3m:   number;          // 3-month average for anomaly detection
  dueDay:        number;
  category:      string;
  categoryColor: string;
  status:        BillStatus;
  lastPaid:      string;
  nextDue:       string;
  active:        boolean;
  retryCount:    number;          // 0-3; auto-cancel at 3
  retrySchedule: RetrySchedule;
  pendingNote?:  string;
}

const STATUS_CFG: Record<BillStatus, { color: "success"|"warning"|"error"|"info"|"dark"; label: string }> = {
  active:    { color: "success", label: "Đang hoạt động" },
  paused:    { color: "warning", label: "Tạm dừng"       },
  failed:    { color: "error",   label: "Thất bại"        },
  pending:   { color: "info",    label: "Đang xử lý"      },
  cancelled: { color: "dark",    label: "Đã huỷ"          },
};

const INITIAL_BILLS: BillSubscription[] = [
  {
    id: "b1", name: "Điện lực TPHCM", provider: "EVN",
    amount: 320000, avgAmount3m: 310000,
    dueDay: 15, category: "Điện", categoryColor: "#FFAA00",
    status: "active", lastPaid: "15/06/2025", nextDue: "15/07/2025",
    active: true, retryCount: 0, retrySchedule: [],
  },
  {
    id: "b2", name: "Cáp + Internet", provider: "VNPT",
    amount: 180000, avgAmount3m: 180000,
    dueDay: 20, category: "Internet", categoryColor: "#0095FF",
    status: "active", lastPaid: "20/06/2025", nextDue: "20/07/2025",
    active: true, retryCount: 0, retrySchedule: [],
  },
  {
    id: "b3", name: "Nước sinh hoạt", provider: "Sawaco",
    amount: 95000, avgAmount3m: 90000,
    dueDay: 10, category: "Nước", categoryColor: "#49DBC8",
    status: "paused", lastPaid: "10/05/2025", nextDue: "10/07/2025",
    active: false, retryCount: 0, retrySchedule: [],
  },
  {
    id: "b4", name: "Netflix", provider: "Netflix Inc",
    amount: 260000, avgAmount3m: 260000,
    dueDay: 5, category: "Giải trí", categoryColor: "#FF3D71",
    status: "failed", lastPaid: "05/05/2025", nextDue: "05/07/2025",
    active: true, retryCount: 2,
    retrySchedule: [
      { attempt: 1, date: "05/07/2025" },
      { attempt: 2, date: "06/07/2025" },
    ],
  },
  {
    id: "b5", name: "Điện nước Văn phòng", provider: "EVN",
    amount: 980000, avgAmount3m: 320000, // 300%+ spike!
    dueDay: 8, category: "Điện", categoryColor: "#FFAA00",
    status: "pending", lastPaid: "08/06/2025", nextDue: "08/07/2025",
    active: true, retryCount: 0, retrySchedule: [],
    pendingNote: "Đang chờ xác nhận từ nhà cung cấp (tối đa 24h)",
  },
];

const CATEGORIES = ["Điện", "Nước", "Internet", "Điện thoại", "Bảo hiểm", "Giải trí", "Học phí", "Khác"];

/** Check if bill amount is >200% of 3-month average */
function isAnomalous(bill: BillSubscription): boolean {
  return bill.avgAmount3m > 0 && bill.amount > bill.avgAmount3m * 2;
}

export default function AutoDebitPage() {
  const [bills,       setBills]       = useState<BillSubscription[]>(INITIAL_BILLS);
  const [addModal,    setAddModal]    = useState(false);
  const [deleteModal, setDeleteModal] = useState<string | null>(null);
  const [detailId,    setDetailId]    = useState<string | null>(null);

  const [newName,   setNewName]   = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newDay,    setNewDay]    = useState("1");
  const [newCat,    setNewCat]    = useState(CATEGORIES[0]);

  const toggle = (id: string) => {
    setBills(prev => prev.map(b =>
      b.id === id ? { ...b, active: !b.active, status: b.active ? "paused" : "active" } : b
    ));
  };

  const retryBill = (id: string) => {
    setBills(prev => prev.map(b => {
      if (b.id !== id) return b;
      const nextRetry = b.retryCount + 1;
      if (nextRetry >= 3) {
        // Auto-cancel after 3 failed retries
        return { ...b, status: "cancelled", active: false, retryCount: nextRetry };
      }
      const retryDates = ["T+1 (ngày mai)", "T+3 (3 ngày nữa)"];
      return {
        ...b,
        retryCount: nextRetry,
        status: "pending",
        retrySchedule: [
          ...b.retrySchedule,
          { attempt: nextRetry + 1, date: retryDates[nextRetry - 1] ?? "—" },
        ],
      };
    }));
  };

  const addBill = () => {
    const amount = Number(newAmount);
    setBills(prev => [...prev, {
      id:            `b${Date.now()}`,
      name:          newName,
      provider:      "Tự nhập",
      amount,
      avgAmount3m:   amount,
      dueDay:        Number(newDay),
      category:      newCat,
      categoryColor: "#AF96FB",
      status:        "active",
      lastPaid:      "—",
      nextDue:       `${newDay.padStart(2, "0")}/07/2025`,
      active:        true,
      retryCount:    0,
      retrySchedule: [],
    }]);
    setNewName(""); setNewAmount(""); setNewDay("1"); setNewCat(CATEGORIES[0]);
    setAddModal(false);
  };

  const deleteBill = (id: string) => {
    setBills(prev => prev.filter(b => b.id !== id));
    setDeleteModal(null);
  };

  const detail = bills.find(b => b.id === detailId);

  const totalMonthly = bills
    .filter(b => b.active && (b.status === "active" || b.status === "pending"))
    .reduce((s, b) => s + b.amount, 0);

  return (
    <div style={{ paddingBottom: 32 }}>
      {/* Header */}
      <div style={{ padding: "16px 20px 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Receipt size={22} color="#1A1F36" />
          <div>
            <Text variant="h6" weight="semibold" color="#1A1F36">Thanh toán Tự động</Text>
            <Text variant="caption" color="#A0AEC0">Auto-Debit hàng tháng</Text>
          </div>
        </div>
        <Button variant="filled" color="dark" size="sm" iconLeft={<Plus size={16} />} onClick={() => setAddModal(true)}>
          Thêm
        </Button>
      </div>

      {/* Summary */}
      <div style={{ margin: "8px 16px 16px", background: "#000", borderRadius: 16, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <Text variant="caption" color="rgba(255,255,255,0.5)">Tổng hàng tháng (đang bật)</Text>
          <Text variant="h5" weight="semibold" color="#BEFF6C">
            {totalMonthly.toLocaleString("vi-VN")}đ
          </Text>
        </div>
        <div style={{ textAlign: "right" }}>
          <Text variant="caption" color="rgba(255,255,255,0.5)">
            {bills.filter(b => b.active).length}/{bills.length}
          </Text>
          <Text variant="caption" color="rgba(255,255,255,0.5)" style={{ display: "block" }}>dịch vụ bật</Text>
        </div>
      </div>

      {/* Bill list */}
      <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 10 }}>
        {bills.map(bill => {
          const cfg      = STATUS_CFG[bill.status];
          const anomaly  = isAnomalous(bill);
          const pctSpike = bill.avgAmount3m > 0
            ? Math.round((bill.amount / bill.avgAmount3m - 1) * 100)
            : 0;

          return (
            <div
              key={bill.id}
              style={{
                background: "#fff", borderRadius: 16, padding: "14px 16px",
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                opacity: bill.active ? 1 : 0.65,
                border: anomaly ? "1.5px solid #FFAA00" : "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: bill.categoryColor + "22", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ width: 12, height: 12, borderRadius: "50%", background: bill.categoryColor }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <Text variant="subtitle2" weight="semibold" color="#1A1F36">{bill.name}</Text>
                    {bill.status !== "cancelled" && (
                      <Toggle checked={bill.active} onChange={() => toggle(bill.id)} color="dark" size="sm" />
                    )}
                  </div>
                  <Text variant="caption" color="#A0AEC0">{bill.provider} · Ngày {bill.dueDay} hàng tháng</Text>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Text variant="body2" weight="semibold" color="#1A1F36">
                        {bill.amount.toLocaleString("vi-VN")}đ
                      </Text>
                      <Badge variant="label" color={cfg.color} label={cfg.label} />
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => setDetailId(bill.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 4px" }}>
                        <ArrowRight size={16} color="#CBD5E0" />
                      </button>
                      <button onClick={() => setDeleteModal(bill.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 4px" }}>
                        <Trash size={14} color="#FF3D71" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Anomaly warning: bill > 200% of 3-month average */}
              {anomaly && (
                <div style={{ display: "flex", alignItems: "flex-start", gap: 6, marginTop: 8, padding: "8px 10px", background: "#FFFBEB", borderRadius: 8 }}>
                  <AlertCircle size={14} color="#FFAA00" style={{ flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <Text variant="caption" color="#92400E" weight="semibold">Cảnh báo biến động bất thường</Text>
                    <Text variant="caption" color="#92400E" style={{ display: "block" }}>
                      Số tiền cao hơn +{pctSpike}% so với trung bình 3 tháng ({bill.avgAmount3m.toLocaleString("vi-VN")}đ). Vui lòng kiểm tra hóa đơn.
                    </Text>
                  </div>
                </div>
              )}

              {/* Failed with retry schedule */}
              {bill.status === "failed" && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, padding: "8px 10px", background: "#FFF1F2", borderRadius: 8 }}>
                  <AlertCircle size={14} color="#FF3D71" />
                  <div style={{ flex: 1 }}>
                    <Text variant="caption" color="#FF3D71">
                      Thanh toán thất bại — Lần thử {bill.retryCount}/3
                    </Text>
                    {bill.retrySchedule.length > 0 && (
                      <Text variant="caption" color="#FF3D71" style={{ display: "block" }}>
                        Lịch thử lại: {bill.retrySchedule.map(r => r.date).join(", ")}
                      </Text>
                    )}
                  </div>
                  {bill.retryCount < 3 && (
                    <Button variant="filled" color="error" size="sm" onClick={() => retryBill(bill.id)}>
                      Thử lại
                    </Button>
                  )}
                </div>
              )}

              {/* Cancelled after 3 retries */}
              {bill.status === "cancelled" && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, padding: "8px 10px", background: "#F5F6FA", borderRadius: 8 }}>
                  <AlertCircle size={14} color="#718096" />
                  <Text variant="caption" color="#718096">
                    Đã tự huỷ sau 3 lần thất bại. Vui lòng kiểm tra số dư và bật lại.
                  </Text>
                </div>
              )}

              {/* Pending state: waiting on provider (up to 24h) */}
              {bill.status === "pending" && bill.pendingNote && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, padding: "8px 10px", background: "#EFF6FF", borderRadius: 8 }}>
                  <AlertCircle size={14} color="#0095FF" />
                  <Text variant="caption" color="#1E40AF">{bill.pendingNote}</Text>
                </div>
              )}

              <div style={{ marginTop: 8, display: "flex", gap: 12 }}>
                <Text variant="caption" color="#A0AEC0">Lần cuối: {bill.lastPaid}</Text>
                <Text variant="caption" color="#A0AEC0">
                  Tiếp theo: <strong style={{ color: "#1A1F36" }}>{bill.nextDue}</strong>
                </Text>
              </div>
            </div>
          );
        })}
      </div>

      {/* Security note */}
      <div style={{ margin: "16px 20px 0", background: "#ECFDF5", borderRadius: 12, padding: "12px 14px", display: "flex", gap: 10 }}>
        <ShieldCheck size={18} color="#00D68F" style={{ flexShrink: 0 }} />
        <Text variant="caption" color="#065F46">
          Thanh toán tự động được bảo vệ bằng mã PIN hoặc sinh trắc học. Retry: T → T+1 → T+3. Tự huỷ sau 3 lần thất bại.
        </Text>
      </div>

      {/* ── Add Bill Modal ───────────────────────────────────────── */}
      <Modal
        open={addModal}
        onClose={() => setAddModal(false)}
        variant="sheet"
        title="Thêm hóa đơn tự động"
        subtitle="Nhập thông tin dịch vụ cần thanh toán định kỳ"
        footer={
          <Button variant="filled" color="dark" size="lg" fullWidth
            disabled={!newName || !newAmount}
            onClick={addBill}
          >
            Lưu hóa đơn
          </Button>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Input
            label="Tên dịch vụ"
            placeholder="VD: Điện lực, Internet"
            value={newName}
            onChange={e => setNewName(e.target.value)}
          />
          <Input
            label="Số tiền hàng tháng (đ)"
            placeholder="VD: 200000"
            type="number"
            value={newAmount}
            onChange={e => setNewAmount(e.target.value)}
          />
          <Input
            label="Ngày thanh toán (1–28)"
            placeholder="VD: 15"
            type="number"
            value={newDay}
            onChange={e => setNewDay(e.target.value)}
          />
          <div>
            <Text variant="caption" weight="semibold" color="#57606a" style={{ display: "block", marginBottom: 8 }}>Danh mục</Text>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {CATEGORIES.map(c => (
                <button
                  key={c}
                  onClick={() => setNewCat(c)}
                  style={{
                    padding: "5px 12px", borderRadius: 8,
                    border: `1.5px solid ${newCat === c ? "#000" : "#E5E7EB"}`,
                    background: newCat === c ? "#000" : "#fff",
                    color: newCat === c ? "#BEFF6C" : "#4A5568",
                    fontSize: 12, fontWeight: 600, fontFamily: "'Work Sans', sans-serif", cursor: "pointer",
                  }}
                >{c}</button>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* ── Delete Confirm ───────────────────────────────────────── */}
      <Modal
        open={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        variant="center"
        title="Xoá hóa đơn?"
        subtitle="Dịch vụ này sẽ không còn được thanh toán tự động nữa."
        footer={
          <div style={{ display: "flex", gap: 10 }}>
            <Button variant="outlined" color="dark" size="lg" fullWidth onClick={() => setDeleteModal(null)}>Huỷ</Button>
            <Button variant="filled" color="error" size="lg" fullWidth
              onClick={() => deleteModal && deleteBill(deleteModal)}>
              Xoá
            </Button>
          </div>
        }
      />

      {/* ── Detail Modal ─────────────────────────────────────────── */}
      {detail && (
        <Modal
          open={!!detailId}
          onClose={() => setDetailId(null)}
          variant="sheet"
          title={detail.name}
          subtitle={detail.provider}
          footer={<Button variant="ghost" color="dark" size="lg" fullWidth onClick={() => setDetailId(null)}>Đóng</Button>}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { label: "Danh mục",        value: detail.category },
              { label: "Số tiền",         value: `${detail.amount.toLocaleString("vi-VN")}đ` },
              { label: "TB 3 tháng",      value: `${detail.avgAmount3m.toLocaleString("vi-VN")}đ` },
              { label: "Ngày thanh toán", value: `Ngày ${detail.dueDay} hàng tháng` },
              { label: "Lần cuối",        value: detail.lastPaid },
              { label: "Kỳ tiếp theo",    value: detail.nextDue },
              { label: "Trạng thái",      value: STATUS_CFG[detail.status].label },
              { label: "Số lần thử lại",  value: `${detail.retryCount}/3` },
            ].map(r => (
              <div key={r.label} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #F3F4F6", paddingBottom: 10 }}>
                <Text variant="body2" color="#718096">{r.label}</Text>
                <Text variant="body2" weight="semibold" color="#1A1F36">{r.value}</Text>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}
