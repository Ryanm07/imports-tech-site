export const INTRO_SESSION_KEY = "imports-tech:intro:v3";
export const INTRO_DURATION_SECONDS = 4.907;
export const INTRO_FINAL_FRAME_SECONDS = 4.83;

const SOURCE = { width: 1280, height: 720 } as const;
const LOGO = { x: 468, y: 263, width: 344, height: 193 } as const;
const RINGS = { x: 274, y: 14, width: 732, height: 692 } as const;

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

export function mapIntroGeometry(
  viewportWidth: number,
  viewportHeight: number,
) {
  const scale = Math.max(
    viewportWidth / SOURCE.width,
    viewportHeight / SOURCE.height,
  );
  const renderedWidth = SOURCE.width * scale;
  const renderedHeight = SOURCE.height * scale;
  const offsetX = (viewportWidth - renderedWidth) / 2;
  const offsetY = (viewportHeight - renderedHeight) / 2;
  return {
    scale,
    renderedWidth,
    renderedHeight,
    offsetX,
    offsetY,
    logo: mapRect(LOGO, scale, offsetX, offsetY),
    rings: mapRect(RINGS, scale, offsetX, offsetY),
  };
}

function mapRect(
  rect: { x: number; y: number; width: number; height: number },
  scale: number,
  offsetX: number,
  offsetY: number,
) {
  return {
    left: offsetX + rect.x * scale,
    top: offsetY + rect.y * scale,
    width: rect.width * scale,
    height: rect.height * scale,
  };
}
