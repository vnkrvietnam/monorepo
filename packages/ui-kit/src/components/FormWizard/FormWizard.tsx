/**
 * @vnkrvietnam/ui — FormWizard
 * Multi-step form with progress indicator
 * Used by: kyc.vnkr.vn (eKYC onboarding), merchant registration, P2P onboarding
 *
 * Features:
 *   - Numbered step indicator (linear progress bar + step dots)
 *   - Step validation before proceeding
 *   - Animated step transitions (slide left/right)
 *   - Navigation: Back / Next / Submit
 *   - Optional step subtitle / description
 *   - Optional step icon
 *   - Controlled + uncontrolled mode
 *   - onComplete callback
 */
import React, { useState, useCallback } from "react";
import type { CSSProperties, ReactNode } from "react";
import { Button } from "../Button/Button";
import { shadows } from "../../tokens/shadows";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WizardStep {
  id:          string;
  title:       string;
  /** Subtitle shown under step title in header */
  subtitle?:   string;
  /** Icon shown in step dot */
  icon?:       ReactNode;
  /** Content rendered for this step */
  content:     ReactNode;
  /** Called before going to next step — return false/string to block */
  onValidate?: () => boolean | string | Promise<boolean | string>;
  /** Hide Back button on this step */
  hideBack?:   boolean;
  /** Custom Next/Submit label for this step */
  nextLabel?:  string;
}

export interface FormWizardProps {
  steps:           WizardStep[];
  /** Controlled active step index */
  activeStep?:     number;
  onStepChange?:   (index: number) => void;
  onComplete?:     () => void;
  /** Label for the final submit button */
  submitLabel?:    string;
  /** Label for the back button */
  backLabel?:      string;
  /** Label for the next button */
  nextLabel?:      string;
  /** Disable the Next button while validating */
  loading?:        boolean;
  /** Card style wrapper */
  card?:           boolean;
  style?:          CSSProperties;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FormWizard({
  steps,
  activeStep:    controlledStep,
  onStepChange,
  onComplete,
  submitLabel  = "Submit",
  backLabel    = "Back",
  nextLabel    = "Continue",
  loading      = false,
  card         = true,
  style,
}: FormWizardProps) {
  const [internalStep, setInternalStep] = useState(0);
  const [validating,   setValidating]   = useState(false);
  const [errorMsg,     setErrorMsg]     = useState<string | null>(null);
  const [direction,    setDirection]    = useState<"forward" | "back">("forward");

  const current  = controlledStep ?? internalStep;
  const step     = steps[current];
  const isFirst  = current === 0;
  const isLast   = current === steps.length - 1;
  const progress = ((current) / (steps.length - 1)) * 100;

  const goTo = useCallback((idx: number) => {
    setDirection(idx > current ? "forward" : "back");
    if (controlledStep === undefined) setInternalStep(idx);
    onStepChange?.(idx);
    setErrorMsg(null);
  }, [current, controlledStep, onStepChange]);

  const handleNext = async () => {
    setErrorMsg(null);
    if (step.onValidate) {
      setValidating(true);
      const result = await step.onValidate();
      setValidating(false);
      if (result === false) return;
      if (typeof result === "string") { setErrorMsg(result); return; }
    }
    if (isLast) {
      onComplete?.();
    } else {
      goTo(current + 1);
    }
  };

  const handleBack = () => {
    if (!isFirst) goTo(current - 1);
  };

  const wrapStyle: CSSProperties = {
    fontFamily: "'Work Sans', sans-serif",
    ...(card && {
      background:   "#FFFFFF",
      borderRadius: 16,
      boxShadow:    shadows.lg,
      border:       "1px solid #F3F4F6",
    }),
    ...style,
  };

  return (
    <div style={wrapStyle}>
      {/* ── Step progress header ─────────────────────────────────────────── */}
      <div style={{ padding: "24px 24px 0" }}>
        {/* Linear progress bar */}
        <div style={{
          height:       4,
          background:   "#F3F4F6",
          borderRadius: 99,
          overflow:     "hidden",
          marginBottom: 20,
        }}>
          <div style={{
            height:     "100%",
            width:      `${progress}%`,
            background: "#000000",
            borderRadius: 99,
            transition: "width 0.35s cubic-bezier(0.4,0,0.2,1)",
          }} />
        </div>

        {/* Step dots */}
        <div style={{
          display:        "flex",
          alignItems:     "center",
          justifyContent: "space-between",
          position:       "relative",
          marginBottom:   24,
        }}>
          {/* Connector line behind dots */}
          <div style={{
            position:   "absolute",
            top:        "50%",
            left:       0,
            right:      0,
            height:     1,
            background: "#F3F4F6",
            zIndex:     0,
          }} />

          {steps.map((s, i) => {
            const isDone    = i < current;
            const isCurrent = i === current;
            return (
              <div key={s.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, zIndex: 1 }}>
                <div style={{
                  width:        32,
                  height:       32,
                  borderRadius: "50%",
                  background:   isDone ? "#000" : (isCurrent ? "#000" : "#F3F4F6"),
                  color:        isDone || isCurrent ? "#fff" : "#A0AEC0",
                  display:      "flex",
                  alignItems:   "center",
                  justifyContent: "center",
                  fontSize:     12,
                  fontWeight:   700,
                  border:       isCurrent ? "2px solid #000" : "2px solid transparent",
                  transition:   "background 0.2s, border-color 0.2s",
                  cursor:       isDone ? "pointer" : "default",
                  boxSizing:    "border-box",
                }}
                  onClick={() => isDone && goTo(i)}
                  title={s.title}
                >
                  {isDone
                    ? <CheckIcon />
                    : (s.icon ?? <span>{i + 1}</span>)
                  }
                </div>
                <span style={{
                  fontSize:  10,
                  fontWeight: isCurrent ? 700 : 400,
                  color:     isCurrent ? "#000" : (isDone ? "#4A5568" : "#A0AEC0"),
                  whiteSpace: "nowrap",
                  maxWidth:   80,
                  overflow:   "hidden",
                  textOverflow: "ellipsis",
                  textAlign:  "center",
                }}>
                  {s.title}
                </span>
              </div>
            );
          })}
        </div>

        {/* Current step title */}
        <div style={{ marginBottom: 20 }}>
          <h3 style={{
            fontSize:  20,
            fontWeight:700,
            color:     "#1A1F36",
            margin:    0,
            lineHeight:1.2,
            fontFamily:"'Work Sans', sans-serif",
          }}>
            {step.title}
          </h3>
          {step.subtitle && (
            <p style={{
              fontSize:  13,
              color:     "#718096",
              margin:    "6px 0 0",
              lineHeight:1.5,
              fontFamily:"'Work Sans', sans-serif",
            }}>
              {step.subtitle}
            </p>
          )}
        </div>
      </div>

      {/* ── Step content ─────────────────────────────────────────────────── */}
      <div style={{
        padding:   "0 24px",
        overflow:  "hidden",
      }}>
        <div style={{
          animation: `vnkr-wizard-${direction} 0.22s cubic-bezier(0.4,0,0.2,1)`,
        }}>
          <style>{`
            @keyframes vnkr-wizard-forward { from { opacity:0; transform:translateX(24px)  } to { opacity:1; transform:translateX(0) } }
            @keyframes vnkr-wizard-back    { from { opacity:0; transform:translateX(-24px) } to { opacity:1; transform:translateX(0) } }
          `}</style>
          {step.content}
        </div>
      </div>

      {/* ── Error message ────────────────────────────────────────────────── */}
      {errorMsg && (
        <div style={{
          margin:       "12px 24px 0",
          padding:      "10px 14px",
          background:   "#FFF1F2",
          borderRadius: 8,
          borderLeft:   "3px solid #FF3D71",
          fontSize:     13,
          color:        "#9F1239",
          fontFamily:   "'Work Sans', sans-serif",
        }}>
          {errorMsg}
        </div>
      )}

      {/* ── Navigation buttons ───────────────────────────────────────────── */}
      <div style={{
        display:        "flex",
        justifyContent: isFirst ? "flex-end" : "space-between",
        padding:        "20px 24px 24px",
        gap:            12,
      }}>
        {!isFirst && !step.hideBack && (
          <Button
            variant="outlined"
            color="dark"
            size="lg"
            onClick={handleBack}
            disabled={loading || validating}
          >
            {backLabel}
          </Button>
        )}

        <Button
          variant="filled"
          color="dark"
          size="lg"
          onClick={handleNext}
          loading={loading || validating}
        >
          {isLast
            ? submitLabel
            : (step.nextLabel ?? nextLabel)
          }
        </Button>
      </div>
    </div>
  );
}

// ─── Micro icons ──────────────────────────────────────────────────────────────
function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}
