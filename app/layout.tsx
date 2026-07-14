import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SiteIntro } from "@/components/site-intro";
import { BRAND_ASSETS, BRAND_LINKS } from "@/lib/brand";
import { getSiteSettings } from "@/lib/content-repository";
import { safeJsonLd } from "@/lib/json-ld";
import { getSiteUrl } from "@/lib/site-url";
import { getTelegramLinks } from "@/lib/telegram";
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
    icon: BRAND_ASSETS.logo,
    shortcut: BRAND_ASSETS.logo,
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
        url: BRAND_ASSETS.socialCard,
        width: 1200,
        height: 630,
        alt: "Imports Tech — Tecnologia testada no uso real",
      },
    ],
  },
  twitter: { card: "summary_large_image", images: [BRAND_ASSETS.socialCard] },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Imports Tech",
    url: site.toString(),
    logo: new URL(BRAND_ASSETS.logo, site).toString(),
    sameAs: [BRAND_LINKS.youtube],
    description:
      "Canal brasileiro de reviews, garimpos, reparos e tecnologia testada no uso real.",
  };
  const telegram = getTelegramLinks(await getSiteSettings());
  return (
    <html lang="pt-BR">
      <body className={`${geist.variable} ${mono.variable}`}>
        <SiteIntro enabled={process.env.INTRO_ENABLED === "true"} />
        <SiteHeader />
        {children}
        <SiteFooter telegram={telegram} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
        />
      </body>
    </html>
  );
}
