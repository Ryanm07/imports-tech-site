import Image from "next/image";
import Link from "next/link";

export function SiteFooter() {
  return <footer className="site-footer">
    <div className="footer-brand"><Image src="/brand/imports-tech-logo.jpg" alt="Logo Imports Tech" width="58" height="58" unoptimized/><div><strong>IMPORTS TECH</strong><span>Reviews · Garimpos · Tecnologia</span></div></div>
    <div className="footer-links"><div><strong>Explorar</strong><Link href="/videos">Vídeos</Link><Link href="/reviews">Reviews</Link><Link href="/garimpos">Garimpos</Link><Link href="/metricas">Métricas</Link></div><div><strong>Transparência</strong><Link href="/privacidade">Privacidade</Link><Link href="/termos">Termos da comunidade</Link><Link href="/afiliados">Aviso de afiliados</Link><Link href="/contato">Contato</Link></div></div>
    <div className="footer-bottom"><span>© 2026 Imports Tech. Tecnologia testada no uso real.</span><a href="https://www.youtube.com/@Imports_Tech" target="_blank" rel="noreferrer">YouTube ↗</a></div>
  </footer>;
}
