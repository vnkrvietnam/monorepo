"use client";
/**
 * (auth) Route Group Layout
 * Blank AppShell — no chrome, full-screen, white background
 */
import React from "react";
import { AppShell } from "@vnkrvietnam/ui-kit";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell layout="blank" bg="#FFFFFF">
      {children}
    </AppShell>
  );
}
