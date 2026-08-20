/**
 * @vnkrvietnam/ui — Shadow & Elevation Tokens
 * 5-level elevation system inspired by Material Design + VNKR brand aesthetics
 */

export const shadows = {
  /** No shadow — flat surface */
  none: "none",
  /** Subtle — cards on surface */
  xs:   "0 1px 2px rgba(0,0,0,0.05)",
  /** Default card shadow */
  sm:   "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)",
  /** Raised card, dropdown */
  md:   "0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06)",
  /** Modal, popover */
  lg:   "0 10px 15px rgba(0,0,0,0.08), 0 4px 6px rgba(0,0,0,0.05)",
  /** Full-page overlay, drawer */
  xl:   "0 20px 25px rgba(0,0,0,0.10), 0 10px 10px rgba(0,0,0,0.04)",
  /** Maximum elevation — toast, command palette */
  "2xl":"0 25px 50px rgba(0,0,0,0.15)",

  // ── Colored brand shadows (for buttons / accents) ─────────────────────
  info:    "0 4px 14px rgba(0,149,255,0.35)",
  success: "0 4px 14px rgba(0,214,143,0.35)",
  warning: "0 4px 14px rgba(255,170,0,0.35)",
  error:   "0 4px 14px rgba(255,61,113,0.35)",
  dark:    "0 4px 14px rgba(0,0,0,0.25)",
} as const;

export type ShadowKey = keyof typeof shadows;

/** Elevation level → shadow name map */
export const elevation: Record<0|1|2|3|4|5, ShadowKey> = {
  0: "none",
  1: "xs",
  2: "sm",
  3: "md",
  4: "lg",
  5: "xl",
} as const;
