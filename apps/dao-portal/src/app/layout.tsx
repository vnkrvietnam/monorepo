import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VNKR DAO",
  description: "Treasury Management & Governance Portal — VNKR Capital & Foundation Ltd.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="vi"><body>{children}</body></html>;
}
