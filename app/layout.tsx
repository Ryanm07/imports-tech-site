import type { Metadata, Viewport } from "next";
import { SiteFrame } from "@/components/site-frame";
import { BRAND_ASSETS, BRAND_LINKS } from "@/lib/brand";
import { getSiteSettings } from "@/lib/content-repository";
import { safeJsonLd } from "@/lib/json-ld";
import { getSiteUrl } from "@/lib/site-url";
import { getTelegramLinks } from "@/lib/telegram";
import { getPublicLinks } from "@/lib/public-links";
import { projectsEnabled } from "@/lib/features";
import "./globals.css";

const site = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: site,
  title: {
    default: "Imports Tech — Tecnologia fora do comum",
    template: "%s | Imports Tech",
  },
  description:
    "Eu compro, testo, conserto e conto a história. Reviews, garimpos e experiências reais com smartphones, notebooks e tecnologia no Imports Tech.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Imports Tech — Tecnologia fora do comum",
    description: "A história, a evolução e a comunidade do Imports Tech.",
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

export const viewport: Viewport = {
  themeColor: "#07111f",
  colorScheme: "dark",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Imports Tech",
    url: site.toString(),
    logo: new URL(BRAND_ASSETS.logoMain, site).toString(),
    sameAs: [BRAND_LINKS.youtube],
    description:
      "Eu compartilho minha história, meus aprendizados e tecnologia testada no uso real.",
  };
  const settings = await getSiteSettings();
  const telegram = getTelegramLinks(settings);
  const publicLinks = getPublicLinks(settings);
  return (
    <html lang="pt-BR">
      <head>
        <link
          rel="preload"
          href="/fonts/geist-latin.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link rel="icon" href={BRAND_ASSETS.icon} />
        <link rel="apple-touch-icon" href={BRAND_ASSETS.appleTouchIcon} />
      </head>
      <body>
        <SiteFrame
          telegram={telegram}
          publicLinks={publicLinks}
          projectsEnabled={projectsEnabled()}
        >
          {children}
        </SiteFrame>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
        />
      </body>
    </html>
  );
}
