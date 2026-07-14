import Link from "next/link";
export default function NotFound() {
  return (
    <main id="conteudo" className="page-main">
      <div className="feature-soon">
        <span>ERRO 404</span>
        <h1>Essa peça não estava na bancada.</h1>
        <p>A página pode ter mudado de endereço ou ainda não foi publicada.</p>
        <Link className="button primary" href="/">
          Voltar ao início
        </Link>
      </div>
    </main>
  );
}
