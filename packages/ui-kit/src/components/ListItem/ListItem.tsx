/**
 * @vnkrvietnam/ui — ListItem / TransactionItem
 * Extracted from Home-v1.png, Cashback.png, Notifications.png, Transfer.png, Payments.png
 *
 * Variants:
 *   transaction — avatar circle (icon/color) + title + subtitle + amount + date
 *   contact     — avatar image/initials + name only + optional chevron
 *   menu        — icon pill + title + subtitle + chevron/toggle/value
 *   notification — icon + title + subtitle (no amount)
 */
import React from "react";
import type { CSSProperties, ReactNode } from "react";

export type ListItemVariant = "transaction" | "contact" | "menu" | "notification";

// ─── Avatar ───────────────────────────────────────────────────────────────────
interface AvatarProps {
  /** Image src */
  src?:      string;
  /** Fallback initials (1-2 chars) */
  initials?: string;
  /** Background color for initials */
  bg?:       string;
  /** Icon element instead of image/initials */
  icon?:     ReactNode;
  /** Icon background color */
  iconBg?:   string;
  size?:     number;
}

function Avatar({ src, initials, bg = "#AF96FB", icon, iconBg, size = 44 }: AvatarProps) {
  const s: CSSProperties = {
    width:          size,
    height:         size,
    borderRadius:   "50%",
    flexShrink:     0,
    overflow:       "hidden",
    display:        "flex",
    alignItems:     "center",
    justifyContent: "center",
    background:     src ? "transparent" : (icon ? (iconBg ?? bg) : bg),
    fontSize:       size * 0.38,
    fontWeight:     700,
    color:          "#fff",
    fontFamily:     "'Work Sans', sans-serif",
  };

  if (src) {
    return (
      <div style={s}>
        <img src={src} alt={initials} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
    );
  }
  if (icon) return <div style={s}>{icon}</div>;
  return <div style={s}>{(initials ?? "?").slice(0, 2).toUpperCase()}</div>;
}

// ─── Chevron right ────────────────────────────────────────────────────────────
function ChevronRight({ color = "#CBD5E0" }: { color?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────
export interface ListItemProps {
  variant?:    ListItemVariant;
  /** Avatar config */
  avatar?:     AvatarProps;
  /** Primary label */
  title:       string;
  /** Secondary label / category */
  subtitle?:   string;
  /** Right-side amount or value string */
  amount?:     string;
  /** Amount color override */
  amountColor?: string;
  /** Right-side secondary text (date/time) */
  meta?:       string;
  /** Show chevron arrow on the right */
  showArrow?:  boolean;
  /** Custom right-side element */
  rightSlot?:  ReactNode;
  /** Pressed / active state */
  active?:     boolean;
  onClick?:    () => void;
  style?:      CSSProperties;
  /** Visual separator line */
  divider?:    boolean;
}

export function ListItem({
  avatar,
  title,
  subtitle,
  amount,
  amountColor,
  meta,
  showArrow = false,
  rightSlot,
  active    = false,
  onClick,
  style,
  divider   = true,
}: ListItemProps) {
  const [pressed, setPressed] = React.useState(false);

  const row: CSSProperties = {
    display:        "flex",
    alignItems:     "center",
    gap:            12,
    padding:        "12px 0",
    borderBottom:   divider ? "1px solid #F3F4F6" : "none",
    cursor:         onClick ? "pointer" : "default",
    background:     pressed && onClick ? "#F9FAFB" : "transparent",
    transition:     "background 0.1s",
    userSelect:     "none",
    ...style,
  };

  return (
    <div
      style={row}
      onClick={onClick}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
    >
      {/* Avatar */}
      {avatar && <Avatar {...avatar} />}

      {/* Text block */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize:     14,
          fontWeight:   600,
          color:        "#1A1F36",
          fontFamily:   "'Work Sans', sans-serif",
          whiteSpace:   "nowrap",
          overflow:     "hidden",
          textOverflow: "ellipsis",
          lineHeight:   1.4,
        }}>
          {title}
        </div>
        {subtitle && (
          <div style={{
            fontSize:  12,
            color:     "#8F9BB3",
            fontFamily:"'Work Sans', sans-serif",
            marginTop: 2,
            whiteSpace:"nowrap",
            overflow:  "hidden",
            textOverflow:"ellipsis",
          }}>
            {subtitle}
          </div>
        )}
      </div>

      {/* Right slot */}
      {rightSlot ?? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2, flexShrink: 0 }}>
          {amount && (
            <span style={{
              fontSize:  14,
              fontWeight: 600,
              color:     amountColor ?? "#1A1F36",
              fontFamily:"'Work Sans', sans-serif",
            }}>
              {amount}
            </span>
          )}
          {meta && (
            <span style={{ fontSize: 11, color: "#A0AEC0", fontFamily: "'Work Sans', sans-serif" }}>
              {meta}
            </span>
          )}
          {showArrow && <ChevronRight />}
        </div>
      )}
    </div>
  );
}

// ─── TransactionList — renders a grouped date-sectioned list ──────────────────
export interface TransactionGroup {
  dateLabel: string;
  items:     Omit<ListItemProps, "variant">[];
}

export interface TransactionListProps {
  groups:  TransactionGroup[];
  style?:  CSSProperties;
}

export function TransactionList({ groups, style }: TransactionListProps) {
  return (
    <div style={{ fontFamily: "'Work Sans', sans-serif", ...style }}>
      {groups.map((group, gi) => (
        <div key={gi}>
          <div style={{
            fontSize:     12,
            fontWeight:   600,
            color:        "#8F9BB3",
            padding:      "12px 0 6px",
            letterSpacing:"0.02em",
          }}>
            {group.dateLabel}
          </div>
          {group.items.map((item, ii) => (
            <ListItem
              key={ii}
              divider={ii < group.items.length - 1}
              {...item}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
