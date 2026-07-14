import type { Metadata } from "next";
import { reviews, money } from "@/lib/site-data";

export const metadata: Metadata = { title: "Reviews", description: "Análises do Imports Tech baseadas em uso real, preço pago e contexto de compra.", alternates: { canonical: "/reviews" } };

export default function ReviewsPage() {
  return <main id="conteudo" className="page-main"><header className="page-hero"><span className="eyebrow-v2">CENTRAL DE REVIEWS</span><h1>O que vale a pena de verdade?</h1><p>Sem ficha técnica infinita. Aqui entram a experiência, o preço pago, os problemas encontrados e o que aconteceu depois.</p></header><div className="review-grid review-library">{reviews.map((review) => <a className="review-card" href={`/reviews/${review.slug}`} key={review.slug}><div className="review-top"><span className="content-tag">{review.manufacturer} · {review.category}</span><span className={`verdict ${review.verdict === "Vale a pena" ? "positive" : review.verdict === "Não recomendo" ? "negative" : "conditional"}`}>{review.verdict}</span></div><h2>{review.name}</h2><p>{review.summary}</p><div className="review-meta"><span>Preço pago <strong>{money(review.pricePaid)}</strong></span><i>Ver review →</i></div></a>)}</div><div className="editorial-note"><strong>Transparência editorial</strong><p>Notas e custos que ainda não foram consolidados aparecem como “não informado”. O site não inventa dados para completar uma ficha.</p></div></main>;
}
