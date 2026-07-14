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
  channelName: "Seu Canal",
  handle: "@seucanal",
  description: "Vídeos novos, boas histórias e ideias que merecem ser compartilhadas.",
  subscribers: 128400,
  totalViews: 8420000,
  videoCount: 184,
  monthlyGrowth: 12.8,
  channelUrl: "https://youtube.com",
  syncedAt: new Date().toISOString(),
  isDemo: true,
  videos: [
    { id: "v1", title: "A descoberta que mudou tudo", views: 284000, publishedAt: "2026-07-11", duration: "12:48", category: "Histórias" },
    { id: "v2", title: "7 coisas que ninguém te conta", views: 196000, publishedAt: "2026-07-06", duration: "09:32", category: "Curiosidades" },
    { id: "v3", title: "Fui até o fim para descobrir", views: 143000, publishedAt: "2026-06-29", duration: "16:04", category: "Experimentos" },
    { id: "v4", title: "O detalhe escondido à vista de todos", views: 98000, publishedAt: "2026-06-22", duration: "11:17", category: "Curiosidades" },
    { id: "v5", title: "24 horas fazendo só isso", views: 87000, publishedAt: "2026-06-15", duration: "18:21", category: "Desafios" },
    { id: "v6", title: "Respondendo o que vocês sempre perguntam", views: 64000, publishedAt: "2026-06-08", duration: "14:09", category: "Comunidade" },
  ],
};

const curiosities = [
  "Se cada inscrito assistisse a apenas 1 minuto, seriam quase 90 dias de conteúdo sem parar.",
  "O vídeo mais visto do canal representa sozinho uma pequena cidade reunida na mesma tela.",
  "A comunidade já passou tempo suficiente assistindo para dar centenas de voltas ao redor do Sol — em minutos.",
];

const weeklyData = [42, 58, 51, 76, 68, 92, 84];

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
          <span className="brand-mark">SC</span>
          <span>SEU CANAL<span className="brand-dot">.</span></span>
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
          <div className="eyebrow"><span className="live-dot" /> NOVO VÍDEO TODA SEMANA</div>
          <h1>Ideias que começam<br />com um <em>play.</em></h1>
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
          <div className="floating-note note-two"><strong>+{data.monthlyGrowth}%</strong><span>este mês</span></div>
        </div>
        <div className="scroll-cue"><span>ROLE PARA DESCOBRIR</span><i>↓</i></div>
      </section>

      <section className="metrics-section" id="numeros">
        <div className="section-heading">
          <div><span className="kicker">POR TRÁS DOS VÍDEOS</span><h2>O canal em números</h2></div>
          <div className="sync-status"><span /> Atualizado {data.isDemo ? "em modo demonstração" : "automaticamente"}</div>
        </div>
        <div className="metric-grid">
          <article className="metric-card accent-card">
            <span className="metric-icon">↗</span>
            <strong>{compact(data.subscribers)}</strong>
            <p>inscritos na comunidade</p>
            <small>+{data.monthlyGrowth}% nos últimos 30 dias</small>
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
          <div className="panel-top"><div><span className="kicker">RITMO DO CANAL</span><h2>Uma semana em alta</h2></div><strong>+18,4% <small>vs. semana anterior</small></strong></div>
          <div className="chart" aria-label="Gráfico de visualizações nos últimos sete dias">
            {weeklyData.map((value, index) => <div className="bar-wrap" key={index}><i style={{ height: `${value}%` }}><span>{value}k</span></i><small>{["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"][index]}</small></div>)}
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

      <footer><a className="brand" href="#inicio"><span className="brand-mark">SC</span><span>SEU CANAL<span className="brand-dot">.</span></span></a><p>© 2026 — Conteúdo para gente curiosa.</p><div><a href="#videos">YouTube ↗</a><a href="#comunidade">Comunidade</a></div></footer>
    </main>
  );
}
