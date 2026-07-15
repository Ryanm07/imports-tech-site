import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SiteIntro } from "@/components/site-intro";
import { InteractiveBackground } from "@/components/motion/interactive-background";
import { PageTransition } from "@/components/motion/page-transition";
import { MotionProvider } from "@/components/motion/motion-provider";
import { BRAND_ASSETS, BRAND_LINKS } from "@/lib/brand";
import { getSiteSettings } from "@/lib/content-repository";
import { safeJsonLd } from "@/lib/json-ld";
import { getSiteUrl } from "@/lib/site-url";
import { getTelegramLinks } from "@/lib/telegram";
import { getPublicLinks } from "@/lib/public-links";
import { projectsEnabled } from "@/lib/features";
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
    "Eu conto minha evolução criando conteúdo sobre celulares, notebooks e tecnologia no uso real.",
  icons: {
    icon: BRAND_ASSETS.icon,
    shortcut: BRAND_ASSETS.favicon,
    apple: BRAND_ASSETS.appleTouchIcon,
  },
  alternates: { canonical: "/" },
  openGraph: {
    title: "Imports Tech — Tecnologia testada no uso real",
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
      <body className={`${geist.variable} ${mono.variable}`}>
        <MotionProvider>
          <InteractiveBackground />
          <SiteIntro enabled={process.env.INTRO_ENABLED === "true"} />
          <SiteHeader
            publicLinks={publicLinks}
            projectsEnabled={projectsEnabled()}
          />
          <PageTransition>{children}</PageTransition>
          <SiteFooter
            telegram={telegram}
            publicLinks={publicLinks}
            projectsEnabled={projectsEnabled()}
          />
        </MotionProvider>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
        />
      </body>
    </html>
  );
}
