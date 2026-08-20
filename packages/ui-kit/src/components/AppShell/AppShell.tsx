/**
 * @vnkrvietnam/ui — AppShell
 * Universal layout wrapper for all VNKR apps
 *
 * Layouts:
 *   default  — TopNavbar + content area (vnkr.vn, docs, kyc)
 *   sidebar  — Sidebar + content area  (merchant, admin, sandbox, analytics)
 *   app      — content + BottomNavbar  (app.vnkr.vn — mobile PWA)
 *   blank    — no chrome               (auth pages, fullscreen)
 *
 * Features:
 *   - Responsive: sidebar collapses to drawer on mobile
 *   - ToastProvider automatically included
 *   - CSS custom properties injected once
 *   - Main content scroll area
 *   - Optional page header slot (title + breadcrumb + actions)
 */
import React from "react";
import type { CSSProperties, ReactNode } from "react";
import { ToastProvider } from "../Toast/Toast";
import type { ToastPosition } from "../Toast/Toast";
import { injectVnkrTokens } from "../../tokens/cssVariables";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AppShellLayout = "default" | "sidebar" | "app" | "blank";

export interface PageHeaderProps {
  title:         string;
  /** Breadcrumb path: [{ label, onClick? }] */
  breadcrumb?:   { label: string; onClick?: () => void }[];
  subtitle?:     string;
  /** Right-side actions slot */
  actions?:      ReactNode;
}

export interface AppShellProps {
  layout?:        AppShellLayout;
  /** TopNavbar slot (default/app layouts) */
  topNav?:        ReactNode;
  /** Sidebar slot (sidebar layout) */
  sidebar?:       ReactNode;
  /** BottomNavbar slot (app layout) */
  bottomNav?:     ReactNode;
  /** Optional page header inside content area */
  pageHeader?:    PageHeaderProps;
  children:       ReactNode;
  /** Toast notification position */
  toastPosition?: ToastPosition;
  /** Background color of content area */
  bg?:            string;
  style?:         CSSProperties;
  /** Additional class on the root element */
  className?:     string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AppShell({
  layout        = "default",
  topNav,
  sidebar,
  bottomNav,
  pageHeader,
  children,
  toastPosition = "top-right",
  bg            = "#F5F6FA",
  style,
  className,
}: AppShellProps) {
  // Inject design tokens once on mount
  React.useEffect(() => { injectVnkrTokens(); }, []);

  const rootStyle: CSSProperties = {
    display:       "flex",
    flexDirection: "column",
    minHeight:     "100vh",
    background:    bg,
    fontFamily:    "'Work Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    ...style,
  };

  if (layout === "blank") {
    return (
      <div style={rootStyle} className={className}>
        <ToastProvider position={toastPosition} />
        {children}
      </div>
    );
  }

  if (layout === "sidebar") {
    return (
      <div style={{ ...rootStyle, flexDirection: "row" }} className={className}>
        <ToastProvider position={toastPosition} />
        {/* Sidebar */}
        {sidebar}
        {/* Main column */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
          {topNav}
          <main style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
            {pageHeader && <PageHeader {...pageHeader} />}
            {children}
          </main>
        </div>
      </div>
    );
  }

  if (layout === "app") {
    return (
      <div style={rootStyle} className={className}>
        <ToastProvider position={toastPosition} />
        {topNav}
        <main style={{ flex: 1, overflowY: "auto", overflowX: "hidden", paddingBottom: bottomNav ? 64 : 0 }}>
          {pageHeader && <PageHeader {...pageHeader} />}
          {children}
        </main>
        {/* BottomNavbar: fixed at bottom */}
        {bottomNav && (
          <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50 }}>
            {bottomNav}
          </div>
        )}
      </div>
    );
  }

  // default layout
  return (
    <div style={rootStyle} className={className}>
      <ToastProvider position={toastPosition} />
      {topNav}
      <main style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
        {pageHeader && <PageHeader {...pageHeader} />}
        {children}
      </main>
    </div>
  );
}

// ─── PageHeader ───────────────────────────────────────────────────────────────

function PageHeader({ title, breadcrumb, subtitle, actions }: PageHeaderProps) {
  return (
    <div style={{
      padding:        "20px 24px 0",
      background:     "transparent",
    }}>
      {/* Breadcrumb */}
      {breadcrumb && breadcrumb.length > 0 && (
        <nav style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 8 }}>
          {breadcrumb.map((crumb, i) => (
            <React.Fragment key={i}>
              {i > 0 && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                  stroke="#CBD5E0" strokeWidth="2" strokeLinecap="round">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              )}
              <span
                style={{
                  fontSize:   12,
                  fontWeight: crumb.onClick ? 500 : 600,
                  color:      crumb.onClick ? "#718096" : "#1A1F36",
                  cursor:     crumb.onClick ? "pointer" : "default",
                  fontFamily: "'Work Sans', sans-serif",
                }}
                onClick={crumb.onClick}
              >
                {crumb.label}
              </span>
            </React.Fragment>
          ))}
        </nav>
      )}

      {/* Title row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 20 }}>
        <div>
          <h1 style={{
            fontSize:   22,
            fontWeight: 700,
            color:      "#1A1F36",
            margin:     0,
            lineHeight: 1.2,
            fontFamily: "'Work Sans', sans-serif",
          }}>
            {title}
          </h1>
          {subtitle && (
            <p style={{
              fontSize:  13,
              color:     "#718096",
              margin:    "4px 0 0",
              fontFamily:"'Work Sans', sans-serif",
            }}>
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
