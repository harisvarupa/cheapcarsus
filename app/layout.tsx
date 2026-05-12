import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: "cheapcarsus | Affordable Used Cars",
  description:
    "Browse affordable used cars with transparent condition tags, smart filters, and clear listing details.",
  icons: {
    icon: "/brand-mark.svg",
    apple: "/brand-mark.svg",
  },
  openGraph: {
    title: "cheapcarsus | Affordable Used Cars",
    description:
      "Browse affordable used cars with transparent condition tags, smart filters, and clear listing details.",
    siteName: "cheapcarsus",
    images: ["/brand-mark.svg"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
