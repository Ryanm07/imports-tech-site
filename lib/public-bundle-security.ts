const PUBLIC_YOUTUBE_SECRET_PATTERNS = [
  /YOUTUBE_API_KEY/u,
  /NEXT_PUBLIC_YOUTUBE/u,
  /AIza[0-9A-Za-z_-]{30,}/u,
] as const;

export function containsPublicYouTubeSecret(
  source: string,
  configuredSecret = "",
) {
  if (configuredSecret.length >= 8 && source.includes(configuredSecret)) {
    return true;
  }
  return PUBLIC_YOUTUBE_SECRET_PATTERNS.some((pattern) => pattern.test(source));
}
