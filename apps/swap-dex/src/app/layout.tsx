import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VNKR Swap",
  description: "AMM DEX & Cross-chain Liquidity Router — VNKR Global Ventures Pte. Ltd.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="vi"><body>{children}</body></html>;
}
