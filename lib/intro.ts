export function shouldShowIntro(input: {
  enabled: boolean;
  replay: boolean;
  seenThisSession: boolean;
  reducedMotion: boolean;
  saveData: boolean;
  effectiveType?: string;
  hasPlayableAsset: boolean;
}) {
  if (!input.enabled || !input.hasPlayableAsset) return false;
  if (!input.replay && input.seenThisSession) return false;
  if (input.reducedMotion || input.saveData) return false;
  return !["slow-2g", "2g"].includes(input.effectiveType || "");
}
