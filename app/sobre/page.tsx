import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BRAND_ASSETS, BRAND_LINKS } from "@/lib/brand";
import { getTimeline } from "@/lib/content-repository";

export const metadata: Metadata = {
  title: "Sobre",
  description:
    "Conheça a proposta do Imports Tech e como os conteúdos são produzidos.",
  alternates: { canonical: "/sobre" },
};

const truthfulFallback = [
  {
    year: "Hoje",
    title: "Tecnologia testada no uso real",
    description:
      "O canal publica reviews, garimpos e reparos com contexto de compra, condição e custo.",
    position: 1,
  },
];

export default async function AboutPage() {
  const storedTimeline = await getTimeline();
  const timeline = storedTimeline.length ? storedTimeline : truthfulFallback;
  return (
    <main id="conteudo" className="page-main">
      <header className="page-hero">
        <span className="eyebrow-v2">SOBRE O IMPORTS TECH</span>
        <h1>Tecnologia sem esconder o depois.</h1>
        <p>
          Comprar é só o começo. O canal acompanha o produto, testa no cotidiano
          e mostra quando o barato valeu a pena — ou quando virou problema.
        </p>
      </header>
      <section className="about-story">
        <Image
          src={BRAND_ASSETS.banner}
          alt="Banner oficial do canal Imports Tech"
          width={1546}
          height={423}
          sizes="(max-width: 760px) 100vw, 52vw"
        />
        <div>
          <h2>Reviews, garimpos e tecnologia</h2>
          <p>
            O Imports Tech é um canal brasileiro focado em aparelhos usados,
            celulares, notebooks, consoles, periféricos, reparos e comparações.
          </p>
          <p>
            Nas histórias de garimpo, o caminho completo importa: anúncio,
            negociação, diagnóstico, manutenção e situação atual.
          </p>
          <div className="hero-buttons">
            <a
              className="button primary"
              href={BRAND_LINKS.youtube}
              target="_blank"
              rel="noreferrer"
            >
              ▶ Conhecer o canal
            </a>
            <Link className="button secondary" href="/?intro=replay">
              Rever abertura
            </Link>
          </div>
        </div>
      </section>
      <section
        className="timeline-section about-timeline"
        aria-label="Trajetória do canal"
      >
        <div>
          <span className="eyebrow-v2">TRAJETÓRIA</span>
          <h2>Marcos do Imports Tech</h2>
        </div>
        <ol>
          {timeline.map((item) => (
            <li key={`${item.position}-${item.title}`}>
              <span>{item.year}</span>
              <strong>{item.title}</strong>
              <p>{item.description}</p>
            </li>
          ))}
        </ol>
      </section>
      <section className="principles" aria-label="Princípios editoriais">
        <article>
          <span>01</span>
          <h3>Preço com contexto</h3>
          <p>Condição, risco e custo total entram na conta.</p>
        </article>
        <article>
          <span>02</span>
          <h3>Teste no uso real</h3>
          <p>Ficha técnica não substitui a experiência no dia a dia.</p>
        </article>
        <article>
          <span>03</span>
          <h3>Transparência</h3>
          <p>Dados não confirmados são marcados; afiliados recebem aviso.</p>
        </article>
      </section>
    </main>
  );
}
