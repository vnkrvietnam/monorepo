"use client";
/**
 * /login — Login Page
 * Features: phone/email + password, 2FA TOTP optional step
 */
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Text, ArrowLeft, Lock, Eye, EyeOff, ShieldCheck } from "@vnkrvietnam/ui-kit";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password,   setPassword]   = useState("");
  const [showPw,     setShowPw]     = useState(false);
  const [totpStep,   setTotpStep]   = useState(false);
  const [totpCode,   setTotpCode]   = useState("");
  const [error,      setError]      = useState("");
  const [loading,    setLoading]    = useState(false);

  const canSubmit = identifier.trim().length >= 6 && password.length >= 6;

  const handleLogin = async () => {
    if (!canSubmit) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/v1/auth/login", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ identifier: identifier.trim(), password, totpCode: totpStep ? totpCode : undefined }),
      });
      const data = await res.json();
      if (!data.success) {
        if (data.errorCode === "TOTP_REQUIRED") { setTotpStep(true); setLoading(false); return; }
        setError(data.message ?? "Đăng nhập thất bại");
        setLoading(false);
        return;
      }
      // Store tokens
      if (typeof window !== "undefined") {
        localStorage.setItem("access_token",  data.data.accessToken);
        localStorage.setItem("refresh_token", data.data.refreshToken);
      }
      router.push("/home");
    } catch {
      setError("Không thể kết nối máy chủ. Kiểm tra mạng và thử lại.");
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#fff", display: "flex", flexDirection: "column", fontFamily: "'Work Sans', sans-serif" }}>
      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", padding: "16px 20px", gap: 8 }}>
        <button onClick={() => router.back()} style={{ width: 40, height: 40, borderRadius: "50%", border: "none", background: "#F5F6FA", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ArrowLeft size={20} color="#000" />
        </button>
      </div>

      <div style={{ flex: 1, padding: "8px 24px 40px", display: "flex", flexDirection: "column", gap: 28 }}>
        {/* Icon */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Lock size={32} color="#BEFF6C" />
          </div>
        </div>

        {/* Title */}
        <div>
          <h1 style={{ margin: 0, fontSize: "1.625rem", fontWeight: 700, color: "#000" }}>
            {totpStep ? "Xác thực 2FA" : "Đăng nhập"}
          </h1>
          <p style={{ margin: "8px 0 0", fontSize: "0.9375rem", color: "#8F9BB3" }}>
            {totpStep ? "Nhập mã 6 chữ số từ Google Authenticator" : "Chào mừng trở lại VNKR"}
          </p>
        </div>

        {!totpStep ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Input label="Số điện thoại / Email" placeholder="0901 234 567 hoặc email@vnkr.vn" type="text" value={identifier} onChange={e => setIdentifier(e.target.value)} fullWidth />
            <div style={{ position: "relative" }}>
              <Input
                label="Mật khẩu"
                type={showPw ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                fullWidth
                iconRight={
                  <button onClick={() => setShowPw(v => !v)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                    {showPw ? <EyeOff size={16} color="#A0AEC0" /> : <Eye size={16} color="#A0AEC0" />}
                  </button>
                }
              />
            </div>
            <div style={{ textAlign: "right" }}>
              <button onClick={() => router.push("/forgot-password")} style={{ background: "none", border: "none", cursor: "pointer", color: "#0095FF", fontSize: 13, fontFamily: "'Work Sans', sans-serif", fontWeight: 600 }}>
                Quên mật khẩu?
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Input label="Mã 2FA (TOTP)" placeholder="123456" type="number" maxLength={6} value={totpCode} onChange={e => setTotpCode(e.target.value.slice(0, 6))} fullWidth />
          </div>
        )}

        {error && (
          <div style={{ background: "#FFF1F2", borderRadius: 10, padding: "10px 14px", display: "flex", gap: 8 }}>
            <Text variant="caption" color="#FF3D71">{error}</Text>
          </div>
        )}

        <div style={{ flex: 1 }} />

        <Button color="dark" size="lg" fullWidth disabled={totpStep ? totpCode.length < 6 : !canSubmit} loading={loading} onClick={handleLogin} style={{ borderRadius: 99 }}>
          {totpStep ? "Xác nhận" : "Đăng nhập"}
        </Button>

        {!totpStep && (
          <div style={{ textAlign: "center" }}>
            <Text variant="body2" color="#8F9BB3">Chưa có tài khoản?{" "}
              <span onClick={() => router.push("/register")} style={{ color: "#000", fontWeight: 700, cursor: "pointer" }}>Đăng ký ngay</span>
            </Text>
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <ShieldCheck size={14} color="#00D68F" />
          <Text variant="caption" color="#A0AEC0">Bảo mật TLS 1.3 · Mã hóa AES-256</Text>
        </div>
      </div>
    </div>
  );
}
