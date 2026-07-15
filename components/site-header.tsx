"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BRAND_ASSETS, BRAND_LINKS } from "@/lib/brand";
import type { PublicLinks } from "@/lib/public-links";

const nav = [
  ["Início", "/"],
  ["Minha história", "/sobre"],
  ["Projetos", "/projetos"],
  ["Comunidade", "/comunidade"],
] as const;

export function SiteHeader({ publicLinks }: { publicLinks: PublicLinks }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const header = useRef<HTMLElement>(null);

  useEffect(() => setMenuOpen(false), [pathname]);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      if (!header.current) return;
      const distance = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight,
      );
      header.current.dataset.scrolled = window.scrollY > 24 ? "true" : "false";
      header.current.style.setProperty(
        "--header-progress",
        Math.min(1, window.scrollY / distance).toFixed(4),
      );
    };
    const onScroll = () => {
      window.cancelAnimationFrame(raf);
      raf = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <>
      <a className="skip-link" href="#conteudo">
        Pular para o conteúdo
      </a>
      <header className="header-shell" ref={header}>
        <span className="header-progress" aria-hidden="true" />
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
            {publicLinks.mediaKit ? (
              <a href={publicLinks.mediaKit} target="_blank" rel="noreferrer">
                Media Kit ↗
              </a>
            ) : (
              <span>Media Kit · Em breve</span>
            )}
            <a href={BRAND_LINKS.youtube} target="_blank" rel="noreferrer">
              YouTube ↗
            </a>
          </div>
        </nav>
        <div className="header-actions header-external">
          {publicLinks.mediaKit ? (
            <a
              className="telegram-cta"
              href={publicLinks.mediaKit}
              target="_blank"
              rel="noreferrer"
            >
              Media Kit
            </a>
          ) : (
            <span className="telegram-cta is-disabled">Media Kit</span>
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
