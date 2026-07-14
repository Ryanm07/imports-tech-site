"use client";

import { useEffect, useMemo, useState } from "react";
import { VideoCard, VideoCardData } from "@/components/video-card";
import { searchVideos, sortVideos } from "@/lib/search";

const filters = ["Todos", "Smartphones", "Notebooks", "Consoles", "Periféricos", "Garimpos", "Reparos", "Comparativos", "Reviews"];

export default function VideosPage() {
  const [videos, setVideos] = useState<VideoCardData[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todos");
  const [order, setOrder] = useState<"recentes" | "antigos" | "vistos">("recentes");
  const [limit, setLimit] = useState(9);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  async function load() {
    setState("loading");
    try { const response = await fetch("/api/youtube", { cache: "no-store" }); if (!response.ok) throw new Error(); const data = await response.json(); setVideos(data.videos); setState("ready"); }
    catch { setState("error"); }
  }

  useEffect(() => { load(); const chosen = new URLSearchParams(window.location.search).get("categoria"); if (chosen) setCategory(chosen); }, []);

  const results = useMemo(() => sortVideos(searchVideos(videos, query, category), order), [videos, query, category, order]);

  return <main id="conteudo" className="page-main">
    <header className="page-hero"><span className="eyebrow-v2">BIBLIOTECA DO CANAL</span><h1>Vídeos sem caça ao clique.</h1><p>Pesquise por produto, marca, modelo ou assunto. A busca acontece localmente sobre os dados já sincronizados.</p></header>
    <section className="library-tools" aria-label="Busca e filtros"><label className="library-search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ex.: iPhone 12, notebook gamer, OLX"/><small>{results.length} resultado{results.length === 1 ? "" : "s"}</small></label><label className="sort-select">Ordenar por<select value={order} onChange={(event) => setOrder(event.target.value as typeof order)}><option value="recentes">Mais recentes</option><option value="antigos">Mais antigos</option><option value="vistos">Mais vistos</option></select></label></section>
    <div className="filter-row" role="group" aria-label="Filtrar por categoria">{filters.map((filter) => <button className={category === filter ? "active" : ""} onClick={() => { setCategory(filter); setLimit(9); }} key={filter}>{filter}</button>)}</div>
    {state === "loading" && <div className="video-skeleton-grid">{[1,2,3,4,5,6].map((item) => <div className="video-skeleton" key={item}/>)}</div>}
    {state === "error" && <div className="empty-state"><strong>Não foi possível carregar a biblioteca.</strong><p>O YouTube pode estar temporariamente indisponível.</p><button onClick={load}>Tentar novamente</button></div>}
    {state === "ready" && !results.length && <div className="empty-state"><strong>Nenhum vídeo encontrado.</strong><p>Remova um filtro ou experimente outro termo.</p><button onClick={() => { setQuery(""); setCategory("Todos"); }}>Limpar busca</button></div>}
    {state === "ready" && results.length > 0 && <><div className="video-grid-v2 library-grid">{results.slice(0, limit).map((video) => <VideoCard key={video.id} video={video}/>)}</div>{limit < results.length && <button className="load-more" onClick={() => setLimit((value) => value + 9)}>Carregar mais vídeos</button>}</>}
  </main>;
}
