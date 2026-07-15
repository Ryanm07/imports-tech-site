"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BRAND_ASSETS, BRAND_LINKS } from "@/lib/brand";
import type { TelegramLinks } from "@/lib/telegram";

const nav = [
  ["Início", "/"],
  ["Minha história", "/sobre"],
  ["Projetos", "/projetos"],
  ["Mural", "/comunidade"],
] as const;

export function SiteHeader({ telegram }: { telegram: TelegramLinks }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const telegramUrl = telegram.group || telegram.channel;

  useEffect(() => setMenuOpen(false), [pathname]);

  return (
    <>
      <a className="skip-link" href="#conteudo">
        Pular para o conteúdo
      </a>
      <header className="header-shell">
        <Link
          className="official-brand"
          href="/"
          aria-label="Imports Tech — início"
        >
          <Image
            data-intro-logo-target
            src={BRAND_ASSETS.logo}
            alt=""
            width="44"
            height="44"
            priority
          />
          <span>
            IMPORTS <strong>TECH</strong>
          </span>
        </Link>
        <nav
          id="main-navigation"
          className={menuOpen ? "main-nav is-open" : "main-nav"}
          aria-label="Navegação principal"
        >
          {nav.map(([label, href]) => {
            const active =
              href === "/"
                ? pathname === "/"
                : pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
              >
                {label}
              </Link>
            );
          })}
          <div className="mobile-external-links">
            {telegramUrl ? (
              <a href={telegramUrl} target="_blank" rel="noreferrer">
                Telegram ↗
              </a>
            ) : (
              <span>Telegram · Em breve</span>
            )}
            <a href={BRAND_LINKS.youtube} target="_blank" rel="noreferrer">
              YouTube ↗
            </a>
          </div>
        </nav>
        <div className="header-actions header-external">
          {telegramUrl ? (
            <a
              className="telegram-cta"
              href={telegramUrl}
              target="_blank"
              rel="noreferrer"
            >
              Telegram
            </a>
          ) : (
            <span className="telegram-cta is-disabled">Telegram</span>
          )}
          <a
            className="youtube-cta"
            href={BRAND_LINKS.youtube}
            target="_blank"
            rel="noreferrer"
          >
            <span aria-hidden="true">▶</span> YouTube
          </a>
          <button
            className="menu-trigger"
            onClick={() => setMenuOpen((value) => !value)}
            aria-expanded={menuOpen}
            aria-controls="main-navigation"
            aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
          >
            <i />
            <i />
            <i />
          </button>
        </div>
      </header>
    </>
  );
}
