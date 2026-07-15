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
    >
      <div>
        <span className="eyebrow-v2">IMPORTS TECH NO TELEGRAM</span>
        <h2>Eu quero manter a conversa perto.</h2>
        <p>
          No Telegram, eu separo as promoções do espaço de conversa para você
          escolher como prefere acompanhar.
        </p>
      </div>
      <div className="telegram-actions">
        <article>
          <strong>Canal de promoções</strong>
          <p>
            Eu seleciono promoções, cupons e oportunidades de tecnologia para
            compartilhar por lá.
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
            No grupo, você pode conversar sobre celulares, notebooks, garimpos,
            reparos e tecnologia com outras pessoas que acompanham o Imports
            Tech.
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
      <small className="telegram-notice">
        O Telegram é um serviço externo e possui seus próprios termos e práticas
        de privacidade.
      </small>
    </section>
  );
}
