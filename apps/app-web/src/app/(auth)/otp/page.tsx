"use client";
/**
 * /otp — Confirm OTP Page
 */
import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, OtpInput, ArrowLeft } from "@vnkrvietnam/ui-kit";

const MOCK_OTP = "0000";
const RESEND_SECONDS = 59;

function OtpPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const phone = params.get("phone") ?? "";

  const [otp, setOtp] = useState("");
  const [error, setError] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_SECONDS);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (countdown <= 0) { setCanResend(true); return; }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  function handleResend() {
    setCountdown(RESEND_SECONDS);
    setCanResend(false);
    setOtp("");
    setError(false);
  }

  function handleConfirm() {
    if (otp === MOCK_OTP) {
      router.push("/set-pin");
    } else {
      setError(true);
    }
  }

  const handleChange = useCallback((val: string) => {
    setOtp(val);
    if (error) setError(false);
  }, [error]);

  return (
    <div style={{
      minHeight:     "100vh",
      background:    "#FFFFFF",
      display:       "flex",
      flexDirection: "column",
      fontFamily:    "'Work Sans', sans-serif",
    }}>
      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", padding: "16px 20px", gap: 8 }}>
        <button
          onClick={() => router.back()}
          style={{
            width: 40, height: 40, borderRadius: "50%",
            border: "none", background: "#F5F6FA",
            cursor: "pointer", display: "flex",
            alignItems: "center", justifyContent: "center",
          }}
        >
          <ArrowLeft size={20} color="#000" />
        </button>
        <span style={{ fontSize: "1.0625rem", fontWeight: 600, color: "#000" }}>
          Xác nhận OTP
        </span>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: "8px 24px 40px", display: "flex", flexDirection: "column", gap: 32 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700 }}>Nhập mã xác nhận</h2>
          <p style={{ margin: "8px 0 0", fontSize: "0.9375rem", color: "#8F9BB3" }}>
            Mã xác nhận đã gửi đến <strong style={{ color: "#000" }}>{phone}</strong>
          </p>
        </div>

        {/* OTP input */}
        <OtpInput
          length={4}
          onChange={handleChange}
          onComplete={handleChange}
          error={error}
        />
        {error && (
          <p style={{ margin: "-16px 0 0", textAlign: "center", color: "#FF3D71", fontSize: "0.8125rem" }}>
            Mã OTP không đúng. Thử lại
          </p>
        )}

        {/* Resend */}
        <div style={{ textAlign: "center" }}>
          {canResend ? (
            <button
              onClick={handleResend}
              style={{
                border: "none", background: "none",
                fontSize: "0.9375rem", color: "#0095FF",
                fontWeight: 600, cursor: "pointer", fontFamily: "'Work Sans', sans-serif",
              }}
            >
              Gửi lại
            </button>
          ) : (
            <span style={{ fontSize: "0.875rem", color: "#8F9BB3" }}>
              Gửi lại sau {countdown}s
            </span>
          )}
        </div>

        <div style={{ flex: 1 }} />

        <Button
          color="dark"
          size="lg"
          fullWidth
          disabled={otp.length < 4}
          onClick={handleConfirm}
          style={{ borderRadius: 99 }}
        >
          Xác nhận
        </Button>
      </div>
    </div>
  );
}

export default function OtpPage() {
  return (
    <Suspense>
      <OtpPageInner />
    </Suspense>
  );
}
