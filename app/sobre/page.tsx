import type { Metadata } from "next";
import Link from "next/link";
import { aboutStory } from "@/lib/about-story";

export const metadata: Metadata = {
  title: "Minha história",
  description:
    "Do primeiro vídeo aos cinco mil inscritos: os momentos que marcaram minha trajetória no Imports Tech.",
  alternates: { canonical: "/sobre" },
};

export default function AboutPage() {
  return (
    <main id="conteudo" className="page-main about-page">
      <header className="about-intro">
        <Link className="about-back" href="/">
          ← Voltar ao estúdio
        </Link>
        <span className="eyebrow-v2">Minha história / Ryan</span>
        <h1>Por trás da bancada.</h1>
        <p>
          O Imports Tech começou com vontade de aprender. Estes são alguns dos
          momentos que me trouxeram até aqui.
        </p>
      </header>
      <article aria-label="Minha trajetória" className="about-story">
        {aboutStory.map((moment) => (
          <section
            key={moment.id}
            id={moment.id}
            className="about-moment"
            aria-labelledby={`${moment.id}-title`}
          >
            {moment.aliases.map((alias) => (
              <span
                key={alias}
                id={alias}
                className="about-anchor"
                aria-hidden="true"
              />
            ))}
            <p className="about-when">{moment.when}</p>
            <div className="about-copy">
              <h2 id={`${moment.id}-title`}>{moment.title}</h2>
              <p>{moment.text}</p>
              {"video" in moment && (
                <a
                  className="about-video"
                  href={`https://www.youtube.com/watch?v=${moment.video.id}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {moment.video.label} <span aria-hidden="true">↗</span>
                </a>
              )}
            </div>
          </section>
        ))}
      </article>
      <section
        id="meta-2027"
        className="about-outlook"
        aria-labelledby="about-outlook-title"
      >
        <span className="eyebrow-v2">Uma meta pessoal</span>
        <h2 id="about-outlook-title">Continuar construindo.</h2>
        <p>
          Quero chegar a 100 mil inscritos até o fim de 2027. É um objetivo para
          o futuro, mantendo espaço para experimentar e contar o que acontece
          pelo caminho.
        </p>
        <Link className="about-video" href="/">
          Explorar o estúdio <span aria-hidden="true">→</span>
        </Link>
      </section>
    </main>
  );
}
