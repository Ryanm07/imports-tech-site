"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { PlayIcon } from "@/components/ui-icons";
import { BRAND_ASSETS, BRAND_LINKS } from "@/lib/brand";
import type { PublicLinks } from "@/lib/public-links";

const baseNav = [
  ["Início", "/"],
  ["Minha história", "/sobre"],
  ["Comunidade", "/comunidade"],
  ["Contato", "/contato"],
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
  const navigation = useRef<HTMLElement>(null);
  const menuTrigger = useRef<HTMLButtonElement>(null);
  const nav = projectsEnabled
    ? [...baseNav.slice(0, 2), ["Projetos", "/projetos"], ...baseNav.slice(2)]
    : baseNav;

  useEffect(() => setMenuOpen(false), [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const focusFrame = window.requestAnimationFrame(() => {
      navigation.current?.querySelector<HTMLAnchorElement>("a")?.focus();
    });
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMenuOpen(false);
      menuTrigger.current?.focus();
    };
    const closeOutside = (event: PointerEvent | FocusEvent) => {
      if (
        event.target instanceof Node &&
        !header.current?.contains(event.target)
      ) {
        setMenuOpen(false);
      }
    };
    const closeOnDesktop = () => {
      if (menuTrigger.current?.offsetParent === null) setMenuOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("focusin", closeOutside);
    window.addEventListener("resize", closeOnDesktop);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", closeOnEscape);
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("focusin", closeOutside);
      window.removeEventListener("resize", closeOnDesktop);
    };
  }, [menuOpen]);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      if (header.current) {
        header.current.dataset.scrolled =
          window.scrollY > 24 ? "true" : "false";
      }
      frame = 0;
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <>
      <a className="skip-link" href="#conteudo">
        Pular para o conteúdo
      </a>
      <header className="header-shell" ref={header}>
        <Link
          className="official-brand"
          href="/"
          aria-label="Imports Tech — início"
          onClick={() => setMenuOpen(false)}
        >
          <Image
            data-intro-logo-target
            src={BRAND_ASSETS.logo}
            alt=""
            width={44}
            height={44}
            sizes="38px"
            priority
            unoptimized
          />
          <span>
            IMPORTS <strong>TECH</strong>
          </span>
        </Link>
        <nav
          ref={navigation}
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
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </Link>
            );
          })}
          <div className="mobile-external-links">
            {publicLinks.mediaKit && (
              <a
                href={publicLinks.mediaKit}
                target="_blank"
                rel="noreferrer"
                onClick={() => setMenuOpen(false)}
              >
                Media Kit
              </a>
            )}
            <a
              href={BRAND_LINKS.youtube}
              target="_blank"
              rel="noreferrer"
              onClick={() => setMenuOpen(false)}
            >
              Acompanhar no YouTube
            </a>
          </div>
        </nav>
        <div className="header-actions header-external">
          {publicLinks.mediaKit && (
            <a
              className="telegram-cta"
              href={publicLinks.mediaKit}
              target="_blank"
              rel="noreferrer"
            >
              Media Kit
            </a>
          )}
          <a
            className="youtube-cta"
            href={BRAND_LINKS.youtube}
            target="_blank"
            rel="noreferrer"
          >
            <PlayIcon width={16} height={16} />
            YouTube
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
            <i aria-hidden="true" />
            <i aria-hidden="true" />
            <i aria-hidden="true" />
          </button>
        </div>
      </header>
    </>
  );
}
