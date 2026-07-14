"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { VideoCard } from "@/components/video-card";
import { searchVideos, sortVideos } from "@/lib/search";
import { VIDEO_CATEGORIES } from "@/lib/video-taxonomy";
import type { YouTubeData, YouTubeVideo } from "@/lib/youtube-service";

const filters = ["Todos", ...VIDEO_CATEGORIES];

export default function VideosPage() {
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [sync, setSync] = useState<Pick<
    YouTubeData,
    "source" | "isStale" | "isPartial" | "lastSuccessfulSyncAt"
  > | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todos");
  const [order, setOrder] = useState<"recentes" | "antigos" | "vistos">(
    "recentes",
  );
  const [limit, setLimit] = useState(12);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  const load = useCallback(async () => {
    setState("loading");
    try {
      const response = await fetch("/api/youtube", { cache: "no-store" });
      if (!response.ok) throw new Error("Falha ao carregar vídeos");
      const data: YouTubeData = await response.json();
      setVideos(data.videos);
      setSync(data);
      setState("ready");
    } catch {
      setState("error");
    }
  }, []);

  useEffect(() => {
    void load();
    const chosen = new URLSearchParams(window.location.search).get("categoria");
    if (chosen && filters.includes(chosen as (typeof filters)[number])) {
      setCategory(chosen);
    }
  }, [load]);

  const results = useMemo(
    () => sortVideos(searchVideos(videos, query, category), order),
    [videos, query, category, order],
  );

  return (
    <main id="conteudo" className="page-main">
      <header className="page-hero">
        <span className="eyebrow-v2">BIBLIOTECA DO CANAL</span>
        <h1>Vídeos sem caça ao clique.</h1>
        <p>
          Pesquise por produto, marca, modelo ou assunto. A busca acontece
          localmente sobre os dados já sincronizados.
        </p>
        {sync && (
          <p className="sync-notice" role="status">
            {sync.isStale
              ? "Exibindo o último retrato disponível."
              : sync.isPartial
                ? "Catálogo recente parcial; configure a API do YouTube para carregar todos os vídeos."
                : "Catálogo completo sincronizado com a API do YouTube."}
            {sync.lastSuccessfulSyncAt && (
              <>
                {" "}
                Última sincronização: {formatSync(sync.lastSuccessfulSyncAt)}.
              </>
            )}
          </p>
        )}
      </header>

      <section className="library-tools" aria-label="Busca e filtros">
        <label className="library-search">
          <span aria-hidden="true">⌕</span>
          <span className="sr-only">Pesquisar na biblioteca</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Ex.: iPhone 12, notebook gamer, OLX"
          />
          <small aria-live="polite">
            {results.length} resultado{results.length === 1 ? "" : "s"}
          </small>
        </label>
        <label className="sort-select">
          Ordenar por
          <select
            value={order}
            onChange={(event) => setOrder(event.target.value as typeof order)}
          >
            <option value="recentes">Mais recentes</option>
            <option value="antigos">Mais antigos</option>
            <option value="vistos">Mais vistos</option>
          </select>
        </label>
      </section>

      <div
        className="filter-row"
        role="group"
        aria-label="Filtrar por categoria"
      >
        {filters.map((filter) => (
          <button
            className={category === filter ? "active" : ""}
            aria-pressed={category === filter}
            onClick={() => {
              setCategory(filter);
              setLimit(12);
            }}
            key={filter}
          >
            {filter}
          </button>
        ))}
      </div>

      {state === "loading" && (
        <div
          className="video-skeleton-grid"
          role="status"
          aria-label="Carregando vídeos"
        >
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div className="video-skeleton" key={item} />
          ))}
        </div>
      )}
      {state === "error" && (
        <div className="empty-state" role="alert">
          <strong>Não foi possível carregar a biblioteca.</strong>
          <p>O YouTube e o último retrato estão indisponíveis.</p>
          <button onClick={() => void load()}>Tentar novamente</button>
        </div>
      )}
      {state === "ready" && !results.length && (
        <div className="empty-state">
          <strong>Nenhum vídeo encontrado.</strong>
          <p>Remova um filtro ou experimente outro termo.</p>
          <button
            onClick={() => {
              setQuery("");
              setCategory("Todos");
            }}
          >
            Limpar busca
          </button>
        </div>
      )}
      {state === "ready" && results.length > 0 && (
        <>
          <div className="video-grid-v2 library-grid">
            {results.slice(0, limit).map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
          {limit < results.length && (
            <button
              className="load-more"
              onClick={() => setLimit((value) => value + 12)}
            >
              Carregar mais vídeos
            </button>
          )}
        </>
      )}
    </main>
  );
}

function formatSync(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}
