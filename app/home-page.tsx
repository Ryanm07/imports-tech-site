import Image from "next/image";
import Link from "next/link";
import { TelegramSection } from "@/components/telegram-section";
import { BRAND_ASSETS, BRAND_LINKS } from "@/lib/brand";
import { buildProjects } from "@/lib/projects";
import type { PublicLinks } from "@/lib/public-links";
import type { Find, Review } from "@/lib/site-data";
import { money } from "@/lib/site-data";
import type { TimelineItem } from "@/lib/content-repository";
import type { TelegramLinks } from "@/lib/telegram";
import type { YouTubeMetricsSnapshot } from "@/lib/youtube-service";

const fallbackIntroduction =
  "Eu sou o Ryan, criador do Imports Tech. Eu comecei o canal em setembro de 2025 para melhorar minha comunicação e compartilhar uma curiosidade que sempre esteve presente na minha vida: tecnologia. Com o tempo, o que começou com reviews simples de periféricos se transformou em histórias de aparelhos encontrados na OLX, reparos, testes reais e projetos que eu jamais imaginava produzir.";

export function HomePage({
  reviews,
  finds,
  featuredProjectSlugs,
  telegram,
  publicLinks,
  youtube,
  timeline,
  homeIntroduction,
  commercialIntroduction,
}: {
  reviews: Review[];
  finds: Find[];
  featuredProjectSlugs: string[];
  telegram: TelegramLinks;
  publicLinks: PublicLinks;
  youtube: YouTubeMetricsSnapshot;
  timeline: TimelineItem[];
  homeIntroduction?: string;
  commercialIntroduction?: string;
}) {
  const projects = buildProjects(reviews, finds, featuredProjectSlugs);
  const repairs = projects.filter((project) => project.repair).length;
  const orbitMetrics = [
    { value: metricValue(youtube.subscribers), label: "inscritos" },
    { value: metricValue(youtube.videoCount), label: "vídeos" },
    { value: metricValue(youtube.totalViews), label: "visualizações" },
    { value: String(projects.length), label: "projetos no site" },
    { value: String(repairs), label: "reparos registrados" },
  ];
  const featuredMilestones = pickMilestones(timeline);

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
            Eu compartilho garimpos, reparos e experiências reais com celulares,
            notebooks e tecnologia.
          </p>
          <div className="hero-buttons">
            <Link className="button primary" href="/sobre">
              Minha história
            </Link>
            <Link className="button secondary" href="/projetos">
              Projetos
            </Link>
            <a
              className="inline-link"
              href={BRAND_LINKS.youtube}
              target="_blank"
              rel="noreferrer"
            >
              YouTube ↗
            </a>
          </div>
        </div>

        <div
          className="orbit-system"
          data-intro-orbit-target
          aria-label="Retrato público do Imports Tech"
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
            >
              <strong>{metric.value}</strong>
              <span>{metric.label}</span>
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

      <section className="home-metrics-band" aria-label="Métricas públicas">
        <Metric value={youtube.subscribers} label="Inscritos" />
        <Metric value={youtube.totalViews} label="Visualizações" />
        <Metric value={youtube.videoCount} label="Vídeos publicados" />
        <Link href="/metricas">Como estes dados são atualizados ↗</Link>
      </section>

      <section className="home-personal-intro section-shell">
        <div className="home-personal-copy">
          <span className="eyebrow-v2">EU SOU O RYAN</span>
          <h2>O canal também registra o quanto eu evoluí.</h2>
          <p>{homeIntroduction || fallbackIntroduction}</p>
          <Link className="button secondary" href="/sobre">
            Continuar minha história
          </Link>
        </div>
        <div className="home-personal-visual">
          <Image
            src={BRAND_ASSETS.banner}
            alt="Banner oficial do canal Imports Tech"
            width={2120}
            height={373}
            sizes="(max-width: 760px) 100vw, 52vw"
          />
          <p>
            Eu gosto de tecnologia, jogos, fotografia e audiovisual. A
            curiosidade, a pesquisa e a prática sempre fizeram parte de como eu
            aprendo.
          </p>
        </div>
      </section>

      <section className="home-milestones">
        <div className="section-title">
          <div>
            <span className="eyebrow-v2">O CAMINHO ATÉ AQUI</span>
            <h2>Alguns momentos que mudaram minha direção.</h2>
          </div>
          <Link href="/sobre">Ver a história completa ↗</Link>
        </div>
        <ol>
          {featuredMilestones.map((milestone) => (
            <li key={milestone.slug}>
              <span>{milestone.dateLabel}</span>
              {milestone.number && <strong>{milestone.number}</strong>}
              <h3>{milestone.title}</h3>
              <p>{milestone.description}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="section-shell home-projects">
        <div className="section-title">
          <div>
            <span className="eyebrow-v2">HISTÓRIAS REAIS</span>
            <h2>Projetos que ficaram comigo.</h2>
          </div>
          <Link href="/projetos">Ver todos os projetos ↗</Link>
        </div>
        <div className="home-project-grid">
          {projects.slice(0, 3).map((project) => (
            <article key={project.slug}>
              <div>
                <Image
                  src={project.image}
                  alt={`Projeto ${project.title}`}
                  fill
                  sizes="(max-width: 760px) 100vw, 33vw"
                />
              </div>
              <span>
                {project.collection} · {project.category}
              </span>
              <h3>{project.title}</h3>
              <p>{project.summary}</p>
              <small>Eu paguei: {money(project.pricePaid)}</small>
              <Link href={`/projetos#${project.slug}`}>
                Conhecer o projeto →
              </Link>
            </article>
          ))}
        </div>
      </section>

      <TelegramSection links={telegram} />

      <section className="brand-home section-shell">
        <div>
          <span className="eyebrow-v2">PARA MARCAS E EMPRESAS</span>
          <h2>Eu transformo uso real em conteúdo que gera confiança.</h2>
        </div>
        <div>
          <p>
            {commercialIntroduction ||
              "Eu produzo reviews, garimpos, reparos e experiências com tecnologia mostrando contexto, processo e resultado. Meu foco é criar histórias úteis para quem realmente está escolhendo ou usando um produto."}
          </p>
          <div className="hero-buttons">
            {publicLinks.mediaKit ? (
              <a
                className="button primary"
                href={publicLinks.mediaKit}
                target="_blank"
                rel="noreferrer"
              >
                Ver Media Kit ↗
              </a>
            ) : (
              <span className="button primary is-disabled">
                Media Kit · Em breve
              </span>
            )}
            {publicLinks.commercialEmail ? (
              <a
                className="button secondary"
                href={`mailto:${publicLinks.commercialEmail}`}
              >
                Contato comercial
              </a>
            ) : (
              <span className="button secondary is-disabled">
                Contato · Em breve
              </span>
            )}
          </div>
        </div>
      </section>

      <section className="home-final-cta">
        <span className="eyebrow-v2">CONTINUE COMIGO</span>
        <h2>O próximo projeto já pode estar na minha bancada.</h2>
        <p>
          No YouTube, eu publico a história completa. Aqui, eu organizo o que
          aprendi no caminho.
        </p>
        <div className="hero-buttons">
          <a
            className="button primary"
            href={BRAND_LINKS.youtube}
            target="_blank"
            rel="noreferrer"
          >
            Acompanhar no YouTube ↗
          </a>
          {publicLinks.mediaKit && (
            <a
              className="button secondary"
              href={publicLinks.mediaKit}
              target="_blank"
              rel="noreferrer"
            >
              Media Kit ↗
            </a>
          )}
        </div>
      </section>
    </main>
  );
}

function Metric({ value, label }: { value: number | null; label: string }) {
  return (
    <div>
      <strong>{metricValue(value)}</strong>
      <span>{label}</span>
    </div>
  );
}

function pickMilestones(timeline: TimelineItem[]) {
  const wanted = [
    "comeco-setembro-2025",
    "iphone-x-historias",
    "mil-inscritos",
    "meta-2027",
  ];
  const matches = wanted.flatMap((slug) =>
    timeline.filter((item) => item.slug === slug),
  );
  return matches.length >= 3 ? matches : timeline.slice(0, 4);
}

function metricValue(value: number | null) {
  return value === null
    ? "Indisponível"
    : new Intl.NumberFormat("pt-BR", { notation: "compact" }).format(value);
}

function freshnessLabel(data: YouTubeMetricsSnapshot) {
  if (data.source === "unavailable" || !data.updatedAt) {
    return "Métricas do YouTube indisponíveis temporariamente";
  }
  const date = formatDateTime(data.updatedAt);
  return data.stale
    ? `Último retrato disponível · ${date}`
    : `Atualizado pela API oficial · ${date}`;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}
