import type { Metadata } from "next";
import { Google_Sans } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";

import "./globals.css";

const googleSans = Google_Sans({
  subsets: ["latin"],
  variable: "--font-google-sans",
  display: "swap",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  title: "Heavens Fruits SAS - Premium Colombian Exotic Fruit Exporters",
  description: "Exportadores de frutas exóticas colombianas de alta calidad, cultivadas de forma sostenible.",
  icons: {
    icon: "/landing/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${googleSans.variable} font-google-sans`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
