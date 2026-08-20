import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VNKR Scan",
  description: "App-Chain Block Explorer & Proof of Reserve — VNKR Blockchain Network Ltd.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="vi"><body>{children}</body></html>;
}
