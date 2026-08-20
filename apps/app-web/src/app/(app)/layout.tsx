"use client";
/**
 * (app) Route Group Layout
 * Wraps all main app screens with AppShell (layout="app")
 * Includes: TopNavbar (mobile header) + BottomNavbar (5-tab)
 * Tabs: Home · Crypto · Learn · Referral · More
 */
import React from "react";
import { usePathname } from "next/navigation";
import {
  AppShell,
  BottomNavbar,
  Home,
  Bitcoin,
  BookOpen,
  Gift,
  MoreHorizontal,
  type NavTab,
} from "@vnkrvietnam/ui-kit";

const NAV_TABS: NavTab[] = [
  { id: "home",     label: "Home",     icon: <Home           size={18} color="currentColor" /> },
  { id: "crypto",   label: "Crypto",   icon: <Bitcoin        size={18} color="currentColor" /> },
  { id: "learn",    label: "Học tập",  icon: <BookOpen       size={18} color="currentColor" /> },
  { id: "referral", label: "Giới thiệu", icon: <Gift         size={18} color="currentColor" /> },
  { id: "more",     label: "More",     icon: <MoreHorizontal size={18} color="currentColor" /> },
];

const TAB_ROUTES: Record<string, string> = {
  home:     "/home",
  crypto:   "/crypto",
  learn:    "/learn",
  referral: "/referral",
  more:     "/more",
};

const ROUTE_TABS: Record<string, string> = {
  "/home":     "home",
  "/crypto":   "crypto",
  "/learn":    "learn",
  "/referral": "referral",
  "/more":     "more",
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const activeTab = ROUTE_TABS[pathname] ?? "home";

  return (
    <AppShell
      layout="app"
      bg="#F5F6FA"
      bottomNav={
        <BottomNavbar
          tabs={NAV_TABS}
          activeTab={activeTab}
          onTabChange={(id) => {
            const route = TAB_ROUTES[id];
            if (route) window.location.href = route;
          }}
        />
      }
    >
      {children}
    </AppShell>
  );
}
