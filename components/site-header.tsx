"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BRAND_ASSETS, BRAND_LINKS } from "@/lib/brand";
import type { PublicLinks } from "@/lib/public-links";

const baseNav = [
  ["Início", "/"],
  ["Minha história", "/sobre"],
  ["Comunidade", "/comunidade"],
] as const;

export function SiteHeader({
  publicLinks,
  projectsEnabled,
}: {
  publicLinks: PublicLinks;
  projectsEnabled: boolean;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const header = useRef<HTMLElement>(null);
  const menuTrigger = useRef<HTMLButtonElement>(null);
  const sceneLabel = useRef<HTMLSpanElement>(null);
  const nav = projectsEnabled
    ? ([...baseNav.slice(0, 2), ["Projetos", "/projetos"], baseNav[2]] as const)
    : baseNav;

  useEffect(() => setMenuOpen(false), [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMenuOpen(false);
      menuTrigger.current?.focus();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

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
    const onMotionFrame = (event: Event) => {
      const detail = (event as CustomEvent<{ section?: string }>).detail;
      if (!header.current || !sceneLabel.current) return;
      const section = detail?.section || "top";
      header.current.dataset.scene = section;
      sceneLabel.current.textContent = sceneName(section);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("imports-tech:motion-frame", onMotionFrame);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("imports-tech:motion-frame", onMotionFrame);
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
            unoptimized
          />
          <span>
            IMPORTS <strong>TECH</strong>
          </span>
        </Link>
        <span
          className="header-scene-label"
          ref={sceneLabel}
          aria-hidden="true"
        >
          Início
        </span>
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
            ref={menuTrigger}
            type="button"
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

function sceneName(section: string) {
  const labels: Record<string, string> = {
    hero: "Início",
    metricas: "Canal em números",
    apresentacao: "Eu sou o Ryan",
    trajetoria: "Minha trajetória",
    historia: "Documentário",
    comunidade: "Comunidade",
    empresas: "Para empresas",
    continuar: "Continue comigo",
    meta: "Próximo capítulo",
  };
  return labels[section] || "Imports Tech";
}
