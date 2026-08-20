"use client";
/**
 * /forgot-password — Password Recovery
 * Step 1: Enter phone/email → Step 2: Verify OTP → Step 3: New password
 */
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Text, ArrowLeft, OtpInput, CheckCircle, ShieldCheck } from "@vnkrvietnam/ui-kit";

type Step = "identifier" | "otp" | "new-password" | "done";

export default function ForgotPasswordPage() {
  const router    = useRouter();
  const [step,       setStep]       = useState<Step>("identifier");
  const [identifier, setIdentifier] = useState("");
  const [otp,        setOtp]        = useState("");
  const [newPw,      setNewPw]      = useState("");
  const [confirmPw,  setConfirmPw]  = useState("");
  const [error,      setError]      = useState("");
  const [loading,    setLoading]    = useState(false);
  const [countdown,  setCountdown]  = useState(0);

  // OTP resend countdown
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const sendOTP = async () => {
    if (!identifier.trim()) { setError("Vui lòng nhập số điện thoại hoặc email"); return; }
    setError("");
    setLoading(true);
    try {
      const res  = await fetch("/api/v1/auth/forgot-password", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ identifier: identifier.trim() }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.message); setLoading(false); return; }
      setStep("otp");
      setCountdown(60);
    } catch {
      setError("Không thể kết nối. Thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (otp.length < 6) { setError("Vui lòng nhập đủ 6 chữ số OTP"); return; }
    setError("");
    setStep("new-password");
  };

  const resetPassword = async () => {
    if (newPw.length < 8)    { setError("Mật khẩu tối thiểu 8 ký tự"); return; }
    if (newPw !== confirmPw) { setError("Mật khẩu xác nhận không khớp"); return; }
    setError("");
    setLoading(true);
    try {
      const res  = await fetch("/api/v1/auth/reset-password", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ identifier, otp, newPassword: newPw }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.message); setLoading(false); return; }
      setStep("done");
    } catch {
      setError("Không thể kết nối. Thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#fff", display: "flex", flexDirection: "column", fontFamily: "'Work Sans', sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", padding: "16px 20px" }}>
        <button onClick={() => step === "identifier" ? router.back() : setStep(s => s === "otp" ? "identifier" : s === "new-password" ? "otp" : "identifier")}
          style={{ width: 40, height: 40, borderRadius: "50%", border: "none", background: "#F5F6FA", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ArrowLeft size={20} color="#000" />
        </button>
      </div>

      <div style={{ flex: 1, padding: "8px 24px 40px", display: "flex", flexDirection: "column", gap: 28 }}>

        {step === "done" ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, textAlign: "center" }}>
            <CheckCircle size={72} color="#00D68F" />
            <Text variant="h5" weight="semibold" color="#1A1F36">Đổi mật khẩu thành công!</Text>
            <Text variant="body2" color="#718096">Bạn có thể đăng nhập với mật khẩu mới.</Text>
            <Button color="dark" size="lg" fullWidth style={{ marginTop: 8 }} onClick={() => router.push("/login")}>Đăng nhập</Button>
          </div>
        ) : (
          <>
            <div>
              <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700, color: "#000" }}>
                {step === "identifier" ? "Khôi phục mật khẩu" : step === "otp" ? "Nhập mã OTP" : "Mật khẩu mới"}
              </h1>
              <p style={{ margin: "8px 0 0", fontSize: "0.9rem", color: "#8F9BB3" }}>
                {step === "identifier" && "Nhập SĐT/email để nhận mã xác nhận"}
                {step === "otp" && `Mã OTP đã gửi đến ${identifier}`}
                {step === "new-password" && "Nhập mật khẩu mới cho tài khoản"}
              </p>
            </div>

            {step === "identifier" && (
              <Input label="Số điện thoại / Email" placeholder="0901234567" value={identifier} onChange={e => setIdentifier(e.target.value)} fullWidth />
            )}

            {step === "otp" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <OtpInput length={6} onComplete={setOtp} />
                <div style={{ textAlign: "center" }}>
                  {countdown > 0 ? (
                    <Text variant="caption" color="#A0AEC0">Gửi lại sau {countdown}s</Text>
                  ) : (
                    <button onClick={() => { sendOTP(); setCountdown(60); }} style={{ background: "none", border: "none", color: "#0095FF", fontWeight: 600, cursor: "pointer", fontSize: 13, fontFamily: "'Work Sans', sans-serif" }}>
                      Gửi lại OTP
                    </button>
                  )}
                </div>
              </div>
            )}

            {step === "new-password" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <Input label="Mật khẩu mới" type="password" placeholder="Tối thiểu 8 ký tự" value={newPw} onChange={e => setNewPw(e.target.value)} fullWidth />
                <Input label="Xác nhận mật khẩu" type="password" placeholder="Nhập lại mật khẩu" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} fullWidth error={confirmPw && confirmPw !== newPw ? "Không khớp" : undefined} />
              </div>
            )}

            {error && (
              <div style={{ background: "#FFF1F2", borderRadius: 10, padding: "10px 14px" }}>
                <Text variant="caption" color="#FF3D71">{error}</Text>
              </div>
            )}

            <div style={{ flex: 1 }} />
            <Button color="dark" size="lg" fullWidth loading={loading} style={{ borderRadius: 99 }}
              onClick={step === "identifier" ? sendOTP : step === "otp" ? verifyOTP : resetPassword}>
              {step === "identifier" ? "Gửi mã OTP" : step === "otp" ? "Xác nhận" : "Đặt lại mật khẩu"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
