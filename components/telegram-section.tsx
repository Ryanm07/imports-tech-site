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
        <h2>Achados e conversas além do site.</h2>
        <p>
          Duas entradas oficiais, exibidas somente quando o endereço foi
          configurado e validado.
        </p>
      </div>
      <div className="telegram-actions">
        <article>
          <strong>Canal de promoções</strong>
          <p>
            Promoções, cupons e oportunidades de tecnologia selecionadas pelo
            Imports Tech.
          </p>
          {links.channel ? (
            <a
              className="button primary"
              href={links.channel}
              target="_blank"
              rel="noreferrer"
            >
              Entrar no canal ↗
            </a>
          ) : (
            <span>Canal · Em breve</span>
          )}
        </article>
        <article>
          <strong>Grupo da comunidade</strong>
          <p>
            Converse sobre celulares, notebooks, garimpos, reparos e tecnologia
            com a comunidade.
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
    </section>
  );
}
