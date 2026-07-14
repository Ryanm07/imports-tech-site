import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const incoming = await headers();
  const host = incoming.get("x-forwarded-host") || incoming.get("host") || "localhost:3000";
  const protocol = incoming.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;
  return {
    title: "Imports Tech — Tecnologia de verdade, sem enrolação",
    description: "Reviews, usados, garimpos, celulares, notebooks e compra inteligente no mundo da tecnologia.",
    icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
    openGraph: {
      title: "Imports Tech — Tecnologia de verdade, sem enrolação",
      description: "Reviews, usados, garimpos, celulares, notebooks e compra inteligente no mundo da tecnologia.",
      type: "website",
      images: [{ url: `${origin}/og-imports-tech.png`, width: 1200, height: 630, alt: "Imports Tech" }],
    },
    twitter: { card: "summary_large_image", images: [`${origin}/og-imports-tech.png`] },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body></html>;
}
