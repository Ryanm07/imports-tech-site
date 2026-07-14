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
          Entre no canal para acompanhar novidades ou no grupo para conversar
          com a comunidade. Links oficiais aparecem somente quando configurados.
        </p>
      </div>
      <div className="telegram-actions">
        {links.channel ? (
          <a
            className="button primary"
            href={links.channel}
            target="_blank"
            rel="noreferrer"
          >
            Canal no Telegram ↗
          </a>
        ) : (
          <span>Canal no Telegram · Em breve</span>
        )}
        {links.group ? (
          <a
            className="button secondary"
            href={links.group}
            target="_blank"
            rel="noreferrer"
          >
            Grupo da comunidade ↗
          </a>
        ) : (
          <span>Grupo da comunidade · Em breve</span>
        )}
      </div>
    </section>
  );
}
