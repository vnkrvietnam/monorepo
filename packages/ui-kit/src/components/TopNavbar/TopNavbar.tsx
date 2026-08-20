/**
 * @vnkrvietnam/ui — TopNavbar / AppBar
 * Responsive top navigation bar — desktop + mobile
 *
 * Desktop (≥768px): Logo · nav links · right-slot (actions/avatar)
 * Mobile (<768px):  Logo · hamburger button (triggers Sidebar)
 *
 * Variants:
 *   default — white background, subtle bottom border
 *   dark    — black background, white text
 *   transparent — no background (for hero overlay)
 */
import React, { useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { shadows } from "../../tokens/shadows";

export type TopNavbarVariant = "default" | "dark" | "transparent";

export interface NavLink {
  id:     string;
  label:  string;
  href?:  string;
  /** Custom click handler (use instead of href for SPA routing) */
  onClick?: () => void;
  /** Show active underline */
  active?: boolean;
}

export interface TopNavbarProps {
  /** Logo element — typically <VnkrLogo /> */
  logo?:         ReactNode;
  /** Nav links shown in desktop centre (hidden on mobile) */
  links?:        NavLink[];
  /** Right-side slot: avatar, buttons, badge icons */
  rightSlot?:    ReactNode;
  /** Left-side extra slot (desktop) */
  leftSlot?:     ReactNode;
  /** Called when hamburger pressed on mobile */
  onMenuToggle?: () => void;
  /** Control hamburger icon state */
  menuOpen?:     boolean;
  variant?:      TopNavbarVariant;
  /** Height override (default 56px) */
  height?:       number;
  /** Sticky top */
  sticky?:       boolean;
  style?:        CSSProperties;
  className?:    string;
}

const VARIANT_MAP: Record<TopNavbarVariant, {
  bg: string; fg: string; border: string; shadow: string;
}> = {
  default:     { bg: "#FFFFFF", fg: "#1A1F36", border: "#F3F4F6",    shadow: shadows.sm },
  dark:        { bg: "#000000", fg: "#FFFFFF", border: "transparent", shadow: shadows.sm },
  transparent: { bg: "transparent", fg: "#1A1F36", border: "transparent", shadow: "none" },
};

export function TopNavbar({
  logo,
  links        = [],
  rightSlot,
  leftSlot,
  onMenuToggle,
  menuOpen     = false,
  variant      = "default",
  height       = 56,
  sticky       = true,
  style,
  className,
}: TopNavbarProps) {
  const c = VARIANT_MAP[variant];

  const barStyle: CSSProperties = {
    display:        "flex",
    alignItems:     "center",
    justifyContent: "space-between",
    height,
    padding:        "0 20px",
    background:     c.bg,
    borderBottom:   `1px solid ${c.border}`,
    boxShadow:      c.shadow,
    position:       sticky ? "sticky" : "relative",
    top:            sticky ? 0 : undefined,
    zIndex:         100,
    boxSizing:      "border-box",
    width:          "100%",
    ...style,
  };

  return (
    <>
      <style>{`
        @media (min-width: 768px) {
          .vnkr-topnav-links { display: flex !important; }
          .vnkr-topnav-hamburger { display: none !important; }
        }
        @media (max-width: 767px) {
          .vnkr-topnav-links { display: none !important; }
          .vnkr-topnav-hamburger { display: flex !important; }
        }
      `}</style>
      <header style={barStyle} className={className} role="banner">
        {/* Left: logo + optional leftSlot */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
          {logo}
          {leftSlot}
        </div>

        {/* Centre: nav links (desktop only) */}
        <nav
          className="vnkr-topnav-links"
          style={{ display: "none", alignItems: "center", gap: 4 }}
          role="navigation"
          aria-label="Main navigation"
        >
          {links.map(link => (
            <NavLinkItem key={link.id} link={link} fg={c.fg} />
          ))}
        </nav>

        {/* Right: action slot + hamburger */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {rightSlot && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {rightSlot}
            </div>
          )}
          {/* Hamburger (mobile only) */}
          <button
            className="vnkr-topnav-hamburger"
            style={{ display: "none" }}
            onClick={onMenuToggle}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            <HamburgerIcon open={menuOpen} color={c.fg} />
          </button>
        </div>
      </header>
    </>
  );
}

// ─── Nav link item ────────────────────────────────────────────────────────────
function NavLinkItem({ link, fg }: { link: NavLink; fg: string }) {
  const [hovered, setHovered] = useState(false);

  const s: CSSProperties = {
    display:       "inline-flex",
    alignItems:    "center",
    padding:       "6px 14px",
    borderRadius:  8,
    fontSize:      14,
    fontWeight:    link.active ? 600 : 500,
    fontFamily:    "'Work Sans', sans-serif",
    color:         link.active ? fg : (hovered ? fg : `${fg}99`),
    background:    link.active ? "rgba(0,0,0,0.06)" : (hovered ? "rgba(0,0,0,0.04)" : "transparent"),
    cursor:        "pointer",
    userSelect:    "none",
    textDecoration:"none",
    transition:    "background 0.15s, color 0.15s",
    whiteSpace:    "nowrap",
    position:      "relative",
  };

  const El = link.href ? "a" : "div";
  return (
    <El
      style={s}
      href={link.href}
      onClick={link.onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {link.label}
      {link.active && (
        <span style={{
          position:     "absolute",
          bottom:       2,
          left:         "50%",
          transform:    "translateX(-50%)",
          width:        20,
          height:       2,
          borderRadius: 99,
          background:   fg,
        }} />
      )}
    </El>
  );
}

// ─── Hamburger icon ───────────────────────────────────────────────────────────
function HamburgerIcon({ open, color }: { open: boolean; color: string }) {
  const base: CSSProperties = {
    display:      "block",
    width:        20,
    height:       2,
    borderRadius: 99,
    background:   color,
    transition:   "transform 0.2s, opacity 0.2s",
  };
  return (
    <div style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
      background: "transparent", border: "none", cursor: "pointer", padding: 0 }}>
      <div style={{ width: 20, display: "flex", flexDirection: "column", gap: 5 }}>
        <span style={{ ...base, transform: open ? "translateY(7px) rotate(45deg)" : "none" }} />
        <span style={{ ...base, opacity: open ? 0 : 1 }} />
        <span style={{ ...base, transform: open ? "translateY(-7px) rotate(-45deg)" : "none" }} />
      </div>
    </div>
  );
}
