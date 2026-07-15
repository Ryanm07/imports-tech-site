import { getYouTubeMetrics } from "@/lib/youtube-service";

export const dynamic = "force-dynamic";

export default async function MetricsPage() {
  const youtube = await getYouTubeMetrics();
  return (
    <main id="conteudo" className="page-main metrics-page">
      <header className="page-hero">
        <span className="eyebrow-v2">RETRATO DO CANAL</span>
        <h1>Métricas públicas, sem estimativas.</h1>
        <p>
          Os números que eu mostro aqui vêm exclusivamente da YouTube Data API,
          sem estimativas de desempenho.
        </p>
      </header>
      <section className="metric-cards" aria-label="Métricas do YouTube">
        <Metric label="Inscritos" value={youtube.subscribers} />
        <Metric label="Visualizações" value={youtube.totalViews} />
        <Metric label="Vídeos publicados" value={youtube.videoCount} />
      </section>
      <section className="sync-panel">
        <span className={youtube.stale ? "status-dot" : "status-dot online"} />
        <div>
          <strong>{sourceLabel(youtube.source, youtube.stale)}</strong>
          <p>
            {youtube.updatedAt
              ? formatDateTime(youtube.updatedAt)
              : "Nenhuma sincronização válida disponível."}
          </p>
        </div>
      </section>
      <section className="metric-cards" aria-label="Contexto do canal">
        <MetricText label="Canal criado" value="Setembro de 2025" />
        <MetricText label="Meta" value="100 mil inscritos" />
        <MetricText label="Prazo da meta" value="Fim de 2027" />
      </section>
    </main>
  );
}

function MetricText({ label, value }: { label: string; value: string }) {
  return (
    <article>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function Metric({
  label,
  value,
  exact = false,
}: {
  label: string;
  value: number | null;
  exact?: boolean;
}) {
  return (
    <article>
      <span>{label}</span>
      <strong>
        {value === null
          ? "Indisponível"
          : exact
            ? String(value)
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
