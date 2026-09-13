import { createContext } from "react";
import type { Group } from "three";

export type StudioObjectActions = {
  pick: (id: string) => boolean;
  throw: () => void;
  drop: () => void;
  restore: () => void;
  click: (id: string | null, touch?: boolean) => void;
};
export type StudioObjectBridge = {
  objects: Map<string, Group>;
  actions: StudioObjectActions | null;
};
export const ObjectInteractionContext =
  createContext<StudioObjectBridge | null>(null);
