import type { Metadata } from "next";
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
    <main id="conteudo" className="page-main">
      <header className="page-hero">
        <span className="eyebrow-v2">FALE COMIGO</span>
        <h1>Contato direto, sem formulário invasivo.</h1>
        <p>
          Para parcerias, contato editorial, correções ou privacidade, eu uso
          somente os canais oficiais indicados nesta página.
        </p>
      </header>
      <div className="contact-grid">
        {links.commercialEmail ? (
          <a href={`mailto:${links.commercialEmail}`}>
            <span>E-MAIL COMERCIAL</span>
            <strong>{links.commercialEmail}</strong>
            <p>
              Eu recebo propostas, contatos editoriais e solicitações por aqui.
            </p>
          </a>
        ) : (
          <div>
            <span>E-MAIL COMERCIAL</span>
            <strong>Em breve</strong>
            <p>Eu ainda não publiquei um endereço comercial confirmado.</p>
          </div>
        )}
        {links.mediaKit ? (
          <a href={links.mediaKit} target="_blank" rel="noreferrer">
            <span>MEDIA KIT</span>
            <strong>Conhecer meu trabalho ↗</strong>
            <p>Informações profissionais e formatos de colaboração.</p>
          </a>
        ) : (
          <div>
            <span>MEDIA KIT</span>
            <strong>Em breve</strong>
            <p>O documento será exibido quando o endereço for confirmado.</p>
          </div>
        )}
        <a href={BRAND_LINKS.youtube} target="_blank" rel="noreferrer">
          <span>YOUTUBE</span>
          <strong>@Imports_Tech</strong>
          <p>Meus vídeos, comentários e publicações oficiais.</p>
        </a>
      </div>
    </main>
  );
}
