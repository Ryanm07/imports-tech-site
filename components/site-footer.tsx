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
      <div className="footer-brand">
        <Image
          src={BRAND_ASSETS.logo}
          alt="Logo Imports Tech"
          width={58}
          height={58}
          sizes="58px"
        />
        <div>
          <strong>IMPORTS TECH</strong>
          <span>História · Comunidade · Tecnologia</span>
        </div>
      </div>
      <div className="footer-links">
        <div>
          <strong>Explorar</strong>
          <Link href="/sobre">Minha história</Link>
          {projectsEnabled && <Link href="/projetos">Projetos</Link>}
          <Link href="/comunidade">Comunidade</Link>
          <Link href="/metricas">Métricas públicas</Link>
          <a href={BRAND_LINKS.youtube} target="_blank" rel="noreferrer">
            YouTube ↗
          </a>
        </div>
        <div>
          <strong>Transparência</strong>
          <Link href="/privacidade">Privacidade</Link>
          <Link href="/termos">Termos do site</Link>
          <Link href="/afiliados">Aviso de afiliados</Link>
          <Link href="/contato">Contato</Link>
          {publicLinks.mediaKit ? (
            <a href={publicLinks.mediaKit} target="_blank" rel="noreferrer">
              Media Kit ↗
            </a>
          ) : (
            <span>Media Kit · Em breve</span>
          )}
        </div>
        <div>
          <strong>Telegram</strong>
          {telegram.channel ? (
            <a href={telegram.channel} target="_blank" rel="noreferrer">
              Canal oficial ↗
            </a>
          ) : (
            <span>Canal · Em breve</span>
          )}
          {telegram.group ? (
            <a href={telegram.group} target="_blank" rel="noreferrer">
              Grupo oficial ↗
            </a>
          ) : (
            <span>Grupo · Em breve</span>
          )}
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2026 Imports Tech. Tecnologia testada no uso real.</span>
        <a href={BRAND_LINKS.youtube} target="_blank" rel="noreferrer">
          YouTube ↗
        </a>
      </div>
    </footer>
  );
}
