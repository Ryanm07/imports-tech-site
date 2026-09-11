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
        <span className="eyebrow-v2">YouTube / @Imports_Tech</span>
        <h1>O canal em números.</h1>
        <p>
          Consulte a origem e a data dos números. Eles mudam no YouTube e não
          representam um contador em tempo real aqui no site.
        </p>
      </header>
      {youtube.source !== "unavailable" && (
        <section className="metric-cards" aria-label="Métricas do YouTube">
          <Metric
            label="Inscritos"
            value={youtube.subscribers}
            approximate={youtube.subscribersApproximate}
          />
          <Metric label="Visualizações" value={youtube.totalViews} />
          <Metric label="Vídeos publicados" value={youtube.videoCount} />
        </section>
      )}
      <section
        className="sync-panel"
        aria-label="Origem e atualização dos números"
      >
        <span
          className={youtube.stale ? "status-dot" : "status-dot online"}
          aria-hidden="true"
        />
        <div>
          <strong>{sourceLabel(youtube.source)}</strong>
          <p>
            {youtube.updatedAt ? (
              <>
                Consulta em{" "}
                <time dateTime={youtube.updatedAt}>
                  {formatDateTime(youtube.updatedAt)}
                </time>{" "}
                (horário de Brasília).
              </>
            ) : (
              "Não há uma consulta recente disponível. Veja os números atuais diretamente no canal."
            )}
          </p>
          {youtube.source !== "unavailable" && (
            <p>
              {youtube.source === "snapshot"
                ? "Fonte: página oficial do canal, conferida manualmente. Inscritos arredondados pelo YouTube."
                : "Fonte: YouTube Data API."}{" "}
              Consultas com mais de 12 horas deixam de exibir números.
            </p>
          )}
          <a
            className="inline-link"
            href={youtube.channelUrl}
            target="_blank"
            rel="noreferrer"
          >
            Consultar no YouTube ↗
          </a>
        </div>
      </section>
      <section className="metrics-context">
        <div className="metric-context-copy">
          <span className="eyebrow-v2">Além dos números</span>
          <h2>Os marcos ficam na história.</h2>
          <p>
            O primeiro vídeo, a foto dos mil inscritos e a chegada aos cinco mil
            fazem parte da trajetória do canal.
          </p>
          <Link className="inline-link" href="/sobre">
            Conhecer minha história
          </Link>
        </div>
      </section>
    </main>
  );
}

function Metric({
  label,
  value,
  approximate = false,
}: {
  label: string;
  value: number | null;
  approximate?: boolean;
}) {
  return (
    <article>
      <span>{label}</span>
      <strong>
        {value === null
          ? "Indisponível"
          : `${approximate ? "≈ " : ""}${new Intl.NumberFormat("pt-BR").format(value)}`}
      </strong>
    </article>
  );
}

function sourceLabel(source: string) {
  if (source === "unavailable") return "Consulte os números no canal";
  return source === "snapshot"
    ? "Conferência manual no YouTube"
    : "Consulta pela API do YouTube";
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}
