"use client";
/**
 * /circuit-breaker — Emergency Pause Control
 * Toggle + double-confirm Modal + event log
 */
import React, { useState, useEffect } from "react";
import {
  Toggle,
  Modal,
  Input,
  Button,
  ListItem,
  Text,
  Badge,
  toast,
  AlertTriangle,
  ShieldCheck,
  Clock,
} from "@vnkrvietnam/ui-kit";

// ─── Past events ─────────────────────────────────────────────────────────────
const PAST_EVENTS = [
  { id: "e1", actor: "Regulator A",  reason: "Volume spike >400% — suspicious pattern",  ts: "2025-06-10 14:32", duration: "22 phút" },
  { id: "e2", actor: "Regulator B",  reason: "Blacklist address interaction detected",    ts: "2025-05-28 09:15", duration: "8 phút"  },
  { id: "e3", actor: "System Auto",  reason: "Failed tx rate exceeded 5% threshold",      ts: "2025-05-12 03:44", duration: "4 phút"  },
];

// ─── Elapsed timer ────────────────────────────────────────────────────────────
function ElapsedTimer({ since }: { since: Date }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - since.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [since]);

  const m = Math.floor(elapsed / 60);
  const s = elapsed % 60;
  return (
    <span style={{ fontVariantNumeric: "tabular-nums" }}>
      {String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
    </span>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function CircuitBreakerPage() {
  const [paused,      setPaused]      = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [reason,      setReason]      = useState("");
  const [loading,     setLoading]     = useState(false);
  const [pausedSince, setPausedSince] = useState<Date | null>(null);

  const handleToggleAttempt = () => {
    if (!paused) {
      // Open confirm before pausing
      setConfirmOpen(true);
    } else {
      // Unpause immediately (also could require confirmation)
      setPaused(false);
      setPausedSince(null);
      toast.success("Hệ thống đã được khôi phục hoạt động bình thường.");
    }
  };

  const handleActivatePause = async () => {
    if (!reason.trim()) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    setLoading(false);
    setPaused(true);
    setPausedSince(new Date());
    setConfirmOpen(false);
    setReason("");
    toast.error("⚠ Circuit Breaker đã được kích hoạt — toàn bộ giao dịch bị tạm dừng.");
  };

  const CONTRACT_ADDR = "0x1Aa2bCd...F3e4";

  return (
    <div style={{ padding: "0 24px 32px", maxWidth: 720 }}>

      {/* ── Status banner ───────────────────────────────────────────────── */}
      <div style={{
        background:   paused ? "#2D0A0F" : "#0D2318",
        border:       `1px solid ${paused ? "#FF3D71" : "#00D68F"}`,
        borderRadius: 14,
        padding:      "16px 20px",
        marginBottom: 24,
        display:      "flex",
        alignItems:   "center",
        gap:          14,
      }}>
        <div style={{ color: paused ? "#FF3D71" : "#00D68F", flexShrink: 0 }}>
          {paused ? <AlertTriangle size={28} /> : <ShieldCheck size={28} />}
        </div>
        <div style={{ flex: 1 }}>
          <Text variant="subtitle1" weight="semibold" color={paused ? "#FF3D71" : "#00D68F"}>
            {paused ? "⚠ HỆ THỐNG TẠM DỪNG" : "✓ HỆ THỐNG HOẠT ĐỘNG BÌNH THƯỜNG"}
          </Text>
          {paused && pausedSince && (
            <Text variant="caption" color="#FF3D71" style={{ display: "block", marginTop: 4 }}>
              Đã tạm dừng được <ElapsedTimer since={pausedSince} /> — mọi giao dịch bị chặn
            </Text>
          )}
        </div>
        <Badge
          variant="label"
          color={paused ? "error" : "success"}
          label={paused ? "PAUSED" : "ONLINE"}
        />
      </div>

      {/* ── Main toggle card ─────────────────────────────────────────────── */}
      <div style={{
        background:   "#161B22",
        border:       `2px solid ${paused ? "#FF3D71" : "#30363D"}`,
        borderRadius: 16,
        padding:      "24px",
        marginBottom: 24,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <div>
            <Text variant="subtitle1" weight="semibold" color="#E6EDF3">
              Emergency Pause — Circuit Breaker
            </Text>
            <Text variant="body2" color="#8B949E" style={{ marginTop: 4, maxWidth: 380 }}>
              Kích hoạt tính năng này sẽ tạm dừng <strong style={{ color: "#FF3D71" }}>toàn bộ</strong> giao dịch
              trên Sandbox. Chỉ sử dụng trong tình huống khẩn cấp theo Nghị định Sandbox.
            </Text>
          </div>
          <Toggle
            checked={paused}
            onChange={handleToggleAttempt}
            color="error"
            size="lg"
          />
        </div>

        {/* Smart contract reference */}
        <div style={{
          marginTop:    16,
          padding:      "10px 14px",
          background:   "#0D0F14",
          borderRadius: 8,
          display:      "flex",
          alignItems:   "center",
          gap:          10,
          flexWrap:     "wrap",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Clock size={14} color="#8B949E" />
            <Text variant="caption" color="#8B949E">Smart Contract:</Text>
          </div>
          <code style={{ fontSize: 12, color: "#BEFF6C", fontFamily: "monospace", letterSpacing: "0.03em" }}>
            VNKRWeb3SandboxModule · {CONTRACT_ADDR}
          </code>
          <Button variant="ghost" color="info" size="sm"
            onClick={() => window.open(`https://scan.vnkr.vn/address/${CONTRACT_ADDR}`, "_blank")}>
            View on Explorer →
          </Button>
        </div>
      </div>

      {/* ── Event log ─────────────────────────────────────────────────────── */}
      <Text variant="subtitle2" weight="semibold" color="#E6EDF3" style={{ marginBottom: 12 }}>
        Lịch sử kích hoạt
      </Text>
      <div style={{ background: "#161B22", border: "1px solid #30363D", borderRadius: 14, padding: "4px 16px" }}>
        {PAST_EVENTS.map((ev, i) => (
          <ListItem
            key={ev.id}
            title={ev.reason}
            subtitle={`${ev.actor} · ${ev.ts} · Kéo dài ${ev.duration}`}
            avatar={{ icon: <AlertTriangle size={16} color="#FF3D71" />, iconBg: "#2D0A0F", size: 38 }}
            divider={i < PAST_EVENTS.length - 1}
            rightSlot={
              <Badge variant="label" color="error" label="FIRED" />
            }
          />
        ))}
      </div>

      {/* ── Double-confirm modal ──────────────────────────────────────────── */}
      <Modal
        open={confirmOpen}
        onClose={() => { setConfirmOpen(false); setReason(""); }}
        variant="center"
        title="⚠ Xác nhận Dừng Khẩn cấp"
        subtitle="Hành động này sẽ dừng TOÀN BỘ giao dịch Sandbox. Nhập lý do bắt buộc."
        footer={
          <div style={{ display: "flex", gap: 10 }}>
            <Button
              variant="outlined"
              color="dark"
              size="lg"
              fullWidth
              onClick={() => { setConfirmOpen(false); setReason(""); }}
            >
              Huỷ
            </Button>
            <Button
              variant="filled"
              color="error"
              size="lg"
              fullWidth
              disabled={!reason.trim()}
              loading={loading}
              onClick={handleActivatePause}
            >
              Kích hoạt Dừng
            </Button>
          </div>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{
            padding:      "12px 14px",
            background:   "#FFF1F2",
            border:       "1px solid #FF3D71",
            borderRadius: 8,
          }}>
            <Text variant="caption" color="#9F1239">
              ⚠ Cảnh báo: Sau khi kích hoạt, tất cả API giao dịch sẽ trả về lỗi 503 cho đến khi được bỏ khoá.
              Hành động này được ghi lại vào SupTech Log.
            </Text>
          </div>
          <Input
            label="Lý do kích hoạt (bắt buộc)"
            placeholder="VD: Phát hiện volume đột biến vượt 300% ngưỡng..."
            value={reason}
            onChange={e => setReason(e.target.value)}
            error={confirmOpen && !reason.trim() ? "Vui lòng nhập lý do" : undefined}
          />
        </div>
      </Modal>
    </div>
  );
}
