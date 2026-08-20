"use client";
/**
 * /support — AI Support + Help Ticket
 * Features:
 *  - Submit ticket with auto-generated #TK-XXXX ID
 *  - File upload validation (<10MB, image/pdf)
 *  - Live chat queue
 *  - AI chatbot quick replies
 */
import React, { useState, useRef, useEffect } from "react";
import {
  Button, Text, Input, Modal, Badge,
  AlertCircle, CheckCircle, ArrowUp, ArrowLeft,
} from "@vnkrvietnam/ui-kit";

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const TICKET_CATEGORIES = ["Giao dịch", "Bảo mật", "Tài khoản", "Kỹ thuật", "Khác"];

interface Message {
  id:      string;
  role:    "user" | "bot";
  text:    string;
  time:    string;
}

interface Ticket {
  id:       string;
  subject:  string;
  category: string;
  status:   "open" | "in-progress" | "resolved";
  created:  string;
}

const QUICK_REPLIES = [
  "Tôi bị lỗi khi chuyển tiền",
  "Số dư không cập nhật",
  "Tôi muốn đặt lại PIN",
  "Giao dịch bị trừ nhưng chưa đến",
];

const BOT_RESPONSES: Record<string, string> = {
  "Tôi bị lỗi khi chuyển tiền": "Xin lỗi vì sự bất tiện. Bạn có thể cho tôi biết mã lỗi hiển thị không? Hoặc thử kiểm tra số dư và hạn mức giao dịch tại /card.",
  "Số dư không cập nhật": "Số dư thường cập nhật trong 5 phút. Nếu sau 30 phút vẫn chưa thấy, vui lòng gửi ticket để được hỗ trợ.",
  "Tôi muốn đặt lại PIN": "Bạn có thể đặt lại PIN tại mục Bảo mật → Quên PIN. Cần xác thực OTP qua số điện thoại đã đăng ký.",
  "Giao dịch bị trừ nhưng chưa đến": "Giao dịch thường mất 1–5 phút. Nếu quá 30 phút, hãy kiểm tra mã giao dịch tại /receipt và gửi ticket với mã UETR nếu là SWIFT.",
};

function generateTicketId() {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `TK-${num}`;
}

function nowTime() {
  return new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

export default function SupportPage() {
  const [tab,          setTab]          = useState<"chat"|"ticket">("chat");
  const [messages,     setMessages]     = useState<Message[]>([
    { id: "1", role: "bot", text: "Xin chào! Tôi là trợ lý AI của VNKR. Tôi có thể giúp gì cho bạn hôm nay?", time: "09:00" },
  ]);
  const [input,        setInput]        = useState("");
  const [botTyping,    setBotTyping]    = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Ticket form
  const [ticketSubject,  setTicketSubject]  = useState("");
  const [ticketDesc,     setTicketDesc]     = useState("");
  const [ticketCategory, setTicketCategory] = useState(TICKET_CATEGORIES[0]);
  const [ticketFiles,    setTicketFiles]    = useState<File[]>([]);
  const [fileError,      setFileError]      = useState("");
  const [tickets,        setTickets]        = useState<Ticket[]>([]);
  const [ticketSuccess,  setTicketSuccess]  = useState<string | null>(null);
  const [submitting,     setSubmitting]     = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, botTyping]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), role: "user", text, time: nowTime() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setBotTyping(true);
    await new Promise(r => setTimeout(r, 1200));
    const botText = BOT_RESPONSES[text] ?? "Tôi hiểu vấn đề của bạn. Để được hỗ trợ chi tiết hơn, vui lòng gửi ticket tại tab 'Gửi Ticket' hoặc chờ kết nối với nhân viên CSKH.";
    const botMsg: Message = { id: (Date.now() + 1).toString(), role: "bot", text: botText, time: nowTime() };
    setMessages(prev => [...prev, botMsg]);
    setBotTyping(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError("");
    const files = Array.from(e.target.files ?? []);
    const invalid = files.filter(f => f.size > MAX_FILE_SIZE_BYTES);
    if (invalid.length > 0) {
      setFileError(`File ${invalid[0].name} vượt quá ${MAX_FILE_SIZE_MB}MB`);
      return;
    }
    setTicketFiles(prev => [...prev, ...files]);
  };

  const removeFile = (idx: number) => {
    setTicketFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const submitTicket = async () => {
    if (!ticketSubject.trim() || !ticketDesc.trim()) return;
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1500));
    const id = generateTicketId();
    setTickets(prev => [...prev, {
      id,
      subject:  ticketSubject,
      category: ticketCategory,
      status:   "open",
      created:  new Date().toLocaleDateString("vi-VN"),
    }]);
    setTicketSuccess(id);
    setTicketSubject(""); setTicketDesc(""); setTicketFiles([]);
    setSubmitting(false);
  };

  return (
    <div style={{ paddingBottom: 32 }}>
      {/* Header */}
      <div style={{ padding: "16px 20px 8px", display: "flex", alignItems: "center", gap: 10 }}>
        <div>
          <Text variant="h6" weight="semibold" color="#1A1F36">Hỗ trợ 24/7</Text>
          <Text variant="caption" color="#A0AEC0">Trợ lý AI · Gửi Ticket · CSKH Live</Text>
        </div>
        <div style={{ marginLeft: "auto" }}>
          <Badge variant="dot" color="success" label="Online" />
        </div>
      </div>

      {/* Tab switcher */}
      <div style={{ padding: "4px 20px 12px" }}>
        <div style={{ display: "flex", background: "#F5F6FA", borderRadius: 12, padding: 3 }}>
          {[{ id: "chat", label: "Chat AI" }, { id: "ticket", label: "Gửi Ticket" }].map(t => (
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

      {/* ── CHAT TAB ────────────────────────────────────────────────── */}
      {tab === "chat" && (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {/* Messages */}
          <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 10, minHeight: 320, maxHeight: 420, overflowY: "auto" }}>
            {messages.map(m => (
              <div
                key={m.id}
                style={{
                  display: "flex",
                  flexDirection: m.role === "user" ? "row-reverse" : "row",
                  gap: 8, alignItems: "flex-end",
                }}
              >
                {m.role === "bot" && (
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#000", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Text variant="caption" color="#BEFF6C" weight="semibold">AI</Text>
                  </div>
                )}
                <div style={{
                  maxWidth: "75%",
                  background: m.role === "user" ? "#000" : "#F5F6FA",
                  borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  padding: "10px 14px",
                }}>
                  <Text variant="body2" color={m.role === "user" ? "#fff" : "#1A1F36"}>{m.text}</Text>
                  <Text variant="caption" color={m.role === "user" ? "rgba(255,255,255,0.5)" : "#A0AEC0"} style={{ display: "block", marginTop: 2 }}>{m.time}</Text>
                </div>
              </div>
            ))}
            {botTyping && (
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Text variant="caption" color="#BEFF6C" weight="semibold">AI</Text>
                </div>
                <div style={{ background: "#F5F6FA", borderRadius: 12, padding: "10px 14px" }}>
                  <Text variant="caption" color="#A0AEC0">Đang soạn...</Text>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick replies */}
          <div style={{ padding: "8px 16px", display: "flex", gap: 6, overflowX: "auto", paddingBottom: 6 }}>
            {QUICK_REPLIES.map(r => (
              <button
                key={r}
                onClick={() => sendMessage(r)}
                style={{
                  flexShrink: 0, padding: "5px 12px", borderRadius: 20,
                  border: "1px solid #E5E7EB", background: "#fff",
                  fontSize: 11, fontWeight: 600, color: "#1A1F36",
                  fontFamily: "'Work Sans', sans-serif", cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >{r}</button>
            ))}
          </div>

          {/* Input area */}
          <div style={{ padding: "4px 16px 0", display: "flex", gap: 8 }}>
            <div style={{ flex: 1 }}>
              <Input
                placeholder="Nhập câu hỏi..."
                value={input}
                onChange={e => setInput(e.target.value)}
              />
            </div>
            <Button
              variant="filled" color="dark" size="md"
              iconLeft={<ArrowUp size={16} />}
              disabled={!input.trim()}
              onClick={() => sendMessage(input)}
            />
          </div>
        </div>
      )}

      {/* ── TICKET TAB ──────────────────────────────────────────────── */}
      {tab === "ticket" && (
        <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Existing tickets */}
          {tickets.length > 0 && (
            <div style={{ background: "#fff", borderRadius: 16, padding: "12px 16px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
              <Text variant="subtitle2" weight="semibold" color="#1A1F36" style={{ marginBottom: 8 }}>Ticket của bạn</Text>
              {tickets.map(t => (
                <div key={t.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #F3F4F6" }}>
                  <div>
                    <Text variant="body2" weight="semibold" color="#1A1F36">#{t.id}</Text>
                    <Text variant="caption" color="#A0AEC0">{t.subject}</Text>
                  </div>
                  <Badge variant="label" color={t.status === "resolved" ? "success" : t.status === "in-progress" ? "warning" : "info"} label={t.status === "resolved" ? "Đã giải quyết" : t.status === "in-progress" ? "Đang xử lý" : "Mới"} />
                </div>
              ))}
            </div>
          )}

          {/* Submit new ticket */}
          <Text variant="subtitle2" weight="semibold" color="#1A1F36">Gửi Ticket mới</Text>

          <Input
            label="Tiêu đề"
            placeholder="Mô tả ngắn gọn vấn đề"
            value={ticketSubject}
            onChange={e => setTicketSubject(e.target.value)}
          />

          {/* Category */}
          <div>
            <Text variant="caption" weight="semibold" color="#57606a" style={{ display: "block", marginBottom: 8 }}>Danh mục</Text>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {TICKET_CATEGORIES.map(c => (
                <button
                  key={c}
                  onClick={() => setTicketCategory(c)}
                  style={{
                    padding: "5px 12px", borderRadius: 8,
                    border: `1.5px solid ${ticketCategory === c ? "#000" : "#E5E7EB"}`,
                    background: ticketCategory === c ? "#000" : "#fff",
                    color: ticketCategory === c ? "#BEFF6C" : "#4A5568",
                    fontSize: 12, fontWeight: 600, fontFamily: "'Work Sans', sans-serif", cursor: "pointer",
                  }}
                >{c}</button>
              ))}
            </div>
          </div>

          <Input
            label="Mô tả chi tiết"
            placeholder="Nhập nội dung vấn đề của bạn..."
            value={ticketDesc}
            onChange={e => setTicketDesc(e.target.value)}
          />

          {/* File upload */}
          <div>
            <Text variant="caption" weight="semibold" color="#57606a" style={{ display: "block", marginBottom: 8 }}>
              Đính kèm file (tối đa {MAX_FILE_SIZE_MB}MB/file)
            </Text>
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: "100%", padding: "12px", borderRadius: 10,
                border: "1.5px dashed #CBD5E0", background: "#F5F6FA",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              <Text variant="caption" color="#718096">Chọn file (PNG, JPG, PDF)</Text>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
            {fileError && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
                <AlertCircle size={14} color="#FF3D71" />
                <Text variant="caption" color="#FF3D71">{fileError}</Text>
              </div>
            )}
            {ticketFiles.length > 0 && (
              <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                {ticketFiles.map((f, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#F5F6FA", borderRadius: 8, padding: "6px 10px" }}>
                    <Text variant="caption" color="#1A1F36">{f.name} ({(f.size / 1024 / 1024).toFixed(2)}MB)</Text>
                    <button onClick={() => removeFile(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "#FF3D71", fontSize: 14 }}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button
            variant="filled" color="dark" size="lg" fullWidth
            disabled={!ticketSubject.trim() || !ticketDesc.trim()}
            loading={submitting}
            onClick={submitTicket}
          >
            Gửi Ticket
          </Button>
        </div>
      )}

      {/* Ticket success modal */}
      <Modal
        open={!!ticketSuccess}
        onClose={() => setTicketSuccess(null)}
        variant="center"
        title="Ticket đã được gửi!"
        subtitle={`Mã ticket: #${ticketSuccess}`}
        footer={
          <Button variant="filled" color="dark" size="lg" fullWidth onClick={() => setTicketSuccess(null)}>
            OK
          </Button>
        }
      >
        <div style={{ textAlign: "center", padding: "16px 0" }}>
          <CheckCircle size={48} color="#00D68F" style={{ margin: "0 auto 12px" }} />
          <Text variant="body2" color="#718096">
            Đội hỗ trợ của chúng tôi sẽ phản hồi trong vòng 2–4 giờ làm việc. Bạn có thể theo dõi trạng thái ticket tại đây.
          </Text>
        </div>
      </Modal>
    </div>
  );
}
