import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title:       "VNKR Merchant — Payment Dashboard",
  description: "Merchant Portal — Quản lý thanh toán, API Keys, đơn hàng — VNKR FinTech",
  icons:       { icon: "/favicon.ico" },
  openGraph: {
    title:       "VNKR Merchant Portal",
    description: "Merchant Dashboard — Quản lý thanh toán & API",
    url:         "https://merchant.vnkr.vn",
    siteName:    "VNKR Merchant",
    locale:      "vi_VN",
    type:        "website",
  },
};

export const viewport: Viewport = {
  width:        "device-width",
  initialScale: 1,
  themeColor:   "#000000",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Work+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
