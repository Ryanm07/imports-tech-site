import Image from "next/image";
import Link from "next/link";
import { BRAND_ASSETS, BRAND_LINKS } from "@/lib/brand";
import type { TelegramLinks } from "@/lib/telegram";
import type { PublicLinks } from "@/lib/public-links";

export function SiteFooter({
  telegram,
  publicLinks,
  projectsEnabled,
}: {
  telegram: TelegramLinks;
  publicLinks: PublicLinks;
  projectsEnabled: boolean;
}) {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <Link href="/" aria-label="Imports Tech — início">
            <Image
              src={BRAND_ASSETS.logo}
              alt=""
              width={48}
              height={48}
              sizes="48px"
              unoptimized
            />
          </Link>
          <div>
            <strong>IMPORTS TECH</strong>
            <span>Tecnologia fora do comum.</span>
          </div>
        </div>
        <nav
          className="footer-links footer-nav"
          aria-label="Navegação do rodapé"
        >
          <div>
            <strong>Explore</strong>
            <Link href="/sobre">Minha história</Link>
            {projectsEnabled && <Link href="/projetos">Projetos</Link>}
            <Link href="/comunidade">Comunidade</Link>
            <Link href="/metricas">Métricas públicas</Link>
            <Link href="/contato">Contato</Link>
          </div>
          <div>
            <strong>Transparência</strong>
            <Link href="/privacidade">Privacidade</Link>
            <Link href="/termos">Termos do site</Link>
            <Link href="/afiliados">Aviso de afiliados</Link>
            {publicLinks.mediaKit && (
              <a href={publicLinks.mediaKit} target="_blank" rel="noreferrer">
                Media Kit
              </a>
            )}
          </div>
        </nav>
      </div>
      <div className="footer-bottom">
        <span>© 2026 Imports Tech</span>
        <nav className="footer-social-links" aria-label="Redes oficiais">
          <a href={BRAND_LINKS.youtube} target="_blank" rel="noreferrer">
            YouTube
          </a>
          {telegram.channel && (
            <a href={telegram.channel} target="_blank" rel="noreferrer">
              Promoções no Telegram
            </a>
          )}
          {telegram.group && (
            <a href={telegram.group} target="_blank" rel="noreferrer">
              Grupo no Telegram
            </a>
          )}
        </nav>
      </div>
    </footer>
  );
}
