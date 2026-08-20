"use client";
/**
 * /card — Card Management
 * Features:
 *  - Flip to see CVV requires PIN → auto-hides after 60s
 *  - Emergency lock/unlock Toggle with API error rollback
 *  - Max 5 cards limit
 */
import React, { useState, useEffect, useRef } from "react";
import {
  WalletCard,
  Toggle,
  Button,
  Modal,
  ListItem,
  Text,
  Badge,
  PinPad,
  toast,
  Lock,
  Globe,
  ArrowRefresh,
  ShieldCheck,
  Settings2,
  Plus,
  Eye,
  EyeOff,
} from "@vnkrvietnam/ui-kit";
import type { CardBg } from "@vnkrvietnam/ui-kit";

const MAX_CARDS = 5;

const BG_OPTIONS: { label: string; value: CardBg; color: string }[] = [
  { label: "Xanh lá", value: "greeny", color: "#BEFF6C" },
  { label: "Tím",     value: "violet", color: "#AF96FB" },
  { label: "Hồng",    value: "pink",   color: "#FD9FDD" },
  { label: "Đen",     value: "dark",   color: "#1a1a1a" },
  { label: "Cam",     value: "orange", color: "#FC7339" },
  { label: "Vàng",    value: "yellow", color: "#FFF172" },
];

interface CardItem {
  id: string;
  name: string;
  last4: string;
  expiry: string;
  cvv: string;
  bg: CardBg;
}

const INITIAL_CARDS: CardItem[] = [
  { id: "c1", name: "Cashie", last4: "7890", expiry: "07/27", cvv: "234", bg: "violet" },
];

export default function CardPage() {
  const [cards,         setCards]         = useState<CardItem[]>(INITIAL_CARDS);
  const [activeIdx,     setActiveIdx]     = useState(0);
  const [flipped,       setFlipped]       = useState(false);
  const [cvvVisible,    setCvvVisible]    = useState(false);
  const [cvvCountdown,  setCvvCountdown]  = useState(0);
  const [freezeModal,   setFreezeModal]   = useState(false);
  const [frozen,        setFrozen]        = useState(false);
  const [freezeLoading, setFreezeLoading] = useState(false);
  const [pinModal,      setPinModal]      = useState(false);
  const [pinError,      setPinError]      = useState("");
  const [onlineEnabled, setOnline]        = useState(true);
  const [intlEnabled,   setIntl]          = useState(false);
  const cvvTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const card = cards[activeIdx];

  // Auto-hide CVV after 60 seconds
  useEffect(() => {
    if (cvvCountdown <= 0) {
      setCvvVisible(false);
      return;
    }
    cvvTimerRef.current = setInterval(() => {
      setCvvCountdown(c => {
        if (c <= 1) {
          setCvvVisible(false);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => {
      if (cvvTimerRef.current) clearInterval(cvvTimerRef.current);
    };
  }, [cvvCountdown]);

  const handleFlip = (f: boolean) => {
    if (f && !cvvVisible) {
      // Must verify PIN before showing CVV
      setPinModal(true);
    } else {
      setFlipped(f);
    }
  };

  const handlePinComplete = (pin: string) => {
    // Simulate PIN check (correct PIN = "123456")
    if (pin === "123456") {
      setPinModal(false);
      setPinError("");
      setCvvVisible(true);
      setFlipped(true);
      setCvvCountdown(60);
      toast.info("CVV sẽ tự động ẩn sau 60 giây");
    } else {
      setPinError("Sai PIN. Vui lòng thử lại.");
    }
  };

  const handleFreezeToggle = async () => {
    const prev = frozen;
    setFreezeLoading(true);
    setFreezeModal(false);
    try {
      // Optimistic update
      setFrozen(f => !f);
      await new Promise((res, rej) => setTimeout(() => {
        // Simulate 10% API failure
        if (Math.random() < 0.1) rej(new Error("API error"));
        else res(true);
      }, 1200));
      toast.success(frozen ? "Thẻ đã được mở khoá" : "Thẻ đã bị khoá khẩn cấp");
    } catch {
      // Rollback on error
      setFrozen(prev);
      toast.error("Không thể thay đổi trạng thái thẻ. Vui lòng thử lại.");
    } finally {
      setFreezeLoading(false);
    }
  };

  const handleAddCard = () => {
    if (cards.length >= MAX_CARDS) {
      toast.warning(`Tối đa ${MAX_CARDS} thẻ. Hãy xóa bớt thẻ để thêm mới.`);
      return;
    }
    const newCard: CardItem = {
      id: `c${Date.now()}`,
      name: "Cashie",
      last4: String(Math.floor(1000 + Math.random() * 9000)),
      expiry: "12/28",
      cvv: String(Math.floor(100 + Math.random() * 900)),
      bg: BG_OPTIONS[cards.length % BG_OPTIONS.length].value,
    };
    setCards(prev => [...prev, newCard]);
    setActiveIdx(cards.length);
    toast.success("Đã thêm thẻ mới");
  };

  return (
    <div style={{ paddingBottom: 24 }}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{ padding: "16px 20px 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Text variant="h6" weight="semibold" color="#1A1F36">Thẻ của tôi ({cards.length}/{MAX_CARDS})</Text>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Badge variant="label" color={frozen ? "error" : "success"} label={frozen ? "Đã khoá" : "Hoạt động"} />
          <Button variant="outlined" color="dark" size="sm" iconLeft={<Plus size={14} />} onClick={handleAddCard}>
            Thêm thẻ
          </Button>
        </div>
      </div>

      {/* ── Card switcher ────────────────────────────────────────────────── */}
      {cards.length > 1 && (
        <div style={{ display: "flex", gap: 8, padding: "4px 20px 8px", overflowX: "auto" }}>
          {cards.map((c, i) => (
            <button
              key={c.id}
              onClick={() => { setActiveIdx(i); setFlipped(false); setCvvVisible(false); }}
              style={{
                padding: "4px 12px", borderRadius: 8, border: `1.5px solid ${activeIdx === i ? "#000" : "#E5E7EB"}`,
                background: activeIdx === i ? "#000" : "#fff",
                color: activeIdx === i ? "#BEFF6C" : "#4A5568",
                fontSize: 12, fontWeight: 700, fontFamily: "'Work Sans', sans-serif", cursor: "pointer",
              }}
            >
              ••{c.last4}
            </button>
          ))}
        </div>
      )}

      {/* ── Card display ─────────────────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "center", padding: "8px 20px 8px" }}>
        <WalletCard
          name={card.name}
          holder="NGUYỄN VĂN A"
          last4={card.last4}
          cardNumber={`0823 4567 8900 ${card.last4}`}
          expiry={card.expiry}
          cvv={cvvVisible ? card.cvv : "•••"}
          bg={card.bg}
          flipped={flipped}
          onFlip={handleFlip}
          width={Math.min(320, typeof window !== "undefined" ? window.innerWidth - 40 : 320)}
        />
      </div>

      {/* ── CVV countdown ────────────────────────────────────────────────── */}
      {cvvVisible && cvvCountdown > 0 && (
        <div style={{ textAlign: "center", marginBottom: 4 }}>
          <Text variant="caption" color="#FF3D71">
            CVV sẽ ẩn sau {cvvCountdown}s
          </Text>
        </div>
      )}

      {/* ── Flip hint ────────────────────────────────────────────────────── */}
      {!flipped && (
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <button
            onClick={() => handleFlip(true)}
            style={{ background: "none", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <Eye size={14} color="#A0AEC0" />
            <Text variant="caption" color="#A0AEC0">Xem CVV (cần xác thực PIN)</Text>
          </button>
        </div>
      )}
      {flipped && (
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <button
            onClick={() => { setFlipped(false); setCvvVisible(false); if (cvvTimerRef.current) { clearInterval(cvvTimerRef.current); setCvvCountdown(0); } }}
            style={{ background: "none", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <EyeOff size={14} color="#A0AEC0" />
            <Text variant="caption" color="#A0AEC0">Ẩn mặt sau thẻ</Text>
          </button>
        </div>
      )}

      {/* ── Theme selector ───────────────────────────────────────────────── */}
      <div style={{ padding: "0 20px 16px" }}>
        <Text variant="caption" color="#A0AEC0" weight="semibold"
          style={{ marginBottom: 10, display: "block", letterSpacing: "0.06em", textTransform: "uppercase" }}>
          Màu thẻ
        </Text>
        <div style={{ display: "flex", gap: 10 }}>
          {BG_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setCards(prev => prev.map((c, i) => i === activeIdx ? { ...c, bg: opt.value } : c))}
              title={opt.label}
              style={{
                width: 36, height: 36, borderRadius: "50%", background: opt.color,
                border: card.bg === opt.value ? "3px solid #000" : "2px solid rgba(0,0,0,0.1)",
                cursor: "pointer", flexShrink: 0, transition: "border 0.15s",
              }}
            />
          ))}
        </div>
      </div>

      {/* ── Card settings ────────────────────────────────────────────────── */}
      <div style={{ margin: "0 16px", background: "#fff", borderRadius: 16, padding: "4px 16px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <ListItem
          title="Thanh toán Online"
          subtitle="Cho phép giao dịch trực tuyến"
          avatar={{ icon: <Globe size={18} color="#0095FF" />, iconBg: "#EFF6FF", size: 40 }}
          divider
          rightSlot={<Toggle checked={onlineEnabled} onChange={setOnline} color="success" size="sm" />}
        />
        <ListItem
          title="Thanh toán Quốc tế"
          subtitle="Giao dịch ngoài Việt Nam"
          avatar={{ icon: <Globe size={18} color="#FFAA00" />, iconBg: "#FFFBEB", size: 40 }}
          divider
          rightSlot={<Toggle checked={intlEnabled} onChange={setIntl} color="info" size="sm" />}
        />
        <ListItem
          title="Bảo mật 2 lớp"
          subtitle="Xác thực mỗi giao dịch"
          avatar={{ icon: <ShieldCheck size={18} color="#00D68F" />, iconBg: "#ECFDF5", size: 40 }}
          divider
          rightSlot={<Badge variant="label" color="success" label="Bật" />}
        />
        <ListItem
          title="Cài đặt thẻ"
          subtitle="Hạn mức, PIN, lịch sử"
          avatar={{ icon: <Settings2 size={18} color="#718096" />, iconBg: "#F5F6FA", size: 40 }}
          showArrow
          divider={false}
        />
      </div>

      {/* ── CTA buttons ───────────────────────────────────────────────────── */}
      <div style={{ padding: "16px 20px 0", display: "flex", gap: 10 }}>
        <Button
          variant="filled"
          color={frozen ? "success" : "error"}
          size="lg"
          fullWidth
          iconLeft={<Lock size={18} />}
          loading={freezeLoading}
          onClick={() => setFreezeModal(true)}
        >
          {frozen ? "Bỏ khoá thẻ" : "Khoá thẻ"}
        </Button>
        <Button
          variant="outlined"
          color="dark"
          size="lg"
          fullWidth
          iconLeft={<ArrowRefresh size={18} />}
          onClick={() => window.location.href = "/reset-pin"}
        >
          Đặt lại PIN
        </Button>
      </div>

      {/* ── Freeze confirm modal ─────────────────────────────────────────── */}
      <Modal
        open={freezeModal}
        onClose={() => setFreezeModal(false)}
        variant="center"
        title={frozen ? "Bỏ khoá thẻ?" : "Khoá thẻ?"}
        subtitle={
          frozen
            ? "Thẻ sẽ được kích hoạt lại và có thể sử dụng ngay."
            : "Mọi giao dịch từ thẻ này sẽ bị chặn cho đến khi bạn bỏ khoá."
        }
        footer={
          <div style={{ display: "flex", gap: 10 }}>
            <Button variant="outlined" color="dark" size="lg" fullWidth onClick={() => setFreezeModal(false)}>Huỷ</Button>
            <Button
              variant="filled"
              color={frozen ? "success" : "error"}
              size="lg"
              fullWidth
              onClick={handleFreezeToggle}
            >
              {frozen ? "Bỏ khoá" : "Khoá ngay"}
            </Button>
          </div>
        }
      />

      {/* ── PIN verification modal for CVV ───────────────────────────────── */}
      <Modal
        open={pinModal}
        onClose={() => { setPinModal(false); setPinError(""); }}
        variant="sheet"
        title="Xác thực PIN"
        subtitle="Nhập mã PIN để xem CVV thẻ"
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "8px 0" }}>
          {pinError && (
            <div style={{ background: "#FFF1F2", borderRadius: 8, padding: "8px 14px", width: "100%" }}>
              <Text variant="caption" color="#FF3D71">{pinError}</Text>
            </div>
          )}
          <PinPad
            length={6}
            onComplete={handlePinComplete}
            error={!!pinError}
          />
          <Text variant="caption" color="#A0AEC0">Demo: PIN là 123456</Text>
        </div>
      </Modal>
    </div>
  );
}
