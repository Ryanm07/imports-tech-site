"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="conteudo" className="page-main">
      <div className="feature-soon">
        <span>ALGO SAIU DO ROTEIRO</span>
        <h1>Não foi possível carregar esta página.</h1>
        <p>
          O problema pode ser temporário. Tente novamente sem perder o restante
          do site.
        </p>
        <button className="button primary" onClick={reset}>
          Tentar novamente
        </button>
      </div>
    </main>
  );
}
