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
        <span className="eyebrow-v2">Comunidade</span>
        <h1>Tecnologia fica melhor em boa companhia.</h1>
        <p>
          Uma descoberta puxa outra. Um comentário vira uma ideia. Esses são os
          espaços para trocar experiências e continuar perto de quem acompanha o
          Imports Tech.
        </p>
      </header>
      <TelegramSection links={telegram} compact />
      <section className="community-youtube" data-motion-section="youtube">
        <div>
          <h2>Seu próximo assunto pode estar nos comentários.</h2>
          <p>
            Eu compartilho bastidores e atualizações na comunidade do YouTube.
            Meu perfil oficial é @Imports_Tech.
          </p>
          <p>
            Você não precisa criar uma conta neste site: a conversa acontece nos
            canais oficiais, sem um fórum próprio por aqui.
          </p>
        </div>
        <a
          className="button secondary"
          href={BRAND_LINKS.youtubeCommunity}
          target="_blank"
          rel="noreferrer"
        >
          Ver atualizações do canal
        </a>
      </section>
    </main>
  );
}
