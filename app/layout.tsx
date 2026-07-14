import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { safeJsonLd } from "@/lib/json-ld";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const geist = Geist({ variable: "--font-sans", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-mono", subsets: ["latin"] });
const site = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: site,
  title: {
    default: "Imports Tech — Tecnologia testada no uso real",
    template: "%s | Imports Tech",
  },
  description:
    "Reviews sinceros, garimpos, reparos e tecnologia testada no uso real.",
  icons: {
    icon: "/brand/imports-tech-logo.jpg",
    shortcut: "/brand/imports-tech-logo.jpg",
  },
  alternates: { canonical: "/" },
  openGraph: {
    title: "Imports Tech — Tecnologia testada no uso real",
    description: "Reviews, garimpos e reparos sem enrolação.",
    type: "website",
    url: "/",
    siteName: "Imports Tech",
    locale: "pt_BR",
    images: [
      {
        url: "/og.jpg",
        width: 1200,
        height: 630,
        alt: "Imports Tech — Tecnologia testada no uso real",
      },
    ],
  },
  twitter: { card: "summary_large_image", images: ["/og.jpg"] },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Imports Tech",
    url: site.toString(),
    logo: new URL("/brand/imports-tech-logo.jpg", site).toString(),
    sameAs: ["https://www.youtube.com/@Imports_Tech"],
    description:
      "Canal brasileiro de reviews, garimpos, reparos e tecnologia testada no uso real.",
  };
  return (
    <html lang="pt-BR">
      <body className={`${geist.variable} ${mono.variable}`}>
        <SiteHeader />
        {children}
        <SiteFooter />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
        />
      </body>
    </html>
  );
}
