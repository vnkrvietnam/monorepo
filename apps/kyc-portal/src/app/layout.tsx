import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VNKR KYC Portal",
  description: "Xác minh danh tính VNeID",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
