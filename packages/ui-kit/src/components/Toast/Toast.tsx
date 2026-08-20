/**
 * @vnkrvietnam/ui — Toast / Notification System
 * Global toast notifications with a React context-based API
 *
 * Usage:
 *   // Wrap app root:
 *   <ToastProvider />  (renders portal + listens internally)
 *
 *   // Anywhere in the tree:
 *   import { toast } from "@vnkrvietnam/ui-kit";
 *   toast.success("Payment sent!");
 *   toast.error("Transaction failed", { duration: 6000 });
 *   toast.info("KYC under review");
 *   toast.warning("Balance low");
 *   toast.custom(<MyNode />);
 *
 * Features:
 *   - 5 variants: success / error / warning / info / dark
 *   - Position: top-right | top-center | bottom-right | bottom-center
 *   - Auto-dismiss with progress bar
 *   - Pause on hover
 *   - Close button
 *   - Max stack (default 5)
 *   - Stacked with vertical offset
 */
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  createContext,
  useContext,
  useMemo,
} from "react";
import type { CSSProperties, ReactNode } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ToastVariant  = "success" | "error" | "warning" | "info" | "dark";
export type ToastPosition = "top-right" | "top-center" | "bottom-right" | "bottom-center";

export interface ToastOptions {
  /** Duration in ms. 0 = persistent */
  duration?: number;
  /** Position override */
  position?:  ToastPosition;
  /** Icon override */
  icon?:      ReactNode;
  /** Show progress bar */
  progress?:  boolean;
}

export interface ToastItem {
  id:        string;
  variant:   ToastVariant;
  message:   ReactNode;
  duration:  number;
  position:  ToastPosition;
  icon?:     ReactNode;
  progress:  boolean;
  createdAt: number;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const DEFAULT_DURATION = 4000;
const DEFAULT_POSITION: ToastPosition = "top-right";
const MAX_TOASTS = 5;

const VARIANT_MAP: Record<ToastVariant, { bg: string; fg: string; accent: string; icon: string }> = {
  success: { bg: "#ECFDF5", fg: "#065F46", accent: "#00D68F", icon: "✓" },
  error:   { bg: "#FFF1F2", fg: "#9F1239", accent: "#FF3D71", icon: "✕" },
  warning: { bg: "#FFFBEB", fg: "#92400E", accent: "#FFAA00", icon: "⚠" },
  info:    { bg: "#EFF6FF", fg: "#1E40AF", accent: "#0095FF", icon: "ℹ" },
  dark:    { bg: "#1A1F36", fg: "#FFFFFF", accent: "#BEFF6C", icon: "●" },
};

// ─── Internal event bus (no React dependency for toast() calls) ───────────────

type Listener = (item: ToastItem) => void;
type RemoveListener = (id: string) => void;

const listeners:       Listener[]       = [];
const removeListeners: RemoveListener[] = [];

function emitAdd(item: ToastItem) {
  listeners.forEach(fn => fn(item));
}
function emitRemove(id: string) {
  removeListeners.forEach(fn => fn(id));
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function createToast(
  variant: ToastVariant,
  message: ReactNode,
  opts: ToastOptions = {}
): string {
  const id = uid();
  emitAdd({
    id,
    variant,
    message,
    duration:  opts.duration ?? DEFAULT_DURATION,
    position:  opts.position ?? DEFAULT_POSITION,
    icon:      opts.icon,
    progress:  opts.progress ?? true,
    createdAt: Date.now(),
  });
  return id;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const toast = {
  success: (msg: ReactNode, opts?: ToastOptions) => createToast("success", msg, opts),
  error:   (msg: ReactNode, opts?: ToastOptions) => createToast("error",   msg, opts),
  warning: (msg: ReactNode, opts?: ToastOptions) => createToast("warning", msg, opts),
  info:    (msg: ReactNode, opts?: ToastOptions) => createToast("info",    msg, opts),
  dark:    (msg: ReactNode, opts?: ToastOptions) => createToast("dark",    msg, opts),
  dismiss: (id: string) => emitRemove(id),
  custom:  (node: ReactNode, opts?: ToastOptions) => createToast("dark",  node, opts),
};

// ─── ToastProvider ────────────────────────────────────────────────────────────

export interface ToastProviderProps {
  /** Default position for all toasts */
  position?: ToastPosition;
  /** Max toasts visible at once */
  maxToasts?: number;
}

export function ToastProvider({
  position:  defaultPos  = DEFAULT_POSITION,
  maxToasts: max         = MAX_TOASTS,
}: ToastProviderProps) {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    const addFn: Listener = (item) => {
      setItems(prev => {
        const updated = [item, ...prev].slice(0, max);
        return updated;
      });
    };
    const removeFn: RemoveListener = (id) => {
      setItems(prev => prev.filter(i => i.id !== id));
    };
    listeners.push(addFn);
    removeListeners.push(removeFn);
    return () => {
      listeners.splice(listeners.indexOf(addFn), 1);
      removeListeners.splice(removeListeners.indexOf(removeFn), 1);
    };
  }, [max]);

  const dismiss = useCallback((id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  }, []);

  // Group by position
  const grouped = useMemo(() => {
    const groups: Partial<Record<ToastPosition, ToastItem[]>> = {};
    items.forEach(item => {
      const pos = item.position ?? defaultPos;
      (groups[pos] ??= []).push(item);
    });
    return groups;
  }, [items, defaultPos]);

  return (
    <>
      {(Object.entries(grouped) as [ToastPosition, ToastItem[]][]).map(([pos, posItems]) => (
        <ToastContainer key={pos} position={pos} items={posItems} onDismiss={dismiss} />
      ))}
    </>
  );
}

// ─── Toast container per position ────────────────────────────────────────────

function ToastContainer({ position, items, onDismiss }: {
  position: ToastPosition;
  items:    ToastItem[];
  onDismiss: (id: string) => void;
}) {
  const isTop     = position.startsWith("top");
  const isCenter  = position.endsWith("center");

  const containerStyle: CSSProperties = {
    position:       "fixed",
    zIndex:         1000,
    display:        "flex",
    flexDirection:  isTop ? "column" : "column-reverse",
    gap:            10,
    padding:        16,
    pointerEvents:  "none",
    // Horizontal
    ...(isCenter
      ? { left: "50%", transform: "translateX(-50%)" }
      : { right: 16 }
    ),
    // Vertical
    ...(isTop ? { top: 0 } : { bottom: 0 }),
    maxWidth:       400,
    width:          "100%",
  };

  return (
    <div style={containerStyle} role="region" aria-label="Notifications">
      {items.map(item => (
        <ToastCard key={item.id} item={item} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

// ─── Single toast card ────────────────────────────────────────────────────────

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: (id: string) => void }) {
  const [paused,  setPaused]  = useState(false);
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(100);
  const elapsed   = useRef(0);
  const lastTick  = useRef(Date.now());
  const rafId     = useRef<number>(0);

  const c = VARIANT_MAP[item.variant];

  // Auto-dismiss countdown
  useEffect(() => {
    if (item.duration === 0) return;

    const tick = () => {
      if (!paused) {
        const now  = Date.now();
        elapsed.current += now - lastTick.current;
        lastTick.current = now;
        const pct = Math.max(0, 100 - (elapsed.current / item.duration) * 100);
        setProgress(pct);
        if (elapsed.current >= item.duration) {
          setVisible(false);
          setTimeout(() => onDismiss(item.id), 280);
          return;
        }
      } else {
        lastTick.current = Date.now();
      }
      rafId.current = requestAnimationFrame(tick);
    };

    rafId.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId.current);
  }, [item.duration, item.id, onDismiss, paused]);

  const cardStyle: CSSProperties = {
    display:        "flex",
    alignItems:     "flex-start",
    gap:            10,
    background:     c.bg,
    borderRadius:   12,
    padding:        "12px 14px",
    boxShadow:      "0 4px 20px rgba(0,0,0,0.12)",
    pointerEvents:  "all",
    position:       "relative",
    overflow:       "hidden",
    borderLeft:     `3px solid ${c.accent}`,
    animation:      visible
      ? "vnkr-toast-in 0.25s cubic-bezier(0.4,0,0.2,1)"
      : "vnkr-toast-out 0.25s cubic-bezier(0.4,0,0.2,1) forwards",
    fontFamily:     "'Work Sans', sans-serif",
    minWidth:       280,
    maxWidth:       360,
    width:          "100%",
    boxSizing:      "border-box",
  };

  return (
    <>
      <style>{`
        @keyframes vnkr-toast-in  { from { opacity:0; transform: translateY(-8px) scale(0.95) } to { opacity:1; transform: translateY(0) scale(1) } }
        @keyframes vnkr-toast-out { from { opacity:1; transform: scale(1) } to { opacity:0; transform: scale(0.95) } }
      `}</style>
      <div
        style={cardStyle}
        role="alert"
        aria-live="polite"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Icon */}
        <span style={{
          width: 22, height: 22, borderRadius: "50%", background: c.accent,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, fontWeight: 700, color: item.variant === "dark" ? "#000" : "#fff",
          flexShrink: 0,
        } as CSSProperties}>
          {item.icon ?? c.icon}
        </span>

        {/* Message */}
        <div style={{ flex: 1, fontSize: 13, fontWeight: 500, color: c.fg, lineHeight: 1.5, paddingTop: 2 }}>
          {item.message}
        </div>

        {/* Close button */}
        <button
          onClick={() => { setVisible(false); setTimeout(() => onDismiss(item.id), 280); }}
          aria-label="Dismiss notification"
          style={{
            background: "transparent", border: "none", cursor: "pointer",
            padding: 2, color: `${c.fg}80`, flexShrink: 0, lineHeight: 1,
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        {/* Progress bar */}
        {item.progress && item.duration > 0 && (
          <div style={{
            position: "absolute", bottom: 0, left: 0,
            height:   3,
            width:    `${progress}%`,
            background: c.accent,
            borderRadius: "0 99px 99px 0",
            transition: "width 0.1s linear",
          }} />
        )}
      </div>
    </>
  );
}
