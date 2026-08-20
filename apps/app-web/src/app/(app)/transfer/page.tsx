"use client";
/**
 * /transfer — Send / Transfer
 * Features:
 *  - Debounce 300ms auto-lookup account/name
 *  - Routing: ≤20M → /enter-pin; >20M or new device → /otp first
 *  - Idempotency-Key (10s dedup window)
 */
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Input,
  ListItem,
  Button,
  Modal,
  Text,
  QRCodeModal,
  Badge,
  Search,
  QrCode,
  ArrowUp,
  CheckCircle,
  AlertCircle,
} from "@vnkrvietnam/ui-kit";
import { useRouter } from "next/navigation";

const TRANSFER_THRESHOLD = 20_000_000; // 20 million VND
const DEDUP_WINDOW_MS    = 10_000;     // 10 seconds
const BALANCE_VND        = 2_500_000;

// Simulated contacts & account lookup
const CONTACTS = [
  { id: "c1", name: "Nguyễn Văn A",  phone: "0901 234 567", bank: "Vietcombank", account: "1234567890", bg: "#AF96FB", initials: "NA" },
  { id: "c2", name: "Trần Thị B",    phone: "0912 345 678", bank: "MB Bank",     account: "9876543210", bg: "#FD9FDD", initials: "TB" },
  { id: "c3", name: "Lê Minh C",     phone: "0923 456 789", bank: "Techcombank", account: "1111222233", bg: "#49DBC8", initials: "MC" },
  { id: "c4", name: "Phạm Quốc D",   phone: "0934 567 890", bank: "ACB",         account: "4444555566", bg: "#FC7339", initials: "QD" },
  { id: "c5", name: "Hoàng Thị E",   phone: "0945 678 901", bank: "Vietinbank",  account: "7777888899", bg: "#BEFF6C", initials: "TE" },
];

type Step = "select" | "amount" | "confirm" | "done";

/** Generate idempotency key for dedup */
function newIdempotencyKey() {
  return `TXN-${Date.now()}-${Math.random().toString(36).slice(2, 9).toUpperCase()}`;
}

export default function TransferPage() {
  const router = useRouter();
  const [step,          setStep]         = useState<Step>("select");
  const [query,         setQuery]        = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selected,      setSelected]     = useState<typeof CONTACTS[0] | null>(null);
  const [amount,        setAmount]       = useState("");
  const [note,          setNote]         = useState("");
  const [qrOpen,        setQrOpen]       = useState(false);
  const [confirmOpen,   setConfirmOpen]  = useState(false);
  const [loading,       setLoading]      = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState(newIdempotencyKey());
  const lastTxnRef = useRef<{ key: string; ts: number } | null>(null);

  // ── Debounce 300ms for account lookup ─────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (!debouncedQuery) return;
    setLookupLoading(true);
    const t = setTimeout(() => setLookupLoading(false), 400); // simulate API
    return () => clearTimeout(t);
  }, [debouncedQuery]);

  const filtered = CONTACTS.filter(c =>
    c.name.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
    c.phone.includes(debouncedQuery) ||
    c.account.includes(debouncedQuery)
  );

  const handleSelectContact = (c: typeof CONTACTS[0]) => {
    setSelected(c);
    setStep("amount");
    // Refresh idempotency key for new transaction
    setIdempotencyKey(newIdempotencyKey());
  };

  const amountNum = Number(amount) || 0;

  // Determine flow: >20M requires OTP first
  const requiresOTP = amountNum > TRANSFER_THRESHOLD;

  const handleContinue = () => {
    if (!amount || amountNum <= 0) return;
    if (amountNum > BALANCE_VND) {
      setConfirmOpen(false);
      return;
    }
    setConfirmOpen(true);
  };

  const handleSend = async () => {
    // Check for duplicate transaction within 10 seconds
    const now = Date.now();
    if (lastTxnRef.current && now - lastTxnRef.current.ts < DEDUP_WINDOW_MS) {
      alert("Giao dịch trùng lặp! Vui lòng chờ vài giây trước khi thử lại.");
      return;
    }
    lastTxnRef.current = { key: idempotencyKey, ts: now };

    if (requiresOTP) {
      // Store pending transaction in sessionStorage, route to OTP first
      sessionStorage.setItem("pending_transfer", JSON.stringify({
        to: selected, amount, note, idempotencyKey,
        returnUrl: "/transfer?step=pin",
      }));
      setConfirmOpen(false);
      router.push("/otp?returnUrl=/enter-pin?returnUrl=/receipt");
      return;
    }

    // ≤20M: go directly to PIN
    setConfirmOpen(false);
    sessionStorage.setItem("pending_transfer", JSON.stringify({
      to: selected, amount, note, idempotencyKey,
    }));
    router.push("/enter-pin?returnUrl=/receipt");
  };

  if (step === "done") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "70vh", padding: "0 24px", textAlign: "center", gap: 16 }}>
        <div style={{ color: "#00D68F" }}>
          <CheckCircle size={64} />
        </div>
        <Text variant="h5" weight="semibold" color="#1A1F36">Gửi thành công!</Text>
        <Text variant="body2" color="#718096">
          Đã gửi <strong style={{ color: "#1A1F36" }}>{amountNum.toLocaleString("vi-VN")}đ</strong> đến <strong style={{ color: "#1A1F36" }}>{selected?.name}</strong>
        </Text>
        <Button variant="filled" color="dark" size="lg" fullWidth style={{ marginTop: 8 }}
          onClick={() => { setStep("select"); setAmount(""); setNote(""); setSelected(null); setIdempotencyKey(newIdempotencyKey()); }}>
          Giao dịch khác
        </Button>
        <Button variant="ghost" color="dark" size="md" onClick={() => router.push("/home")}>Về trang chủ</Button>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 24 }}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{ padding: "16px 20px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Text variant="h6" weight="semibold" color="#1A1F36">Gửi tiền</Text>
        <Button variant="outlined" color="dark" size="sm" iconLeft={<QrCode size={14} />} onClick={() => setQrOpen(true)}>
          Quét QR
        </Button>
      </div>

      {step === "select" && (
        <>
          <div style={{ padding: "0 20px 12px" }}>
            <Input
              placeholder="Tìm tên, SĐT hoặc số tài khoản"
              iconLeft={<Search size={16} />}
              value={query}
              onChange={e => setQuery(e.target.value)}
              caption={lookupLoading ? "Đang tra cứu..." : undefined}
            />
          </div>
          <div style={{ margin: "0 16px", background: "#fff", borderRadius: 16, padding: "4px 16px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <div style={{ padding: "10px 0 4px" }}>
              <Text variant="caption" weight="semibold" color="#A0AEC0" style={{ letterSpacing: "0.06em", textTransform: "uppercase" }}>
                {debouncedQuery ? "Kết quả tìm kiếm" : "Gần đây"}
              </Text>
            </div>
            {filtered.map((c, i) => (
              <ListItem
                key={c.id}
                title={c.name}
                subtitle={`${c.bank} · ${c.account}`}
                avatar={{ initials: c.initials, bg: c.bg }}
                showArrow
                divider={i < filtered.length - 1}
                onClick={() => handleSelectContact(c)}
              />
            ))}
            {filtered.length === 0 && !lookupLoading && (
              <div style={{ padding: "20px 0", textAlign: "center" }}>
                <Text variant="body2" color="#A0AEC0">Không tìm thấy liên hệ</Text>
              </div>
            )}
            {lookupLoading && (
              <div style={{ padding: "16px 0", textAlign: "center" }}>
                <Text variant="body2" color="#A0AEC0">Đang tra cứu...</Text>
              </div>
            )}
          </div>
        </>
      )}

      {step === "amount" && selected && (
        <div style={{ padding: "0 20px" }}>
          {/* Selected contact */}
          <div style={{ background: "#fff", borderRadius: 16, padding: "14px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: selected.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, fontFamily: "'Work Sans', sans-serif", color: "#fff" }}>
              {selected.initials}
            </div>
            <div style={{ flex: 1 }}>
              <Text variant="subtitle2" weight="semibold" color="#1A1F36">{selected.name}</Text>
              <Text variant="caption" color="#A0AEC0">{selected.bank} · {selected.account}</Text>
            </div>
            <Button variant="ghost" color="dark" size="sm" onClick={() => setStep("select")}>Đổi</Button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Input
              label="Số tiền (VND)"
              placeholder="0"
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              caption={`Số dư: ${BALANCE_VND.toLocaleString("vi-VN")}đ`}
              error={amountNum > BALANCE_VND ? "Số dư không đủ" : undefined}
            />

            {/* Threshold warning */}
            {amountNum > TRANSFER_THRESHOLD && (
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8, background: "#FFFBEB", borderRadius: 10, padding: "10px 12px" }}>
                <AlertCircle size={16} color="#FFAA00" style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <Text variant="caption" color="#92400E" weight="semibold">Yêu cầu xác thực OTP</Text>
                  <Text variant="caption" color="#92400E" style={{ display: "block" }}>
                    Giao dịch &gt;20 triệu cần xác thực OTP trước khi nhập PIN.
                  </Text>
                </div>
              </div>
            )}

            {/* Quick amounts */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {["50.000", "100.000", "200.000", "500.000"].map(v => (
                <Button key={v} variant="outlined" color="dark" size="sm" onClick={() => setAmount(v.replace(/\./g, ""))}>
                  {v}đ
                </Button>
              ))}
            </div>

            <Input
              label="Lời nhắn (tuỳ chọn)"
              placeholder="VD: Trả tiền ăn trưa"
              value={note}
              onChange={e => setNote(e.target.value)}
            />

            <Button
              variant="filled"
              color="dark"
              size="lg"
              fullWidth
              iconLeft={<ArrowUp size={18} />}
              disabled={!amount || amountNum <= 0 || amountNum > BALANCE_VND}
              onClick={handleContinue}
            >
              Tiếp tục {requiresOTP ? "(OTP + PIN)" : "(PIN)"}
            </Button>
          </div>
        </div>
      )}

      {/* ── Confirm modal ────────────────────────────────────────────────── */}
      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        variant="sheet"
        title="Xác nhận giao dịch"
        footer={
          <Button variant="filled" color="dark" size="lg" fullWidth loading={loading} onClick={handleSend}>
            {requiresOTP ? "Gửi OTP & tiếp tục" : "Xác nhận — Nhập PIN"}
          </Button>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {requiresOTP && (
            <div style={{ background: "#FFFBEB", borderRadius: 8, padding: "8px 12px", display: "flex", gap: 8 }}>
              <AlertCircle size={16} color="#FFAA00" />
              <Text variant="caption" color="#92400E">Giao dịch &gt;20 triệu: OTP → PIN</Text>
            </div>
          )}
          {[
            { label: "Người nhận",   value: selected?.name },
            { label: "Ngân hàng",    value: selected?.bank },
            { label: "Số tài khoản", value: selected?.account },
            { label: "Số tiền",      value: `${amountNum.toLocaleString("vi-VN")}đ` },
            { label: "Phí giao dịch",value: "0đ" },
            { label: "Lời nhắn",     value: note || "—" },
          ].map(row => (
            <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Text variant="body2" color="#718096">{row.label}</Text>
              <Text variant="body2" weight="semibold" color="#1A1F36">{row.value}</Text>
            </div>
          ))}
          <div style={{ height: 1, background: "#F3F4F6", margin: "4px 0" }} />
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Text variant="subtitle2" weight="semibold" color="#1A1F36">Tổng cộng</Text>
            <Text variant="subtitle2" weight="semibold" color="#1A1F36">{amountNum.toLocaleString("vi-VN")}đ</Text>
          </div>
          <Text variant="caption" color="#A0AEC0" style={{ fontFamily: "monospace", wordBreak: "break-all" }}>
            Key: {idempotencyKey}
          </Text>
        </div>
      </Modal>

      {/* QR Scanner */}
      <QRCodeModal
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        value=""
        label="Quét mã VietQR để nạp thông tin người nhận"
        scannable
      />
    </div>
  );
}
