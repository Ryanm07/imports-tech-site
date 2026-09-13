export const QUALITY_ORDER = [
  "ultra",
  "high",
  "medium",
  "low",
  "basic",
] as const;

export type StudioQuality = (typeof QUALITY_ORDER)[number];
export type StudioQualityPreference = StudioQuality | "auto";

export function shouldDeferStudio3D(
  hints: StudioQualityHints,
  preference: StudioQualityPreference,
) {
  return preference === "auto" && selectStudioQuality(hints) === "basic";
}

export function readStudioQualityPreference(
  value: string | null,
): StudioQualityPreference {
  return QUALITY_ORDER.some((quality) => quality === value)
    ? (value as StudioQuality)
    : "auto";
}

export type StudioQualityHints = {
  cores?: number;
  memoryGB?: number;
  saveData?: boolean;
  effectiveType?: string;
  finePointer?: boolean;
  downlinkMbps?: number;
};

export const QUALITY_SETTINGS: Record<
  StudioQuality,
  { dpr: number; fps: number; stars: number; shadows: boolean }
> = {
  ultra: { dpr: 1.75, fps: 45, stars: 4, shadows: true },
  high: { dpr: 1.6, fps: 30, stars: 3, shadows: true },
  medium: { dpr: 1.25, fps: 24, stars: 2, shadows: true },
  low: { dpr: 1, fps: 0, stars: 1, shadows: false },
  basic: { dpr: 1, fps: 0, stars: 0, shadows: false },
};

export const QUALITY_LABELS: Record<StudioQualityPreference, string> = {
  auto: "Automática",
  ultra: "Cinemática",
  high: "Alta",
  medium: "Equilibrada",
  low: "Leve",
  basic: "Máxima economia",
};

export type StudioQualityState = {
  preference: StudioQualityPreference;
  quality: StudioQuality;
  ceiling: StudioQuality;
  ultraApproved: boolean;
  ultraEligible: boolean;
  ultraCandidate: boolean;
};

export const initialStudioQualityState: StudioQualityState = {
  preference: "auto",
  quality: "medium",
  ceiling: "ultra",
  ultraApproved: false,
  ultraEligible: false,
  ultraCandidate: false,
};

type StudioQualityAction =
  | {
      type: "preference";
      preference: StudioQualityPreference;
      hints: StudioQualityHints;
      reducedMotion: boolean;
    }
  | { type: "sync"; hints: StudioQualityHints; reducedMotion: boolean }
  | { type: "degrade"; quality: StudioQuality }
  | { type: "ultra-assessed"; qualified: boolean };

export function studioQualityReducer(
  state: StudioQualityState,
  action: StudioQualityAction,
): StudioQualityState {
  if (action.type === "degrade") {
    if (state.preference !== "auto") return state;
    return {
      ...state,
      ultraCandidate: false,
      ceiling:
        QUALITY_ORDER.indexOf(action.quality) >
        QUALITY_ORDER.indexOf(state.ceiling)
          ? action.quality
          : state.ceiling,
      quality:
        QUALITY_ORDER.indexOf(action.quality) >
        QUALITY_ORDER.indexOf(state.quality)
          ? action.quality
          : state.quality,
    };
  }
  if (action.type === "ultra-assessed") {
    if (state.preference !== "auto" || !state.ultraCandidate) return state;
    return {
      ...state,
      ultraCandidate: false,
      ultraApproved: action.qualified,
      quality:
        action.qualified && state.ceiling === "ultra" ? "ultra" : state.quality,
      ceiling: action.qualified ? state.ceiling : "high",
    };
  }

  const current =
    action.type === "preference"
      ? { ...initialStudioQualityState, preference: action.preference }
      : state;
  const ultraEligible =
    canTryStudioUltra(action.hints) && !action.reducedMotion;
  const automatic = current.preference === "auto";
  const requested =
    automatic && ultraEligible && current.ultraApproved
      ? "ultra"
      : selectStudioQuality(action.hints, current.preference);
  const quality =
    !automatic ||
    QUALITY_ORDER.indexOf(requested) > QUALITY_ORDER.indexOf(current.ceiling)
      ? requested
      : current.ceiling;
  return {
    ...current,
    quality,
    ultraEligible,
    ultraCandidate:
      automatic &&
      ultraEligible &&
      !current.ultraApproved &&
      current.ceiling === "ultra" &&
      quality === "high",
  };
}

function validPositiveNumber(value: number | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

export function selectStudioQuality(
  hints: StudioQualityHints,
  preference: StudioQualityPreference = "auto",
): StudioQuality {
  if (preference !== "auto") return preference;
  const cores =
    validPositiveNumber(hints.cores) && Number.isInteger(hints.cores)
      ? hints.cores
      : undefined;
  const memoryGB = validPositiveNumber(hints.memoryGB)
    ? hints.memoryGB
    : undefined;

  if (
    hints.saveData === true ||
    hints.effectiveType === "slow-2g" ||
    hints.effectiveType === "2g" ||
    (cores !== undefined && cores <= 2) ||
    (memoryGB !== undefined && memoryGB <= 2)
  ) {
    return "basic";
  }
  if (
    hints.effectiveType === "3g" ||
    (cores !== undefined && cores <= 4) ||
    (memoryGB !== undefined && memoryGB <= 4)
  ) {
    return "low";
  }
  if (
    cores !== undefined &&
    cores >= 8 &&
    memoryGB !== undefined &&
    memoryGB >= 8
  ) {
    return "high";
  }
  return "medium";
}

export function lowerStudioQuality(current: StudioQuality): StudioQuality {
  const next: Record<StudioQuality, StudioQuality> = {
    ultra: "high",
    high: "medium",
    medium: "low",
    low: "basic",
    basic: "basic",
  };
  return next[current];
}

export function canTryStudioUltra(hints: StudioQualityHints): boolean {
  // Hardware reports are coarse and optional. This only gates automatic
  // trials; an explicit quality selection does not require these signals.
  return (
    validPositiveNumber(hints.cores) &&
    Number.isInteger(hints.cores) &&
    hints.cores >= 16 &&
    validPositiveNumber(hints.memoryGB) &&
    hints.memoryGB >= 8 &&
    hints.finePointer === true &&
    hints.saveData !== true &&
    hints.effectiveType === "4g" &&
    validPositiveNumber(hints.downlinkMbps) &&
    hints.downlinkMbps >= 8
  );
}

export function qualifiesForStudioUltra(
  frameIntervalsMs: readonly number[],
): boolean {
  // Promotion needs an uninterrupted healthy sample. A stall or invalid frame
  // must reject the trial, rather than disappear from the percentile window.
  if (
    frameIntervalsMs.length < 90 ||
    frameIntervalsMs.some(
      (interval) => !validPositiveNumber(interval) || interval > 100,
    )
  ) {
    return false;
  }

  const samples = [...frameIntervalsMs].sort((a, b) => a - b);
  const midpoint = Math.floor(samples.length / 2);
  const median =
    samples.length % 2 === 0
      ? (samples[midpoint - 1] + samples[midpoint]) / 2
      : samples[midpoint];
  const p90 = samples[Math.ceil(samples.length * 0.9) - 1];
  return median <= 18.5 && p90 <= 23;
}

export function assessFrameWindow(
  current: StudioQuality,
  frameIntervalsMs: number[],
  targetFps: number,
): StudioQuality {
  if (!validPositiveNumber(targetFps)) return current;

  // Demand rendering and hidden tabs create idle gaps, not slow frames.
  const samples = frameIntervalsMs
    .filter((interval) => validPositiveNumber(interval) && interval <= 250)
    .sort((a, b) => a - b);
  if (samples.length < 48) return current;

  const midpoint = Math.floor(samples.length / 2);
  const median =
    samples.length % 2 === 0
      ? (samples[midpoint - 1] + samples[midpoint]) / 2
      : samples[midpoint];
  const p90 = samples[Math.ceil(samples.length * 0.9) - 1];
  const targetInterval = 1000 / targetFps;

  if (median > targetInterval * 1.5 || p90 > targetInterval * 2) {
    return lowerStudioQuality(current);
  }
  return current;
}
