"use client";

import { useEffect, useMemo, useState } from "react";
import { VideoCard, VideoCardData, compact } from "@/components/video-card";
import { categories, finds, money, reviews } from "@/lib/site-data";
import Image from "next/image";
import Link from "next/link";

type ChannelData = { channelName: string; subscribers: number; totalViews: number; videoCount: number; syncedAt: string; videos: VideoCardData[] };

const fallback: ChannelData = { channelName: "Imports Tech!", subscribers: 3340, totalViews: 610472, videoCount: 80, syncedAt: "", videos: [] };

export function HomePage() {
  const [data, setData] = useState(fallback);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  async function load() {
    setStatus("loading");
    try {
      const response = await fetch("/api/youtube", { cache: "no-store" });
      if (!response.ok) throw new Error();
      setData(await response.json());
      setStatus("ready");
    } catch { setStatus("error"); }
  }

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 300_000);
    return () => window.clearInterval(timer);
  }, []);

  const featured = useMemo(() => data.videos.length ? [...data.videos].sort((a, b) => b.views - a.views)[0] : null, [data.videos]);
  const orbitMetrics = [
    { value: compact(data.subscribers), label: "inscritos", detail: "Pessoas acompanhando o canal" },
    { value: String(data.videoCount), label: "vídeos", detail: "Conteúdos publicados" },
    { value: compact(data.totalViews), label: "visualizações", detail: "Alcance público total" },
    { value: "30+", label: "produtos", detail: "Estimativa editorial; catálogo em organização" },
    { value: "10+", label: "garimpos", detail: "Histórias de usados mapeadas" },
  ];

  return <>
    <main id="conteudo">
      <section className="hero-v2">
        <div className="hero-grid" aria-hidden="true"/>
        <div className="hero-message">
          <span className="eyebrow-v2"><i/> REVIEWS · GARIMPOS · TECNOLOGIA</span>
          <h1>Tecnologia testada<br/><em>no uso real.</em></h1>
          <p>Do anúncio na OLX até o teste final. Reviews sinceros, compras inteligentes e reparos sem esconder os problemas.</p>
          <div className="hero-buttons"><Link className="button primary" href="/videos">▶ Assistir aos vídeos</Link><Link className="button secondary" href="/reviews">Explorar reviews</Link><Link className="inline-link" href="/garimpos">Ver garimpos ↗</Link></div>
        </div>
        <div className="orbit-system" aria-label="Métricas do Imports Tech">
          <div className="orbit-line orbit-a"/><div className="orbit-line orbit-b"/><div className="orbit-line orbit-c"/>
          <div className="orbit-logo"><Image src="/brand/imports-tech-logo.jpg" alt="Logo oficial Imports Tech" fill sizes="255px" priority unoptimized/><span>IMPORTS TECH</span></div>
          {orbitMetrics.map((metric, index) => <button className={`orbit-node node-${index + 1}`} key={metric.label} aria-label={`${metric.value} ${metric.label}. ${metric.detail}`}><strong>{metric.value}</strong><span>{metric.label}</span><small>{metric.detail}</small></button>)}
        </div>
        <div className="hero-proof"><span className={status === "ready" ? "status-dot online" : "status-dot"}/><span>{status === "loading" ? "Sincronizando com o canal…" : status === "error" ? "Exibindo o último retrato válido" : "Dados públicos sincronizados"}</span>{status === "error" && <button onClick={load}>Tentar novamente</button>}</div>
      </section>

      <section className="section-shell" id="ultimos-videos">
        <div className="section-title"><div><span className="eyebrow-v2">PUBLICADO AGORA</span><h2>Últimos vídeos</h2></div><Link href="/videos">Ver biblioteca completa <span>↗</span></Link></div>
        {status === "loading" && !data.videos.length ? <div className="video-skeleton-grid" aria-label="Carregando vídeos">{[1,2,3].map((item) => <div className="video-skeleton" key={item}/>)}</div> : data.videos.length ? <div className="video-grid-v2">{data.videos.slice(0, 6).map((video) => <VideoCard key={video.id} video={video}/>)}</div> : <div className="empty-state"><strong>Os vídeos não puderam ser atualizados.</strong><p>O restante do site continua disponível.</p><button onClick={load}>Tentar novamente</button></div>}
      </section>

      {featured && <section className="featured-band"><div className="featured-label"><span>EM DESTAQUE</span><strong>O vídeo que mais chamou atenção entre os recentes.</strong><p>Sem segredo de algoritmo: é o conteúdo com maior número público de visualizações no recorte atual.</p></div><VideoCard video={featured} featured/></section>}

      <section className="section-shell muted-section">
        <div className="section-title"><div><span className="eyebrow-v2">EXPERIÊNCIA, NÃO SÓ ESPECIFICAÇÃO</span><h2>Reviews recentes</h2></div><Link href="/reviews">Central de reviews <span>↗</span></Link></div>
        <div className="review-grid">{reviews.map((review) => <Link className="review-card" href={`/reviews/${review.slug}`} key={review.slug}><div className="review-top"><span className="content-tag">{review.category}</span><span className={`verdict ${review.verdict === "Vale a pena" ? "positive" : review.verdict === "Não recomendo" ? "negative" : "conditional"}`}>{review.verdict}</span></div><h3>{review.name}</h3><p>{review.summary}</p><div className="review-meta"><span>Preço pago <strong>{money(review.pricePaid)}</strong></span><i>Ver análise →</i></div></Link>)}</div>
      </section>

      <section className="section-shell finds-home">
        <div className="section-title"><div><span className="eyebrow-v2">DO ANÚNCIO AO TESTE FINAL</span><h2>Garimpos do canal</h2></div><Link href="/garimpos">Todos os garimpos <span>↗</span></Link></div>
        <div className="finds-list">{finds.map((find, index) => <Link href={`/garimpos/${find.slug}`} className="find-row" key={find.slug}><span className="find-index">0{index + 1}</span><div><span>{find.currentStatus}</span><h3>{find.product}</h3></div><dl><dt>Pago</dt><dd>{money(find.negotiatedPrice)}</dd></dl><dl><dt>Reparo</dt><dd>{money(find.repairCost)}</dd></dl><strong>Ver história ↗</strong></Link>)}</div>
      </section>

      <section className="category-section"><div className="section-title"><div><span className="eyebrow-v2">ENCONTRE SEU ASSUNTO</span><h2>Categorias</h2></div></div><div className="category-grid">{categories.map((category) => <Link href={`/videos?categoria=${encodeURIComponent(category.name)}`} key={category.name}><span>{category.icon}</span><h3>{category.name}</h3><p>{category.description}</p><i>↗</i></Link>)}</div></section>

      <section className="metrics-strip"><div><span>Inscritos</span><strong>{compact(data.subscribers)}</strong></div><div><span>Vídeos publicados</span><strong>{data.videoCount}</strong></div><div><span>Visualizações</span><strong>{compact(data.totalViews)}</strong></div><Link href="/metricas">Abrir painel público <span>↗</span></Link></section>

      <section className="about-home"><div className="about-image"><Image src="/brand/imports-tech-banner.jpg" alt="Banner oficial Imports Tech — Reviews, Garimpos, Tecnologia" width={2120} height={373} sizes="(max-width: 760px) 100vw, 55vw" unoptimized/></div><div><span className="eyebrow-v2">POR TRÁS DO CANAL</span><h2>Tecnologia honesta, com contexto.</h2><p>O Imports Tech mostra o que acontece depois da compra: o estado em que o produto chegou, o que precisou de atenção, quanto custou e se ainda vale a pena. Sem transformar experiência real em ficha técnica infinita.</p><Link className="button secondary" href="/sobre">Conhecer o Imports Tech</Link></div></section>
    </main>
  </>;
}
