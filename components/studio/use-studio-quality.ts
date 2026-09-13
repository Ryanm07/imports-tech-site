"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import {
  initialStudioQualityState,
  readStudioQualityPreference,
  studioQualityReducer,
  shouldDeferStudio3D,
  type StudioQuality,
  type StudioQualityHints,
  type StudioQualityPreference,
} from "@/lib/studio-quality";

const QUALITY_KEY = "imports-tech:studio-quality:v1";
type StudioNavigator = Navigator & {
  deviceMemory?: number;
  connection?: EventTarget & {
    saveData?: boolean;
    effectiveType?: string;
    downlink?: number;
  };
};

function readHints(): StudioQualityHints {
  const device = navigator as StudioNavigator;
  return {
    cores: device.hardwareConcurrency,
    memoryGB: device.deviceMemory,
    saveData: device.connection?.saveData,
    effectiveType: device.connection?.effectiveType,
    downlinkMbps: device.connection?.downlink,
    finePointer: window.matchMedia("(hover: hover) and (pointer: fine)")
      .matches,
  };
}

export function useStudioQuality(reducedMotion: boolean) {
  const [state, dispatch] = useReducer(
    studioQualityReducer,
    initialStudioQualityState,
  );
  const restored = useRef(false);
  const [entry, setEntry] = useState<"pending" | "static" | "3d">("pending");

  useEffect(() => {
    const device = navigator as StudioNavigator;
    const pointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const sync = () =>
      dispatch({ type: "sync", hints: readHints(), reducedMotion });
    if (!restored.current) {
      let preference: StudioQualityPreference = "auto";
      try {
        preference = readStudioQualityPreference(
          localStorage.getItem(QUALITY_KEY),
        );
      } catch {
        // Quality selection still works when browser storage is unavailable.
      }
      restored.current = true;
      setEntry(shouldDeferStudio3D(readHints(), preference) ? "static" : "3d");
      dispatch({
        type: "preference",
        preference,
        hints: readHints(),
        reducedMotion,
      });
    } else {
      sync();
    }
    device.connection?.addEventListener("change", sync);
    pointer.addEventListener("change", sync);
    return () => {
      device.connection?.removeEventListener("change", sync);
      pointer.removeEventListener("change", sync);
    };
  }, [reducedMotion]);

  const setQualityPreference = useCallback(
    (preference: StudioQualityPreference) => {
      setEntry("3d");
      dispatch({
        type: "preference",
        preference,
        hints: readHints(),
        reducedMotion,
      });
      try {
        localStorage.setItem(QUALITY_KEY, preference);
      } catch {
        // The current session continues to respect the selected preset.
      }
    },
    [reducedMotion],
  );
  const onDegrade = useCallback((quality: StudioQuality) => {
    dispatch({ type: "degrade", quality });
  }, []);
  const onUltraAssessed = useCallback((qualified: boolean) => {
    dispatch({ type: "ultra-assessed", qualified });
  }, []);

  return {
    entry,
    quality: state.quality,
    qualityPreference: state.preference,
    setQualityPreference,
    ultraEligible: state.ultraEligible,
    ultraCandidate: state.ultraCandidate,
    onDegrade,
    onUltraAssessed,
  };
}
