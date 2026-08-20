"use client";
/**
 * /onboarding — 2-slide onboarding carousel
 */
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Wallet, ArrowSwap } from "@vnkrvietnam/ui-kit";

const SLIDES = [
  {
    bg:       "linear-gradient(160deg, #000000 0%, #1a1a1a 100%)",
    textBg:   "#000000",
    fg:       "#FFFFFF",
    accent:   "#BEFF6C",
    icon:     <Wallet size={72} color="#BEFF6C" />,
    title:    "Quản lý tài chính thông minh",
    subtitle: "P2P · Crypto · Cashback tất cả trong một ví",
    btnLabel: "Tiếp theo",
    btnColor: "white" as const,
  },
  {
    bg:       "#BEFF6C",
    textBg:   "#BEFF6C",
    fg:       "#000000",
    accent:   "#000000",
    icon:     <ArrowSwap size={72} color="#000000" />,
    title:    "Giao dịch tức thì",
    subtitle: "Chuyển tiền P2P, đổi crypto nhanh chóng",
    btnLabel: "Get Started",
    btnColor: "dark" as const,
  },
];

export default function OnboardingPage() {
  const [slide, setSlide] = useState(0);
  const router = useRouter();
  const current = SLIDES[slide];

  function handleNext() {
    if (slide < SLIDES.length - 1) {
      setSlide(slide + 1);
    } else {
      router.push("/register");
    }
  }

  // Swipe support
  const touchStartX = React.useRef<number | null>(null);
  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 50 && slide < SLIDES.length - 1) setSlide(slide + 1);
    if (diff < -50 && slide > 0) setSlide(slide - 1);
    touchStartX.current = null;
  }

  return (
    <div
      style={{
        minHeight:      "100vh",
        background:     current.bg,
        display:        "flex",
        flexDirection:  "column",
        alignItems:     "center",
        justifyContent: "space-between",
        padding:        "60px 32px 48px",
        transition:     "background 0.4s",
        fontFamily:     "'Work Sans', sans-serif",
      }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Top spacer */}
      <div />

      {/* Content */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 32, textAlign: "center" }}>
        <div style={{
          width:          120,
          height:         120,
          borderRadius:   "50%",
          background:     slide === 0 ? "rgba(190,255,108,0.12)" : "rgba(0,0,0,0.08)",
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
        }}>
          {current.icon}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <h1 style={{
            margin:     0,
            fontSize:   "1.625rem",
            fontWeight: 700,
            color:      current.fg,
            lineHeight: 1.2,
          }}>
            {current.title}
          </h1>
          <p style={{
            margin:     0,
            fontSize:   "0.9375rem",
            fontWeight: 400,
            color:      slide === 0 ? "rgba(255,255,255,0.65)" : "rgba(0,0,0,0.55)",
            lineHeight: 1.5,
          }}>
            {current.subtitle}
          </p>
        </div>
      </div>

      {/* Bottom: dots + button */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 28, width: "100%" }}>
        {/* Dot indicators */}
        <div style={{ display: "flex", gap: 8 }}>
          {SLIDES.map((_, i) => (
            <div
              key={i}
              onClick={() => setSlide(i)}
              style={{
                width:        i === slide ? 24 : 8,
                height:       8,
                borderRadius: 4,
                background:   i === slide
                  ? (slide === 0 ? "#BEFF6C" : "#000000")
                  : (slide === 0 ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.25)"),
                transition:   "width 0.25s, background 0.25s",
                cursor:       "pointer",
              }}
            />
          ))}
        </div>

        <Button
          color={current.btnColor}
          size="lg"
          fullWidth
          onClick={handleNext}
          style={{ borderRadius: 99 }}
        >
          {current.btnLabel}
        </Button>
      </div>
    </div>
  );
}
