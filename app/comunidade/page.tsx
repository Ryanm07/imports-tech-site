import type { Metadata } from "next";
import { CommunityClient } from "@/components/community-client";
import { TelegramSection } from "@/components/telegram-section";
import { BRAND_LINKS } from "@/lib/brand";
import { getSiteSettings } from "@/lib/content-repository";
import { communityCategories } from "@/lib/site-data";
import { getTelegramLinks } from "@/lib/telegram";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Mural da Comunidade",
  description:
    "Dúvidas, garimpos, reparos e conversas sobre tecnologia com a comunidade Imports Tech.",
  alternates: { canonical: "/comunidade" },
};

export default async function CommunityPage() {
  const enabled = process.env.COMMUNITY_ENABLED === "true";
  const telegram = getTelegramLinks(await getSiteSettings());
  if (!enabled) {
    return (
      <main id="conteudo" className="page-main">
        <div className="feature-soon">
          <span>MURAL DA COMUNIDADE</span>
          <h1>Comunidade em breve.</h1>
          <p>
            Estamos preparando um espaço simples para dúvidas, achados e
            experiências sobre tecnologia, com moderação e proteção contra spam.
          </p>
          <div className="category-pills">
            {communityCategories.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
          <a
            className="button primary"
            href={BRAND_LINKS.youtubeCommunity}
            target="_blank"
            rel="noreferrer"
          >
            Acompanhar no YouTube ↗
          </a>
          <TelegramSection links={telegram} compact />
        </div>
      </main>
    );
  }

  return (
    <main id="conteudo" className="page-main">
      <header className="page-hero">
        <span className="eyebrow-v2">MURAL DA COMUNIDADE</span>
        <h1>Pergunte. Responda. Compartilhe o garimpo.</h1>
        <p>
          Não é preciso criar conta. O nome é informado por cada visitante e não
          representa uma identidade verificada, exceto quando houver o selo
          oficial.
        </p>
      </header>
      <CommunityClient
        turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ""}
      />
      <TelegramSection links={telegram} compact />
    </main>
  );
}
