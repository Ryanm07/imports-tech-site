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
  const focus = Math.min(
    clamp01((value - 0.32) / 0.06),
    clamp01((0.72 - value) / 0.07),
  );
  return {
    approach: clamp01(value / 0.18),
    enter: clamp01((value - 0.18) / 0.2),
    focus,
    center: focus,
    transform: clamp01((value - 0.65) / 0.21),
    exit: clamp01((value - 0.86) / 0.14),
  };
}

export function chapterPhases(position: number, index: number) {
  const signed = position - index;
  const progress = clamp01((signed + 1) / 2);
  return {
    signed,
    progress,
    approach: clamp01(progress / 0.18),
    enter: clamp01((progress - 0.1) / 0.35),
    focus: clamp01(1 - Math.abs(signed) / 1.18),
    transform: clamp01((progress - 0.62) / 0.22),
    exit: clamp01((progress - 0.68) / 0.32),
    cycle: Math.abs(Math.sin(progress * Math.PI * 2)),
    eased: 1 - Math.pow(1 - progress, 3),
  };
}

export function storyScrollPosition(
  scrollY: number,
  sectionTop: number,
  travel: number,
  chapterCount: number,
) {
  const progress = clamp01((scrollY - sectionTop) / Math.max(1, travel));
  return progress * Math.max(0, chapterCount - 1);
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
