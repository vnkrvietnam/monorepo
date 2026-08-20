"use client";
/**
 * /ekyc — eKYC Identity Verification
 * Step 1: Chụp CCCD / Passport (Front & Back)
 * Step 2: Liveness Detection (Quét khuôn mặt 3D)
 * Step 3: Review & Submit
 */
import React, { useState, useRef } from "react";
import {
  Button, Text, Badge, Modal,
  CheckCircle, Camera, ArrowRight, ArrowLeft,
  UserShield, AlertCircle,
} from "@vnkrvietnam/ui-kit";

type EKYCStep = 1 | 2 | 3 | 4;

interface DocSide { file: File | null; preview: string | null }

const STEP_LABELS = ["Mặt trước", "Mặt sau", "Khuôn mặt", "Hoàn tất"];

function UploadBox({
  label, preview, onSelect,
}: {
  label: string; preview: string | null; onSelect: (f: File) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div
      onClick={() => ref.current?.click()}
      style={{
        border:         "2px dashed #CBD5E0",
        borderRadius:   16,
        background:     preview ? "#000" : "#F5F6FA",
        height:         180,
        display:        "flex",
        flexDirection:  "column",
        alignItems:     "center",
        justifyContent: "center",
        gap:            10,
        cursor:         "pointer",
        position:       "relative",
        overflow:       "hidden",
      }}
    >
      {preview ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 14 }} />
          <div style={{
            position: "absolute", bottom: 8, right: 8,
            background: "#00D68F", borderRadius: "50%", width: 28, height: 28,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <CheckCircle size={16} color="#fff" />
          </div>
        </>
      ) : (
        <>
          <Camera size={32} color="#A0AEC0" />
          <Text variant="body2" color="#718096" weight="medium">{label}</Text>
          <Text variant="caption" color="#A0AEC0">Chụp ảnh hoặc tải lên</Text>
        </>
      )}
      <input
        ref={ref} type="file" accept="image/*" style={{ display: "none" }}
        onChange={e => { const f = e.target.files?.[0]; if (f) onSelect(f); }}
      />
    </div>
  );
}

function StepBar({ current }: { current: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "0 20px 20px" }}>
      {STEP_LABELS.map((lbl, i) => {
        const done    = i + 1 < current;
        const active  = i + 1 === current;
        return (
          <React.Fragment key={lbl}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
              <div style={{
                width:            28, height: 28, borderRadius: "50%",
                background:       done ? "#00D68F" : active ? "#000" : "#E5E7EB",
                display:          "flex", alignItems: "center", justifyContent: "center",
                marginBottom:     4,
              }}>
                {done
                  ? <CheckCircle size={14} color="#fff" />
                  : <Text variant="caption" weight="semibold" color={active ? "#BEFF6C" : "#A0AEC0"}>{i + 1}</Text>
                }
              </div>
              <Text variant="caption" color={active ? "#1A1F36" : "#A0AEC0"} weight={active ? "semibold" : "regular"}>
                {lbl}
              </Text>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div style={{ height: 2, flex: 0.5, background: done ? "#00D68F" : "#E5E7EB", marginBottom: 18 }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default function EKYCPage() {
  const [step,       setStep]       = useState<EKYCStep>(1);
  const [front,      setFront]      = useState<DocSide>({ file: null, preview: null });
  const [back,       setBack]       = useState<DocSide>({ file: null, preview: null });
  const [docType,    setDocType]    = useState<"cccd" | "passport">("cccd");
  const [liveness,   setLiveness]   = useState<"idle" | "scanning" | "done">("idle");
  const [submitting, setSubmitting] = useState(false);
  const [doneModal,  setDoneModal]  = useState(false);

  const handleFile = (side: "front" | "back") => (f: File) => {
    const preview = URL.createObjectURL(f);
    if (side === "front") setFront({ file: f, preview });
    else                  setBack({ file: f, preview });
  };

  const simulateLiveness = async () => {
    setLiveness("scanning");
    await new Promise(r => setTimeout(r, 2500));
    setLiveness("done");
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 2000));
    setSubmitting(false);
    setDoneModal(true);
  };

  return (
    <div style={{ paddingBottom: 32 }}>
      {/* Header */}
      <div style={{ padding: "16px 20px 8px", display: "flex", alignItems: "center", gap: 12 }}>
        <UserShield size={24} color="#1A1F36" />
        <div>
          <Text variant="h6" weight="semibold" color="#1A1F36">Xác minh danh tính eKYC</Text>
          <Text variant="caption" color="#A0AEC0">Chuẩn VNeID — ISO 29003</Text>
        </div>
      </div>

      <StepBar current={step} />

      {/* ── Step 1: Front of document ─────────────────────────────────── */}
      {step === 1 && (
        <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 16 }}>
          <Text variant="subtitle2" weight="semibold" color="#1A1F36">
            Bước 1 — Chụp mặt trước CCCD/Hộ chiếu
          </Text>

          {/* Doc type selector */}
          <div style={{ display: "flex", gap: 8 }}>
            {(["cccd", "passport"] as const).map(t => (
              <Button
                key={t}
                variant={docType === t ? "filled" : "outlined"}
                color="dark" size="sm" fullWidth
                onClick={() => setDocType(t)}
              >
                {t === "cccd" ? "CCCD / CMND" : "Hộ chiếu"}
              </Button>
            ))}
          </div>

          <UploadBox
            label="Mặt trước — chứa ảnh & thông tin"
            preview={front.preview}
            onSelect={handleFile("front")}
          />

          <div style={{ background: "#FFFBEB", borderRadius: 12, padding: "12px 14px", display: "flex", gap: 10 }}>
            <AlertCircle size={18} color="#FFAA00" style={{ flexShrink: 0, marginTop: 1 }} />
            <Text variant="caption" color="#92400E">
              Đảm bảo ảnh rõ nét, không mờ, không che khuất, chụp trên nền sáng.
            </Text>
          </div>

          <Button
            variant="filled" color="dark" size="lg" fullWidth
            iconLeft={<ArrowRight size={18} />}
            disabled={!front.preview}
            onClick={() => setStep(2)}
          >
            Tiếp tục
          </Button>
        </div>
      )}

      {/* ── Step 2: Back of document ──────────────────────────────────── */}
      {step === 2 && (
        <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 16 }}>
          <Text variant="subtitle2" weight="semibold" color="#1A1F36">
            Bước 2 — Chụp mặt sau CCCD/Hộ chiếu
          </Text>

          <UploadBox
            label="Mặt sau — chứa mã vạch / QR"
            preview={back.preview}
            onSelect={handleFile("back")}
          />

          <div style={{ display: "flex", gap: 10 }}>
            <Button
              variant="outlined" color="dark" size="lg" fullWidth
              iconLeft={<ArrowLeft size={18} />}
              onClick={() => setStep(1)}
            >
              Quay lại
            </Button>
            <Button
              variant="filled" color="dark" size="lg" fullWidth
              disabled={!back.preview}
              onClick={() => setStep(3)}
            >
              Tiếp tục
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 3: Liveness Detection ────────────────────────────────── */}
      {step === 3 && (
        <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 20, alignItems: "center" }}>
          <Text variant="subtitle2" weight="semibold" color="#1A1F36" style={{ alignSelf: "flex-start" }}>
            Bước 3 — Quét khuôn mặt 3D (Liveness)
          </Text>

          {/* Face frame simulation */}
          <div style={{
            width:        240, height: 300, borderRadius: "50% / 40%",
            border:       liveness === "scanning" ? "3px solid #BEFF6C" : liveness === "done" ? "3px solid #00D68F" : "3px dashed #CBD5E0",
            background:   "#000",
            display:      "flex", flexDirection: "column",
            alignItems:   "center", justifyContent: "center",
            transition:   "border 0.5s",
            position:     "relative",
          }}>
            {liveness === "idle" && (
              <>
                <Camera size={48} color="#4A5568" />
                <Text variant="caption" color="#718096" style={{ marginTop: 12 }}>Nhìn thẳng vào camera</Text>
              </>
            )}
            {liveness === "scanning" && (
              <>
                <div style={{
                  width: 80, height: 80, borderRadius: "50%",
                  background: "rgba(190,255,108,0.2)",
                  border: "3px solid #BEFF6C",
                  animation: "pulse 1s infinite",
                }} />
                <Text variant="caption" color="#BEFF6C" style={{ marginTop: 12 }}>Đang quét...</Text>
              </>
            )}
            {liveness === "done" && (
              <>
                <CheckCircle size={56} color="#00D68F" />
                <Text variant="caption" color="#00D68F" style={{ marginTop: 12 }} weight="semibold">
                  Xác thực thành công
                </Text>
              </>
            )}
          </div>

          {liveness === "idle" && (
            <Button variant="filled" color="dark" size="lg" fullWidth iconLeft={<Camera size={18} />}
              onClick={simulateLiveness}>
              Bắt đầu quét khuôn mặt
            </Button>
          )}
          {liveness === "done" && (
            <Button variant="filled" color="dark" size="lg" fullWidth
              onClick={() => setStep(4)}>
              Tiếp tục xem lại
            </Button>
          )}
          <Button variant="ghost" color="dark" size="sm" onClick={() => setStep(2)}>
            Quay lại
          </Button>
        </div>
      )}

      {/* ── Step 4: Review & Submit ───────────────────────────────────── */}
      {step === 4 && (
        <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 16 }}>
          <Text variant="subtitle2" weight="semibold" color="#1A1F36">
            Bước 4 — Xem lại & Xác nhận
          </Text>

          <div style={{ display: "flex", gap: 10 }}>
            {[front, back].map((s, i) => (
              <div key={i} style={{ flex: 1, borderRadius: 12, overflow: "hidden", height: 100, background: "#F5F6FA", position: "relative" }}>
                {s.preview && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.preview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                )}
                <div style={{ position: "absolute", bottom: 4, left: 6 }}>
                  <Badge variant="label" color="success" label={i === 0 ? "Mặt trước" : "Mặt sau"} />
                </div>
              </div>
            ))}
          </div>

          {[
            { label: "Loại giấy tờ",  value: docType === "cccd" ? "CCCD / CMND" : "Hộ chiếu" },
            { label: "Liveness",       value: liveness === "done" ? "✓ Passed" : "Chưa xác thực" },
            { label: "Cấp độ KYC",    value: "Cấp 2 (ISO 29003)" },
          ].map(r => (
            <div key={r.label} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #F3F4F6", paddingBottom: 10 }}>
              <Text variant="body2" color="#718096">{r.label}</Text>
              <Text variant="body2" weight="semibold" color="#1A1F36">{r.value}</Text>
            </div>
          ))}

          <Button
            variant="filled" color="dark" size="lg" fullWidth
            loading={submitting}
            onClick={handleSubmit}
          >
            Gửi xác minh
          </Button>
        </div>
      )}

      {/* Done Modal */}
      <Modal
        open={doneModal}
        onClose={() => { setDoneModal(false); window.location.href = "/more"; }}
        variant="center"
        title="Đã gửi thành công!"
        subtitle="Hồ sơ eKYC của bạn đang được xử lý. Thường mất 1–3 phút để hoàn tất."
        footer={
          <Button variant="filled" color="dark" size="lg" fullWidth
            onClick={() => window.location.href = "/more"}>
            Về cài đặt
          </Button>
        }
      />
      <style>{`@keyframes pulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.15);opacity:0.7} }`}</style>
    </div>
  );
}
