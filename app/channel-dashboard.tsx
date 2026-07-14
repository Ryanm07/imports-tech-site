"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Video = {
  id: string;
  title: string;
  views: number;
  publishedAt: string;
  duration: string;
  thumbnail?: string;
  category: string;
};

type ChannelData = {
  channelName: string;
  handle: string;
  description: string;
  subscribers: number;
  totalViews: number;
  videoCount: number;
  monthlyGrowth: number;
  channelUrl: string;
  syncedAt: string;
  isDemo: boolean;
  videos: Video[];
};

const fallbackData: ChannelData = {
  channelName: "Imports Tech!",
  handle: "@Imports_Tech",
  description: "Tecnologia de verdade, sem enrolação: reviews, usados, garimpos e as melhores escolhas em custo-benefício.",
  subscribers: 3340,
  totalViews: 610472,
  videoCount: 80,
  monthlyGrowth: 0,
  channelUrl: "https://www.youtube.com/@Imports_Tech",
  syncedAt: new Date().toISOString(),
  isDemo: false,
  videos: [
    { id: "fnD2R4YoJ8k", title: "Velho, mas não obsoleto! Será que o iPhone 12 Ainda Vale a Pena em 2026?", views: 1100, publishedAt: "2026-07-10", duration: "14:08", category: "Smartphones" },
    { id: "i4LXDsWlc8Q", title: "Comprei um iPhone 12 por R$650… Me Dei Bem?", views: 5400, publishedAt: "2026-07-02", duration: "5:04", category: "Garimpos" },
    { id: "biatbb6rvwU", title: "Usei o Galaxy S21 Ultra em 2026… Ele Ainda é ABSURDO?", views: 5100, publishedAt: "2026-06-30", duration: "11:03", category: "Smartphones" },
    { id: "cbodYFxeINo", title: "Paguei R$2.500 no MacBook Mais Vendido do Brasil... Valeu a Pena?", views: 11000, publishedAt: "2026-06-23", duration: "13:32", category: "Notebooks" },
    { id: "ScBB5TZ-Py8", title: "Achei um S21 Ultra por R$502,89 na OLX… Eu tive que Arriscar", views: 76000, publishedAt: "2026-06-16", duration: "14:21", category: "Garimpos" },
    { id: "Y1nStLptXY0", title: "Paguei R$1.200 no notebook gamer mais vendido do Brasil... valeu a pena?", views: 243000, publishedAt: "2026-06-10", duration: "19:07", category: "Notebooks" },
  ],
};

function compact(value: number) {
  return new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function dateLabel(date: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(new Date(date));
}

export function ChannelDashboard() {
  const [data, setData] = useState(fallbackData);
  const [filter, setFilter] = useState("Todos");
  const [curiosity, setCuriosity] = useState(0);
  const [poll, setPoll] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    let active = true;
    const sync = async () => {
      try {
        const response = await fetch("/api/youtube", { cache: "no-store" });
        if (response.ok && active) setData(await response.json());
      } catch {
        // O site continua utilizável com os dados demonstrativos.
      }
    };
    sync();
    const timer = window.setInterval(sync, 60_000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  const visibleVideos = useMemo(() => {
    if (filter === "Populares") return [...data.videos].sort((a, b) => b.views - a.views).slice(0, 4);
    if (filter === "Recentes") return data.videos.slice(0, 4);
    return data.videos;
  }, [data.videos, filter]);

  const chartData = useMemo(() => {
    const recent = data.videos.slice(0, 6).reverse();
    const largest = Math.max(...recent.map((video) => video.views), 1);
    return recent.map((video) => ({
      label: video.title,
      value: video.views,
      height: Math.max(8, (video.views / largest) * 100),
    }));
  }, [data.videos]);

  const curiosities = useMemo(() => [
    `O Imports Tech já soma ${compact(data.totalViews)} visualizações em análises e garimpos de tecnologia.`,
    `São ${data.videoCount} vídeos publicados desde setembro de 2025 — conteúdo novo quase toda semana.`,
    `A comunidade já reúne ${compact(data.subscribers)} pessoas interessadas em tecnologia e compra inteligente.`,
  ], [data]);

  function submitNewsletter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubscribed(true);
    event.currentTarget.reset();
  }

  return (
    <main>
      <div className="noise" aria-hidden="true" />
      <header className="site-header">
        <a className="brand" href="#inicio" aria-label="Voltar ao início">
          <span className="brand-mark">IT</span>
          <span>IMPORTS TECH<span className="brand-dot">.</span></span>
        </a>
        <nav className={menuOpen ? "nav open" : "nav"} aria-label="Navegação principal">
          <a href="#inicio" onClick={() => setMenuOpen(false)}>Início</a>
          <a href="#videos" onClick={() => setMenuOpen(false)}>Vídeos</a>
          <a href="#numeros" onClick={() => setMenuOpen(false)}>Números</a>
          <a href="#comunidade" onClick={() => setMenuOpen(false)}>Comunidade</a>
        </nav>
        <a className="youtube-button" href={data.channelUrl} target="_blank" rel="noreferrer">
          <span className="play-mini">▶</span> YouTube
        </a>
        <button className="menu-button" aria-label="Abrir menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
          <span /> <span />
        </button>
      </header>

      <section className="hero" id="inicio">
        <div className="hero-copy">
          <div className="eyebrow"><span className="live-dot" /> REVIEWS · GARIMPOS · CUSTO-BENEFÍCIO</div>
          <h1>Tecnologia real.<br /><em>Sem enrolação.</em></h1>
          <p>{data.description}</p>
          <div className="hero-actions">
            <a className="primary-button" href="#videos"><span>▶</span> Assistir agora</a>
            <a className="text-link" href="#numeros">Explorar o canal <span>↘</span></a>
          </div>
        </div>
        <div className="hero-stage" aria-label="Destaque do canal">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="channel-sphere">
            <span className="sphere-label">{data.channelName}</span>
            <span className="sphere-play">▶</span>
            <span className="sphere-handle">{data.handle}</span>
          </div>
          <div className="floating-note note-one"><strong>{compact(data.subscribers)}</strong><span>inscritos</span></div>
          <div className="floating-note note-two"><strong>{data.videoCount}</strong><span>vídeos publicados</span></div>
        </div>
        <div className="scroll-cue"><span>ROLE PARA DESCOBRIR</span><i>↓</i></div>
      </section>

      <section className="metrics-section" id="numeros">
        <div className="section-heading">
          <div><span className="kicker">POR TRÁS DOS VÍDEOS</span><h2>O canal em números</h2></div>
          <div className="sync-status"><span /> Sincronizado automaticamente com o YouTube</div>
        </div>
        <div className="metric-grid">
          <article className="metric-card accent-card">
            <span className="metric-icon">↗</span>
            <strong>{compact(data.subscribers)}</strong>
            <p>inscritos na comunidade</p>
            <small>número público atualizado pelo canal</small>
          </article>
          <article className="metric-card"><span className="metric-number">01</span><strong>{compact(data.totalViews)}</strong><p>visualizações totais</p><div className="mini-line" /></article>
          <article className="metric-card"><span className="metric-number">02</span><strong>{data.videoCount}</strong><p>histórias publicadas</p><div className="stack-lines"><i/><i/><i/></div></article>
          <article className="metric-card"><span className="metric-number">03</span><strong>4,8</strong><p>minutos por sessão</p><div className="meter"><i /></div></article>
        </div>
      </section>

      <section className="videos-section" id="videos">
        <div className="section-heading videos-heading">
          <div><span className="kicker">DÊ O PLAY</span><h2>Últimos vídeos</h2></div>
          <div className="filters" role="group" aria-label="Filtrar vídeos">
            {["Todos", "Recentes", "Populares"].map((item) => <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item}</button>)}
          </div>
        </div>
        <div className="video-grid">
          {visibleVideos.map((video, index) => (
            <a className="video-card" key={video.id} href={data.isDemo ? "#comunidade" : `https://youtu.be/${video.id}`} target={data.isDemo ? undefined : "_blank"} rel="noreferrer">
              <div className={`video-art art-${(index % 6) + 1}`} style={video.thumbnail ? { backgroundImage: `linear-gradient(180deg, transparent 40%, rgba(0,0,0,.82)), url(${video.thumbnail})` } : undefined}>
                <span className="episode">{String(index + 1).padStart(2, "0")}</span>
                <span className="video-play">▶</span>
                <span className="duration">{video.duration}</span>
              </div>
              <div className="video-meta"><span>{video.category} · {dateLabel(video.publishedAt)}</span><h3>{video.title}</h3><p>{compact(video.views)} visualizações <i>↗</i></p></div>
            </a>
          ))}
        </div>
      </section>

      <section className="insights-section">
        <div className="growth-panel">
          <div className="panel-top"><div><span className="kicker">DESEMPENHO RECENTE</span><h2>Vídeos que estão rodando</h2></div><strong>{compact(Math.max(...data.videos.map((video) => video.views), 0))} <small>maior alcance recente</small></strong></div>
          <div className="chart" aria-label="Comparação de visualizações dos vídeos recentes">
            {chartData.map((item, index) => <div className="bar-wrap" key={item.label} title={`${item.label}: ${compact(item.value)} visualizações`}><i style={{ height: `${item.height}%` }}><span>{compact(item.value)}</span></i><small>V{index + 1}</small></div>)}
          </div>
        </div>
        <div className="curiosity-panel">
          <span className="asterisk">✳</span>
          <span className="kicker">VOCÊ SABIA?</span>
          <p>{curiosities[curiosity]}</p>
          <button onClick={() => setCuriosity((curiosity + 1) % curiosities.length)}>Outra curiosidade <span>→</span></button>
          <div className="curiosity-count">0{curiosity + 1} / 0{curiosities.length}</div>
        </div>
      </section>

      <section className="community-section" id="comunidade">
        <div className="community-copy"><span className="kicker">VOCÊ FAZ PARTE DISSO</span><h2>A próxima ideia<br />pode ser <em>sua.</em></h2><p>Vote, sugira e acompanhe os bastidores. Os melhores vídeos começam com uma boa conversa.</p></div>
        <div className="poll-card">
          <span>ENQUETE DA SEMANA</span><h3>Qual tema você quer ver no próximo vídeo?</h3>
          {["Um mistério da internet", "Um experimento na prática", "Uma história inacreditável"].map((option, index) => (
            <button key={option} className={poll === option ? "selected" : ""} onClick={() => setPoll(option)}>
              <i>{String.fromCharCode(65 + index)}</i><span>{option}</span><strong>{poll ? [42, 34, 24][index] + (poll === option ? 1 : 0) : ""}{poll ? "%" : "→"}</strong>
            </button>
          ))}
          <small>{poll ? "Voto registrado — obrigado por participar!" : "2.847 pessoas já votaram"}</small>
        </div>
      </section>

      <section className="newsletter">
        <div><span className="kicker">SEM ALGORITMO NO CAMINHO</span><h2>O melhor do canal,<br />direto na sua caixa de entrada.</h2></div>
        {subscribed ? <div className="success-message"><span>✓</span><strong>Você está na lista!</strong><p>Até a próxima história.</p></div> : <form onSubmit={submitNewsletter}><label htmlFor="email">Seu melhor e-mail</label><div><input id="email" type="email" required placeholder="voce@email.com"/><button type="submit" aria-label="Inscrever-se">→</button></div><small>Uma mensagem por semana. Sem spam, prometido.</small></form>}
      </section>

      <footer><a className="brand" href="#inicio"><span className="brand-mark">IT</span><span>IMPORTS TECH<span className="brand-dot">.</span></span></a><p>© 2026 — Tecnologia de verdade, sem enrolação.</p><div><a href={data.channelUrl} target="_blank" rel="noreferrer">YouTube ↗</a><a href="#comunidade">Comunidade</a></div></footer>
    </main>
  );
}
