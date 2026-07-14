"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { categories, finds, reviews } from "@/lib/site-data";
import { normalizeSearch } from "@/lib/search";

type Video = { id: string; title: string; category: string };
type Result = { type: string; title: string; href: string; detail: string };

const nav = [
  ["Início", "/"], ["Vídeos", "/videos"], ["Reviews", "/reviews"], ["Garimpos", "/garimpos"],
  ["Métricas", "/metricas"], ["Comunidade", "/comunidade"], ["Sobre", "/sobre"],
];

export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [videos, setVideos] = useState<Video[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(query), 220);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!searchOpen || videos.length) return;
    fetch("/api/youtube").then((response) => response.ok ? response.json() : null).then((data) => data?.videos && setVideos(data.videos)).catch(() => undefined);
  }, [searchOpen, videos.length]);

  useEffect(() => {
    if (searchOpen) window.setTimeout(() => inputRef.current?.focus(), 40);
  }, [searchOpen]);

  useEffect(() => {
    const handle = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setSearchOpen(true); }
      if (event.key === "Escape") { setSearchOpen(false); setMenuOpen(false); }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, []);

  const results = useMemo<Result[]>(() => {
    const term = normalizeSearch(debounced);
    if (!term) return [];
    const all: Result[] = [
      ...videos.map((video) => ({ type: "Vídeo", title: video.title, href: `https://youtu.be/${video.id}`, detail: video.category })),
      ...reviews.map((review) => ({ type: "Review", title: review.name, href: `/reviews/${review.slug}`, detail: review.verdict })),
      ...finds.map((find) => ({ type: "Garimpo", title: find.product, href: `/garimpos/${find.slug}`, detail: find.result })),
      ...categories.map((category) => ({ type: "Categoria", title: category.name, href: `/videos?categoria=${encodeURIComponent(category.name)}`, detail: category.description })),
    ];
    return all.filter((item) => normalizeSearch(`${item.title} ${item.detail} ${item.type}`).includes(term)).slice(0, 8);
  }, [debounced, videos]);

  function searchKeys(event: React.KeyboardEvent) {
    if (event.key === "ArrowDown") { event.preventDefault(); setActiveIndex((value) => Math.min(value + 1, Math.max(results.length - 1, 0))); }
    if (event.key === "ArrowUp") { event.preventDefault(); setActiveIndex((value) => Math.max(value - 1, 0)); }
    if (event.key === "Enter" && results[activeIndex]) window.location.href = results[activeIndex].href;
  }

  return (
    <>
      <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>
      <header className="header-shell">
        <Link className="official-brand" href="/" aria-label="Imports Tech — início">
          <Image src="/brand/imports-tech-logo.jpg" alt="" width="44" height="44" priority unoptimized />
          <span>IMPORTS <strong>TECH</strong></span>
        </Link>
        <nav className={menuOpen ? "main-nav is-open" : "main-nav"} aria-label="Navegação principal">
          {nav.map(([label, href]) => <a key={href} href={href} aria-current={pathname === href ? "page" : undefined} onClick={() => setMenuOpen(false)}>{label}</a>)}
          <a className="mobile-youtube" href="https://www.youtube.com/@Imports_Tech" target="_blank" rel="noreferrer">Abrir no YouTube ↗</a>
        </nav>
        <div className="header-actions">
          <button className="search-trigger" onClick={() => setSearchOpen(true)} aria-label="Abrir pesquisa"><span>⌕</span><kbd>Ctrl K</kbd></button>
          <a className="youtube-cta" href="https://www.youtube.com/@Imports_Tech" target="_blank" rel="noreferrer"><span>▶</span> YouTube</a>
          <button className="menu-trigger" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}><i/><i/><i/></button>
        </div>
      </header>

      {searchOpen && <div className="search-layer" role="dialog" aria-modal="true" aria-label="Pesquisa global" onMouseDown={(event) => event.target === event.currentTarget && setSearchOpen(false)}>
        <div className="search-panel">
          <div className="search-field"><span>⌕</span><input ref={inputRef} value={query} onChange={(event) => { setQuery(event.target.value); setActiveIndex(0); }} onKeyDown={searchKeys} placeholder="Busque vídeos, produtos, reviews e garimpos" aria-label="Termo da pesquisa"/><button onClick={() => setSearchOpen(false)} aria-label="Fechar pesquisa">ESC</button></div>
          {!debounced && <div className="search-empty"><strong>O que você está procurando?</strong><p>Experimente “iPhone 12”, “notebook” ou “OLX”.</p></div>}
          {debounced && results.length === 0 && <div className="search-empty"><strong>Nada encontrado</strong><p>Tente um produto, marca ou categoria diferente.</p></div>}
          {results.length > 0 && <div className="search-results" role="listbox">
            {results.map((result, index) => <a key={`${result.type}-${result.title}`} href={result.href} className={activeIndex === index ? "is-active" : ""} role="option" aria-selected={activeIndex === index} onMouseEnter={() => setActiveIndex(index)}><span>{result.type}</span><div><strong>{result.title}</strong><small>{result.detail}</small></div><i>↗</i></a>)}
          </div>}
          <div className="search-help"><span>↑↓ navegar</span><span>↵ abrir</span><span>Esc fechar</span></div>
        </div>
      </div>}
    </>
  );
}
