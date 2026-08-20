"use client";
/**
 * /splash — Splash Screen
 * Full-screen black, VNKR logo centered, auto-navigate after 2s
 */
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { VnkrLogo } from "@vnkrvietnam/ui-kit";

export default function SplashPage() {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => router.replace("/onboarding"), 2000);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <div style={{
      minHeight:      "100vh",
      background:     "#000000",
      display:        "flex",
      flexDirection:  "column",
      alignItems:     "center",
      justifyContent: "center",
      position:       "relative",
      fontFamily:     "'Work Sans', sans-serif",
    }}>
      {/* Center content */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <VnkrLogo variant="light" size={80} />
        <p style={{
          margin:     0,
          fontSize:   "1rem",
          fontWeight: 500,
          color:      "#BEFF6C",
          letterSpacing: "0.02em",
        }}>
          Ví điện tử thế hệ mới
        </p>
      </div>

      {/* Loading spinner at bottom */}
      <div style={{
        position: "absolute",
        bottom:   48,
        display:  "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <Spinner />
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg
      width="28" height="28" viewBox="0 0 28 28"
      style={{ animation: "spin 0.9s linear infinite" }}
    >
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <circle
        cx="14" cy="14" r="10"
        fill="none"
        stroke="#BEFF6C"
        strokeWidth="2.5"
        strokeDasharray="44"
        strokeDashoffset="30"
        strokeLinecap="round"
      />
    </svg>
  );
}
