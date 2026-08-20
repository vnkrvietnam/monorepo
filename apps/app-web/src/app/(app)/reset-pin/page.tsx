"use client";
/**
 * /reset-pin — Reset PIN
 * Flow: Enter old PIN (/enter-pin) → New PIN → Confirm PIN
 * Validation: reject simple sequences (111111, 123456, 654321, 000000, etc.)
 */
import React, { useState, useRef, useEffect } from "react";
import {
  Button, Text, Input, PinPad,
  CheckCircle, Lock, Phone, ShieldCheck, Fingerprint, ArrowLeft,
  AlertCircle,
} from "@vnkrvietnam/ui-kit";
import { useRouter } from "next/navigation";

type Step = "verify-old" | "new-pin" | "confirm-pin" | "done";

const SIMPLE_SEQUENCES = [
  "000000", "111111", "222222", "333333", "444444", "555555", "666666", "777777", "888888", "999999",
  "123456", "654321", "012345", "987654", "246810", "135790",
];

/** Check if PIN is too simple */
function isSimplePin(pin: string): string | null {
  if (SIMPLE_SEQUENCES.includes(pin)) {
    return "PIN quá đơn giản. Không được dùng dãy số liên tiếp hoặc lặp lại.";
  }
  // Check ascending/descending sequences
  const digits = pin.split("").map(Number);
  let isAscending = true, isDescending = true;
  for (let i = 1; i < digits.length; i++) {
    if (digits[i] !== digits[i - 1] + 1) isAscending = false;
    if (digits[i] !== digits[i - 1] - 1) isDescending = false;
  }
  if (isAscending || isDescending) {
    return "PIN quá đơn giản. Không được dùng dãy số liên tiếp.";
  }
  return null;
}

export default function ResetPINPage() {
  const router = useRouter();
  const [step,       setStep]      = useState<Step>("verify-old");
  const [oldPinError, setOldPinError] = useState("");
  const [newPin,     setNewPin]    = useState("");
  const [newPinError, setNewPinError] = useState("");
  const [confirmPin, setConfirmPin]= useState("");
  const [confirmError,setConfirmError]= useState("");
  const [loading,    setLoading]   = useState(false);

  const handleOldPinComplete = async (pin: string) => {
    setOldPinError("");
    // Simulate old PIN verification (correct = "123456")
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setLoading(false);
    if (pin !== "123456") {
      setOldPinError("PIN cũ không đúng. Vui lòng thử lại.");
      return;
    }
    setStep("new-pin");
  };

  const handleNewPinComplete = (pin: string) => {
    setNewPinError("");
    const err = isSimplePin(pin);
    if (err) { setNewPinError(err); return; }
    setNewPin(pin);
    setStep("confirm-pin");
  };

  const handleConfirmPinComplete = async (pin: string) => {
    setConfirmError("");
    if (pin !== newPin) {
      setConfirmError("PIN xác nhận không khớp. Vui lòng thử lại.");
      return;
    }
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    setLoading(false);
    setStep("done");
  };

  return (
    <div style={{ minHeight: "90vh", paddingBottom: 32 }}>
      {/* Header */}
      <div style={{ padding: "16px 20px 20px", display: "flex", alignItems: "center", gap: 12 }}>
        {(step === "new-pin" || step === "confirm-pin") && (
          <button
            onClick={() => {
              if (step === "new-pin") setStep("verify-old");
              if (step === "confirm-pin") { setStep("new-pin"); setNewPin(""); setNewPinError(""); }
            }}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            <ArrowLeft size={22} color="#1A1F36" />
          </button>
        )}
        <Lock size={22} color="#1A1F36" />
        <Text variant="h6" weight="semibold" color="#1A1F36">Đặt lại PIN</Text>
      </div>

      {/* Step indicator */}
      {step !== "done" && (
        <div style={{ padding: "0 20px 16px" }}>
          <div style={{ display: "flex", gap: 4 }}>
            {["verify-old", "new-pin", "confirm-pin"].map((s, i) => (
              <div
                key={s}
                style={{
                  flex: 1, height: 4, borderRadius: 99,
                  background: ["verify-old", "new-pin", "confirm-pin"].indexOf(step) >= i ? "#000" : "#E5E7EB",
                  transition: "background 0.3s",
                }}
              />
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
            {["Bước 1: Xác nhận PIN cũ", "Bước 2: PIN mới", "Bước 3: Xác nhận lại"].map((label, i) => (
              <Text key={i} variant="caption" color={["verify-old", "new-pin", "confirm-pin"].indexOf(step) >= i ? "#1A1F36" : "#A0AEC0"} style={{ fontSize: 10 }}>
                {label}
              </Text>
            ))}
          </div>
        </div>
      )}

      {/* ── Step 1: Verify old PIN ────────────────────────────────── */}
      {step === "verify-old" && (
        <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
          <div style={{ textAlign: "center" }}>
            <Text variant="subtitle1" weight="semibold" color="#1A1F36">Xác nhận PIN hiện tại</Text>
            <Text variant="body2" color="#A0AEC0" style={{ marginTop: 6 }}>Nhập mã PIN hiện tại để tiếp tục</Text>
          </div>
          {oldPinError && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#FFF1F2", borderRadius: 8, padding: "8px 14px", width: "100%" }}>
              <AlertCircle size={14} color="#FF3D71" />
              <Text variant="caption" color="#FF3D71">{oldPinError}</Text>
            </div>
          )}
          <PinPad
            length={6}
            onComplete={handleOldPinComplete}
            error={!!oldPinError}
          />
          <Text variant="caption" color="#A0AEC0">Demo: PIN cũ là 123456</Text>
          <Button variant="ghost" color="dark" size="sm" onClick={() => router.push("/more")}>Huỷ</Button>
        </div>
      )}

      {/* ── Step 2: Enter new PIN ─────────────────────────────────── */}
      {step === "new-pin" && (
        <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
          <div style={{ textAlign: "center" }}>
            <Text variant="subtitle1" weight="semibold" color="#1A1F36">Tạo PIN mới</Text>
            <Text variant="body2" color="#A0AEC0" style={{ marginTop: 6 }}>Nhập 6 chữ số cho PIN mới của bạn</Text>
          </div>
          {newPinError && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8, background: "#FFF1F2", borderRadius: 8, padding: "8px 14px", width: "100%" }}>
              <AlertCircle size={14} color="#FF3D71" style={{ flexShrink: 0, marginTop: 1 }} />
              <Text variant="caption" color="#FF3D71">{newPinError}</Text>
            </div>
          )}
          <div style={{ background: "#FFFBEB", borderRadius: 10, padding: "10px 14px", width: "100%" }}>
            <Text variant="caption" color="#92400E">
              PIN phải đủ 6 chữ số. Không dùng: 123456, 111111, dãy liên tiếp hoặc lặp lại.
            </Text>
          </div>
          <PinPad
            length={6}
            onComplete={handleNewPinComplete}
            error={!!newPinError}
          />
        </div>
      )}

      {/* ── Step 3: Confirm new PIN ───────────────────────────────── */}
      {step === "confirm-pin" && (
        <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
          <div style={{ textAlign: "center" }}>
            <Text variant="subtitle1" weight="semibold" color="#1A1F36">Xác nhận PIN mới</Text>
            <Text variant="body2" color="#A0AEC0" style={{ marginTop: 6 }}>Nhập lại PIN mới để xác nhận</Text>
          </div>
          {confirmError && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#FFF1F2", borderRadius: 8, padding: "8px 14px", width: "100%" }}>
              <AlertCircle size={14} color="#FF3D71" />
              <Text variant="caption" color="#FF3D71">{confirmError}</Text>
            </div>
          )}
          <PinPad
            length={6}
            onComplete={handleConfirmPinComplete}
            error={!!confirmError}
          />
        </div>
      )}

      {/* ── Done ─────────────────────────────────────────────────── */}
      {step === "done" && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "40px 24px", gap: 16 }}>
          <CheckCircle size={72} color="#00D68F" />
          <Text variant="h5" weight="semibold" color="#1A1F36">PIN đã được cập nhật!</Text>
          <Text variant="body2" color="#718096">Mã PIN mới của bạn đã được thiết lập thành công. Sử dụng PIN mới cho các giao dịch tiếp theo.</Text>
          <Button variant="filled" color="dark" size="lg" fullWidth style={{ marginTop: 8 }} onClick={() => router.push("/home")}>
            Về trang chủ
          </Button>
          <Button variant="ghost" color="dark" size="sm" onClick={() => router.push("/security")}>
            Về Bảo mật
          </Button>
        </div>
      )}
    </div>
  );
}
