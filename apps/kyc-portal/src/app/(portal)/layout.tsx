"use client";

import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  SidebarLayout,
  VnkrLogo,
  Badge,
} from "@vnkrvietnam/ui-kit";
import type { SidebarSection } from "@vnkrvietnam/ui-kit";
import {
  Home,
  Users,
  UserCheck,
  ShieldCheck,
  XCircle,
  Fingerprint,
  FileText,
  Settings2,
} from "@vnkrvietnam/ui-kit";

const NAV_SECTIONS: SidebarSection[] = [
  {
    label: "Tổng quan",
    items: [
      {
        id: "dashboard",
        label: "Dashboard",
        icon: <Home size={18} />,
        href: "/dashboard",
      },
      {
        id: "users",
        label: "Users",
        icon: <Users size={18} />,
        href: "/users",
      },
    ],
  },
  {
    label: "Xác minh",
    items: [
      {
        id: "queue",
        label: "KYC Queue",
        icon: <UserCheck size={18} />,
        href: "/queue",
        badge: 12,
      },
      {
        id: "verified",
        label: "Verified",
        icon: <ShieldCheck size={18} />,
        href: "/verified",
      },
      {
        id: "rejected",
        label: "Rejected",
        icon: <XCircle size={18} />,
        href: "/rejected",
      },
    ],
  },
  {
    label: "Hệ thống",
    items: [
      {
        id: "attestations",
        label: "ZKP Attestations",
        icon: <Fingerprint size={18} />,
        href: "/attestations",
      },
      {
        id: "audit-log",
        label: "Audit Log",
        icon: <FileText size={18} />,
        href: "/audit-log",
      },
      {
        id: "settings",
        label: "Settings",
        icon: <Settings2 size={18} />,
        href: "/settings",
      },
    ],
  },
];

function getActiveId(pathname: string): string {
  if (pathname.startsWith("/dashboard")) return "dashboard";
  if (pathname.startsWith("/users")) return "users";
  if (pathname.startsWith("/queue")) return "queue";
  if (pathname.startsWith("/verified")) return "verified";
  if (pathname.startsWith("/rejected")) return "rejected";
  if (pathname.startsWith("/attestations")) return "attestations";
  if (pathname.startsWith("/audit-log")) return "audit-log";
  if (pathname.startsWith("/settings")) return "settings";
  return "dashboard";
}

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const activeId = getActiveId(pathname);

  const handleNavChange = (id: string) => {
    const item = NAV_SECTIONS.flatMap((s) => s.items).find((i) => i.id === id);
    if (item?.href) router.push(item.href);
  };

  const logo = <VnkrLogo variant="dark" size="sm" />;

  const sidebarBottom = (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "12px 16px",
        borderTop: "1px solid #F3F4F6",
      }}
    >
      {/* Avatar initials */}
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          background: "#000000",
          color: "#FFFFFF",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 13,
          fontWeight: 700,
          flexShrink: 0,
          fontFamily: "'Work Sans', sans-serif",
        }}
      >
        AO
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "#1A1F36",
            fontFamily: "'Work Sans', sans-serif",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          Admin Officer
        </div>
        <div style={{ marginTop: 2 }}>
          <Badge variant="label" color="dark" label="OPERATOR" />
        </div>
      </div>
    </div>
  );

  return (
    <SidebarLayout
      sections={NAV_SECTIONS}
      activeId={activeId}
      onNavChange={handleNavChange}
      logo={logo}
      sidebarBottom={sidebarBottom}
      bg="#F5F6FA"
      topNavVariant="default"
    >
      {children}
    </SidebarLayout>
  );
}
