/**
 * @vnkrvietnam/ui — Sidebar / Drawer
 * Collapsible side navigation — used by merchant, admin, sandbox, analytics apps
 *
 * Modes:
 *   drawer  — overlay slide-in from left (mobile + tablet)
 *   sidebar — persistent inline sidebar (desktop)
 *
 * Features:
 *   - Section grouping with labels
 *   - Active item highlight
 *   - Collapse to icon-only mode (desktop)
 *   - Nested sub-items (1 level)
 *   - Badge counts on items
 *   - ESC + backdrop close (drawer mode)
 */
import React, { useEffect, useCallback } from "react";
import type { CSSProperties, ReactNode } from "react";
import { shadows } from "../../tokens/shadows";

export interface SidebarItem {
  id:        string;
  label:     string;
  icon?:     ReactNode;
  href?:     string;
  onClick?:  () => void;
  badge?:    number;
  /** Sub-items (one level deep) */
  children?: Omit<SidebarItem, "children" | "icon">[];
  /** Visual separator before this item */
  divider?:  boolean;
}

export interface SidebarSection {
  /** Section header label (optional) */
  label?: string;
  items:  SidebarItem[];
}

export type SidebarMode = "drawer" | "sidebar";

export interface SidebarProps {
  sections:       SidebarSection[];
  activeId?:      string;
  onItemClick?:   (id: string) => void;
  mode?:          SidebarMode;
  /** Sidebar open state (drawer mode) / collapsed state (sidebar mode) */
  open?:          boolean;
  collapsed?:     boolean;
  onClose?:       () => void;
  onCollapse?:    (collapsed: boolean) => void;
  /** Logo slot at top of sidebar */
  logo?:          ReactNode;
  /** Bottom slot: user avatar/profile row */
  bottomSlot?:    ReactNode;
  /** Sidebar width when expanded */
  width?:         number;
  /** Sidebar width when collapsed (icon-only) */
  collapsedWidth?: number;
  bg?:            string;
  style?:         CSSProperties;
}

export function Sidebar({
  sections,
  activeId,
  onItemClick,
  mode            = "sidebar",
  open            = true,
  collapsed       = false,
  onClose,
  onCollapse,
  logo,
  bottomSlot,
  width           = 240,
  collapsedWidth  = 64,
  bg              = "#FFFFFF",
  style,
}: SidebarProps) {
  const isDrawer    = mode === "drawer";
  const currentWidth = collapsed ? collapsedWidth : width;
  const isVisible   = isDrawer ? open : true;

  // ESC closes drawer
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape" && isDrawer && open) onClose?.();
  }, [isDrawer, open, onClose]);

  useEffect(() => {
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  // Body scroll lock for drawer
  useEffect(() => {
    if (isDrawer && open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [isDrawer, open]);

  const sidebarStyle: CSSProperties = {
    position:     isDrawer ? "fixed" : "relative",
    top:          isDrawer ? 0 : undefined,
    left:         isDrawer ? 0 : undefined,
    bottom:       isDrawer ? 0 : undefined,
    width:        currentWidth,
    minHeight:    isDrawer ? "100vh" : "100%",
    background:   bg,
    borderRight:  `1px solid #F3F4F6`,
    boxShadow:    isDrawer ? shadows.xl : "none",
    display:      "flex",
    flexDirection:"column",
    zIndex:       isDrawer ? 200 : undefined,
    overflowX:    "hidden",
    overflowY:    "auto",
    transition:   "width 0.22s cubic-bezier(0.4,0,0.2,1), transform 0.28s cubic-bezier(0.4,0,0.2,1)",
    transform:    isDrawer && !open ? "translateX(-100%)" : "translateX(0)",
    flexShrink:   0,
    boxSizing:    "border-box",
    ...style,
  };

  if (!isVisible && !isDrawer) return null;

  return (
    <>
      {/* Backdrop (drawer only) */}
      {isDrawer && open && (
        <div
          onClick={onClose}
          role="presentation"
          style={{
            position:   "fixed",
            inset:      0,
            background: "rgba(0,0,0,0.45)",
            zIndex:     199,
            animation:  "vnkr-fade-in 0.18s ease",
          }}
        />
      )}
      <style>{`@keyframes vnkr-fade-in { from { opacity:0 } to { opacity:1 } }`}</style>

      <aside style={sidebarStyle} role="navigation" aria-label="Sidebar navigation">
        {/* Logo slot */}
        {logo && (
          <div style={{
            padding:      `16px ${collapsed ? 12 : 20}px`,
            borderBottom: "1px solid #F3F4F6",
            display:      "flex",
            alignItems:   "center",
            justifyContent: collapsed ? "center" : "space-between",
            gap:          8,
            flexShrink:   0,
          }}>
            {logo}
            {/* Collapse toggle (sidebar mode only) */}
            {!isDrawer && !collapsed && (
              <CollapseButton onToggle={() => onCollapse?.(true)} />
            )}
          </div>
        )}

        {/* Expand button when collapsed */}
        {!isDrawer && collapsed && (
          <div style={{ padding: "16px 0", display: "flex", justifyContent: "center", borderBottom: "1px solid #F3F4F6" }}>
            <CollapseButton collapsed onToggle={() => onCollapse?.(false)} />
          </div>
        )}

        {/* Sections */}
        <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: `8px 0` }}>
          {sections.map((section, si) => (
            <SidebarSectionBlock
              key={si}
              section={section}
              activeId={activeId}
              collapsed={collapsed}
              onItemClick={(id) => {
                onItemClick?.(id);
                if (isDrawer) onClose?.();
              }}
            />
          ))}
        </div>

        {/* Bottom slot */}
        {bottomSlot && (
          <div style={{
            borderTop:  "1px solid #F3F4F6",
            padding:    `12px ${collapsed ? 8 : 16}px`,
            flexShrink: 0,
          }}>
            {bottomSlot}
          </div>
        )}
      </aside>
    </>
  );
}

// ─── Section block ────────────────────────────────────────────────────────────
function SidebarSectionBlock({ section, activeId, collapsed, onItemClick }: {
  section:     SidebarSection;
  activeId?:   string;
  collapsed:   boolean;
  onItemClick: (id: string) => void;
}) {
  return (
    <div style={{ marginBottom: 4 }}>
      {section.label && !collapsed && (
        <div style={{
          fontSize:     10,
          fontWeight:   700,
          color:        "#A0AEC0",
          letterSpacing:"0.08em",
          textTransform:"uppercase",
          padding:      "10px 20px 4px",
          fontFamily:   "'Work Sans', sans-serif",
        }}>
          {section.label}
        </div>
      )}
      {section.items.map(item => (
        <SidebarItemRow
          key={item.id}
          item={item}
          isActive={activeId === item.id}
          collapsed={collapsed}
          onClick={() => {
            item.onClick?.();
            onItemClick(item.id);
          }}
          activeId={activeId}
          onItemClick={onItemClick}
        />
      ))}
    </div>
  );
}

// ─── Single item row ──────────────────────────────────────────────────────────
function SidebarItemRow({ item, isActive, collapsed, onClick, activeId, onItemClick }: {
  item:        SidebarItem;
  isActive:    boolean;
  collapsed:   boolean;
  onClick:     () => void;
  activeId?:   string;
  onItemClick: (id: string) => void;
}) {
  const [hovered, setHovered]   = React.useState(false);
  const [expanded, setExpanded] = React.useState(
    item.children?.some(c => c.id === activeId) ?? false
  );

  const hasChildren = (item.children?.length ?? 0) > 0;

  const rowStyle: CSSProperties = {
    display:       "flex",
    alignItems:    "center",
    gap:           10,
    padding:       collapsed ? "10px 0" : "9px 16px 9px 20px",
    margin:        "1px 8px",
    borderRadius:  10,
    cursor:        "pointer",
    userSelect:    "none",
    background:    isActive ? "#000000" : (hovered ? "#F5F6FA" : "transparent"),
    color:         isActive ? "#FFFFFF" : "#1A1F36",
    transition:    "background 0.13s",
    justifyContent: collapsed ? "center" : "flex-start",
    position:      "relative",
  };

  const labelStyle: CSSProperties = {
    flex:        1,
    fontSize:    14,
    fontWeight:  isActive ? 600 : 500,
    fontFamily:  "'Work Sans', sans-serif",
    whiteSpace:  "nowrap",
    overflow:    "hidden",
    textOverflow:"ellipsis",
    lineHeight:  1.4,
  };

  return (
    <>
      {item.divider && (
        <div style={{ height: 1, background: "#F3F4F6", margin: "6px 20px" }} />
      )}
      <div
        style={rowStyle}
        onClick={() => {
          if (hasChildren) {
            setExpanded(e => !e);
          } else {
            onClick();
          }
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        role="menuitem"
        aria-current={isActive ? "page" : undefined}
        title={collapsed ? item.label : undefined}
      >
        {/* Icon */}
        {item.icon && (
          <span style={{
            display:    "flex",
            alignItems: "center",
            flexShrink: 0,
            color:      isActive ? "#FFFFFF" : "#718096",
          }}>
            {item.icon}
          </span>
        )}

        {/* Label (hidden when collapsed) */}
        {!collapsed && <span style={labelStyle}>{item.label}</span>}

        {/* Badge */}
        {!collapsed && item.badge !== undefined && item.badge > 0 && (
          <span style={{
            background:   "#FF3D71",
            color:        "#fff",
            fontSize:     10,
            fontWeight:   700,
            minWidth:     18,
            height:       18,
            borderRadius: 99,
            display:      "flex",
            alignItems:   "center",
            justifyContent: "center",
            padding:      "0 5px",
            fontFamily:   "'Work Sans', sans-serif",
            flexShrink:   0,
          }}>
            {item.badge > 99 ? "99+" : item.badge}
          </span>
        )}

        {/* Chevron for sub-items */}
        {!collapsed && hasChildren && (
          <ChevronIcon open={expanded} color={isActive ? "#fff" : "#A0AEC0"} />
        )}
      </div>

      {/* Sub-items */}
      {!collapsed && hasChildren && expanded && (
        <div style={{ marginLeft: 36 }}>
          {item.children!.map(child => (
            <div
              key={child.id}
              style={{
                padding:      "7px 16px 7px 20px",
                margin:       "1px 8px",
                borderRadius: 8,
                cursor:       "pointer",
                fontSize:     13,
                fontWeight:   activeId === child.id ? 600 : 400,
                fontFamily:   "'Work Sans', sans-serif",
                color:        activeId === child.id ? "#000" : "#4A5568",
                background:   activeId === child.id ? "#F5F6FA" : "transparent",
                userSelect:   "none",
              }}
              onClick={() => { child.onClick?.(); onItemClick(child.id); }}
            >
              {child.label}
              {child.badge !== undefined && child.badge > 0 && (
                <span style={{ marginLeft: 6, background: "#FF3D71", color: "#fff",
                  fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 99 }}>
                  {child.badge}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ─── Chevron icon ─────────────────────────────────────────────────────────────
function ChevronIcon({ open, color }: { open: boolean; color: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      style={{ transition: "transform 0.18s", transform: open ? "rotate(180deg)" : "rotate(0deg)", flexShrink: 0 }}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

// ─── Collapse toggle ──────────────────────────────────────────────────────────
function CollapseButton({ onToggle, collapsed = false }: { onToggle: () => void; collapsed?: boolean }) {
  return (
    <button
      onClick={onToggle}
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      style={{
        width:        28,
        height:       28,
        borderRadius: "50%",
        background:   "#F5F6FA",
        border:       "1px solid #E5E7EB",
        cursor:       "pointer",
        display:      "flex",
        alignItems:   "center",
        justifyContent: "center",
        flexShrink:   0,
        padding:      0,
      }}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
        stroke="#4A5568" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        style={{ transform: collapsed ? "rotate(180deg)" : "rotate(0deg)" }}>
        <path d="M15 18l-6-6 6-6" />
      </svg>
    </button>
  );
}
