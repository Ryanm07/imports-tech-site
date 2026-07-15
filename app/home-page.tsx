import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { TelegramSection } from "@/components/telegram-section";
import { ScrollSection } from "@/components/motion/scroll-section";
import { HomeScrollDirector } from "@/components/home-scroll-director";
import { BRAND_ASSETS, BRAND_LINKS } from "@/lib/brand";
import type { PublicLinks } from "@/lib/public-links";
import type { TimelineItem } from "@/lib/content-repository";
import type { TelegramLinks } from "@/lib/telegram";
import type { YouTubeMetricsSnapshot } from "@/lib/youtube-service";

const fallbackIntroduction =
  "Eu sou o Ryan. Criei o Imports Tech em setembro de 2025 porque queria perder a timidez e aprender a me comunicar melhor falando sobre uma coisa que sempre gostei: tecnologia. Comecei com reviews simples de periféricos. Aos poucos, vieram os achados da OLX, os reparos, os testes no dia a dia e projetos que eu nem imaginava conseguir produzir.";

export function HomePage({
  telegram,
  publicLinks,
  youtube,
  timeline,
  homeIntroduction,
  commercialIntroduction,
}: {
  telegram: TelegramLinks;
  publicLinks: PublicLinks;
  youtube: YouTubeMetricsSnapshot;
  timeline: TimelineItem[];
  homeIntroduction?: string;
  commercialIntroduction?: string;
}) {
  const orbitMetrics = [
    {
      value: metricValue(youtube.subscribers),
      label: "inscritos",
      kind: "current",
    },
    {
      value: metricValue(youtube.videoCount),
      label: "vídeos publicados",
      kind: "current",
    },
    {
      value: metricValue(youtube.totalViews),
      label: "visualizações",
      kind: "current",
    },
    { value: "2025", label: "canal criado em", kind: "origin" },
    { value: "100 MIL", label: "meta · até o fim de 2027", kind: "goal" },
  ];
  const featuredMilestones = pickMilestones(timeline);

  return (
    <main id="conteudo">
      <HomeScrollDirector />
      <ScrollSection name="hero" className="hero-v2">
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-message">
          <span className="eyebrow-v2">
            <i /> HISTÓRIA · COMUNIDADE · TECNOLOGIA
          </span>
          <h1>
            Tecnologia testada
            <br />
            <em>no uso real.</em>
          </h1>
          <p>
            Eu compro, testo, conserto e conto o que realmente aconteceu com
            cada aparelho que passa pela minha bancada.
          </p>
          <div className="hero-buttons">
            <Link className="button primary" href="/sobre">
              Minha história
            </Link>
            <Link className="button secondary" href="/comunidade">
              Comunidade
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
              unoptimized
            />
            <span>IMPORTS TECH</span>
          </div>
          {orbitMetrics.map((metric, index) => (
            <div
              className={`orbit-node node-${index + 1} is-${metric.kind}`}
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
        <div className="hero-scroll-invitation" aria-hidden="true">
          <span>ROLE PARA CONTINUAR</span>
          <i />
        </div>
      </ScrollSection>

      <ScrollSection name="metricas" className="home-metrics-story">
        <div className="home-metrics-sticky" data-scroll-sequence>
          <div className="home-metrics-heading">
            <span className="eyebrow-v2">O CANAL EM NÚMEROS</span>
            <h2>Cada número marca uma parte do caminho.</h2>
            <p>{freshnessLabel(youtube)}</p>
          </div>
          <div className="home-metrics-track" aria-hidden="true">
            <i />
          </div>
          <ol aria-label="Métricas públicas do canal">
            <MetricStory
              value={youtube.subscribers}
              label="Inscritos"
              context="A comunidade que decidiu continuar comigo."
            />
            <MetricStory
              value={youtube.totalViews}
              label="Visualizações"
              context="Histórias assistidas no canal oficial."
            />
            <MetricStory
              value={youtube.videoCount}
              label="Vídeos publicados"
              context="Cada publicação resume horas de trabalho."
            />
            <MetricStory
              value="SET 2025"
              label="O começo"
              context="Foi quando eu publiquei os primeiros passos dessa história."
            />
            <MetricStory
              value="100 mil"
              label="Meta até o fim de 2027"
              context="É um objetivo à frente, não uma conquista atual."
            />
          </ol>
          <Link href="/metricas">Como estes dados são atualizados ↗</Link>
        </div>
      </ScrollSection>

      <ScrollSection
        name="apresentacao"
        className="home-personal-intro section-shell"
      >
        <div className="home-personal-copy">
          <span className="eyebrow-v2">EU SOU O RYAN</span>
          <h2>O canal acabou virando o registro da minha própria evolução.</h2>
          <p>{homeIntroduction || fallbackIntroduction}</p>
          <Link className="button secondary" href="/sobre">
            Continuar minha história
          </Link>
        </div>
        <div className="home-personal-visual">
          <span className="personal-mask-line" aria-hidden="true" />
          <Image
            src={BRAND_ASSETS.banner}
            alt="Banner oficial do canal Imports Tech"
            width={2048}
            height={339}
            sizes="(max-width: 760px) 100vw, 52vw"
            unoptimized
          />
          <p>
            Eu gosto de tecnologia, jogos, fotografia e audiovisual. Quase tudo
            que aprendo começa do mesmo jeito: uma curiosidade, muita pesquisa e
            vontade de colocar a mão na massa.
          </p>
        </div>
      </ScrollSection>

      <ScrollSection name="trajetoria" className="home-milestones">
        <div className="home-milestones-sticky" data-scroll-sequence>
          <div className="section-title">
            <div>
              <span className="eyebrow-v2">O CAMINHO ATÉ AQUI</span>
              <h2>Alguns momentos que mudaram o rumo dessa história.</h2>
            </div>
            <Link href="/sobre">Ver a história completa ↗</Link>
          </div>
          <div className="home-milestone-line" aria-hidden="true">
            <i />
          </div>
          <ol aria-label="Quatro viradas da minha trajetória">
            {featuredMilestones.map((milestone, index) => (
              <li
                key={milestone.slug}
                data-sequence-item
                style={{ "--milestone-index": index } as CSSProperties}
              >
                <span>
                  {String(index + 1).padStart(2, "0")} · {milestone.dateLabel}
                </span>
                {milestone.number && <strong>{milestone.number}</strong>}
                <h3>{milestone.title}</h3>
                <p>{milestone.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </ScrollSection>

      <TelegramSection links={telegram} />

      <ScrollSection name="empresas" className="brand-home section-shell">
        <div>
          <div
            className="brand-public-numbers"
            aria-label="Números públicos do canal"
          >
            <span>
              <strong>{metricValue(youtube.subscribers)}</strong> inscritos
            </span>
            <span>
              <strong>{metricValue(youtube.totalViews)}</strong> visualizações
            </span>
            <span>
              <strong>{metricValue(youtube.videoCount)}</strong> vídeos
            </span>
          </div>
          <span className="eyebrow-v2">PARA MARCAS E EMPRESAS</span>
          <h2>
            Eu transformo experiências reais em conteúdo que ajuda a decidir.
          </h2>
        </div>
        <div>
          <p>
            {commercialIntroduction ||
              "Eu produzo reviews, garimpos e reparos mostrando o contexto inteiro: como o produto chegou, o que eu encontrei e qual foi o resultado. Meu compromisso é criar uma história útil para quem está pensando em comprar ou já usa aquele produto."}
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
      </ScrollSection>

      <ScrollSection name="continuar" className="home-final-cta">
        <div className="final-brand-return" aria-hidden="true">
          <i />
          <Image
            src={BRAND_ASSETS.logo}
            alt=""
            width={76}
            height={76}
            unoptimized
          />
        </div>
        <span className="eyebrow-v2">CONTINUE COMIGO</span>
        <h2>A história continua daqui.</h2>
        <p>
          No YouTube, eu mostro a história completa. Aqui, eu deixo organizado o
          que aprendi pelo caminho.
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
          {telegram.group || telegram.channel ? (
            <a
              className="button secondary"
              href={telegram.group || telegram.channel || undefined}
              target="_blank"
              rel="noreferrer"
            >
              Telegram ↗
            </a>
          ) : (
            <span className="button secondary is-disabled">
              Telegram · Em breve
            </span>
          )}
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
          <a className="inline-link" href="#conteudo">
            Voltar ao topo ↑
          </a>
        </div>
      </ScrollSection>
    </main>
  );
}

function MetricStory({
  value,
  label,
  context,
}: {
  value: number | string | null;
  label: string;
  context: string;
}) {
  return (
    <li data-sequence-item>
      <strong>{typeof value === "string" ? value : metricValue(value)}</strong>
      <span>{label}</span>
      <p>{context}</p>
    </li>
  );
}

function pickMilestones(timeline: TimelineItem[]) {
  const wanted = [
    "comeco-setembro-2025",
    "iphone-xr",
    "mil-inscritos",
    "acer-nitro-5",
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
