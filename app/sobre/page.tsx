import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { IntroReplayButtons } from "@/components/intro-replay-buttons";
import { ScrollSection } from "@/components/motion/scroll-section";
import { StoryExperience } from "@/components/story-experience";
import { BRAND_ASSETS, BRAND_LINKS } from "@/lib/brand";
import { getTimeline } from "@/lib/content-repository";
import { projectsEnabled } from "@/lib/features";

export const metadata: Metadata = {
  title: "Minha história",
  description:
    "Eu conto como comecei o Imports Tech, como minha comunicação evoluiu e o que aprendi em cada fase do canal.",
  alternates: { canonical: "/sobre" },
};

export default async function AboutPage() {
  const timeline = await getTimeline();
  return (
    <main id="conteudo" className="page-main story-page">
      <header className="page-hero story-hero" data-motion-section="abertura">
        <span className="eyebrow-v2">MINHA HISTÓRIA</span>
        <h1>
          Eu comecei para aprender a falar. Continuei porque encontrei minha
          voz.
        </h1>
        <p>
          Quando eu comecei, em setembro de 2025, eu não fazia ideia de onde o
          Imports Tech poderia chegar. Eu só queria perder a timidez, aprender a
          me comunicar melhor e dividir uma coisa que sempre mexeu comigo:
          tecnologia.
        </p>
      </header>

      <ScrollSection name="origem" className="story-opening">
        <div className="story-banner">
          <Image
            src={BRAND_ASSETS.banner}
            alt="Banner oficial do canal Imports Tech"
            width={2048}
            height={339}
            sizes="(max-width: 760px) 100vw, 55vw"
            priority
            unoptimized
          />
        </div>
        <div>
          <span className="eyebrow-v2">DE ONDE EU PARTI</span>
          <h2>Eu deixei minha evolução à vista.</h2>
          <p>
            Nos primeiros vídeos, eu falava baixo, me enrolava e quase não tinha
            confiança. Eu deixei tudo publicado porque gosto de olhar para trás
            e ver, de verdade, o quanto eu caminhei desde o começo.
          </p>
          <p>
            Eu sempre gostei de tecnologia, jogos, fotografia e audiovisual. Fiz
            o ensino médio com curso técnico e comecei Engenharia da Computação,
            mas muita coisa que eu sei veio da curiosidade, de ir atrás e de
            aprender fazendo.
          </p>
          <div className="hero-buttons">
            <a
              className="button primary"
              href={BRAND_LINKS.youtube}
              target="_blank"
              rel="noreferrer"
            >
              Conhecer o canal ↗
            </a>
          </div>
          <IntroReplayButtons />
        </div>
      </ScrollSection>

      <StoryExperience
        timeline={timeline}
        projectsEnabled={projectsEnabled()}
      />

      <ScrollSection name="processo" className="story-process">
        <div>
          <span className="eyebrow-v2">COMO EU PRODUZO HOJE</span>
          <h2>O vídeo final esconde muitas horas de trabalho.</h2>
        </div>
        <div className="story-process-copy">
          <p>
            Hoje eu gravo com tripé, iluminação, barra de luz, luz de
            preenchimento, um bom celular e microfone Fifine M8 com braço. O
            áudio passa pelo Audacity e a edição pelo DaVinci Resolve. O modelo
            exato do celular fica editável no painel, porque eu não quero deixar
            no ar uma informação que pode mudar.
          </p>
          <p>
            Normalmente, eu tenho dois ou três vídeos gravados esperando para
            editar. Esse ainda é meu maior gargalo. Uma hora de gravação costuma
            virar só 10 a 15 minutos de vídeo, e cada produção leva cerca de 12
            horas do começo ao fim.
          </p>
        </div>
        <div className="story-numbers" aria-label="Números do processo">
          <div>
            <strong>≈ 12h</strong>
            <span>por vídeo completo</span>
          </div>
          <div>
            <strong>≈ 8h</strong>
            <span>só de edição</span>
          </div>
          <div>
            <strong>10–15 min</strong>
            <span>a partir de 1h gravada</span>
          </div>
        </div>
      </ScrollSection>

      <ScrollSection name="meta" className="home-final-cta story-final">
        <span className="eyebrow-v2">O PRÓXIMO CAPÍTULO</span>
        <h2>Minha meta é chegar a 100 mil inscritos até o fim de 2027.</h2>
        <p>
          Eu quero construir uma das maiores comunidades de tecnologia do
          Brasil, mas sem perder a honestidade e a proximidade que fizeram tudo
          isso começar.
        </p>
        <div className="hero-buttons">
          <Link className="button secondary" href="/comunidade">
            Entrar na comunidade
          </Link>
          <Link className="inline-link" href="/">
            Voltar ao início
          </Link>
          <a
            className="button primary"
            href={BRAND_LINKS.youtube}
            target="_blank"
            rel="noreferrer"
          >
            Acompanhar no YouTube ↗
          </a>
        </div>
      </ScrollSection>
    </main>
  );
}
