import type { Metadata } from "next";
import Link from "next/link";
import { getYouTubeMetrics } from "@/lib/youtube-service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Métricas públicas",
  description:
    "Inscritos, visualizações e vídeos do Imports Tech, com origem e data de atualização dos números do YouTube.",
  alternates: { canonical: "/metricas" },
};

export default async function MetricsPage() {
  const youtube = await getYouTubeMetrics();
  return (
    <main id="conteudo" className="page-main metrics-page">
      <header className="page-hero" data-motion-section="abertura">
        <span className="eyebrow-v2">O canal em números</span>
        <h1>Cada número tem uma história.</h1>
        <p>
          Gente que chegou, vídeos que saíram da bancada e descobertas
          compartilhadas. Um retrato público do Imports Tech, com números do
          YouTube e a data de cada atualização.
        </p>
      </header>
      <section className="metric-cards" aria-label="Métricas do YouTube">
        <Metric label="Inscritos" value={youtube.subscribers} />
        <Metric label="Visualizações" value={youtube.totalViews} />
        <Metric label="Vídeos publicados" value={youtube.videoCount} />
      </section>
      <section
        className="sync-panel"
        aria-label="Origem e atualização dos números"
      >
        <span
          className={youtube.stale ? "status-dot" : "status-dot online"}
          aria-hidden="true"
        />
        <div>
          <strong>{sourceLabel(youtube.source, youtube.stale)}</strong>
          <p>
            {youtube.updatedAt ? (
              <>
                Última sincronização:{" "}
                <time dateTime={youtube.updatedAt}>
                  {formatDateTime(youtube.updatedAt)}
                </time>{" "}
                (horário de Brasília).
              </>
            ) : (
              "Nenhuma sincronização válida disponível."
            )}
          </p>
          <p>Fonte: YouTube Data API. Sem estimativas de desempenho.</p>
        </div>
      </section>
      <section className="metrics-context">
        <div className="metric-context-copy">
          <span className="eyebrow-v2">O que vem pela frente</span>
          <h2>O canal começou em setembro de 2025. A história continua.</h2>
          <p>
            Meu objetivo é construir uma comunidade de tecnologia cada vez
            maior, sem perder a honestidade e a proximidade do começo.
          </p>
          <Link className="inline-link" href="/sobre">
            Conhecer minha história
          </Link>
        </div>
        <div className="metric-goal">
          <span>Minha meta pessoal</span>
          <strong>100 mil</strong>
          <p>inscritos até o fim de 2027</p>
          <small>
            Uma meta para o futuro, separada dos números atuais do canal.
          </small>
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number | null }) {
  return (
    <article>
      <span>{label}</span>
      <strong>
        {value === null
          ? "Indisponível"
          : new Intl.NumberFormat("pt-BR").format(value)}
      </strong>
    </article>
  );
}

function sourceLabel(source: string, stale: boolean) {
  if (source === "unavailable") return "Indisponível temporariamente";
  return stale ? "Último retrato disponível" : "Métricas atualizadas";
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}
