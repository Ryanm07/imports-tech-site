import type { Metadata } from "next";
import { TelegramSection } from "@/components/telegram-section";
import { getSiteSettings } from "@/lib/content-repository";
import { getTelegramLinks } from "@/lib/telegram";

export const metadata: Metadata = {
  title: "Comunidade",
  description:
    "Os espaços oficiais para conversar e acompanhar o Imports Tech.",
  alternates: { canonical: "/comunidade" },
};

export default async function CommunityPage() {
  const telegram = getTelegramLinks(await getSiteSettings());
  return (
    <main id="conteudo" className="page-main community-hub">
      <header className="page-hero" data-motion-section="abertura">
        <span className="eyebrow-v2">Comunidade</span>
        <h1>A conversa continua.</h1>
        <p>
          Ideias, dúvidas e experiências de quem acompanha o Imports Tech. Estes
          são os espaços oficiais para participar.
        </p>
      </header>
      <TelegramSection links={telegram} compact />
    </main>
  );
}
