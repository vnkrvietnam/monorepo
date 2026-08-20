/**
 * @vnkrvietnam/ui — Typography Tokens
 * Font: Work Sans — Semibold / Medium / Regular
 * Source: VNKR Design-system / Icon-set / Typography.png
 */

export const fontFamily = {
  base: "'Work Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
} as const;

export const fontWeight = {
  regular:  400,
  medium:   500,
  semibold: 600,
} as const;

/** px → rem map (base 16px) */
export const fontSize = {
  // Headlines
  h1: "6rem",      // 96px
  h2: "3.75rem",   // 60px
  h3: "3rem",      // 48px
  h4: "2.125rem",  // 34px
  h5: "1.5rem",    // 24px
  h6: "1.25rem",   // 20px
  // Subtitle
  subtitle1: "1rem",     // 16px
  subtitle2: "0.875rem", // 14px
  // Body
  body1:   "1rem",     // 16px
  body2:   "0.875rem", // 14px
  caption: "0.75rem",  // 12px
  overline:"0.625rem", // 10px
  // Button
  btnGiant:  "1.25rem",  // 20px
  btnLarge:  "1rem",     // 16px
  btnMedium: "0.875rem", // 14px
  btnSmall:  "0.75rem",  // 12px
} as const;

export const lineHeight = {
  tight:   1.2,
  normal:  1.5,
  relaxed: 1.75,
} as const;

export const letterSpacing = {
  tight:  "-0.01em",
  normal: "0em",
  wide:   "0.05em",
  wider:  "0.1em",
} as const;

export const typography = {
  fontFamily,
  fontWeight,
  fontSize,
  lineHeight,
  letterSpacing,
} as const;

export type FontSize    = keyof typeof fontSize;
export type FontWeight  = keyof typeof fontWeight;
export type LineHeight  = keyof typeof lineHeight;
