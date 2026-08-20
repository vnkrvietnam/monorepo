"use client";
/**
 * App root — redirects to /home by default
 * Renders the AppShell with BottomNavbar for mobile PWA experience
 */
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RootPage() {
  const router = useRouter();
  useEffect(() => { router.replace("/home"); }, [router]);
  return null;
}
