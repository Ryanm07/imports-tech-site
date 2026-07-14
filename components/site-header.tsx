"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  type KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Category, Find, Review } from "@/lib/site-data";
import {
  categories as fallbackCategories,
  finds as fallbackFinds,
  reviews as fallbackReviews,
} from "@/lib/site-data";
import { normalizeSearch } from "@/lib/search";

type Video = { id: string; title: string; category: string };
type Result = { type: string; title: string; href: string; detail: string };

const nav = [
  ["Início", "/"],
  ["Vídeos", "/videos"],
  ["Reviews", "/reviews"],
  ["Garimpos", "/garimpos"],
  ["Métricas", "/metricas"],
  ["Comunidade", "/comunidade"],
  ["Sobre", "/sobre"],
];

export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [videos, setVideos] = useState<Video[]>([]);
  const [reviews, setReviews] = useState<Review[]>(fallbackReviews);
  const [finds, setFinds] = useState<Find[]>(fallbackFinds);
  const [categories, setCategories] = useState<Category[]>(fallbackCategories);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    window.setTimeout(() => triggerRef.current?.focus(), 0);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(query), 220);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!searchOpen || videos.length) return;
    Promise.all([
      fetch("/api/youtube").then((response) =>
        response.ok ? response.json() : null,
      ),
      fetch("/api/content").then((response) =>
        response.ok ? response.json() : null,
      ),
    ])
      .then(([youtube, editorial]) => {
        if (youtube?.videos) setVideos(youtube.videos);
        if (editorial?.reviews) setReviews(editorial.reviews);
        if (editorial?.finds) setFinds(editorial.finds);
        if (editorial?.categories) setCategories(editorial.categories);
      })
      .catch(() => undefined);
  }, [searchOpen, videos.length]);

  useEffect(() => {
    if (!searchOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = window.setTimeout(() => inputRef.current?.focus(), 40);
    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = previousOverflow;
    };
  }, [searchOpen]);

  useEffect(() => {
    const handle = (event: globalThis.KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
      if (event.key === "Escape") {
        if (searchOpen) closeSearch();
        setMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [closeSearch, searchOpen]);

  const results = useMemo<Result[]>(() => {
    const term = normalizeSearch(debounced);
    if (!term) return [];
    const all: Result[] = [
      ...videos.map((video) => ({
        type: "Vídeo",
        title: video.title,
        href: `/videos/${video.id}`,
        detail: video.category,
      })),
      ...reviews.map((review) => ({
        type: "Review",
        title: review.name,
        href: `/reviews/${review.slug}`,
        detail: review.category,
      })),
      ...finds.map((find) => ({
        type: "Garimpo",
        title: find.product,
        href: `/garimpos/${find.slug}`,
        detail: find.result,
      })),
      ...categories.map((category) => ({
        type: "Categoria",
        title: category.name,
        href: `/videos?categoria=${encodeURIComponent(category.name)}`,
        detail: category.description,
      })),
    ];
    return all
      .filter((item) =>
        normalizeSearch(`${item.title} ${item.detail} ${item.type}`).includes(
          term,
        ),
      )
      .slice(0, 8);
  }, [categories, debounced, finds, reviews, videos]);

  function searchKeys(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((value) =>
        Math.min(value + 1, Math.max(results.length - 1, 0)),
      );
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((value) => Math.max(value - 1, 0));
    }
    if (event.key === "Enter" && results[activeIndex]) {
      window.location.href = results[activeIndex].href;
    }
  }

  function trapFocus(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Tab" || !panelRef.current) return;
    const focusable = [
      ...panelRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      ),
    ].filter((element) => !element.hasAttribute("disabled"));
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

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
            src="/brand/imports-tech-logo.jpg"
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
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </Link>
            );
          })}
          <a
            className="mobile-youtube"
            href="https://www.youtube.com/@Imports_Tech"
            target="_blank"
            rel="noreferrer"
          >
            Abrir no YouTube ↗
          </a>
        </nav>
        <div className="header-actions">
          <button
            ref={triggerRef}
            className="search-trigger"
            onClick={() => setSearchOpen(true)}
            aria-label="Abrir pesquisa"
            aria-haspopup="dialog"
          >
            <span aria-hidden="true">⌕</span>
            <kbd>Ctrl K</kbd>
          </button>
          <a
            className="youtube-cta"
            href="https://www.youtube.com/@Imports_Tech"
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

      {searchOpen && (
        <div
          className="search-layer"
          role="dialog"
          aria-modal="true"
          aria-label="Pesquisa global"
          onMouseDown={(event) =>
            event.target === event.currentTarget && closeSearch()
          }
        >
          <div className="search-panel" ref={panelRef} onKeyDown={trapFocus}>
            <div className="search-field">
              <span aria-hidden="true">⌕</span>
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={searchKeys}
                placeholder="Busque vídeos, produtos, reviews e garimpos"
                aria-label="Termo da pesquisa"
                aria-controls="global-search-results"
                aria-activedescendant={
                  results[activeIndex]
                    ? `search-result-${activeIndex}`
                    : undefined
                }
              />
              <button onClick={closeSearch} aria-label="Fechar pesquisa">
                ESC
              </button>
            </div>
            {!debounced && (
              <div className="search-empty">
                <strong>O que você está procurando?</strong>
                <p>Experimente “iPhone 12”, “notebook” ou “OLX”.</p>
              </div>
            )}
            {debounced && results.length === 0 && (
              <div className="search-empty" role="status">
                <strong>Nada encontrado</strong>
                <p>Tente um produto, marca ou categoria diferente.</p>
              </div>
            )}
            {results.length > 0 && (
              <div
                className="search-results"
                role="listbox"
                id="global-search-results"
              >
                {results.map((result, index) => (
                  <Link
                    id={`search-result-${index}`}
                    key={`${result.type}-${result.title}`}
                    href={result.href}
                    className={activeIndex === index ? "is-active" : ""}
                    role="option"
                    aria-selected={activeIndex === index}
                    onMouseEnter={() => setActiveIndex(index)}
                  >
                    <span>{result.type}</span>
                    <div>
                      <strong>{result.title}</strong>
                      <small>{result.detail}</small>
                    </div>
                    <i aria-hidden="true">↗</i>
                  </Link>
                ))}
              </div>
            )}
            <div className="search-help" aria-hidden="true">
              <span>↑↓ navegar</span>
              <span>↵ abrir</span>
              <span>Esc fechar</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
