import React from "react";
import type { CSSProperties, ElementType, ReactNode, HTMLAttributes } from "react";
import { fontFamily, fontSize, fontWeight, lineHeight, letterSpacing } from "../../tokens/typography";

// ─── Variant definitions ──────────────────────────────────────────────────────
export type TextVariant =
  | "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
  | "subtitle1" | "subtitle2"
  | "body1" | "body2"
  | "caption" | "overline"
  | "btnGiant" | "btnLarge" | "btnMedium" | "btnSmall";

export type TextWeight = "regular" | "medium" | "semibold";
export type TextAlign  = "left" | "center" | "right" | "justify";

interface VariantConfig {
  tag:     ElementType;
  size:    string;
  weight:  number;
  lh:      number;
  ls:      string;
  transform?: CSSProperties["textTransform"];
}

const VARIANT_MAP: Record<TextVariant, VariantConfig> = {
  h1:        { tag: "h1", size: fontSize.h1,        weight: fontWeight.semibold, lh: lineHeight.tight,   ls: letterSpacing.tight  },
  h2:        { tag: "h2", size: fontSize.h2,        weight: fontWeight.semibold, lh: lineHeight.tight,   ls: letterSpacing.tight  },
  h3:        { tag: "h3", size: fontSize.h3,        weight: fontWeight.semibold, lh: lineHeight.tight,   ls: letterSpacing.normal },
  h4:        { tag: "h4", size: fontSize.h4,        weight: fontWeight.semibold, lh: lineHeight.tight,   ls: letterSpacing.normal },
  h5:        { tag: "h5", size: fontSize.h5,        weight: fontWeight.semibold, lh: lineHeight.normal,  ls: letterSpacing.normal },
  h6:        { tag: "h6", size: fontSize.h6,        weight: fontWeight.semibold, lh: lineHeight.normal,  ls: letterSpacing.normal },
  subtitle1: { tag: "p",  size: fontSize.subtitle1, weight: fontWeight.medium,   lh: lineHeight.normal,  ls: letterSpacing.normal },
  subtitle2: { tag: "p",  size: fontSize.subtitle2, weight: fontWeight.medium,   lh: lineHeight.normal,  ls: letterSpacing.normal },
  body1:     { tag: "p",  size: fontSize.body1,     weight: fontWeight.regular,  lh: lineHeight.relaxed, ls: letterSpacing.normal },
  body2:     { tag: "p",  size: fontSize.body2,     weight: fontWeight.regular,  lh: lineHeight.relaxed, ls: letterSpacing.normal },
  caption:   { tag: "span", size: fontSize.caption, weight: fontWeight.regular,  lh: lineHeight.normal,  ls: letterSpacing.normal },
  overline:  { tag: "span", size: fontSize.overline,weight: fontWeight.regular,  lh: lineHeight.normal,  ls: letterSpacing.wider, transform: "uppercase" },
  btnGiant:  { tag: "span", size: fontSize.btnGiant, weight: fontWeight.semibold, lh: lineHeight.tight,  ls: letterSpacing.wide   },
  btnLarge:  { tag: "span", size: fontSize.btnLarge, weight: fontWeight.semibold, lh: lineHeight.tight,  ls: letterSpacing.wide   },
  btnMedium: { tag: "span", size: fontSize.btnMedium,weight: fontWeight.semibold, lh: lineHeight.tight,  ls: letterSpacing.wide   },
  btnSmall:  { tag: "span", size: fontSize.btnSmall, weight: fontWeight.semibold, lh: lineHeight.tight,  ls: letterSpacing.wide   },
};

// ─── Props ────────────────────────────────────────────────────────────────────
export interface TextProps extends HTMLAttributes<HTMLElement> {
  variant?:  TextVariant;
  weight?:   TextWeight;
  color?:    string;
  align?:    TextAlign;
  truncate?: boolean;
  as?:       ElementType;
  children?: ReactNode;
}

export function Text({
  variant  = "body1",
  weight,
  color    = "#2E3A59",
  align    = "left",
  truncate = false,
  as,
  children,
  style,
  ...rest
}: TextProps) {
  const cfg = VARIANT_MAP[variant];
  const Tag  = as ?? cfg.tag;

  const computed: CSSProperties = {
    fontFamily:    fontFamily.base,
    fontSize:      cfg.size,
    fontWeight:    weight ? fontWeight[weight] : cfg.weight,
    lineHeight:    cfg.lh,
    letterSpacing: cfg.ls,
    textTransform: cfg.transform,
    color,
    textAlign:     align,
    margin:        0,
    padding:       0,
    ...(truncate && {
      overflow:     "hidden",
      textOverflow: "ellipsis",
      whiteSpace:   "nowrap",
    }),
    ...style,
  };

  return (
    <Tag style={computed} {...rest}>
      {children}
    </Tag>
  );
}
