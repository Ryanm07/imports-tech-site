"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { VideoCardData } from "@/components/video-card";
import { finds, reviews } from "@/lib/site-data";

type Data = {
  subscribers: number;
  totalViews: number;
  videoCount: number;
  videos: VideoCardData[];
  syncedAt: string;
  lastSuccessfulSyncAt?: string;
  isStale?: boolean;
  isPartial?: boolean;
};

export default function MetricsPage() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    try {
      const response = await fetch("/api/youtube", { cache: "no-store" });
      if (!response.ok) throw new Error("YouTube indisponível");
      setData(await response.json());
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    data?.videos.forEach((video) =>
      counts.set(video.category, (counts.get(video.category) || 0) + 1),
    );
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [data]);

  return (
    <main id="conteudo" className="page-main">
      <header className="page-hero">
        <span className="eyebrow-v2">MÉTRICAS PÚBLICAS</span>
        <h1>Os números que podem ser mostrados.</h1>
        <p>
          Somente dados públicos do canal. Receita, CTR, retenção e informações
          do YouTube Studio ficam de fora.
        </p>
      </header>
      {!data && !error && (
        <div className="metric-loading" role="status">
          <span className="sr-only">Carregando métricas</span>
          <i />
          <i />
          <i />
        </div>
      )}
      {error && !data && (
        <div className="empty-state" role="alert">
          <strong>Não foi possível atualizar as métricas.</strong>
          <p>O restante do site continua disponível.</p>
          <button onClick={() => void load()}>Tentar novamente</button>
        </div>
      )}
      {data && (
        <>
          <section className="metrics-dashboard" aria-label="Resumo do canal">
            <Metric
              label="Inscritos"
              value={compact(data.subscribers)}
              note="Contagem pública atual"
            />
            <Metric
              label="Vídeos publicados"
              value={String(data.videoCount)}
              note="Catálogo informado pelo YouTube"
            />
            <Metric
              label="Visualizações totais"
              value={compact(data.totalViews)}
              note="Alcance público acumulado"
            />
            <Metric
              label="Reviews mapeadas"
              value={String(reviews.length)}
              note="Registros editoriais publicados"
            />
            <Metric
              label="Garimpos catalogados"
              value={String(finds.length)}
              note="Histórias editoriais publicadas"
            />
          </section>
          <section className="data-panels">
            <div>
              <span className="eyebrow-v2">VÍDEOS RECENTES</span>
              <h2>Mais assistidos no recorte</h2>
              <ol>
                {[...data.videos]
                  .sort((a, b) => b.views - a.views)
                  .slice(0, 5)
                  .map((video, index) => (
                    <li key={video.id}>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <div>
                        <strong>{video.title}</strong>
                        <small>{video.category}</small>
                      </div>
                      <b>{compact(video.views)}</b>
                    </li>
                  ))}
              </ol>
            </div>
            <div>
              <span className="eyebrow-v2">CATEGORIAS PRESENTES</span>
              <h2>Assuntos do catálogo sincronizado</h2>
              <div className="category-bars">
                {categories.map(([category, count]) => (
                  <div key={category}>
                    <span>{category}</span>
                    <i>
                      <b
                        style={{
                          width: `${(count / Math.max(...categories.map((item) => item[1]), 1)) * 100}%`,
                        }}
                      />
                    </i>
                    <strong>{count}</strong>
                  </div>
                ))}
              </div>
            </div>
          </section>
          <p className="sync-note" role="status">
            {data.isStale
              ? "Exibindo o último retrato disponível. "
              : data.isPartial
                ? "Sincronização parcial. "
                : "Sincronização concluída. "}
            Última tentativa: {formatDateTime(data.syncedAt)}.
            {data.lastSuccessfulSyncAt
              ? ` Último sucesso: ${formatDateTime(data.lastSuccessfulSyncAt)}.`
              : ""}
          </p>
        </>
      )}
    </main>
  );
}

function Metric({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <article>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  );
}

function compact(value: number) {
  return new Intl.NumberFormat("pt-BR", { notation: "compact" }).format(value);
}

function formatDateTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "data não informada"
    : new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(date);
}
