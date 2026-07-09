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
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://uber-new-omega.vercel.app"),
  title: {
    default: "أوبر - منصة النقل والتوصيل الذكية",
    template: "%s | أوبر",
  },
  description: "احجز رحلتك في دقائق، توصيل طعام، شحن طرود، وأكثر. خدمات نقل ذكية في جميع مدن المملكة العربية السعودية.",
  keywords: ["أوبر", "uber", "توصيل", "نقل", "تاكسي", "توصيل طعام", "شحن", "السعودية", "الرياض", "جدة"],
  authors: [{ name: "أوبر" }],
  creator: "أوبر",
  publisher: "أوبر",
  manifest: "/manifest.json",
  alternates: {
    canonical: "/",
    languages: { "ar-SA": "/" },
  },
  openGraph: {
    title: "أوبر - منصة النقل والتوصيل الذكية",
    description: "احجز رحلتك في دقائق. خدمات نقل ذكية في جميع مدن المملكة.",
    url: "https://uber-new-omega.vercel.app",
    siteName: "أوبر",
    locale: "ar_SA",
    type: "website",
    images: [{ url: "/logo.svg", width: 192, height: 192, alt: "أوبر" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "أوبر - منصة النقل والتوصيل الذكية",
    description: "احجز رحلتك في دقائق. خدمات نقل ذكية في جميع مدن المملكة.",
    images: ["/logo.svg"],
  },
  icons: {
    icon: [{ url: "/logo.svg", type: "image/svg+xml" }],
    shortcut: ["/logo.svg"],
    apple: [{ url: "/logo.svg" }],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  category: "technology",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/logo.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/logo.svg" />
        <link rel="shortcut icon" href="/logo.svg" />
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`} />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
                `,
              }}
            />
          </>
        )}
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
