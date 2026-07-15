import type { TelegramLinks } from "@/lib/telegram";

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
      <div>
        <span className="eyebrow-v2">IMPORTS TECH NO TELEGRAM</span>
        <h2>Eu quero que a conversa continue perto.</h2>
        <p>
          No Telegram, eu deixo as promoções em um lugar e a conversa em outro.
          Assim, você entra só no espaço que fizer sentido para você.
        </p>
      </div>
      <div className="telegram-actions">
        <article>
          <strong>Canal de promoções</strong>
          <p>
            Eu mando as promoções, cupons e oportunidades de tecnologia que
            realmente chamam minha atenção.
          </p>
          {links.channel ? (
            <a
              className="button primary"
              href={links.channel}
              target="_blank"
              rel="noreferrer"
            >
              Ver promoções ↗
            </a>
          ) : (
            <span>Canal · Em breve</span>
          )}
        </article>
        <article>
          <strong>Grupo da comunidade</strong>
          <p>
            É o espaço para conversar comigo e com outras pessoas sobre
            celulares, notebooks, garimpos, reparos e tecnologia.
          </p>
          {links.group ? (
            <a
              className="button secondary"
              href={links.group}
              target="_blank"
              rel="noreferrer"
            >
              Entrar no grupo ↗
            </a>
          ) : (
            <span>Grupo · Em breve</span>
          )}
        </article>
      </div>
      <div className="community-message-preview" aria-hidden="true">
        <span />
        <span />
        <span />
        <i />
      </div>
      <small className="telegram-notice">
        O Telegram é um serviço externo e possui seus próprios termos e práticas
        de privacidade.
      </small>
    </section>
  );
}
