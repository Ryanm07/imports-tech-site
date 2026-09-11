import type { Metadata } from "next";
import Link from "next/link";
import { ContactEmail } from "@/components/contact-email";
import { BRAND_LINKS } from "@/lib/brand";
import { getSiteSettings } from "@/lib/content-repository";
import { getPublicLinks } from "@/lib/public-links";

export const metadata: Metadata = {
  title: "Contato comercial",
  description: "Meus canais oficiais de contato e o Media Kit do Imports Tech.",
  alternates: { canonical: "/contato" },
};

export default async function ContactPage() {
  const links = getPublicLinks(await getSiteSettings());
  return (
    <main id="conteudo" className="page-main contact-page">
      <header className="page-hero" data-motion-section="abertura">
        <span className="eyebrow-v2">Contato</span>
        <h1>Vamos criar algo fora do comum.</h1>
        <p>
          Parcerias, ideias de conteúdo ou uma boa conversa sobre tecnologia.
          Aqui estão os caminhos oficiais para falar comigo.
        </p>
      </header>
      <div className="contact-layout">
        <section className="contact-primary">
          {links.commercialEmail ? (
            <>
              <span className="eyebrow-v2">Contato comercial</span>
              <h2>A próxima ideia começa com uma conversa.</h2>
              <p>
                Envie sua proposta, contato editorial ou solicitação diretamente
                para mim.
              </p>
              <ContactEmail email={links.commercialEmail} />
            </>
          ) : (
            <>
              <span className="eyebrow-v2">Meu canal oficial</span>
              <h2>Por enquanto, a gente se encontra no YouTube.</h2>
              <p>
                Meus vídeos, atualizações e comentários estão no @Imports_Tech.
                É o espaço disponível para acompanhar meu trabalho e conversar
                sobre os conteúdos.
              </p>
              <a
                className="button primary"
                href={BRAND_LINKS.youtube}
                target="_blank"
                rel="noreferrer"
              >
                Acessar @Imports_Tech
              </a>
            </>
          )}
        </section>
        <aside
          className="contact-details"
          aria-label="Informações para contato"
        >
          {links.mediaKit ? (
            <section>
              <span className="eyebrow-v2">Para marcas</span>
              <h2>Conheça meu trabalho.</h2>
              <p>
                Informações profissionais e formatos de colaboração em um só
                lugar.
              </p>
              <a
                className="button secondary"
                href={links.mediaKit}
                target="_blank"
                rel="noreferrer"
              >
                Abrir Media Kit
              </a>
            </section>
          ) : (
            <section>
              <span className="eyebrow-v2">Para marcas</span>
              <h2>Conteúdo com experiência real.</h2>
              <p>
                Conheça a trajetória do canal e os números públicos enquanto o
                Media Kit não está disponível.
              </p>
              <Link className="inline-link" href="/metricas">
                Ver métricas do canal
              </Link>
            </section>
          )}
          <div className="contact-note">
            <h3>Transparência no contato</h3>
            <p>
              Para parcerias, correções, contato editorial e privacidade, use
              somente os canais oficiais publicados nesta página.
            </p>
            {!links.commercialEmail && (
              <p>O endereço de e-mail comercial ainda não foi publicado.</p>
            )}
            {links.commercialEmail && (
              <a
                className="inline-link"
                href={BRAND_LINKS.youtube}
                target="_blank"
                rel="noreferrer"
              >
                Também estou no YouTube
              </a>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}
