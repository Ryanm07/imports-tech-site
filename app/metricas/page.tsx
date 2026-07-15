import Link from "next/link";
import { getPublicEditorialData } from "@/lib/content-repository";
import { buildProjects } from "@/lib/projects";
import { getYouTubeMetrics } from "@/lib/youtube-service";

export const dynamic = "force-dynamic";

export default async function MetricsPage() {
  const [youtube, editorial] = await Promise.all([
    getYouTubeMetrics(),
    getPublicEditorialData(),
  ]);
  const projects = buildProjects(editorial.reviews, editorial.finds);
  const repairs = projects.filter((project) => project.repair).length;
  return (
    <main id="conteudo" className="page-main metrics-page">
      <header className="page-hero">
        <span className="eyebrow-v2">RETRATO DO CANAL</span>
        <h1>Métricas públicas, sem estimativas.</h1>
        <p>
          Os dados do canal vêm exclusivamente da YouTube Data API. Os números
          editoriais são calculados a partir dos projetos publicados neste site.
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
      <section className="metric-cards" aria-label="Métricas editoriais">
        <Metric label="Projetos publicados" value={projects.length} exact />
        <Metric
          label="Garimpos registrados"
          value={editorial.finds.length}
          exact
        />
        <Metric label="Reparos documentados" value={repairs} exact />
      </section>
      <Link className="button secondary" href="/projetos">
        Conhecer os projetos
      </Link>
    </main>
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
