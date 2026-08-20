"use client";
/**
 * /register — Registration Page
 */
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Text, ArrowLeft } from "@vnkrvietnam/ui-kit";

export default function RegisterPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [agreed, setAgreed] = useState(false);

  const canContinue = phone.trim().length >= 8 && agreed;

  function handleContinue() {
    if (!canContinue) return;
    router.push(`/otp?phone=${encodeURIComponent(phone.trim())}`);
  }

  return (
    <div style={{
      minHeight:     "100vh",
      background:    "#FFFFFF",
      display:       "flex",
      flexDirection: "column",
      fontFamily:    "'Work Sans', sans-serif",
    }}>
      {/* Top bar */}
      <div style={{
        display:    "flex",
        alignItems: "center",
        padding:    "16px 20px",
        gap:        8,
      }}>
        <button
          onClick={() => router.back()}
          style={{
            width:      40,
            height:     40,
            borderRadius: "50%",
            border:     "none",
            background: "#F5F6FA",
            cursor:     "pointer",
            display:    "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ArrowLeft size={20} color="#000" />
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: "8px 24px 40px", display: "flex", flexDirection: "column", gap: 32 }}>
        {/* Title */}
        <div>
          <h1 style={{ margin: 0, fontSize: "1.625rem", fontWeight: 700, color: "#000000" }}>
            Đăng ký tài khoản
          </h1>
          <p style={{ margin: "8px 0 0", fontSize: "0.9375rem", color: "#8F9BB3" }}>
            Nhập số điện thoại để bắt đầu
          </p>
        </div>

        {/* Phone input */}
        <Input
          label="Số điện thoại"
          type="tel"
          placeholder="+84 xxx xxx xxx"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          fullWidth
        />

        {/* Terms checkbox */}
        <label style={{
          display:    "flex",
          alignItems: "flex-start",
          gap:        12,
          cursor:     "pointer",
        }}>
          <div
            onClick={() => setAgreed(!agreed)}
            style={{
              flexShrink:   0,
              marginTop:    2,
              width:        20,
              height:       20,
              borderRadius: 6,
              border:       `2px solid ${agreed ? "#000000" : "#CBD5E0"}`,
              background:   agreed ? "#000000" : "transparent",
              display:      "flex",
              alignItems:   "center",
              justifyContent: "center",
              transition:   "background 0.15s, border-color 0.15s",
              cursor:       "pointer",
            }}
          >
            {agreed && (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="#BEFF6C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
          <span style={{ fontSize: "0.875rem", color: "#2E3A59", lineHeight: 1.5 }}>
            Tôi đồng ý với{" "}
            <span style={{ color: "#0095FF", fontWeight: 600 }}>Điều khoản sử dụng</span>
          </span>
        </label>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        <Button
          color="dark"
          size="lg"
          fullWidth
          disabled={!canContinue}
          onClick={handleContinue}
          style={{ borderRadius: 99 }}
        >
          Tiếp tục
        </Button>
      </div>
    </div>
  );
}
