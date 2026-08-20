/**
 * @vnkrvietnam/ui — Modal / BottomSheet
 * Slide-up bottom sheet + centered modal overlay
 *
 * Variants:
 *   sheet  — slides up from bottom (mobile-first, like Appearance modal)
 *   center — centered dialog (tablet/desktop)
 *
 * Features:
 *   - backdrop with blur-dimming
 *   - drag handle (sheet)
 *   - close button
 *   - keyboard ESC support
 *   - aria-modal, role="dialog"
 *   - body scroll lock while open
 */
import React, { useEffect, useCallback, useRef } from "react";
import type { CSSProperties, ReactNode, KeyboardEvent } from "react";

export type ModalVariant = "sheet" | "center";

export interface ModalProps {
  open:         boolean;
  onClose:      () => void;
  variant?:     ModalVariant;
  title?:       string;
  /** Subtitle or description */
  subtitle?:    string;
  children?:    ReactNode;
  /** Footer action slot */
  footer?:      ReactNode;
  /** Whether clicking the backdrop closes the modal */
  closeOnBackdrop?: boolean;
  /** Max width for center variant */
  maxWidth?:    number;
  style?:       CSSProperties;
}

export function Modal({
  open,
  onClose,
  variant          = "sheet",
  title,
  subtitle,
  children,
  footer,
  closeOnBackdrop  = true,
  maxWidth         = 480,
  style,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // ── ESC to close ──────────────────────────────────────────────────────────
  const handleKey = useCallback((e: globalThis.KeyboardEvent) => {
    if (e.key === "Escape" && open) onClose();
  }, [open, onClose]);

  useEffect(() => {
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  // ── Body scroll lock ──────────────────────────────────────────────────────
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [open]);

  // ── Focus trap (auto-focus dialog) ────────────────────────────────────────
  useEffect(() => {
    if (open) dialogRef.current?.focus();
  }, [open]);

  if (!open) return null;

  // ── Backdrop ──────────────────────────────────────────────────────────────
  const backdropStyle: CSSProperties = {
    position:   "fixed",
    inset:      0,
    background: "rgba(0,0,0,0.5)",
    zIndex:     1000,
    display:    "flex",
    alignItems: variant === "center" ? "center" : "flex-end",
    justifyContent: "center",
    // Simple fade-in (no JS animation needed — just visible)
    animation:  "vnkr-fade-in 0.18s ease",
  };

  // ── Dialog ────────────────────────────────────────────────────────────────
  const dialogStyle: CSSProperties = {
    position:     "relative",
    background:   "#FFFFFF",
    width:        "100%",
    maxWidth:     variant === "center" ? maxWidth : "100%",
    maxHeight:    variant === "center" ? "90vh" : "85vh",
    overflowY:    "auto",
    outline:      "none",
    // Sheet: rounded top corners only
    borderRadius: variant === "center" ? 20 : "20px 20px 0 0",
    padding:      "0 0 24px",
    animation:    variant === "center"
      ? "vnkr-scale-in 0.2s cubic-bezier(0.4,0,0.2,1)"
      : "vnkr-slide-up 0.28s cubic-bezier(0.4,0,0.2,1)",
    ...style,
  };

  return (
    <>
      <style>{`
        @keyframes vnkr-fade-in   { from { opacity: 0 } to { opacity: 1 } }
        @keyframes vnkr-slide-up  { from { transform: translateY(100%) } to { transform: translateY(0) } }
        @keyframes vnkr-scale-in  { from { opacity: 0; transform: scale(0.95) } to { opacity: 1; transform: scale(1) } }
      `}</style>

      <div
        style={backdropStyle}
        onClick={closeOnBackdrop ? onClose : undefined}
        role="presentation"
      >
        <div
          ref={dialogRef}
          style={dialogStyle}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? "vnkr-modal-title" : undefined}
          tabIndex={-1}
          onClick={e => e.stopPropagation()}
        >
          {/* Drag handle (sheet only) */}
          {variant === "sheet" && (
            <div style={{
              display:       "flex",
              justifyContent:"center",
              padding:       "12px 0 4px",
            }}>
              <div style={{
                width:        40,
                height:       4,
                borderRadius: 99,
                background:   "#E0E0E0",
              }} />
            </div>
          )}

          {/* Header */}
          {(title || variant === "center") && (
            <div style={{
              display:        "flex",
              alignItems:     "center",
              justifyContent: "space-between",
              padding:        "16px 24px 8px",
              borderBottom:   (children || footer) ? "1px solid #F3F4F6" : "none",
            }}>
              <div>
                {title && (
                  <div id="vnkr-modal-title" style={{
                    fontSize:  17,
                    fontWeight:700,
                    color:     "#1A1F36",
                    fontFamily:"'Work Sans', sans-serif",
                  }}>
                    {title}
                  </div>
                )}
                {subtitle && (
                  <div style={{
                    fontSize:  13,
                    color:     "#8F9BB3",
                    fontFamily:"'Work Sans', sans-serif",
                    marginTop: 2,
                  }}>
                    {subtitle}
                  </div>
                )}
              </div>
              {/* Close × button */}
              <button
                onClick={onClose}
                aria-label="Close"
                style={{
                  width:      32,
                  height:     32,
                  borderRadius:"50%",
                  background: "#F5F6FA",
                  border:     "none",
                  cursor:     "pointer",
                  display:    "flex",
                  alignItems: "center",
                  justifyContent:"center",
                  flexShrink: 0,
                  color:      "#4A5568",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          )}

          {/* Body */}
          {children && (
            <div style={{ padding: "16px 24px 0" }}>
              {children}
            </div>
          )}

          {/* Footer */}
          {footer && (
            <div style={{
              padding:    "16px 24px 0",
              borderTop:  "1px solid #F3F4F6",
              marginTop:  16,
            }}>
              {footer}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
