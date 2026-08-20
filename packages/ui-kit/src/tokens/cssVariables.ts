/**
 * @vnkrvietnam/ui — CSS Custom Properties (Design Tokens as CSS variables)
 * Usage: import '@vnkrvietnam/ui/styles' in your app root.
 *
 * All values map 1-to-1 to the TS token files.
 */
const VNKR_CSS_VARIABLES = `
:root {
  /* ── Brand colors ─────────────────────────────────────────── */
  --vnkr-color-dark:       #000000;
  --vnkr-color-white:      #FFFFFF;
  --vnkr-color-info:       #0095FF;
  --vnkr-color-success:    #00D68F;
  --vnkr-color-warning:    #FFAA00;
  --vnkr-color-error:      #FF3D71;
  --vnkr-color-greyscale:  #2E3A59;

  /* ── Brand palette ─────────────────────────────────────────── */
  --vnkr-brand-dark:       #000000;
  --vnkr-brand-grey:       #EFEFEF;
  --vnkr-brand-magenta:    #FD9FDD;
  --vnkr-brand-orange:     #FC7339;
  --vnkr-brand-greeny:     #BEFF6C;
  --vnkr-brand-violet:     #AF96FB;
  --vnkr-brand-blue:       #49DBC8;
  --vnkr-brand-yellow:     #FFF172;

  /* ── Background ────────────────────────────────────────────── */
  --vnkr-bg-surface:       #FFFFFF;
  --vnkr-bg-muted:         #F5F6FA;
  --vnkr-bg-violet:        #AF96FB;
  --vnkr-bg-pink:          #FD9FDD;
  --vnkr-bg-greeny:        #BEFF6C;
  --vnkr-bg-yellow:        #FFF172;
  --vnkr-bg-orange:        #FC7339;

  /* ── Greyscale shades ─────────────────────────────────────── */
  --vnkr-grey-900: #000000;
  --vnkr-grey-800: #1A1F36;
  --vnkr-grey-700: #2E3A59;
  --vnkr-grey-600: #4A5568;
  --vnkr-grey-500: #718096;
  --vnkr-grey-400: #A0AEC0;
  --vnkr-grey-300: #CBD5E0;
  --vnkr-grey-100: #EDF2F7;

  /* ── Typography ────────────────────────────────────────────── */
  --vnkr-font-base:    'Work Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --vnkr-fw-regular:   400;
  --vnkr-fw-medium:    500;
  --vnkr-fw-semibold:  600;

  --vnkr-fs-h1:        6rem;
  --vnkr-fs-h2:        3.75rem;
  --vnkr-fs-h3:        3rem;
  --vnkr-fs-h4:        2.125rem;
  --vnkr-fs-h5:        1.5rem;
  --vnkr-fs-h6:        1.25rem;
  --vnkr-fs-subtitle1: 1rem;
  --vnkr-fs-subtitle2: 0.875rem;
  --vnkr-fs-body1:     1rem;
  --vnkr-fs-body2:     0.875rem;
  --vnkr-fs-caption:   0.75rem;
  --vnkr-fs-overline:  0.625rem;
  --vnkr-fs-btn-giant: 1.25rem;
  --vnkr-fs-btn-large: 1rem;
  --vnkr-fs-btn-md:    0.875rem;
  --vnkr-fs-btn-sm:    0.75rem;

  /* ── Spacing (base 4px) ────────────────────────────────────── */
  --vnkr-space-1:  4px;
  --vnkr-space-2:  8px;
  --vnkr-space-3:  12px;
  --vnkr-space-4:  16px;
  --vnkr-space-5:  20px;
  --vnkr-space-6:  24px;
  --vnkr-space-8:  32px;
  --vnkr-space-10: 40px;
  --vnkr-space-12: 48px;
  --vnkr-space-16: 64px;

  /* ── Border radius ─────────────────────────────────────────── */
  --vnkr-radius-sm:   4px;
  --vnkr-radius-md:   8px;
  --vnkr-radius-lg:   12px;
  --vnkr-radius-xl:   16px;
  --vnkr-radius-2xl:  24px;
  --vnkr-radius-full: 9999px;

  /* ── Shadows ───────────────────────────────────────────────── */
  --vnkr-shadow-sm: 0 1px 3px rgba(0,0,0,0.08);
  --vnkr-shadow-md: 0 4px 12px rgba(0,0,0,0.10);
  --vnkr-shadow-lg: 0 8px 24px rgba(0,0,0,0.12);
  --vnkr-shadow-xl: 0 16px 48px rgba(0,0,0,0.16);
}

@keyframes vnkr-skeleton {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
`;

/** Inject CSS variables into <head>. Call once at app root. */
export function injectVnkrTokens(): void {
  if (typeof document === "undefined") return;
  const id = "vnkr-tokens";
  if (document.getElementById(id)) return;
  const style = document.createElement("style");
  style.id = id;
  style.textContent = VNKR_CSS_VARIABLES;
  document.head.appendChild(style);
}

export { VNKR_CSS_VARIABLES };
