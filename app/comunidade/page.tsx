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
      <header className="page-hero" data-motion-section="abertura">
        <span className="eyebrow-v2">COMUNIDADE IMPORTS TECH</span>
        <h1>O vídeo termina. A conversa não precisa terminar.</h1>
        <p>
          Eu uso meus espaços oficiais para continuar perto de quem acompanha o
          canal. Você não precisa criar conta aqui, e eu não mantenho um{" "}
          {"fórum próprio"} no site.
        </p>
      </header>
      <TelegramSection links={telegram} compact />
      <section className="community-youtube" data-motion-section="youtube">
        <span>NO YOUTUBE</span>
        <h2>Eu também estou nos comentários e nas atualizações do canal.</h2>
        <p>
          É por lá que eu publico vídeos, mostro alguns bastidores e compartilho
          atualizações. Meu perfil oficial é @Imports_Tech.
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
