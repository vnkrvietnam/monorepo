/**
 * @vnkrvietnam/ui — Icon System
 * Linear stroke style — 24×24 viewport — stroke-width 1.5
 * Source: VNKR Design-system / Icon-set
 *
 * Categories: Arrow · Archive · Business · Call · Files · Money · Users ·
 *             Security · Settings · Notifications · Location · Search ·
 *             Shop · Time · Weather · Grid · Content · Delivery · Building
 */
import React from "react";
import type { SVGAttributes } from "react";

// ─── Base props ───────────────────────────────────────────────────────────────
export interface IconProps extends SVGAttributes<SVGSVGElement> {
  /** px size — default 24 */
  size?: number;
  /** stroke color — default currentColor */
  color?: string;
  /** stroke width — default 1.5 */
  strokeWidth?: number;
}

function Icon({
  size = 24,
  color = "currentColor",
  strokeWidth = 1.5,
  children,
  ...rest
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      {children}
    </svg>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  ARROW category
// ══════════════════════════════════════════════════════════════════════════════

export const ArrowRight   = (p: IconProps) => <Icon {...p}><path d="M5 12h14M13 6l6 6-6 6"/></Icon>;
export const ArrowLeft    = (p: IconProps) => <Icon {...p}><path d="M19 12H5M11 6l-6 6 6 6"/></Icon>;
export const ArrowUp      = (p: IconProps) => <Icon {...p}><path d="M12 19V5M6 11l6-6 6 6"/></Icon>;
export const ArrowDown    = (p: IconProps) => <Icon {...p}><path d="M12 5v14M18 13l-6 6-6-6"/></Icon>;
export const ChevronRight = (p: IconProps) => <Icon {...p}><path d="M9 18l6-6-6-6"/></Icon>;
export const ChevronLeft  = (p: IconProps) => <Icon {...p}><path d="M15 18l-6-6 6-6"/></Icon>;
export const ChevronUp    = (p: IconProps) => <Icon {...p}><path d="M18 15l-6-6-6 6"/></Icon>;
export const ChevronDown  = (p: IconProps) => <Icon {...p}><path d="M6 9l6 6 6-6"/></Icon>;
export const ArrowSwap    = (p: IconProps) => <Icon {...p}><path d="M7 16V4m0 0L4 7m3-3l3 3M17 8v12m0 0l3-3m-3 3l-3-3"/></Icon>;
export const ArrowRefresh = (p: IconProps) => <Icon {...p}><path d="M1 4v6h6"/><path d="M23 20v-6h-6"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15"/></Icon>;
export const ArrowExport  = (p: IconProps) => <Icon {...p}><path d="M12 3v12"/><path d="m8 7 4-4 4 4"/><path d="M20 21H4"/></Icon>;
export const ArrowImport  = (p: IconProps) => <Icon {...p}><path d="M12 21V9"/><path d="m8 17 4 4 4-4"/><path d="M20 3H4"/></Icon>;

// ══════════════════════════════════════════════════════════════════════════════
//  ARCHIVE / BOOKMARK category
// ══════════════════════════════════════════════════════════════════════════════

export const Bookmark       = (p: IconProps) => <Icon {...p}><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></Icon>;
export const BookmarkCheck  = (p: IconProps) => <Icon {...p}><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/><polyline points="9 11 12 14 15 11"/></Icon>;
export const BookmarkPlus   = (p: IconProps) => <Icon {...p}><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/><line x1="12" y1="7" x2="12" y2="13"/><line x1="9" y1="10" x2="15" y2="10"/></Icon>;
export const BookmarkMinus  = (p: IconProps) => <Icon {...p}><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/><line x1="9" y1="10" x2="15" y2="10"/></Icon>;
export const BookOpen       = (p: IconProps) => <Icon {...p}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></Icon>;

// ══════════════════════════════════════════════════════════════════════════════
//  BUSINESS / CHART category
// ══════════════════════════════════════════════════════════════════════════════

export const BarChartIcon    = (p: IconProps) => <Icon {...p}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></Icon>;
export const LineChartIcon   = (p: IconProps) => <Icon {...p}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></Icon>;
export const PieChartIcon    = (p: IconProps) => <Icon {...p}><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></Icon>;
export const TrendUp         = (p: IconProps) => <Icon {...p}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></Icon>;
export const TrendDown       = (p: IconProps) => <Icon {...p}><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></Icon>;
export const Activity        = (p: IconProps) => <Icon {...p}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></Icon>;
export const Monitor         = (p: IconProps) => <Icon {...p}><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></Icon>;

// ══════════════════════════════════════════════════════════════════════════════
//  CALL / PHONE category
// ══════════════════════════════════════════════════════════════════════════════

export const Phone         = (p: IconProps) => <Icon {...p}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></Icon>;
export const PhoneCall     = (p: IconProps) => <Icon {...p}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/><path d="M14.05 2a9 9 0 0 1 8 7.94"/><path d="M14.05 6A5 5 0 0 1 18 10"/></Icon>;
export const PhonePlus     = (p: IconProps) => <Icon {...p}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/><line x1="17" y1="1" x2="17" y2="7"/><line x1="14" y1="4" x2="20" y2="4"/></Icon>;
export const PhoneMissed   = (p: IconProps) => <Icon {...p}><line x1="23" y1="1" x2="17" y2="7"/><line x1="17" y1="1" x2="23" y2="7"/><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></Icon>;
export const PhoneOff      = (p: IconProps) => <Icon {...p}><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67"/><path d="M5.68 6.29a19.79 19.79 0 0 0-3.07-3.07A2 2 0 0 0 .43 5.4v3a2 2 0 0 0 1.72 2 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1-.45 2.11L3.6 14.13"/><line x1="23" y1="1" x2="1" y2="23"/></Icon>;

// ══════════════════════════════════════════════════════════════════════════════
//  FILES / FOLDER category
// ══════════════════════════════════════════════════════════════════════════════

export const Folder         = (p: IconProps) => <Icon {...p}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></Icon>;
export const FolderPlus     = (p: IconProps) => <Icon {...p}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></Icon>;
export const FolderMinus    = (p: IconProps) => <Icon {...p}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><line x1="9" y1="14" x2="15" y2="14"/></Icon>;
export const FolderHeart    = (p: IconProps) => <Icon {...p}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><path d="M12 14.5a2 2 0 0 1 0-3 2 2 0 0 1 2 2c0 1.5-2 3-2 3s-2-1.5-2-3a2 2 0 0 1 2-2z"/></Icon>;
export const FolderCloud    = (p: IconProps) => <Icon {...p}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><path d="M9.5 14.5a2.5 2.5 0 0 1 5 0"/></Icon>;
export const FileText       = (p: IconProps) => <Icon {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></Icon>;

// ══════════════════════════════════════════════════════════════════════════════
//  MONEY / WALLET / PAYMENT category
// ══════════════════════════════════════════════════════════════════════════════

export const Wallet         = (p: IconProps) => <Icon {...p}><path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/><path d="M16 3H8a2 2 0 0 0-2 2v2h12V5a2 2 0 0 0-2-2z"/><circle cx="18" cy="14" r="1" fill="currentColor"/></Icon>;
export const CreditCard     = (p: IconProps) => <Icon {...p}><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></Icon>;
export const DollarSign     = (p: IconProps) => <Icon {...p}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></Icon>;
export const Receipt        = (p: IconProps) => <Icon {...p}><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="14" y2="14"/></Icon>;
export const Percent        = (p: IconProps) => <Icon {...p}><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></Icon>;
export const Tag            = (p: IconProps) => <Icon {...p}><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></Icon>;
export const Ticket         = (p: IconProps) => <Icon {...p}><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z"/><line x1="9" y1="2" x2="9" y2="22"/></Icon>;
export const Safe           = (p: IconProps) => <Icon {...p}><rect x="2" y="3" width="20" height="17" rx="2"/><circle cx="12" cy="11.5" r="3"/><path d="M8 21v-2"/><path d="M16 21v-2"/><path d="M12 8.5v1"/><path d="M12 14v1"/><path d="M9 11.5H8"/><path d="M16 11.5h-1"/></Icon>;

// ══════════════════════════════════════════════════════════════════════════════
//  USERS / PEOPLE category
// ══════════════════════════════════════════════════════════════════════════════

export const User         = (p: IconProps) => <Icon {...p}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></Icon>;
export const Users        = (p: IconProps) => <Icon {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></Icon>;
export const UserPlus     = (p: IconProps) => <Icon {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="17" y1="11" x2="23" y2="11"/></Icon>;
export const UserMinus    = (p: IconProps) => <Icon {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="23" y1="11" x2="17" y2="11"/></Icon>;
export const UserCheck    = (p: IconProps) => <Icon {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></Icon>;
export const UserX        = (p: IconProps) => <Icon {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="18" y1="8" x2="23" y2="13"/><line x1="23" y1="8" x2="18" y2="13"/></Icon>;
export const UserCircle   = (p: IconProps) => <Icon {...p}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><circle cx="12" cy="12" r="10" strokeDasharray="2 0"/></Icon>;
export const UserShield   = (p: IconProps) => <Icon {...p}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeWidth={1.5}/></Icon>;

// ══════════════════════════════════════════════════════════════════════════════
//  SECURITY category
// ══════════════════════════════════════════════════════════════════════════════

export const Shield      = (p: IconProps) => <Icon {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></Icon>;
export const ShieldCheck = (p: IconProps) => <Icon {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></Icon>;
export const Lock        = (p: IconProps) => <Icon {...p}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></Icon>;
export const Unlock      = (p: IconProps) => <Icon {...p}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></Icon>;
export const Eye         = (p: IconProps) => <Icon {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></Icon>;
export const EyeOff      = (p: IconProps) => <Icon {...p}><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></Icon>;
export const Key         = (p: IconProps) => <Icon {...p}><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></Icon>;
export const Fingerprint = (p: IconProps) => <Icon {...p}><path d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10"/><path d="M5 12a7 7 0 0 1 7-7"/><path d="M12 5a7 7 0 0 1 6.2 3.8"/><path d="M9 12a3 3 0 1 1 6 0"/><path d="M12 9v3"/><path d="M12 12v8"/><path d="M7 15.5a10 10 0 0 0 10 0"/></Icon>;

// ══════════════════════════════════════════════════════════════════════════════
//  SETTINGS / CONTROLS category
// ══════════════════════════════════════════════════════════════════════════════

export const Settings2  = (p: IconProps) => <Icon {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></Icon>;
export const Sliders    = (p: IconProps) => <Icon {...p}><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></Icon>;
export const ToggleLeft  = (p: IconProps) => <Icon {...p}><rect x="1" y="5" width="22" height="14" rx="7" ry="7"/><circle cx="8" cy="12" r="3"/></Icon>;
export const ToggleRight = (p: IconProps) => <Icon {...p}><rect x="1" y="5" width="22" height="14" rx="7" ry="7"/><circle cx="16" cy="12" r="3"/></Icon>;
export const MoreHorizontal = (p: IconProps) => <Icon {...p}><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="19" cy="12" r="1" fill="currentColor"/><circle cx="5" cy="12" r="1" fill="currentColor"/></Icon>;
export const MoreVertical   = (p: IconProps) => <Icon {...p}><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="5" r="1" fill="currentColor"/><circle cx="12" cy="19" r="1" fill="currentColor"/></Icon>;
export const Filter         = (p: IconProps) => <Icon {...p}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></Icon>;
export const Gift           = (p: IconProps) => <Icon {...p}><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></Icon>;

// ══════════════════════════════════════════════════════════════════════════════
//  NOTIFICATIONS category
// ══════════════════════════════════════════════════════════════════════════════

export const Bell      = (p: IconProps) => <Icon {...p}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></Icon>;
export const BellOff   = (p: IconProps) => <Icon {...p}><path d="M13.73 21a2 2 0 0 1-3.46 0"/><path d="M18.63 13A17.89 17.89 0 0 1 18 8"/><path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14"/><path d="M18 8a6 6 0 0 0-9.33-5"/><line x1="1" y1="1" x2="23" y2="23"/></Icon>;
export const BellPlus  = (p: IconProps) => <Icon {...p}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="10.5" y1="3.5" x2="13.5" y2="3.5"/></Icon>;

// ══════════════════════════════════════════════════════════════════════════════
//  LOCATION / MAP category
// ══════════════════════════════════════════════════════════════════════════════

export const MapPin     = (p: IconProps) => <Icon {...p}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></Icon>;
export const Navigation = (p: IconProps) => <Icon {...p}><polygon points="3 11 22 2 13 21 11 13 3 11"/></Icon>;
export const Compass    = (p: IconProps) => <Icon {...p}><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></Icon>;
export const Globe      = (p: IconProps) => <Icon {...p}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></Icon>;

// ══════════════════════════════════════════════════════════════════════════════
//  SEARCH category
// ══════════════════════════════════════════════════════════════════════════════

export const Search      = (p: IconProps) => <Icon {...p}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></Icon>;
export const SearchPlus  = (p: IconProps) => <Icon {...p}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></Icon>;
export const SearchMinus = (p: IconProps) => <Icon {...p}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></Icon>;

// ══════════════════════════════════════════════════════════════════════════════
//  SHOP / COMMERCE category
// ══════════════════════════════════════════════════════════════════════════════

export const ShoppingBag   = (p: IconProps) => <Icon {...p}><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></Icon>;
export const ShoppingCart  = (p: IconProps) => <Icon {...p}><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></Icon>;
export const Package       = (p: IconProps) => <Icon {...p}><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></Icon>;
export const Store         = (p: IconProps) => <Icon {...p}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></Icon>;

// ══════════════════════════════════════════════════════════════════════════════
//  TIME / CALENDAR category
// ══════════════════════════════════════════════════════════════════════════════

export const Clock     = (p: IconProps) => <Icon {...p}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></Icon>;
export const Calendar  = (p: IconProps) => <Icon {...p}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></Icon>;
export const Timer     = (p: IconProps) => <Icon {...p}><circle cx="12" cy="12" r="9"/><polyline points="12 6 12 12 15.5 15.5"/><path d="M9.5 2.5h5M12 2v2.5"/></Icon>;

// ══════════════════════════════════════════════════════════════════════════════
//  GRID / LAYOUT category
// ══════════════════════════════════════════════════════════════════════════════

export const Grid        = (p: IconProps) => <Icon {...p}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></Icon>;
export const LayoutGrid  = (p: IconProps) => <Icon {...p}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></Icon>;
export const List        = (p: IconProps) => <Icon {...p}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></Icon>;
export const Menu        = (p: IconProps) => <Icon {...p}><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></Icon>;
export const X           = (p: IconProps) => <Icon {...p}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></Icon>;
export const Check       = (p: IconProps) => <Icon {...p}><polyline points="20 6 9 17 4 12"/></Icon>;
export const Home        = (p: IconProps) => <Icon {...p}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></Icon>;

// ══════════════════════════════════════════════════════════════════════════════
//  CONTENT / MEDIA category
// ══════════════════════════════════════════════════════════════════════════════

export const Image       = (p: IconProps) => <Icon {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" stroke="none"/><polyline points="21 15 16 10 5 21"/></Icon>;
export const Camera      = (p: IconProps) => <Icon {...p}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></Icon>;
export const Video       = (p: IconProps) => <Icon {...p}><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></Icon>;
export const Mic         = (p: IconProps) => <Icon {...p}><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></Icon>;
export const Play        = (p: IconProps) => <Icon {...p}><polygon points="5 3 19 12 5 21 5 3"/></Icon>;
export const Pause       = (p: IconProps) => <Icon {...p}><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></Icon>;

// ══════════════════════════════════════════════════════════════════════════════
//  DELIVERY / TRANSPORT category
// ══════════════════════════════════════════════════════════════════════════════

export const Truck       = (p: IconProps) => <Icon {...p}><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></Icon>;
export const Car         = (p: IconProps) => <Icon {...p}><path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v9a2 2 0 0 1-2 2h-1"/><circle cx="9" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></Icon>;

// ══════════════════════════════════════════════════════════════════════════════
//  BUILDING / REAL-ESTATE category
// ══════════════════════════════════════════════════════════════════════════════

export const Building    = (p: IconProps) => <Icon {...p}><rect x="4" y="2" width="16" height="20" rx="1"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M16 6h.01M12 6h.01M12 10h.01M8 10h.01M16 10h.01M12 14h.01M8 14h.01M16 14h.01"/></Icon>;
export const Bank        = (p: IconProps) => <Icon {...p}><line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7"/></Icon>;

// ══════════════════════════════════════════════════════════════════════════════
//  ESSENTIAL / UI — Misc
// ══════════════════════════════════════════════════════════════════════════════

export const Info        = (p: IconProps) => <Icon {...p}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></Icon>;
export const AlertCircle = (p: IconProps) => <Icon {...p}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></Icon>;
export const AlertTriangle=(p: IconProps) => <Icon {...p}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></Icon>;
export const CheckCircle = (p: IconProps) => <Icon {...p}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></Icon>;
export const XCircle     = (p: IconProps) => <Icon {...p}><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></Icon>;
export const Plus        = (p: IconProps) => <Icon {...p}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></Icon>;
export const Minus       = (p: IconProps) => <Icon {...p}><line x1="5" y1="12" x2="19" y2="12"/></Icon>;
export const Edit        = (p: IconProps) => <Icon {...p}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></Icon>;
export const Trash       = (p: IconProps) => <Icon {...p}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></Icon>;
export const Copy        = (p: IconProps) => <Icon {...p}><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></Icon>;
export const Share       = (p: IconProps) => <Icon {...p}><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></Icon>;
export const Heart       = (p: IconProps) => <Icon {...p}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></Icon>;
export const Star        = (p: IconProps) => <Icon {...p}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></Icon>;
export const QrCode      = (p: IconProps) => <Icon {...p}><rect x="3" y="3" width="5" height="5"/><rect x="16" y="3" width="5" height="5"/><rect x="3" y="16" width="5" height="5"/><path d="M21 16h-3v5"/><path d="M21 21v.01"/><path d="M12 7v3"/><path d="M12 3h.01"/><path d="M12 14h.01"/><path d="M15 12h.01"/><path d="M12 12h.01"/><path d="M9 12h.01"/></Icon>;
export const Cashback    = (p: IconProps) => <Icon {...p}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/><path d="M15 8H9a1 1 0 0 0 0 2h4a1 1 0 0 1 0 2H9"/><line x1="12" y1="6" x2="12" y2="8"/><line x1="12" y1="14" x2="12" y2="16"/></Icon>;
export const Send        = (p: IconProps) => <Icon {...p}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></Icon>;
export const Download    = (p: IconProps) => <Icon {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></Icon>;
export const Upload      = (p: IconProps) => <Icon {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></Icon>;
export const Bitcoin     = (p: IconProps) => <Icon {...p}><path d="M11.767 19.089c4.924.868 6.14-6.025 1.216-6.894m-1.216 6.894L10.5 19.25m1.267-.161L9.5 9.25m2.267 9.839 1.216.215M9.5 9.25l-1.25-.22m2.5.22 1.216.215M7.734 7.03C12.658 7.898 11.443 1 6.518 1.868L7.734 7.03zm0 0 1.266 7.109"/></Icon>;

// ── Icon map (for dynamic lookup) ────────────────────────────────────────────
export const IconMap = {
  // Arrow
  ArrowRight, ArrowLeft, ArrowUp, ArrowDown,
  ChevronRight, ChevronLeft, ChevronUp, ChevronDown,
  ArrowSwap, ArrowRefresh, ArrowExport, ArrowImport,
  // Archive
  Bookmark, BookmarkCheck, BookmarkPlus, BookmarkMinus, BookOpen,
  // Business
  BarChartIcon, LineChartIcon, PieChartIcon, TrendUp, TrendDown, Activity, Monitor,
  // Call
  Phone, PhoneCall, PhonePlus, PhoneMissed, PhoneOff,
  // Files
  Folder, FolderPlus, FolderMinus, FolderHeart, FolderCloud, FileText,
  // Money
  Wallet, CreditCard, DollarSign, Receipt, Percent, Tag, Ticket, Safe,
  // Users
  User, Users, UserPlus, UserMinus, UserCheck, UserX, UserCircle, UserShield,
  // Security
  Shield, ShieldCheck, Lock, Unlock, Eye, EyeOff, Key, Fingerprint,
  // Settings
  Settings2, Sliders, ToggleLeft, ToggleRight, MoreHorizontal, MoreVertical,
  // Notifications
  Bell, BellOff, BellPlus,
  // Location
  MapPin, Navigation, Compass, Globe,
  // Search
  Search, SearchPlus, SearchMinus,
  // Shop
  ShoppingBag, ShoppingCart, Package, Store,
  // Time
  Clock, Calendar, Timer,
  // Grid / Layout
  Grid, LayoutGrid, List, Menu, X, Check, Home,
  // Content
  Image, Camera, Video, Mic, Play, Pause,
  // Delivery
  Truck, Car,
  // Building
  Building, Bank,
  // Essential
  Info, AlertCircle, AlertTriangle, CheckCircle, XCircle,
  Plus, Minus, Edit, Trash, Copy, Share, Heart, Star,
  QrCode, Cashback, Send, Download, Upload, Bitcoin,
} as const;

export type IconName = keyof typeof IconMap;

// ─── Dynamic <Icon name="…" /> shorthand ────────────────────────────────────
export interface DynamicIconProps extends IconProps {
  name: IconName;
}

export function VnkrIcon({ name, ...rest }: DynamicIconProps) {
  const Component = IconMap[name];
  return <Component {...rest} />;
}
