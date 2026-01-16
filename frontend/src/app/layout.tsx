import type { Metadata } from "next";
import { Geist, Geist_Mono, Plus_Jakarta_Sans, Outfit } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
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
      <body className={`${geistSans.variable} ${geistMono.variable} ${plusJakartaSans.variable} ${outfit.variable} font-outfit`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
