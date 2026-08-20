"use client";
/**
 * /enter-pin — PIN Entry for transaction authentication
 * Features:
 *  - returnUrl query param support for routing after success
 *  - Max 5 attempts before lockout
 *  - Forgot PIN → /reset-pin
 */
import React, { useState, useEffect, Suspense } from "react";
import {
  PinPad,
  Button,
  Text,
  Badge,
  AlertCircle,
  Lock,
  ShieldCheck,
} from "@vnkrvietnam/ui-kit";
import { useRouter, useSearchParams } from "next/navigation";

const MAX_ATTEMPTS = 5;
const CORRECT_PIN  = "123456"; // demo

function EnterPinInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const returnUrl    = searchParams.get("returnUrl") ?? "/home";
  const actionLabel  = searchParams.get("action") ?? "";

  const [attempts,   setAttempts]   = useState(0);
  const [error,      setError]      = useState("");
  const [locked,     setLocked]     = useState(false);
  const [lockTimer,  setLockTimer]  = useState(0);

  // Lockout countdown
  useEffect(() => {
    if (lockTimer <= 0) return;
    const t = setTimeout(() => setLockTimer(c => {
      if (c <= 1) { setLocked(false); setAttempts(0); return 0; }
      return c - 1;
    }), 1000);
    return () => clearTimeout(t);
  }, [lockTimer]);

  const handleComplete = (pin: string) => {
    if (locked) return;

    if (pin === CORRECT_PIN) {
      setError("");
      // Navigate to return URL
      router.push(returnUrl);
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      if (newAttempts >= MAX_ATTEMPTS) {
        setLocked(true);
        setLockTimer(30); // 30s lockout
        setError("Đã nhập sai quá nhiều lần. Vui lòng chờ 30 giây.");
      } else {
        setError(`PIN không đúng. Còn ${MAX_ATTEMPTS - newAttempts} lần thử.`);
      }
    }
  };

  const contextLabel: Record<string, string> = {
    withdraw: "Xác nhận rút Cashback",
    cvv:      "Xem CVV thẻ",
    transfer: "Xác nhận chuyển tiền",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "90vh", padding: "24px 20px", gap: 24 }}>
      {/* Icon */}
      <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Lock size={32} color="#BEFF6C" />
      </div>

      <div style={{ textAlign: "center" }}>
        <Text variant="h5" weight="semibold" color="#1A1F36">Nhập mã PIN</Text>
        {actionLabel && contextLabel[actionLabel] && (
          <Text variant="body2" color="#718096" style={{ marginTop: 4 }}>
            {contextLabel[actionLabel]}
          </Text>
        )}
        {!actionLabel && (
          <Text variant="body2" color="#718096" style={{ marginTop: 4 }}>
            Xác thực để tiếp tục
          </Text>
        )}
      </div>

      {/* Attempts indicator */}
      {attempts > 0 && !locked && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#FFF1F2", borderRadius: 8, padding: "8px 14px" }}>
          <AlertCircle size={14} color="#FF3D71" />
          <Text variant="caption" color="#FF3D71">{error}</Text>
        </div>
      )}

      {locked && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, background: "#FFF1F2", borderRadius: 12, padding: "14px 20px", textAlign: "center" }}>
          <AlertCircle size={24} color="#FF3D71" />
          <Text variant="body2" weight="semibold" color="#FF3D71">{error}</Text>
          <Badge variant="label" color="error" label={`Mở khoá sau ${lockTimer}s`} />
        </div>
      )}

      {!locked && (
        <PinPad
          length={6}
          onComplete={handleComplete}
          error={!!error}
        />
      )}

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
        <Button variant="ghost" color="dark" size="sm" onClick={() => router.push("/reset-pin")}>
          Quên PIN?
        </Button>
        <Text variant="caption" color="#A0AEC0">Demo: PIN là 123456</Text>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
        <ShieldCheck size={14} color="#00D68F" />
        <Text variant="caption" color="#A0AEC0">Kết nối được mã hoá TLS 1.3</Text>
      </div>
    </div>
  );
}

export default function EnterPinPage() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "90vh" }}>
        <Text variant="body2" color="#A0AEC0">Đang tải...</Text>
      </div>
    }>
      <EnterPinInner />
    </Suspense>
  );
}
