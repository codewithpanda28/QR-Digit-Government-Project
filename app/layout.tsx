import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

// ✅ Native Next.js font loading — no render-blocking @import
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Q-Raksha - India's #1 Safety QR Platform",
  description: "Next-generation smart QR tags for child safety, women safety, elderly care, and vehicles. Q-Raksha saves lives with instant emergency alerts.",
  keywords: "Q-Raksha, QR safety India, emergency alerts, child safety, women safety, elderly care, vehicle safety",
  authors: [{ name: "Q-Raksha Team" }],
  icons: {
    icon: "/logo faviocn.jpeg",
  },
  openGraph: {
    title: "Q-Raksha - India's #1 Safety QR",
    description: "Intelligent QR-based safety platform for everyone",
    url: "https://q-raksha.in/",
    siteName: "Q-Raksha",
    type: "website",
  },
};

import Script from "next/script";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${outfit.variable} font-sans antialiased`} suppressHydrationWarning>
        {/* ✅ lazyOnload — Cashfree loads AFTER page is interactive, doesn't block render */}
        <Script src="https://sdk.cashfree.com/js/v3/cashfree.js" strategy="lazyOnload" />
        {children}
      </body>
    </html>
  );
}
