import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { IntroReplayButtons } from "@/components/intro-replay-buttons";
import { BRAND_ASSETS, BRAND_LINKS } from "@/lib/brand";
import { getTimeline } from "@/lib/content-repository";

export const metadata: Metadata = {
  title: "Minha história",
  description:
    "Eu conto como comecei o Imports Tech, como minha comunicação evoluiu e o que aprendi construindo cada projeto.",
  alternates: { canonical: "/sobre" },
};

export default async function AboutPage() {
  const timeline = await getTimeline();
  return (
    <main id="conteudo" className="page-main story-page">
      <header className="page-hero story-hero">
        <span className="eyebrow-v2">MINHA HISTÓRIA</span>
        <h1>
          Eu comecei para aprender a falar. Continuei porque encontrei minha
          voz.
        </h1>
        <p>
          Em setembro de 2025, eu não imaginava onde o Imports Tech poderia
          chegar. Eu só queria enfrentar a timidez, melhorar minha comunicação e
          dividir uma curiosidade que sempre esteve comigo: tecnologia.
        </p>
      </header>

      <section className="story-opening">
        <div className="story-banner">
          <Image
            src={BRAND_ASSETS.banner}
            alt="Banner oficial do canal Imports Tech"
            width={1546}
            height={423}
            sizes="(max-width: 760px) 100vw, 55vw"
            priority
          />
        </div>
        <div>
          <span className="eyebrow-v2">DE ONDE EU PARTI</span>
          <h2>Minha evolução ficou gravada.</h2>
          <p>
            Nos primeiros vídeos, eu falava baixo, me enrolava e tinha menos
            confiança. Eu mantive esses vídeos publicados porque eles mostram a
            distância entre o começo e o que consigo produzir hoje.
          </p>
          <p>
            Eu gosto de tecnologia, jogos, fotografia e audiovisual. Fiz o
            ensino médio com curso técnico e comecei Engenharia da Computação,
            mas grande parte do que sei também veio de curiosidade, pesquisa e
            prática.
          </p>
          <div className="hero-buttons">
            <a
              className="button primary"
              href={BRAND_LINKS.youtube}
              target="_blank"
              rel="noreferrer"
            >
              Conhecer o canal ↗
            </a>
          </div>
          <IntroReplayButtons />
        </div>
      </section>

      <section className="story-timeline" aria-label="Minha trajetória">
        <div className="story-timeline-heading">
          <span className="eyebrow-v2">MINHA TRAJETÓRIA</span>
          <h2>O que mudou — e o que eu aprendi no caminho.</h2>
        </div>
        <ol>
          {timeline.map((item, index) => (
            <li id={item.slug} key={item.slug}>
              <div className="story-index" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </div>
              <div className="story-date">
                <span>{item.dateLabel}</span>
                <small>
                  {item.datePrecision === "approximate"
                    ? "Data aproximada"
                    : "Data confirmada"}
                </small>
              </div>
              <div className="story-entry">
                {item.number && <strong>{item.number}</strong>}
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <div className="story-entry-links">
                  {item.relatedProject && (
                    <Link href={`/projetos#${item.relatedProject}`}>
                      Ver projeto relacionado →
                    </Link>
                  )}
                  {item.youtubeUrl && (
                    <a href={item.youtubeUrl} target="_blank" rel="noreferrer">
                      Assistir no YouTube ↗
                    </a>
                  )}
                </div>
              </div>
              {item.imageUrl && (
                <div className="story-entry-image">
                  <Image
                    src={item.imageUrl}
                    alt=""
                    fill
                    sizes="(max-width: 760px) 100vw, 28vw"
                  />
                </div>
              )}
            </li>
          ))}
        </ol>
      </section>

      <section className="story-process">
        <div>
          <span className="eyebrow-v2">COMO EU PRODUZO HOJE</span>
          <h2>O vídeo final esconde muitas horas de trabalho.</h2>
        </div>
        <div className="story-process-copy">
          <p>
            Hoje eu uso tripé, iluminação, barra de luz, luz de preenchimento,
            um bom celular, microfone Fifine M8 com braço, Audacity e DaVinci
            Resolve. O modelo exato do celular fica como informação editável no
            painel porque eu não quero publicar um dado que possa ficar
            desatualizado.
          </p>
          <p>
            Normalmente, eu tenho dois ou três vídeos gravados esperando edição.
            Esse é meu maior gargalo. Uma hora de gravação costuma virar de 10 a
            15 minutos finais, e eu gasto cerca de 12 horas no processo completo
            de cada vídeo.
          </p>
        </div>
        <div className="story-numbers" aria-label="Números do processo">
          <div>
            <strong>≈ 12h</strong>
            <span>por vídeo completo</span>
          </div>
          <div>
            <strong>≈ 8h</strong>
            <span>só de edição</span>
          </div>
          <div>
            <strong>10–15 min</strong>
            <span>a partir de 1h gravada</span>
          </div>
        </div>
      </section>

      <section className="home-final-cta story-final">
        <span className="eyebrow-v2">O PRÓXIMO CAPÍTULO</span>
        <h2>Minha meta é chegar a 100 mil inscritos até o fim de 2027.</h2>
        <p>
          No longo prazo, eu quero construir uma das maiores comunidades de
          tecnologia do Brasil sem perder a honestidade e a proximidade que me
          trouxeram até aqui.
        </p>
        <div className="hero-buttons">
          <Link className="button secondary" href="/projetos">
            Conhecer meus projetos
          </Link>
          <a
            className="button primary"
            href={BRAND_LINKS.youtube}
            target="_blank"
            rel="noreferrer"
          >
            Acompanhar no YouTube ↗
          </a>
        </div>
      </section>
    </main>
  );
}
