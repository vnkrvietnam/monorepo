/**
 * IconGallery — visual reference for all VNKR icons
 * Grouped by category, useful in Storybook / docs pages.
 */
import React, { useState } from "react";
import { IconMap } from "./icons";
import type { IconName } from "./icons";

const CATEGORIES: Record<string, IconName[]> = {
  Arrow:         ["ArrowRight","ArrowLeft","ArrowUp","ArrowDown","ChevronRight","ChevronLeft","ChevronUp","ChevronDown","ArrowSwap","ArrowRefresh","ArrowExport","ArrowImport"],
  Archive:       ["Bookmark","BookmarkCheck","BookmarkPlus","BookmarkMinus","BookOpen"],
  Business:      ["BarChartIcon","LineChartIcon","PieChartIcon","TrendUp","TrendDown","Activity","Monitor"],
  Call:          ["Phone","PhoneCall","PhonePlus","PhoneMissed","PhoneOff"],
  Files:         ["Folder","FolderPlus","FolderMinus","FolderHeart","FolderCloud","FileText"],
  Money:         ["Wallet","CreditCard","DollarSign","Receipt","Percent","Tag","Ticket","Safe","Bitcoin","Cashback"],
  Users:         ["User","Users","UserPlus","UserMinus","UserCheck","UserX","UserCircle","UserShield"],
  Security:      ["Shield","ShieldCheck","Lock","Unlock","Eye","EyeOff","Key","Fingerprint"],
  Settings:      ["Settings2","Sliders","ToggleLeft","ToggleRight","MoreHorizontal","MoreVertical"],
  Notifications: ["Bell","BellOff","BellPlus"],
  Location:      ["MapPin","Navigation","Compass","Globe"],
  Search:        ["Search","SearchPlus","SearchMinus"],
  Shop:          ["ShoppingBag","ShoppingCart","Package","Store"],
  Time:          ["Clock","Calendar","Timer"],
  Grid:          ["Grid","LayoutGrid","List","Menu","Home"],
  Content:       ["Image","Camera","Video","Mic","Play","Pause"],
  Delivery:      ["Truck","Car"],
  Building:      ["Building","Bank"],
  Essential:     ["Info","AlertCircle","AlertTriangle","CheckCircle","XCircle","Plus","Minus","X","Check","Edit","Trash","Copy","Share","Heart","Star","QrCode","Send","Download","Upload"],
};

export function IconGallery() {
  const [search, setSearch] = useState("");
  const query = search.toLowerCase();

  return (
    <div style={{ fontFamily: "'Work Sans', sans-serif", padding: 40, background: "#FFFFFF", maxWidth: 1000 }}>
      <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 4, color: "#000" }}>Icon Set</div>
      <div style={{ fontSize: 13, color: "#8F9BB3", marginBottom: 28 }}>
        Linear style — 24 × 24 — stroke-width 1.5 — <code>@vnkrvietnam/ui</code>
      </div>

      {/* Search */}
      <input
        placeholder="Search icons…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{
          width: "100%", maxWidth: 360, height: 40,
          padding: "0 14px", fontSize: 13,
          border: "1.5px solid #EDF2F7", borderRadius: 8,
          outline: "none", marginBottom: 40,
          fontFamily: "'Work Sans', sans-serif",
          color: "#2E3A59", background: "#F5F6FA",
          boxSizing: "border-box",
        }}
      />

      {Object.entries(CATEGORIES).map(([cat, names]) => {
        const filtered = names.filter(n => n.toLowerCase().includes(query));
        if (filtered.length === 0) return null;
        return (
          <div key={cat} style={{ marginBottom: 40 }}>
            <div style={{
              fontSize: "0.7rem", fontWeight: 700,
              letterSpacing: "0.08em", textTransform: "uppercase",
              color: "#8F9BB3", borderBottom: "1px solid #EDF2F7",
              paddingBottom: 8, marginBottom: 16,
            }}>
              {cat} <span style={{ fontWeight: 400, color: "#CBD5E0" }}>({filtered.length})</span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {filtered.map(name => {
                const Component = IconMap[name];
                return (
                  <div
                    key={name}
                    title={name}
                    style={{
                      display: "flex", flexDirection: "column",
                      alignItems: "center", gap: 6,
                      padding: "12px 10px",
                      borderRadius: 10,
                      border: "1px solid #EDF2F7",
                      background: "#FAFAFA",
                      cursor: "default",
                      minWidth: 72,
                    }}
                  >
                    <Component size={20} color="#2E3A59" />
                    <span style={{ fontSize: 9, color: "#8F9BB3", textAlign: "center", maxWidth: 72, wordBreak: "break-word" }}>
                      {name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
