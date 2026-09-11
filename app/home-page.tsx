import Image from "next/image";
import Link from "next/link";
import { TelegramSection } from "@/components/telegram-section";
import { ScrollSection } from "@/components/motion/scroll-section";
import { VideoCard } from "@/components/video-card";
import { ArrowIcon, PlayIcon } from "@/components/ui-icons";
import { BRAND_ASSETS, BRAND_LINKS } from "@/lib/brand";
import type { FeaturedContent } from "@/lib/featured-content";
import type { PublicLinks } from "@/lib/public-links";
import type { TimelineItem } from "@/lib/content-repository";
import type { TelegramLinks } from "@/lib/telegram";
import type { YouTubeMetricsSnapshot } from "@/lib/youtube-service";

const fallbackIntroduction =
  "Eu sou o Ryan. Criei o Imports Tech em setembro de 2025 para perder a timidez e aprender a me comunicar falando sobre o que sempre gostei: tecnologia. Dos primeiros periféricos aos achados da OLX, cada vídeo acabou virando uma parte da minha própria evolução.";

type HomePageProps = {
  telegram: TelegramLinks;
  publicLinks: PublicLinks;
  youtube: YouTubeMetricsSnapshot;
  timeline: TimelineItem[];
  featured: FeaturedContent[];
  homeIntroduction?: string;
  commercialIntroduction?: string;
};

export function HomePage({
  telegram,
  publicLinks,
  youtube,
  timeline,
  featured,
  homeIntroduction,
  commercialIntroduction,
}: HomePageProps) {
  const selectedMilestones = timeline.filter((item) =>
    [
      "comeco-setembro-2025",
      "iphone-xr",
      "mil-inscritos",
      "acer-nitro-5",
    ].includes(item.slug),
  );
  const milestones = selectedMilestones.length
    ? selectedMilestones
    : timeline.slice(0, 4);
  return (
    <main id="conteudo" className="home-page">
      <section className="editorial-hero" data-motion-section="hero">
        <div className="hero-topline">
          <span>
            <i className="status-dot" /> A curiosidade trouxe você até aqui.
          </span>
          <span>Imports Tech, por Ryan</span>
        </div>
        <div className="hero-headline">
          <h1>
            Tecnologia
            <br />
            fora do comum
          </h1>
          <a
            className="hero-seal"
            href={featured.length ? "#na-bancada" : "/sobre"}
            aria-label="Explorar as experiências do canal"
            data-intro-orbit-target
          >
            <span>Testar. Descobrir.</span>
            <Image
              src={BRAND_ASSETS.logo}
              alt=""
              width={80}
              height={80}
              sizes="70px"
              unoptimized
            />
            <span>Contar a história.</span>
          </a>
        </div>
        <div className="hero-workbench">
          {featured[0] ? (
            <a
              className="hero-feature"
              href={featured[0].url}
              target="_blank"
              rel="noreferrer"
              aria-label={`Assistir no YouTube: ${featured[0].title}`}
            >
              <Image
                src={featured[0].thumbnail}
                alt={featured[0].title}
                width={480}
                height={360}
                sizes="(max-width: 760px) 100vw, 60vw"
                priority
                unoptimized
              />
              <div className="hero-feature-shade" />
              <span className="hero-feature-label">
                Da minha bancada para o canal
              </span>
              <span className="hero-feature-title">{featured[0].title}</span>
              <span className="video-play">
                <PlayIcon />
              </span>
              <span className="hero-feature-action">
                Assistir à história <ArrowIcon />
              </span>
            </a>
          ) : (
            <div className="hero-brand-image">
              <Image
                src={BRAND_ASSETS.banner}
                alt="Imports Tech — reviews, garimpos e tecnologia"
                width={2048}
                height={339}
                priority
                unoptimized
              />
            </div>
          )}
          <div className="hero-introduction">
            <p>
              Eu compro, testo, conserto.
              <br />
              <strong>E conto o que realmente aconteceu.</strong>
            </p>
            <p>
              Smartphones, notebooks e achados que merecem uma segunda chance. A
              experiência inteira, além da ficha técnica.
            </p>
            <a
              className="button primary"
              href={BRAND_LINKS.youtube}
              target="_blank"
              rel="noreferrer"
            >
              <PlayIcon /> Conhecer o canal <ArrowIcon />
            </a>
            <Link className="text-link" href="/sobre">
              Quem está por trás disso <ArrowIcon />
            </Link>
          </div>
        </div>
        <div className="hero-bottomline">
          <span>
            <strong>5 mil+</strong> pessoas nessa descoberta{" "}
            <small>Marco do canal</small>
          </span>
          <a href={featured.length ? "#na-bancada" : "/sobre"}>
            Tem muita história pela frente <span aria-hidden="true">↓</span>
          </a>
        </div>
      </section>
      {featured.length > 0 && (
        <ScrollSection
          id="na-bancada"
          name="conteudos"
          className="content-section section-shell"
        >
          <div className="section-heading" data-reveal>
            <div>
              <span className="eyebrow-v2">Na bancada</span>
              <h2>
                Cada achado,
                <br />
                uma história de verdade.
              </h2>
            </div>
            <div>
              <p>
                O que chegou, o que deu errado e o que eu aprendi. Uma seleção
                para começar a explorar.
              </p>
              <a
                className="text-link"
                href={BRAND_LINKS.youtube}
                target="_blank"
                rel="noreferrer"
              >
                Todos os vídeos no YouTube <ArrowIcon />
              </a>
            </div>
          </div>
          <div className="video-grid">
            {featured.map((video) => (
              <VideoCard key={video.videoId} video={video} />
            ))}
          </div>
          <div className="content-footnote">
            <span>Garimpos, reviews e reparos</span>
            <span>Sem pular a parte difícil.</span>
          </div>
        </ScrollSection>
      )}
      <ScrollSection name="apresentacao" className="about-home section-shell">
        <div className="about-brand-panel" data-reveal>
          <div className="about-brand-top">
            <span>De onde tudo começou</span>
            <span>Set. 2025</span>
          </div>
          <Image
            src={BRAND_ASSETS.logo}
            alt="Logo oficial do Imports Tech"
            width={220}
            height={220}
            sizes="(max-width: 760px) 120px, 170px"
            unoptimized
          />
          <p>
            Uma câmera.
            <br />
            Muita curiosidade.
            <br />
            <strong>Vontade de começar.</strong>
          </p>
          <Link
            href="/sobre"
            className="about-brand-link"
            aria-label="Conhecer a história do Imports Tech"
          >
            <ArrowIcon />
          </Link>
        </div>
        <div className="about-home-copy" data-reveal>
          <span className="eyebrow-v2">Prazer, Ryan.</span>
          <h2>
            Antes de um canal,
            <br />
            uma boa dose
            <br />
            de curiosidade.
          </h2>
          <p>{homeIntroduction || fallbackIntroduction}</p>
          <p>
            Eu gosto de tecnologia, jogos, fotografia e audiovisual. Quase tudo
            começa com vontade de entender como as coisas funcionam.
          </p>
          <Link className="text-link" href="/sobre">
            Conhecer minha história <ArrowIcon />
          </Link>
        </div>
      </ScrollSection>
      {milestones.length > 0 && (
        <ScrollSection
          name="trajetoria"
          className="milestones-home section-shell"
        >
          <div className="section-heading" data-reveal>
            <div>
              <span className="eyebrow-v2">O caminho até aqui</span>
              <h2>
                Pequenos começos.
                <br />
                Grandes viradas.
              </h2>
            </div>
            <Link href="/sobre" className="text-link">
              Explorar a trajetória <ArrowIcon />
            </Link>
          </div>
          <ol className="milestone-list">
            {milestones.map((item, index) => (
              <li key={item.slug} data-reveal>
                <Link href={`/sobre#${item.slug}`}>
                  <span className="milestone-order" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <span className="milestone-date">{item.dateLabel}</span>
                    <h3>{item.title}</h3>
                  </div>
                  <span className="milestone-value">
                    {item.number || "O primeiro passo"}
                  </span>
                  <ArrowIcon />
                </Link>
              </li>
            ))}
          </ol>
        </ScrollSection>
      )}
      <TelegramSection links={telegram} />
      <ScrollSection name="metricas" className="channel-snapshot section-shell">
        <div className="snapshot-heading">
          <span className="eyebrow-v2">O canal em números</span>
          <h2>Um retrato do caminho.</h2>
          <p>{freshnessLabel(youtube)}</p>
          <Link href="/metricas" className="text-link">
            Origem e atualização dos dados <ArrowIcon />
          </Link>
        </div>
        <dl className="snapshot-values">
          <div>
            <dt>Inscritos no retrato</dt>
            <dd>{metricValue(youtube.subscribers)}</dd>
          </div>
          <div>
            <dt>Visualizações</dt>
            <dd>{metricValue(youtube.totalViews)}</dd>
          </div>
          <div>
            <dt>Vídeos publicados</dt>
            <dd>{metricValue(youtube.videoCount)}</dd>
          </div>
        </dl>
      </ScrollSection>
      <ScrollSection name="empresas" className="partnership-home section-shell">
        <div data-reveal>
          <span className="eyebrow-v2">Marcas e parcerias</span>
          <h2>
            Seu produto.
            <br />
            Uma experiência real.
          </h2>
        </div>
        <div data-reveal>
          <p>
            {commercialIntroduction ||
              "Eu produzo conteúdo mostrando o contexto inteiro: como o produto chegou, o que eu encontrei e qual foi o resultado. Vamos conversar sobre uma história que faça sentido para quem acompanha o canal."}
          </p>
          <div className="hero-buttons">
            <Link className="button primary" href="/contato">
              Vamos conversar <ArrowIcon />
            </Link>
            {publicLinks.mediaKit && (
              <a
                className="text-link"
                href={publicLinks.mediaKit}
                target="_blank"
                rel="noreferrer"
              >
                Ver Media Kit <ArrowIcon />
              </a>
            )}
          </div>
        </div>
      </ScrollSection>
    </main>
  );
}
function metricValue(value: number | null) {
  return value === null
    ? "Indisponível"
    : new Intl.NumberFormat("pt-BR", { notation: "compact" }).format(value);
}
function freshnessLabel(data: YouTubeMetricsSnapshot) {
  if (data.source === "unavailable" || !data.updatedAt)
    return "As métricas estão temporariamente indisponíveis.";
  const date = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(data.updatedAt));
  return data.stale
    ? `Último retrato disponível: ${date}. Os números atuais podem ser maiores.`
    : `Atualizado pela API oficial em ${date}.`;
}
