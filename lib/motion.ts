export type MotionMode = "full" | "light" | "reduced";

export type MotionCapabilityInput = {
  reducedMotion: boolean;
  saveData?: boolean;
  effectiveType?: string;
  hardwareConcurrency?: number;
  deviceMemory?: number;
  viewportWidth?: number;
};

export function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

export function pageProgress(
  scrollY: number,
  documentHeight: number,
  viewportHeight: number,
) {
  const distance = Math.max(0, documentHeight - viewportHeight);
  return distance === 0 ? 0 : clamp01(scrollY / distance);
}

export function sectionProgress(
  sectionTop: number,
  sectionHeight: number,
  viewportHeight: number,
) {
  const travel = Math.max(1, sectionHeight + viewportHeight);
  return clamp01((viewportHeight - sectionTop) / travel);
}

export function motionPhases(progress: number) {
  const value = clamp01(progress);
  return {
    approach: clamp01(value / 0.2),
    enter: clamp01((value - 0.2) / 0.2),
    center: Math.min(
      clamp01((value - 0.36) / 0.1),
      clamp01((0.72 - value) / 0.1),
    ),
    transform: clamp01((value - 0.65) / 0.2),
    exit: clamp01((value - 0.85) / 0.15),
  };
}

export function chapterPhases(position: number, index: number) {
  const signed = position - index;
  return {
    signed,
    enter: clamp01(signed + 1),
    focus: clamp01(1 - Math.abs(signed) / 1.18),
    exit: clamp01(signed),
  };
}

export function chooseMotionMode(input: MotionCapabilityInput): MotionMode {
  if (input.reducedMotion) return "reduced";
  if (
    input.saveData ||
    input.effectiveType === "slow-2g" ||
    input.effectiveType === "2g" ||
    (input.hardwareConcurrency !== undefined &&
      input.hardwareConcurrency <= 4) ||
    (input.deviceMemory !== undefined && input.deviceMemory <= 4) ||
    (input.viewportWidth !== undefined && input.viewportWidth < 520)
  ) {
    return "light";
  }
  return "full";
}
