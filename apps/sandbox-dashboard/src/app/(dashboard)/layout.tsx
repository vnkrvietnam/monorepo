"use client";
/**
 * Sandbox Dashboard — (dashboard) route group layout
 * SidebarLayout dark theme, REGULATOR role
 */
import React from "react";
import { usePathname } from "next/navigation";
import {
  SidebarLayout,
  VnkrLogo,
  Badge,
  Text,
  Monitor,
  BarChartIcon,
  Bell,
  AlertTriangle,
  FileText,
  ShieldCheck,
  BookOpen,
} from "@vnkrvietnam/ui-kit";
import type { SidebarSection } from "@vnkrvietnam/ui-kit";

const SECTIONS: SidebarSection[] = [
  {
    label: "Giám sát",
    items: [
      { id: "/overview",        label: "Tổng quan",       icon: <Monitor   size={18} /> },
      { id: "/tiers",           label: "Tier Matrix",     icon: <BarChartIcon size={18} /> },
      { id: "/alerts",          label: "Cảnh báo",        icon: <Bell      size={18} />, badge: 3 },
    ],
  },
  {
    label: "Kiểm soát",
    items: [
      { id: "/circuit-breaker", label: "Circuit Breaker", icon: <AlertTriangle size={18} /> },
      { id: "/logs",            label: "Emergency Log",   icon: <FileText  size={18} /> },
    ],
  },
  {
    label: "Báo cáo",
    items: [
      { id: "/compliance",      label: "Compliance",      icon: <ShieldCheck size={18} /> },
      { id: "/audit",           label: "Audit Trail",     icon: <BookOpen  size={18} /> },
    ],
  },
];

function BottomSlot() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{
        width: 36, height: 36, borderRadius: "50%",
        background: "#BEFF6C",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 13, fontWeight: 700, color: "#000",
        fontFamily: "'Work Sans', sans-serif", flexShrink: 0,
      }}>
        HĐ
      </div>
      <div style={{ minWidth: 0 }}>
        <Text variant="caption" weight="semibold" color="#E6EDF3">Hội đồng Giám sát</Text>
        <div style={{ marginTop: 2 }}>
          <Badge variant="label" color="greeny" label="REGULATOR" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <SidebarLayout
      sections={SECTIONS}
      activeId={pathname}
      onNavChange={(id) => { window.location.href = id; }}
      logo={<VnkrLogo variant="light" size="sm" />}
      sidebarBottom={<BottomSlot />}
      topNavVariant="dark"
      bg="#0D0F14"
    >
      {children}
    </SidebarLayout>
  );
}
