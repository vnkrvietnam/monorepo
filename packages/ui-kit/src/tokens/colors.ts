/**
 * @vnkrvietnam/ui — Color Tokens
 * Source: VNKR Design-system / Color-palette / Color-palette.png
 *
 * Palette gốc VNKR:
 *  - Dark / Info / Success / Warning / Error / Greyscale
 *  - Brand accents: dark, grey, magenta, orange, greeny, violet, blue, yellow
 *  - 8 shades mỗi semantic tone (dark → light)
 */

// ─── Semantic base ────────────────────────────────────────────────────────────
export const colorDark      = "#000000";
export const colorInfo      = "#0095FF";
export const colorSuccess   = "#00D68F";
export const colorWarning   = "#FFAA00";
export const colorError     = "#FF3D71";
export const colorGreyscale = "#2E3A59";
export const colorWhite     = "#FFFFFF";

// ─── VNKR Brand palette ───────────────────────────────────────────────────────
export const colorBrand = {
  /** Solid black — primary brand colour */
  dark:    "#000000",
  /** Light grey — secondary neutral */
  grey:    "#EFEFEF",
  /** Magenta/hot-pink accent */
  magenta: "#FD9FDD",
  /** Warm orange accent */
  orange:  "#FC7339",
  /** Lime green accent */
  greeny:  "#BEFF6C",
  /** Soft violet accent */
  violet:  "#AF96FB",
  /** Teal/aqua accent */
  blue:    "#49DBC8",
  /** Lemon yellow accent */
  yellow:  "#FFF172",
} as const;

// ─── Shade scales (index 0 = darkest, 7 = lightest) ──────────────────────────
export const colorShades = {
  info: [
    "#1A2980", "#1E3FAA", "#0074D9", "#0095FF",
    "#4DB8FF", "#99D6FF", "#CCF0FF", "#EBF8FF",
  ],
  success: [
    "#004D40", "#006652", "#00897B", "#00D68F",
    "#66EFCA", "#B2F7E3", "#D9FBF2", "#F0FFF9",
  ],
  warning: [
    "#7A4700", "#A35C00", "#CC7A00", "#FFAA00",
    "#FFCC66", "#FFE5B2", "#FFF3D9", "#FFFBF0",
  ],
  error: [
    "#7A0033", "#A3004A", "#CC005C", "#FF3D71",
    "#FF8FAA", "#FFB3C6", "#FFD6E0", "#FFF0F4",
  ],
  greyscale: [
    "#000000", "#1A1F36", "#2E3A59", "#4A5568",
    "#718096", "#A0AEC0", "#CBD5E0", "#EDF2F7",
  ],
} as const;

// ─── Background / surface helpers ────────────────────────────────────────────
export const colorBackground = {
  /** App background */
  surface: "#FFFFFF",
  /** Subtle off-white card surface */
  muted:   "#F5F6FA",
  /** Screen-specific brand backgrounds */
  violet:  "#AF96FB",
  pink:    "#FD9FDD",
  greeny:  "#BEFF6C",
  yellow:  "#FFF172",
  orange:  "#FC7339",
} as const;

// ─── Unified export ───────────────────────────────────────────────────────────
export const colors = {
  dark:       colorDark,
  info:       colorInfo,
  success:    colorSuccess,
  warning:    colorWarning,
  error:      colorError,
  greyscale:  colorGreyscale,
  white:      colorWhite,
  brand:      colorBrand,
  shades:     colorShades,
  background: colorBackground,
} as const;

export type ColorBrand      = keyof typeof colorBrand;
export type ColorBackground = keyof typeof colorBackground;
export type SemanticColor   = "info" | "success" | "warning" | "error" | "greyscale";
