import Image from "next/image";
import Link from "next/link";
import { BRAND_ASSETS, BRAND_LINKS } from "@/lib/brand";
import type { TelegramLinks } from "@/lib/telegram";

export function SiteFooter({ telegram }: { telegram: TelegramLinks }) {
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
          <span>Reviews · Garimpos · Tecnologia</span>
        </div>
      </div>
      <div className="footer-links">
        <div>
          <strong>Explorar</strong>
          <Link href="/videos">Vídeos</Link>
          <Link href="/reviews">Reviews</Link>
          <Link href="/garimpos">Garimpos</Link>
          <Link href="/comunidade">Mural da comunidade</Link>
          <Link href="/metricas">Métricas</Link>
        </div>
        <div>
          <strong>Transparência</strong>
          <Link href="/privacidade">Privacidade</Link>
          <Link href="/termos">Termos da comunidade</Link>
          <Link href="/afiliados">Aviso de afiliados</Link>
          <Link href="/contato">Contato</Link>
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
