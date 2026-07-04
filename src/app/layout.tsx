import type { Metadata } from "next";
import { Cairo, Tajawal } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "@/components/providers";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  display: "swap",
});

const tajawal = Tajawal({
  variable: "--font-tajawal",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "حراج - موقع الإعلانات المبوبة الأول في السعودية",
  description: "موقع حراج لبيع وشراء السيارات والعقارات والأجهزة والإلكترونيات والأثاث والوظائف والحيوانات والخدمات. أضف إعلانك مجاناً وصل لملايين العملاء.",
  keywords: ["حراج", "حراج السيارات", "إعلانات مبوبة", "سوق السعودية", "بيع وشراء", "سيارات مستعملة", "عقارات"],
  authors: [{ name: "Haraj" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "حراج - موقع الإعلانات المبوبة",
    description: "أكبر سوق للإعلانات المبوبة في السعودية",
    type: "website",
    locale: "ar_SA",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body
        className={`${cairo.variable} ${tajawal.variable} font-tajawal antialiased bg-background text-foreground`}
      >
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
