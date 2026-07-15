import type { Metadata } from "next";
import { TelegramSection } from "@/components/telegram-section";
import { BRAND_LINKS } from "@/lib/brand";
import { getSiteSettings } from "@/lib/content-repository";
import { getTelegramLinks } from "@/lib/telegram";

export const metadata: Metadata = {
  title: "Comunidade",
  description:
    "Os espaços oficiais onde eu compartilho promoções e converso com a comunidade Imports Tech.",
  alternates: { canonical: "/comunidade" },
};

export default async function CommunityPage() {
  const telegram = getTelegramLinks(await getSiteSettings());
  return (
    <main id="conteudo" className="page-main community-hub">
      <header className="page-hero">
        <span className="eyebrow-v2">COMUNIDADE IMPORTS TECH</span>
        <h1>A conversa continua fora do site.</h1>
        <p>
          Eu uso os espaços oficiais para ficar perto de quem acompanha o canal.
          O site não exige conta e não mantém um fórum próprio.
        </p>
      </header>
      <TelegramSection links={telegram} compact />
      <section className="community-youtube">
        <span>NO YOUTUBE</span>
        <h2>Eu também leio comentários e publico atualizações no canal.</h2>
        <p>
          Para acompanhar vídeos, bastidores e publicações, use sempre o perfil
          oficial @Imports_Tech.
        </p>
        <a
          className="button secondary"
          href={BRAND_LINKS.youtubeCommunity}
          target="_blank"
          rel="noreferrer"
        >
          Abrir a comunidade do YouTube ↗
        </a>
      </section>
    </main>
  );
}
