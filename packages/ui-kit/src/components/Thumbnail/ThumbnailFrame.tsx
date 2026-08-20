/**
 * @vnkrvietnam/ui — ThumbnailFrame
 * Chuẩn hình ảnh hiển thị cho bài viết / sản phẩm VNKR
 *
 * Tỉ lệ tiêu chuẩn:
 *   16:9  — Cover / banner / video thumbnail (1280×720, 1920×1080)
 *   1:1   — Social post / avatar / product card
 *   4:3   — Blog card / article feature image
 *   9:16  — Mobile story / TikTok / Reels
 *   OG    — Open Graph meta (1200×630 ≈ 1.91:1)
 *
 * Brand identity:
 *   - Logo: VNKR wordmark (bottom-left mặc định)
 *   - Brand shapes: *, ✦, ◑, sun — dùng làm background accent
 *   - Brand color backgrounds: pink (#FD9FDD), greeny (#BEFF6C), violet (#AF96FB)
 */
import React from "react";
import type { CSSProperties, ReactNode } from "react";
import { VnkrLogo } from "../Logo/VnkrLogo";

export type ThumbnailRatio  = "16:9" | "1:1" | "4:3" | "9:16" | "og";
export type ThumbnailBg     = "pink" | "greeny" | "violet" | "yellow" | "orange" | "dark" | "white" | string;

const RATIO_MAP: Record<ThumbnailRatio, number> = {
  "16:9": 16 / 9,
  "1:1":  1,
  "4:3":  4 / 3,
  "9:16": 9 / 16,
  "og":   1200 / 630,
};

const RATIO_LABEL: Record<ThumbnailRatio, string> = {
  "16:9": "16:9 — Cover / Banner / Video",
  "1:1":  "1:1 — Social Post / Avatar / Product",
  "4:3":  "4:3 — Blog Card / Article",
  "9:16": "9:16 — Mobile Story / Reels",
  "og":   "OG (1.91:1) — Open Graph / Meta Share",
};

const BG_COLOR: Record<string, string> = {
  pink:   "#FD9FDD",
  greeny: "#BEFF6C",
  violet: "#AF96FB",
  yellow: "#FFF172",
  orange: "#FC7339",
  dark:   "#000000",
  white:  "#FFFFFF",
};

export interface ThumbnailFrameProps {
  ratio?:       ThumbnailRatio;
  bg?:          ThumbnailBg;
  /** Width in px (height auto-calculated from ratio) */
  width?:       number;
  /** Whether to show VNKR logo watermark */
  showLogo?:    boolean;
  /** Whether to show brand decorative shapes */
  showShapes?:  boolean;
  /** Custom content placed inside the frame */
  children?:    ReactNode;
  style?:       CSSProperties;
  /** Title text overlaid on the thumbnail */
  title?:       string;
  /** Subtitle text */
  subtitle?:    string;
}

// ── Brand decorative shapes (from Thumbnail.png & Splash-screen design) ───────
function BrandShapes({ width, height, fg }: { width: number; height: number; fg: string }) {
  const s = width * 0.12;
  const textColor = fg;
  return (
    <svg
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid slice"
    >
      {/* Asterisk / star — top-left */}
      <text x={width * 0.08} y={height * 0.28} fontSize={s * 1.6} fill={textColor} opacity={0.6}
        fontFamily="sans-serif" textAnchor="middle">✳</text>

      {/* 4-point sparkle — center-left */}
      <text x={width * 0.2} y={height * 0.56} fontSize={s * 1.1} fill="#49DBC8" opacity={0.9}
        fontFamily="sans-serif" textAnchor="middle">✦</text>

      {/* Sun spiky — bottom-right */}
      <text x={width * 0.76} y={height * 0.86} fontSize={s * 1.4} fill="#FFF172" opacity={0.85}
        fontFamily="sans-serif" textAnchor="middle">✺</text>

      {/* Orange dot — right edge */}
      <circle cx={width * 0.96} cy={height * 0.34} r={s * 0.55} fill="#FC7339" opacity={0.9} />

      {/* Lime pill — bottom-left */}
      <rect x={width * 0.04} y={height * 0.74} width={s * 1.8} height={s * 0.42} rx={s * 0.21}
        fill="#BEFF6C" transform={`rotate(-35, ${width * 0.10}, ${height * 0.76})`} opacity={0.9}/>
    </svg>
  );
}

export function ThumbnailFrame({
  ratio      = "16:9",
  bg         = "pink",
  width      = 640,
  showLogo   = true,
  showShapes = true,
  children,
  style,
  title,
  subtitle,
}: ThumbnailFrameProps) {
  const aspectRatio  = RATIO_MAP[ratio];
  const height       = Math.round(width / aspectRatio);
  const bgColor      = BG_COLOR[bg] ?? bg;
  const isDark       = bg === "dark";
  const textFg       = isDark ? "#FFFFFF" : "#000000";
  const shapesFg     = isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.15)";

  const frameStyle: CSSProperties = {
    position:     "relative",
    width,
    height,
    background:   bgColor,
    borderRadius: 16,
    overflow:     "hidden",
    display:      "flex",
    alignItems:   "center",
    justifyContent: "center",
    flexDirection: "column",
    gap:           12,
    ...style,
  };

  return (
    <div style={frameStyle}>
      {/* Background shapes */}
      {showShapes && <BrandShapes width={width} height={height} fg={shapesFg} />}

      {/* Content layer */}
      <div style={{ position: "relative", zIndex: 1, textAlign: "center", padding: "0 40px" }}>
        {/* VNKR logo center */}
        {!children && !title && (
          <VnkrLogo variant={isDark ? "light" : "dark"} size={Math.max(60, Math.round(width * 0.2))} />
        )}

        {/* Title */}
        {title && (
          <div style={{
            fontSize:   Math.max(16, width * 0.045),
            fontWeight: 700,
            color:      textFg,
            fontFamily: "'Work Sans', sans-serif",
            lineHeight: 1.2,
            marginBottom: subtitle ? 8 : 0,
          }}>
            {title}
          </div>
        )}

        {/* Subtitle */}
        {subtitle && (
          <div style={{
            fontSize:   Math.max(12, width * 0.025),
            fontWeight: 400,
            color:      isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.55)",
            fontFamily: "'Work Sans', sans-serif",
          }}>
            {subtitle}
          </div>
        )}

        {children}
      </div>

      {/* Logo watermark — bottom-left */}
      {showLogo && (
        <div style={{
          position:  "absolute",
          bottom:    Math.round(height * 0.06),
          left:      Math.round(width * 0.05),
          zIndex:    2,
          opacity:   0.85,
        }}>
          <VnkrLogo variant={isDark ? "light" : "dark"} size={Math.max(40, Math.round(width * 0.12))} />
        </div>
      )}
    </div>
  );
}
