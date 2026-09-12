export type StudioTheme = "dark" | "light";
export type StudioMode = "overview" | "walk";
export type StudioState = {
  mode: StudioMode;
  theme: StudioTheme;
  presentationTheme: StudioTheme;
  selectedItem: string | null;
};
export type StudioAction =
  | { type: "mode"; mode: StudioMode }
  | { type: "theme"; theme: StudioTheme }
  | { type: "select"; id: string | null }
  | { type: "escape" };
export const initialStudioState: StudioState = {
  mode: "overview",
  theme: "dark",
  presentationTheme: "dark",
  selectedItem: null,
};
export function studioReducer(
  state: StudioState,
  action: StudioAction,
): StudioState {
  switch (action.type) {
    case "theme":
      return {
        ...state,
        theme: action.theme,
        presentationTheme:
          state.mode === "overview" ? action.theme : state.presentationTheme,
      };
    case "select":
      return { ...state, selectedItem: action.id };
    case "mode":
      if (action.mode === state.mode) return state;
      return action.mode === "walk"
        ? {
            ...state,
            mode: "walk",
            presentationTheme: state.theme,
            selectedItem: null,
          }
        : {
            ...state,
            mode: "overview",
            theme: state.presentationTheme,
            selectedItem: null,
          };
    case "escape":
      return state.selectedItem
        ? { ...state, selectedItem: null }
        : studioReducer(state, { type: "mode", mode: "overview" });
  }
}

export type GroundPosition = { x: number; z: number };
// Padded footprints leave space for the visitor's body around the base furniture.
export const STUDIO_OBSTACLES = [
  { minX: -1.75, maxX: 1.75, minZ: -2.3, maxZ: -0.72 },
  { minX: -3.18, maxX: -1.92, minZ: -2.5, maxZ: -0.83 },
  { minX: -0.5, maxX: 0.5, minZ: -0.04, maxZ: 1.02 },
  { minX: 1.86, maxX: 2.5, minZ: -1.8, maxZ: -0.92 },
] as const;

export function canStandAt({ x, z }: GroundPosition) {
  return (
    Number.isFinite(x) &&
    Number.isFinite(z) &&
    x >= -3.18 &&
    x <= 3.18 &&
    z >= -2.4 &&
    z <= 3.08 &&
    !STUDIO_OBSTACLES.some(
      (box) => x > box.minX && x < box.maxX && z > box.minZ && z < box.maxZ,
    )
  );
}

export function walkStep(
  position: GroundPosition,
  dx: number,
  dz: number,
  dt: number,
): GroundPosition {
  if (![dx, dz, dt].every(Number.isFinite) || dt <= 0) return position;
  const length = Math.hypot(dx, dz);
  if (!length) return position;
  const distance = Math.min(dt, 0.05) * 1.8;
  const steps = Math.max(1, Math.ceil(distance / 0.035));
  const sx = ((dx / Math.max(1, length)) * distance) / steps;
  const sz = ((dz / Math.max(1, length)) * distance) / steps;
  let { x, z } = position;
  for (let i = 0; i < steps; i++) {
    if (canStandAt({ x: x + sx, z })) x += sx;
    if (canStandAt({ x, z: z + sz })) z += sz;
  }
  return { x, z };
}

export function readStudioTheme(value: string | null): StudioTheme {
  return value === "light" ? "light" : "dark";
}
