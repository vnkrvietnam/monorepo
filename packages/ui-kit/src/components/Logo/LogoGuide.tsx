/**
 * LogoGuide — Brand Usage Guidelines component
 * Hiển thị đầy đủ quy chuẩn sử dụng logo VNKR: biến thể, vùng an toàn, kích thước tối thiểu.
 */
import React from "react";
import { VnkrLogo } from "./VnkrLogo";
import type { LogoVariant } from "./VnkrLogo";

const VARIANTS: { variant: LogoVariant; bg: string; label: string; rule: string }[] = [
  { variant: "dark",  bg: "#FFFFFF", label: "Dark on White",       rule: "Sử dụng trên nền trắng / sáng"         },
  { variant: "light", bg: "#000000", label: "Light on Black",      rule: "Sử dụng trên nền đen / tối"            },
  { variant: "green", bg: "#BEFF6C", label: "Dark on Brand Green", rule: "Nền accent greeny — tài liệu truyền thông" },
  { variant: "pink",  bg: "#FD9FDD", label: "Dark on Brand Pink",  rule: "Nền accent magenta — social / marketing"  },
];

function RuleCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      border: "1px solid #EDF2F7", borderRadius: 12,
      padding: "20px 24px", marginBottom: 16,
    }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#2E3A59", marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 12, color: "#718096", lineHeight: 1.7 }}>{children}</div>
    </div>
  );
}

export function LogoGuide() {
  return (
    <div style={{ fontFamily: "'Work Sans', sans-serif", padding: 40, background: "#FFFFFF", maxWidth: 920 }}>
      <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 4, color: "#000" }}>Logo System</div>
      <div style={{ fontSize: 13, color: "#8F9BB3", marginBottom: 48 }}>
        VNKR Organisation — Brand Identity & Usage Guidelines
      </div>

      {/* Variants */}
      <Section title="Logo Variants">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
          {VARIANTS.map(({ variant, bg, label, rule }) => (
            <div key={variant} style={{
              background: bg,
              borderRadius: 16,
              padding: 32,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 20,
              border: bg === "#FFFFFF" ? "1px solid #EDF2F7" : "none",
            }}>
              <VnkrLogo variant={variant} size="lg" />
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: bg === "#000000" || bg === "#000" ? "#FFFFFF" : "#2E3A59" }}>
                  {label}
                </div>
                <div style={{ fontSize: 11, color: bg === "#000000" ? "#A0AEC0" : "#718096", marginTop: 4 }}>
                  {rule}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Badge variants */}
      <Section title="Logo with Badge (App Icon Style)">
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-end" }}>
          {VARIANTS.slice(0, 2).map(({ variant, label }) => (
            <div key={variant} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              <VnkrLogo variant={variant} size="md" badge />
              <span style={{ fontSize: 11, color: "#8F9BB3" }}>{label}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Size scale */}
      <Section title="Size Scale">
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-end" }}>
          {(["xs","sm","md","lg","xl"] as const).map(s => (
            <div key={s} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <VnkrLogo variant="dark" size={s} />
              <span style={{ fontSize: 10, color: "#A0AEC0", fontFamily: "monospace" }}>{s.toUpperCase()}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Rules */}
      <Section title="Usage Rules">
        <RuleCard title="✅ Vùng an toàn (Safe Zone)">
          Khoảng trống tối thiểu xung quanh logo = <strong>1× chiều cao logo</strong> trên mọi phía.
          Không đặt văn bản hoặc hình ảnh trong vùng này.
        </RuleCard>
        <RuleCard title="✅ Kích thước tối thiểu">
          <strong>Digital:</strong> 80px chiều rộng &nbsp;|&nbsp;
          <strong>Print:</strong> 20mm chiều rộng &nbsp;|&nbsp;
          <strong>Favicon:</strong> sử dụng chữ "V" đơn độc trên nền đen, 16×16px.
        </RuleCard>
        <RuleCard title="❌ Không được phép">
          • Kéo giãn / bóp méo tỉ lệ logo<br/>
          • Thay đổi màu sắc ra ngoài 4 biến thể chính thức<br/>
          • Đặt logo trên nền bận rộn hoặc hình ảnh có độ tương phản thấp<br/>
          • Thêm hiệu ứng đổ bóng, gradient, viền ngoài<br/>
          • Xoay hoặc nghiêng logo<br/>
          • Tách "VNKR" ra khỏi dấu Wi-Fi signal
        </RuleCard>
        <RuleCard title="📐 Tỉ lệ khung hình (Aspect Ratio)">
          Logo wordmark: <strong>≈ 3.1 : 1</strong> (ngang × dọc)<br/>
          Badge / App icon: <strong>1 : 1</strong> (vuông, bo góc 25%)
        </RuleCard>
      </Section>

      {/* Copyright */}
      <div style={{
        marginTop: 48, padding: "16px 0", borderTop: "1px solid #EDF2F7",
        fontSize: 11, color: "#A0AEC0", lineHeight: 1.6,
      }}>
        © VNKR Organisation. Tác giả chính: <strong>Nhâm Quốc Huân</strong> (IP phần mềm lõi axvn-network).
        Giá trị IP: 10.000.000.000.000 VNĐ. UNLICENSED — All rights reserved.
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 48 }}>
      <div style={{
        fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.08em",
        textTransform: "uppercase", color: "#8F9BB3",
        borderBottom: "1px solid #EDF2F7", paddingBottom: 8, marginBottom: 20,
      }}>
        {title}
      </div>
      {children}
    </div>
  );
}
