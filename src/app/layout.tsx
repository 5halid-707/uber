import type { Metadata, Viewport } from "next";
import { Cairo, Tajawal } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "@/components/providers";

const cairo = Cairo({ variable: "--font-cairo", subsets: ["arabic", "latin"], display: "swap" });
const tajawal = Tajawal({ variable: "--font-tajawal", subsets: ["arabic", "latin"], weight: ["400", "500", "700", "800"], display: "swap" });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#000000",
};

export const metadata: Metadata = {
  title: "أوبر - منصة النقل والتوصيل الذكية",
  description: "احجز رحلتك في دقائق، توصيل طعام، شحن طرود، وأكثر. خدمات نقل ذكية في جميع مدن المملكة.",
  keywords: ["أوبر", "uber", "توصيل", "نقل", "تاكسي", "توصيل طعام", "شحن"],
  authors: [{ name: "أوبر" }],
  creator: "أوبر",
  publisher: "أوبر",
  manifest: "/manifest.json",
  icons: {
    icon: [{ url: "/logo.svg", type: "image/svg+xml" }],
    shortcut: ["/logo.svg"],
    apple: [{ url: "/logo.svg" }],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/logo.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/logo.svg" />
        <link rel="shortcut icon" href="/logo.svg" />
      </head>
      <body className={`${cairo.variable} ${tajawal.variable} font-tajawal antialiased bg-white text-foreground`}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
