import type { TelegramLinks } from "@/lib/telegram";
import { BRAND_LINKS } from "@/lib/brand";

export function TelegramSection({
  links,
  compact = false,
}: {
  links: TelegramLinks;
  compact?: boolean;
}) {
  const options = [
    {
      href: links.channel,
      title: "Canal de promoções",
      text: "Promoções, cupons e oportunidades de tecnologia que chamam minha atenção.",
      action: "Ver promoções",
    },
    {
      href: links.group,
      title: "Grupo da comunidade",
      text: "Um espaço para trocar experiências sobre equipamentos, compras e reparos.",
      action: "Entrar no grupo",
    },
  ].filter((option) => option.href);
  return (
    <section
      className={compact ? "telegram-section compact" : "telegram-section"}
      aria-label="Canais oficiais"
    >
      <div className="community-feature">
        <div className="community-feature-mark" aria-hidden="true">
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
            <rect
              x="3"
              y="12"
              width="58"
              height="40"
              rx="12"
              fill="currentColor"
            />
            <path d="m27 23 16 9-16 9V23Z" fill="var(--bg, #07111f)" />
          </svg>
        </div>
        <div className="community-feature-copy">
          <span>YouTube / @Imports_Tech</span>
          <h2>Me encontre nos comentários.</h2>
          <p>
            Os vídeos, bastidores e atualizações ficam no canal. A conversa
            acontece por lá, sem cadastro neste site.
          </p>
          <a
            className="button primary"
            href={BRAND_LINKS.youtubeCommunity}
            target="_blank"
            rel="noreferrer"
          >
            Abrir a comunidade no YouTube
          </a>
        </div>
      </div>
      {options.length > 0 && (
        <>
          <div className="telegram-options">
            {options.map((option) => (
              <article key={option.title} className="telegram-option">
                <div>
                  <span className="eyebrow-v2">Telegram</span>
                  <h3>{option.title}</h3>
                  <p>{option.text}</p>
                </div>
                <a
                  className="inline-link"
                  href={option.href!}
                  target="_blank"
                  rel="noreferrer"
                >
                  {option.action}
                </a>
              </article>
            ))}
          </div>
          <small className="telegram-notice">
            O Telegram é um serviço externo, com seus próprios termos e práticas
            de privacidade.
          </small>
        </>
      )}
    </section>
  );
}
