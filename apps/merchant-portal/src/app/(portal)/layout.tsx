"use client";
/**
 * (portal) Route Group Layout
 * Wraps all portal screens with SidebarLayout from @vnkrvietnam/ui-kit
 */
import React from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  SidebarLayout,
  VnkrLogo,
  Home,
  Receipt,
  Wallet,
  Key,
  Settings2,
  BookOpen,
  AlertCircle,
} from "@vnkrvietnam/ui-kit";
import type { SidebarSection } from "@vnkrvietnam/ui-kit";

const NAV_SECTIONS: SidebarSection[] = [
  {
    label: "Main",
    items: [
      { id: "dashboard", label: "Dashboard", icon: <Home size={18} />,    href: "/dashboard"  },
      { id: "orders",    label: "Orders",    icon: <Receipt size={18} />, href: "/orders"     },
      { id: "payments",  label: "Payments",  icon: <Wallet size={18} />,  href: "/payments"   },
    ],
  },
  {
    label: "Developers",
    items: [
      { id: "api-keys",  label: "API Keys",  icon: <Key size={18} />,       href: "/api-keys"  },
      { id: "webhooks",  label: "Webhooks",  icon: <Settings2 size={18} />, href: "/webhooks"  },
      { id: "docs",      label: "Docs",      icon: <BookOpen size={18} />,  href: "https://docs.vnkr.vn" },
    ],
  },
  {
    label: "Account",
    items: [
      { id: "settings",  label: "Settings",  icon: <Settings2 size={18} />,   href: "/settings" },
      { id: "support",   label: "Support",   icon: <AlertCircle size={18} />, href: "/support"  },
    ],
  },
];

const ROUTE_ID: Record<string, string> = {
  "/dashboard": "dashboard",
  "/orders":    "orders",
  "/payments":  "payments",
  "/api-keys":  "api-keys",
  "/webhooks":  "webhooks",
  "/settings":  "settings",
  "/support":   "support",
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const activeId = ROUTE_ID[pathname] ?? "dashboard";

  return (
    <SidebarLayout
      sections={NAV_SECTIONS}
      activeId={activeId}
      onNavChange={(id) => {
        const item = NAV_SECTIONS.flatMap(s => s.items).find(i => i.id === id);
        if (item?.href && item.href.startsWith("http")) {
          window.open(item.href, "_blank");
        } else if (item?.href) {
          router.push(item.href);
        }
      }}
      logo={<VnkrLogo variant="dark" size="sm" />}
      sidebarBottom={
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width:          36,
            height:         36,
            borderRadius:   "50%",
            background:     "#AF96FB",
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            fontFamily:     "'Work Sans', sans-serif",
            fontWeight:     700,
            fontSize:       14,
            color:          "#000",
            flexShrink:     0,
          }}>
            M
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize:     13,
              fontWeight:   600,
              color:        "#1A1F36",
              fontFamily:   "'Work Sans', sans-serif",
              whiteSpace:   "nowrap",
              overflow:     "hidden",
              textOverflow: "ellipsis",
            }}>
              Merchant User
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
              <span style={{
                background:   "#BEFF6C",
                color:        "#000",
                fontSize:     9,
                fontWeight:   700,
                padding:      "1px 6px",
                borderRadius: 99,
                fontFamily:   "'Work Sans', sans-serif",
                letterSpacing:"0.04em",
              }}>
                PRO
              </span>
            </div>
          </div>
        </div>
      }
      bg="#F5F6FA"
    >
      {children}
    </SidebarLayout>
  );
}
