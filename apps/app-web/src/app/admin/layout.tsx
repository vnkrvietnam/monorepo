"use client";
/**
 * Admin layout — SidebarLayout navigation for admin portal
 */
import React from "react";
import { usePathname } from "next/navigation";
import {
  SidebarLayout,
  VnkrLogo,
  BarChartIcon,
  Users,
  ShieldCheck,
  Wallet,
  FileText,
  Settings2,
  Activity,
  type SidebarSection,
} from "@vnkrvietnam/ui-kit";

const ADMIN_NAV: SidebarSection[] = [
  {
    label: "Tổng quan",
    items: [
      { id: "dashboard", label: "Dashboard",        icon: <BarChartIcon size={18} />, href: "/admin/dashboard" },
    ],
  },
  {
    label: "Quản lý",
    items: [
      { id: "users",      label: "Người dùng",       icon: <Users       size={18} />, href: "/admin/users"    },
      { id: "kyc",        label: "Xác minh eKYC",    icon: <ShieldCheck size={18} />, href: "/admin/kyc"      },
      { id: "finance",    label: "Tài chính",        icon: <Wallet      size={18} />, href: "/admin/finance"  },
    ],
  },
  {
    label: "Nội dung & Tuân thủ",
    items: [
      { id: "cms",        label: "CMS & Học thuật",  icon: <FileText    size={18} />, href: "/admin/cms"        },
      { id: "compliance", label: "Tuân thủ NQ/NĐ",  icon: <Activity    size={18} />, href: "/admin/compliance" },
    ],
  },
  {
    label: "Hệ thống",
    items: [
      { id: "system",     label: "Cài đặt Hệ thống", icon: <Settings2  size={18} />, href: "/admin/system"    },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const activeId = pathname.split("/").slice(-1)[0] ?? "dashboard";

  return (
    <SidebarLayout
      sections={ADMIN_NAV}
      activeId={activeId}
      onNavChange={(id) => {
        const item = ADMIN_NAV.flatMap(s => s.items).find(i => i.id === id);
        if (item?.href) window.location.href = item.href;
      }}
      logo={
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <VnkrLogo variant="dark" size="xs" />
          <span style={{ fontSize: 11, fontWeight: 700, color: "#A0AEC0", letterSpacing: "0.05em" }}>ADMIN</span>
        </div>
      }
    >
      {children}
    </SidebarLayout>
  );
}
