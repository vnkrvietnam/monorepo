/**
 * @vnkrvietnam/ui — SidebarLayout
 * Ready-to-use composition: AppShell(sidebar) + Sidebar + TopNavbar
 * Used by: merchant, sandbox, kyc, admin, analytics apps
 *
 * Handles:
 *   - Responsive collapse (sidebar ↔ drawer on mobile)
 *   - Window resize listener
 *   - Sidebar open/collapsed state
 *   - Unified TopNavbar with hamburger on mobile
 */
import React, { useState, useEffect, useCallback } from "react";
import type { CSSProperties, ReactNode } from "react";
import { AppShell } from "../AppShell/AppShell";
import { Sidebar } from "../Sidebar/Sidebar";
import { TopNavbar } from "../TopNavbar/TopNavbar";
import type { SidebarSection, SidebarItem } from "../Sidebar/Sidebar";
import type { NavLink } from "../TopNavbar/TopNavbar";
import type { TopNavbarVariant } from "../TopNavbar/TopNavbar";
import type { ToastPosition } from "../Toast/Toast";

export interface SidebarLayoutProps {
  /** Sidebar navigation sections */
  sections:        SidebarSection[];
  /** Active nav item id */
  activeId?:       string;
  onNavChange?:    (id: string) => void;
  /** Logo element shown in sidebar header + topnav */
  logo?:           ReactNode;
  /** Bottom slot of sidebar (user profile row) */
  sidebarBottom?:  ReactNode;
  /** Right slot of top navbar (avatar, notifications) */
  topNavRight?:    ReactNode;
  /** Desktop-only top nav links */
  topNavLinks?:    NavLink[];
  topNavVariant?:  TopNavbarVariant;
  /** Page title shown in header (uses PageHeader internally) */
  pageTitle?:      string;
  pageSubtitle?:   string;
  pageBreadcrumb?: { label: string; onClick?: () => void }[];
  pageActions?:    ReactNode;
  children:        ReactNode;
  bg?:             string;
  toastPosition?:  ToastPosition;
  /** Fixed sidebar width (expanded) */
  sidebarWidth?:   number;
  style?:          CSSProperties;
}

const MOBILE_BP = 768;

export function SidebarLayout({
  sections,
  activeId,
  onNavChange,
  logo,
  sidebarBottom,
  topNavRight,
  topNavLinks,
  topNavVariant = "default",
  pageTitle,
  pageSubtitle,
  pageBreadcrumb,
  pageActions,
  children,
  bg            = "#F5F6FA",
  toastPosition = "top-right",
  sidebarWidth  = 240,
  style,
}: SidebarLayoutProps) {
  const [isMobile,   setIsMobile]   = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed,  setCollapsed]  = useState(false);

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < MOBILE_BP);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const handleNavChange = useCallback((id: string) => {
    onNavChange?.(id);
    if (isMobile) setDrawerOpen(false);
  }, [onNavChange, isMobile]);

  const sidebar = (
    <Sidebar
      sections={sections}
      activeId={activeId}
      onItemClick={handleNavChange}
      mode={isMobile ? "drawer" : "sidebar"}
      open={isMobile ? drawerOpen : true}
      collapsed={!isMobile && collapsed}
      onClose={() => setDrawerOpen(false)}
      onCollapse={setCollapsed}
      logo={logo}
      bottomSlot={sidebarBottom}
      width={sidebarWidth}
    />
  );

  const topNav = (
    <TopNavbar
      logo={!isMobile && collapsed ? undefined : (isMobile ? logo : undefined)}
      links={topNavLinks}
      rightSlot={topNavRight}
      variant={topNavVariant}
      onMenuToggle={() => setDrawerOpen(o => !o)}
      menuOpen={drawerOpen}
      height={56}
      sticky
    />
  );

  return (
    <AppShell
      layout="sidebar"
      topNav={topNav}
      sidebar={sidebar}
      bg={bg}
      toastPosition={toastPosition}
      pageHeader={pageTitle ? {
        title:      pageTitle,
        subtitle:   pageSubtitle,
        breadcrumb: pageBreadcrumb,
        actions:    pageActions,
      } : undefined}
      style={style}
    >
      {children}
    </AppShell>
  );
}
