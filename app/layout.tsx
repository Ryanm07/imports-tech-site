import type { Metadata } from "next";
import { headers } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import "./globals.css";

const geist = Geist({ variable: "--font-sans", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-mono", subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const incoming = await headers();
  const host = incoming.get("x-forwarded-host") || incoming.get("host") || "localhost:3000";
  const protocol = incoming.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;
  return {
    metadataBase: new URL(origin),
    title: { default: "Imports Tech — Tecnologia testada no uso real", template: "%s | Imports Tech" },
    description: "Reviews sinceros, garimpos, reparos e tecnologia testada no uso real.",
    icons: { icon: "/brand/imports-tech-logo.jpg", shortcut: "/brand/imports-tech-logo.jpg" },
    openGraph: { title: "Imports Tech — Tecnologia testada no uso real", description: "Reviews, garimpos e reparos sem enrolação.", type: "website", url: origin, siteName: "Imports Tech", images: [{ url: `${origin}/og-imports-tech-v2.png`, width: 1200, height: 630, alt: "Imports Tech — Tecnologia testada no uso real" }] },
    twitter: { card: "summary_large_image", images: [`${origin}/og-imports-tech-v2.png`] },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const jsonLd = { "@context": "https://schema.org", "@type": "Organization", name: "Imports Tech", url: "https://www.youtube.com/@Imports_Tech", logo: "/brand/imports-tech-logo.jpg", sameAs: ["https://www.youtube.com/@Imports_Tech"], description: "Canal brasileiro de reviews, garimpos, reparos e tecnologia testada no uso real." };
  return <html lang="pt-BR"><body className={`${geist.variable} ${mono.variable}`}><SiteHeader/>{children}<SiteFooter/><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}/></body></html>;
}
