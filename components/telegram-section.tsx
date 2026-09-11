import type { TelegramLinks } from "@/lib/telegram";
import { BRAND_LINKS } from "@/lib/brand";

export function TelegramSection({
  links,
  compact = false,
}: {
  links: TelegramLinks;
  compact?: boolean;
}) {
  return (
    <section
      className={compact ? "telegram-section compact" : "telegram-section"}
      data-motion-section="comunidade"
    >
      <div className="telegram-heading">
        <span className="eyebrow-v2">Comunidade Imports Tech</span>
        <h2>A conversa continua.</h2>
        <p>
          Dos comentários do canal aos garimpos do dia. Escolha o seu jeito de
          acompanhar.
        </p>
      </div>
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
          <h3>Tem sempre uma descoberta nova.</h3>
          <p>
            Vídeos completos, bastidores e experiências reais. Eu também estou
            nas atualizações e nos comentários do canal.
          </p>
          <a
            className="button primary"
            href={BRAND_LINKS.youtube}
            target="_blank"
            rel="noreferrer"
          >
            Acompanhar no YouTube
          </a>
        </div>
      </div>
      <div className="telegram-options">
        <article className="telegram-option">
          <div>
            <span className="eyebrow-v2">Telegram</span>
            <h3>Canal de promoções</h3>
            <p>
              Eu compartilho promoções, cupons e oportunidades de tecnologia que
              realmente chamam minha atenção.
            </p>
          </div>
          {links.channel ? (
            <a
              className="inline-link"
              href={links.channel}
              target="_blank"
              rel="noreferrer"
            >
              Ver promoções
            </a>
          ) : (
            <span className="unavailable-note">Em breve no Telegram</span>
          )}
        </article>
        <article className="telegram-option">
          <div>
            <span className="eyebrow-v2">Telegram</span>
            <h3>Grupo da comunidade</h3>
            <p>
              Um espaço para conversar comigo e com outras pessoas sobre
              celulares, notebooks, garimpos, reparos e tecnologia.
            </p>
          </div>
          {links.group ? (
            <a
              className="inline-link"
              href={links.group}
              target="_blank"
              rel="noreferrer"
            >
              Entrar no grupo
            </a>
          ) : (
            <span className="unavailable-note">Em breve no Telegram</span>
          )}
        </article>
      </div>
      <small className="telegram-notice">
        O Telegram é um serviço externo, com seus próprios termos e práticas de
        privacidade.
      </small>
    </section>
  );
}
