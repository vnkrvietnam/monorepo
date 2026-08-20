/**
 * @vnkrvietnam/ui — Spacing & Sizing Tokens
 */

// Base unit: 4px
export const spacing = {
  0:   "0px",
  1:   "4px",
  2:   "8px",
  3:   "12px",
  4:   "16px",
  5:   "20px",
  6:   "24px",
  8:   "32px",
  10:  "40px",
  12:  "48px",
  14:  "56px",
  16:  "64px",
  20:  "80px",
  24:  "96px",
} as const;

export const borderRadius = {
  none:   "0px",
  sm:     "4px",
  md:     "8px",
  lg:     "12px",
  xl:     "16px",
  "2xl":  "24px",
  full:   "9999px",
} as const;

export const shadow = {
  sm:  "0 1px 3px rgba(0,0,0,0.08)",
  md:  "0 4px 12px rgba(0,0,0,0.10)",
  lg:  "0 8px 24px rgba(0,0,0,0.12)",
  xl:  "0 16px 48px rgba(0,0,0,0.16)",
} as const;

export const zIndex = {
  base:    0,
  raised:  10,
  modal:   100,
  overlay: 200,
  toast:   300,
} as const;

export const sizing = {
  iconSm:  "16px",
  iconMd:  "20px",
  iconLg:  "24px",
  iconXl:  "32px",
  avatarSm:"32px",
  avatarMd:"40px",
  avatarLg:"56px",
  navbarHeight: "64px",
  headerHeight: "56px",
  inputHeight:  "52px",
  btnHeightSm:  "32px",
  btnHeightMd:  "44px",
  btnHeightLg:  "52px",
} as const;
