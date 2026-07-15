import Image from "next/image";
import Link from "next/link";
import { TelegramSection } from "@/components/telegram-section";
import { BRAND_ASSETS, BRAND_LINKS } from "@/lib/brand";
import { buildProjects } from "@/lib/projects";
import type { Category, Find, Review } from "@/lib/site-data";
import { money } from "@/lib/site-data";
import type { TelegramLinks } from "@/lib/telegram";
import type { YouTubeMetricsSnapshot } from "@/lib/youtube-service";

export function HomePage({
  reviews,
  finds,
  categories,
  featuredProjectSlugs,
  telegram,
  youtube,
}: {
  reviews: Review[];
  finds: Find[];
  categories: Category[];
  featuredProjectSlugs: string[];
  telegram: TelegramLinks;
  youtube: YouTubeMetricsSnapshot;
}) {
  const projects = buildProjects(reviews, finds, featuredProjectSlugs);
  const repairs = projects.filter((project) => project.repair).length;
  const orbitMetrics = [
    {
      value: metricValue(youtube.subscribers),
      label: "inscritos",
      detail: metricsDetail(youtube),
    },
    {
      value: metricValue(youtube.videoCount),
      label: "vídeos publicados",
      detail: metricsDetail(youtube),
    },
    {
      value: metricValue(youtube.totalViews),
      label: "visualizações",
      detail: metricsDetail(youtube),
    },
    {
      value: String(projects.length),
      label: "projetos",
      detail: "Registros editoriais publicados no site",
    },
    {
      value: String(repairs),
      label: "reparos",
      detail: "Reparos documentados nos projetos",
    },
  ];

  return (
    <main id="conteudo">
      <section className="hero-v2">
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-message">
          <span className="eyebrow-v2">
            <i /> HISTÓRIA · PROJETOS · TECNOLOGIA
          </span>
          <h1>
            Tecnologia testada
            <br />
            <em>no uso real.</em>
          </h1>
          <p>
            Conheça os bastidores do Imports Tech: compras, diagnósticos,
            reparos, decisões e o que aconteceu depois.
          </p>
          <div className="hero-buttons">
            <Link className="button primary" href="/projetos">
              Conhecer os projetos
            </Link>
            <Link className="button secondary" href="/sobre">
              Minha história
            </Link>
            <a
              className="inline-link"
              href={BRAND_LINKS.youtube}
              target="_blank"
              rel="noreferrer"
            >
              Acessar o YouTube ↗
            </a>
          </div>
        </div>

        <div
          className="orbit-system"
          data-intro-orbit-target
          aria-label="Métricas do Imports Tech"
          role="list"
        >
          <div className="orbit-line orbit-a" aria-hidden="true" />
          <div className="orbit-line orbit-b" aria-hidden="true" />
          <div className="orbit-line orbit-c" aria-hidden="true" />
          <div className="orbit-logo">
            <Image
              src={BRAND_ASSETS.logo}
              alt="Logo oficial Imports Tech"
              fill
              sizes="255px"
              priority
            />
            <span>IMPORTS TECH</span>
          </div>
          {orbitMetrics.map((metric, index) => (
            <div
              className={`orbit-node node-${index + 1}`}
              key={metric.label}
              role="listitem"
              aria-label={`${metric.value} ${metric.label}. ${metric.detail}`}
            >
              <strong>{metric.value}</strong>
              <span>{metric.label}</span>
              <small>{metric.detail}</small>
            </div>
          ))}
        </div>

        <div className="hero-proof" role="status">
          <span
            className={youtube.stale ? "status-dot" : "status-dot online"}
          />
          <span>{freshnessLabel(youtube)}</span>
        </div>
      </section>

      <section className="section-shell home-projects">
        <div className="section-title">
          <div>
            <span className="eyebrow-v2">HISTÓRIAS REAIS</span>
            <h2>Projetos marcantes</h2>
          </div>
          <Link href="/projetos">
            Ver todos os projetos <span>↗</span>
          </Link>
        </div>
        <div className="home-project-grid">
          {projects.slice(0, 4).map((project) => (
            <article key={project.slug}>
              <div>
                <Image
                  src={project.image}
                  alt={`Projeto ${project.title}`}
                  fill
                  sizes="(max-width: 760px) 100vw, 50vw"
                />
              </div>
              <span>
                {project.kind} · {project.category}
              </span>
              <h3>{project.title}</h3>
              <p>{project.summary}</p>
              <small>Valor registrado: {money(project.pricePaid)}</small>
              <Link href={`/projetos#${project.slug}`}>
                Conhecer o projeto →
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="category-section">
        <div className="section-title">
          <div>
            <span className="eyebrow-v2">UM SÓ LUGAR</span>
            <h2>Assuntos dos projetos</h2>
          </div>
        </div>
        <div className="category-grid">
          {categories.map((category) => (
            <Link href="/projetos" key={category.name}>
              <span>{category.icon}</span>
              <h3>{category.name}</h3>
              <p>{category.description}</p>
              <i>↗</i>
            </Link>
          ))}
        </div>
      </section>

      <section className="metrics-strip editorial-metrics">
        <div>
          <span>Projetos publicados</span>
          <strong>{projects.length}</strong>
        </div>
        <div>
          <span>Garimpos registrados</span>
          <strong>{finds.length}</strong>
        </div>
        <div>
          <span>Reparos documentados</span>
          <strong>{repairs}</strong>
        </div>
        <Link href="/metricas">
          Ver métricas públicas <span>↗</span>
        </Link>
      </section>

      <section className="about-home">
        <div className="about-image">
          <Image
            src={BRAND_ASSETS.banner}
            alt="Banner oficial Imports Tech"
            width={2120}
            height={373}
            sizes="(max-width: 760px) 100vw, 55vw"
          />
        </div>
        <div>
          <span className="eyebrow-v2">POR TRÁS DO CANAL</span>
          <h2>Mais que um vídeo: o caminho completo.</h2>
          <p>
            O site complementa o canal com contexto sobre compra, condição,
            reparo, custo e situação atual de cada projeto.
          </p>
          <Link className="button secondary" href="/sobre">
            Conhecer minha história
          </Link>
        </div>
      </section>

      <TelegramSection links={telegram} />
    </main>
  );
}

function metricValue(value: number | null) {
  return value === null
    ? "Indisponível"
    : new Intl.NumberFormat("pt-BR", { notation: "compact" }).format(value);
}

function metricsDetail(data: YouTubeMetricsSnapshot) {
  if (data.source === "unavailable") return "Indisponível temporariamente";
  return data.stale
    ? "Último retrato público disponível"
    : "Métrica pública atualizada pela API oficial";
}

function freshnessLabel(data: YouTubeMetricsSnapshot) {
  if (data.source === "unavailable" || !data.updatedAt) {
    return "Indisponível temporariamente";
  }
  if (data.stale) {
    return `Último retrato disponível · ${formatDateTime(data.updatedAt)}`;
  }
  return `Atualizado em ${formatDateTime(data.updatedAt)}`;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}
