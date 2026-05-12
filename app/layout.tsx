import type { Metadata } from "next";
import { Sora } from "next/font/google";
import "./globals.css";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const siteTitle = "Cheap Cars US";
const siteSubtitle = "Affordable Used Cars With Transparent Listings";
const siteDescription =
  "Shop budget-friendly used cars across the US with clear photos, condition tags, pricing, mileage, and listing details before you visit or contact a seller.";
const logoImage = {
  url: "/cheap-cars-us-logo.png",
  width: 1024,
  height: 1024,
  alt: "Cheap Cars US logo",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: siteTitle,
  title: {
    default: `${siteTitle} | ${siteSubtitle}`,
    template: `%s | ${siteTitle}`,
  },
  description: siteDescription,
  keywords: [
    "cheap cars",
    "used cars",
    "affordable used cars",
    "budget cars",
    "cars for sale",
    "used car marketplace",
  ],
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/cheap-cars-us-logo.png",
    apple: "/cheap-cars-us-logo.png",
  },
  openGraph: {
    title: `${siteTitle} | ${siteSubtitle}`,
    description: siteDescription,
    url: "/",
    siteName: siteTitle,
    images: [logoImage],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteTitle} | ${siteSubtitle}`,
    description: siteDescription,
    images: [logoImage],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={`${sora.variable} antialiased`}>
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
