import type { Metadata } from "next";
import { ReactNode } from "react";

import "./globals.css";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { SignInProvider } from "@/components/SignInProvider";
import { siteConfig } from "@/lib/site";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://neobank.example";

export const metadata: Metadata = {
  title: `${siteConfig.brandName} | ${siteConfig.tagline}`,
  applicationName: siteConfig.brandName,
  description:
    "Global cards and IBAN accounts with policy driven controls and non custodial ownership, designed as a modern neobank experience.",
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: `${siteConfig.brandName} | ${siteConfig.tagline}`,
    description:
      "Global cards and IBAN accounts with policy driven controls and non custodial ownership, designed as a modern neobank experience.",
    url: siteUrl,
    siteName: siteConfig.brandName,
    locale: "en_US",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.brandName} | ${siteConfig.tagline}`,
    description:
      "Global cards and IBAN accounts with policy driven controls and non custodial ownership, designed as a modern neobank experience."
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <SignInProvider>
          <Navbar />
          <main className="min-h-screen pt-20">{children}</main>
          <Footer />
        </SignInProvider>
      </body>
    </html>
  );
}
