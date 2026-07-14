export type TelegramLinks = { channel: string | null; group: string | null };

export function getTelegramLinks(
  settings: Record<string, string> = {},
): TelegramLinks {
  return {
    channel: validTelegramUrl(
      settings.telegram_channel_url || process.env.TELEGRAM_CHANNEL_URL,
    ),
    group: validTelegramUrl(
      settings.telegram_group_url || process.env.TELEGRAM_GROUP_URL,
    ),
  };
}

export function validTelegramUrl(value: string | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return null;
    if (!["t.me", "telegram.me"].includes(url.hostname.toLowerCase()))
      return null;
    if (!/^\/[A-Za-z0-9_+/-]{2,}$/u.test(url.pathname)) return null;
    return url.toString();
  } catch {
    return null;
  }
}
