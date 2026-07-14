import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Sobre",
  description:
    "Conheça a proposta do Imports Tech e como os conteúdos são produzidos.",
  alternates: { canonical: "/sobre" },
};

export default function AboutPage() {
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
          src="/brand/imports-tech-banner.jpg"
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
            A ideia é colocar o produto no uso real e falar de preço, condição e
            risco com honestidade.
          </p>
          <p>
            Nas histórias de garimpo, o caminho completo importa: anúncio,
            negociação, diagnóstico, manutenção e situação atual. Nas reviews, a
            experiência pesa mais do que uma lista de especificações.
          </p>
          <a
            className="button primary"
            href="https://www.youtube.com/@Imports_Tech"
            target="_blank"
            rel="noreferrer"
          >
            ▶ Conhecer o canal
          </a>
        </div>
      </section>
      <section className="principles" aria-label="Princípios editoriais">
        <article>
          <span>01</span>
          <h3>Preço com contexto</h3>
          <p>
            Um produto só é bom negócio quando condição, risco e custo total
            entram na conta.
          </p>
        </article>
        <article>
          <span>02</span>
          <h3>Teste no uso real</h3>
          <p>
            Ficha técnica ajuda, mas não substitui bateria, calor, câmera e
            desempenho no dia a dia.
          </p>
        </article>
        <article>
          <span>03</span>
          <h3>Transparência</h3>
          <p>
            Dados não confirmados são marcados como pendentes. Links de afiliado
            sempre recebem aviso.
          </p>
        </article>
      </section>
    </main>
  );
}
