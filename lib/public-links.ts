export type PublicLinks = {
  mediaKit: string | null;
  commercialEmail: string | null;
};

export function getPublicLinks(
  settings: Record<string, string> = {},
): PublicLinks {
  return {
    mediaKit: validHttpsUrl(
      settings.media_kit_url || process.env.MEDIA_KIT_URL,
    ),
    commercialEmail: validEmail(
      settings.commercial_contact_email || process.env.COMMERCIAL_CONTACT_EMAIL,
    ),
  };
}

export function validHttpsUrl(value: string | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export function validEmail(value: string | undefined) {
  if (!value) return null;
  const candidate = value.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(candidate) ? candidate : null;
}
