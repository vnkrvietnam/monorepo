/**
 * @vnkrvietnam/ui — BottomNavbar
 * 5-tab bottom navigation — extracted from Home-v1.png, Cashback.png, Card.png
 *
 * Tabs: Home · Crypto · Card · Cashback · More
 * Active: icon + label bold, indicator dot or filled background
 * Inactive: icon only (dimmed), label hidden or muted
 */
import React from "react";
import type { CSSProperties, ReactNode } from "react";

export type NavTabId = "home" | "crypto" | "card" | "cashback" | "more" | string;

export interface NavTab {
  id:       NavTabId;
  label:    string;
  icon:     ReactNode;
  /** Optional badge count */
  badge?:   number;
}

export interface BottomNavbarProps {
  tabs:         NavTab[];
  activeTab?:   NavTabId;
  onTabChange?: (id: NavTabId) => void;
  /** Background color */
  bg?:          string;
  /** Active icon/label color */
  activeColor?: string;
  /** Inactive icon/label color */
  inactiveColor?: string;
  style?:       CSSProperties;
}

export function BottomNavbar({
  tabs,
  activeTab,
  onTabChange,
  bg            = "#FFFFFF",
  activeColor   = "#000000",
  inactiveColor = "#A0AEC0",
  style,
}: BottomNavbarProps) {

  const [internalActive, setInternalActive] = React.useState(
    activeTab ?? (tabs[0]?.id ?? "")
  );
  const current = activeTab !== undefined ? activeTab : internalActive;

  const barStyle: CSSProperties = {
    display:        "flex",
    alignItems:     "stretch",
    justifyContent: "space-around",
    background:     bg,
    borderTop:      "1px solid #F3F4F6",
    height:         64,
    paddingBottom:  4,
    paddingTop:     4,
    boxShadow:      "0 -4px 16px rgba(0,0,0,0.06)",
    ...style,
  };

  const handlePress = (id: NavTabId) => {
    setInternalActive(id);
    onTabChange?.(id);
  };

  return (
    <nav style={barStyle} role="tablist" aria-label="Main navigation">
      {tabs.map(tab => {
        const isActive = tab.id === current;
        return (
          <NavItem
            key={tab.id}
            tab={tab}
            isActive={isActive}
            activeColor={activeColor}
            inactiveColor={inactiveColor}
            onPress={handlePress}
          />
        );
      })}
    </nav>
  );
}

// ─── Single tab item ──────────────────────────────────────────────────────────
interface NavItemProps {
  tab:           NavTab;
  isActive:      boolean;
  activeColor:   string;
  inactiveColor: string;
  onPress:       (id: NavTabId) => void;
}

function NavItem({ tab, isActive, activeColor, inactiveColor, onPress }: NavItemProps) {
  const [pressed, setPressed] = React.useState(false);

  const itemStyle: CSSProperties = {
    display:        "flex",
    flexDirection:  "column",
    alignItems:     "center",
    justifyContent: "center",
    flex:           1,
    gap:            3,
    cursor:         "pointer",
    userSelect:     "none",
    position:       "relative",
    borderRadius:   12,
    transform:      pressed ? "scale(0.92)" : "scale(1)",
    transition:     "transform 0.1s",
  };

  const iconWrap: CSSProperties = {
    display:        "flex",
    alignItems:     "center",
    justifyContent: "center",
    width:          isActive ? 44 : 28,
    height:         isActive ? 30 : 28,
    borderRadius:   isActive ? 99  : "50%",
    background:     isActive ? "#000000" : "transparent",
    transition:     "all 0.2s cubic-bezier(0.4,0,0.2,1)",
    color:          isActive ? "#FFFFFF" : inactiveColor,
  };

  const labelStyle: CSSProperties = {
    fontSize:     10,
    fontWeight:   isActive ? 700 : 400,
    color:        isActive ? activeColor : inactiveColor,
    fontFamily:   "'Work Sans', sans-serif",
    lineHeight:   1,
    transition:   "color 0.15s, font-weight 0.15s",
    letterSpacing: "0.02em",
  };

  return (
    <div
      style={itemStyle}
      role="tab"
      aria-selected={isActive}
      aria-label={tab.label}
      onClick={() => onPress(tab.id)}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => { setPressed(false); onPress(tab.id); }}
    >
      {/* Badge overlay */}
      {tab.badge !== undefined && tab.badge > 0 && (
        <span style={{
          position:      "absolute",
          top:           4,
          right:         "calc(50% - 22px)",
          background:    "#FF3D71",
          color:         "#fff",
          fontSize:      9,
          fontWeight:    700,
          minWidth:      16,
          height:        16,
          borderRadius:  99,
          display:       "flex",
          alignItems:    "center",
          justifyContent:"center",
          padding:       "0 4px",
          border:        "2px solid #fff",
          fontFamily:    "'Work Sans', sans-serif",
          zIndex:        2,
        }}>
          {tab.badge > 99 ? "99+" : tab.badge}
        </span>
      )}

      {/* Icon */}
      <div style={iconWrap}>
        {tab.icon}
      </div>

      {/* Label */}
      <span style={labelStyle}>{tab.label}</span>
    </div>
  );
}

// ─── Default VNKR nav tabs (convenience export) ───────────────────────────────
// Import icons separately; this export just gives the tab config shape.
export const defaultNavTabs = (icons: {
  home: ReactNode;
  crypto: ReactNode;
  card: ReactNode;
  cashback: ReactNode;
  more: ReactNode;
}): NavTab[] => [
  { id: "home",     label: "Home",     icon: icons.home     },
  { id: "crypto",   label: "Crypto",   icon: icons.crypto   },
  { id: "card",     label: "Card",     icon: icons.card     },
  { id: "cashback", label: "Cashback", icon: icons.cashback },
  { id: "more",     label: "More",     icon: icons.more     },
];
