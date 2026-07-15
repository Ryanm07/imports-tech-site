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
