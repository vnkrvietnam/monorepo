/**
 * ThumbnailGuide — Quy chuẩn hình ảnh & thumbnail VNKR
 * Hiển thị tất cả tỉ lệ chuẩn + background variant + usage rules.
 */
import React from "react";
import { ThumbnailFrame } from "./ThumbnailFrame";
import type { ThumbnailRatio, ThumbnailBg } from "./ThumbnailFrame";

const RATIOS: ThumbnailRatio[] = ["16:9","1:1","4:3","9:16","og"];
const BGS:    ThumbnailBg[]    = ["pink","greeny","violet","yellow","orange","dark"];

const RATIO_INFO: Record<ThumbnailRatio, { w: number; h: number; use: string }> = {
  "16:9": { w:1280, h:720,  use:"Cover bài viết, video thumbnail, banner trang chủ" },
  "1:1":  { w:1080, h:1080, use:"Social post (Instagram/Facebook), avatar, product card" },
  "4:3":  { w:1200, h:900,  use:"Blog card, article feature image, trong-text image" },
  "9:16": { w:1080, h:1920, use:"Instagram/Facebook Story, TikTok, Reels, app splash" },
  "og":   { w:1200, h:630,  use:"Open Graph / Twitter card — mọi đường link chia sẻ" },
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 56 }}>
      <div style={{
        fontSize:"0.7rem", fontWeight:700, letterSpacing:"0.08em",
        textTransform:"uppercase", color:"#8F9BB3",
        borderBottom:"1px solid #EDF2F7", paddingBottom:8, marginBottom:24,
      }}>{title}</div>
      {children}
    </div>
  );
}

export function ThumbnailGuide() {
  return (
    <div style={{ fontFamily:"'Work Sans', sans-serif", padding:40, background:"#FFFFFF", maxWidth:1000 }}>
      <div style={{ fontSize:28, fontWeight:700, marginBottom:4, color:"#000" }}>Thumbnail System</div>
      <div style={{ fontSize:13, color:"#8F9BB3", marginBottom:48 }}>
        VNKR Design System — Tiêu chuẩn hình ảnh & tỉ lệ khung hình
      </div>

      {/* Ratio scale */}
      <Section title="Tỉ lệ tiêu chuẩn (Aspect Ratios)">
        <div style={{ display:"flex", flexWrap:"wrap", gap:32, alignItems:"flex-start" }}>
          {RATIOS.map(r => {
            const info = RATIO_INFO[r];
            const previewW = r === "9:16" ? 120 : r === "1:1" ? 200 : r === "4:3" ? 240 : r === "og" ? 280 : 280;
            return (
              <div key={r} style={{ display:"flex", flexDirection:"column", gap:12, alignItems:"center" }}>
                <ThumbnailFrame ratio={r} bg="pink" width={previewW} showLogo={false} showShapes={false}>
                  <div style={{
                    fontSize:11, fontWeight:700, color:"#000",
                    fontFamily:"monospace", textAlign:"center",
                  }}>
                    {info.w} × {info.h}
                  </div>
                </ThumbnailFrame>
                <div style={{ textAlign:"center" }}>
                  <div style={{ fontSize:13, fontWeight:700, color:"#2E3A59" }}>{r}</div>
                  <div style={{ fontSize:11, color:"#8F9BB3", maxWidth:160, lineHeight:1.5, marginTop:4 }}>{info.use}</div>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Background colors */}
      <Section title="Brand Background Variants">
        <div style={{ display:"flex", flexWrap:"wrap", gap:20 }}>
          {BGS.map(bg => (
            <div key={bg} style={{ display:"flex", flexDirection:"column", gap:8, alignItems:"center" }}>
              <ThumbnailFrame ratio="16:9" bg={bg} width={220} showShapes title="VNKR" subtitle="Design System" />
              <span style={{ fontSize:11, color:"#8F9BB3", textTransform:"capitalize" }}>{bg}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Full preview */}
      <Section title="Full Preview — 16:9 Brand Thumbnail">
        <ThumbnailFrame
          ratio="16:9" bg="pink" width={640}
          showLogo showShapes
          title="VNKR Design System"
          subtitle="Thư viện component độc quyền — axvietnam"
        />
      </Section>

      {/* Rules */}
      <Section title="Quy chuẩn sử dụng">
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
          {[
            { title:"✅ Tỉ lệ bắt buộc",    body:"Luôn xuất file theo đúng tỉ lệ chuẩn. Không crop/scale sai tỉ lệ sau khi xuất." },
            { title:"✅ Độ phân giải",       body:"Min 1280×720px (72dpi). Print: 300dpi, nhân đôi kích thước pixel." },
            { title:"✅ Logo watermark",     body:"Luôn đặt logo VNKR ở góc dưới-trái với opacity 85% — không che bởi nội dung chính." },
            { title:"✅ Font trên thumbnail",body:"Chỉ dùng Work Sans Semibold / Bold cho tiêu đề. Cỡ chữ tối thiểu: 4% chiều rộng thumbnail." },
            { title:"❌ Không dùng ảnh lạ", body:"Không đặt ảnh thật làm background nếu không qua bước brand overlay VNKR." },
            { title:"❌ Không thay màu tự ý",body:"Background chỉ được dùng 6 brand colors chính thức. Không dùng gradient tự chế." },
          ].map(({ title, body }) => (
            <div key={title} style={{ border:"1px solid #EDF2F7", borderRadius:12, padding:"16px 20px" }}>
              <div style={{ fontSize:12, fontWeight:700, color:"#2E3A59", marginBottom:6 }}>{title}</div>
              <div style={{ fontSize:12, color:"#718096", lineHeight:1.65 }}>{body}</div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
