/**
 * @vnkrvietnam/ui — Grid & Layout Tokens
 * 4-column mobile / 8-column tablet / 12-column desktop
 * Base gutter: 16px | Column margin: 20px | Max content width: 1280px
 */

export const grid = {
  columns: {
    mobile:  4,
    tablet:  8,
    desktop: 12,
  },
  gutter: {
    mobile:  "16px",
    tablet:  "20px",
    desktop: "24px",
  },
  margin: {
    mobile:  "20px",
    tablet:  "32px",
    desktop: "80px",
  },
  maxWidth: {
    content: "1280px",
    narrow:  "760px",
    form:    "480px",
  },
} as const;

/** Breakpoints (min-width) */
export const breakpoints = {
  xs:  "375px",
  sm:  "480px",
  md:  "768px",
  lg:  "1024px",
  xl:  "1280px",
  "2xl":"1440px",
} as const;

/** Media-query helpers (CSS-in-JS strings) */
export const mq = {
  mobile:  `@media (max-width: 767px)`,
  tablet:  `@media (min-width: 768px) and (max-width: 1023px)`,
  desktop: `@media (min-width: 1024px)`,
  up: {
    sm:  `@media (min-width: 480px)`,
    md:  `@media (min-width: 768px)`,
    lg:  `@media (min-width: 1024px)`,
    xl:  `@media (min-width: 1280px)`,
  },
} as const;

export type Breakpoint = keyof typeof breakpoints;
