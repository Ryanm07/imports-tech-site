"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Matrix4, Vector3, type ShaderMaterial } from "three";
import { HOLE_POSITION, HOLE_RADIUS } from "@/lib/cosmic-space";
import { cosmicVertexShader, cosmicFragmentShader } from "./cosmic-shaders";
import {
  QUALITY_SETTINGS,
  assessFrameWindow,
  lowerStudioQuality,
  qualifiesForStudioUltra,
  type StudioQuality,
} from "@/lib/studio-quality";

export function CosmicBackground({
  theme,
  mode,
  quality,
  reducedMotion,
  paused,
  onDegrade,
  ultraCandidate,
  onUltraAssessed,
}: {
  theme: "light" | "dark";
  mode: "overview" | "walk";
  quality: StudioQuality;
  reducedMotion: boolean;
  paused: boolean;
  onDegrade: (quality: StudioQuality) => void;
  ultraCandidate: boolean;
  onUltraAssessed: (qualified: boolean) => void;
}) {
  const { size, invalidate, camera, gl } = useThree();
  const settings = QUALITY_SETTINGS[quality];
  const material = useRef<ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uCameraWorld: { value: new Matrix4() },
      uProjectionInverse: { value: new Matrix4() },
      uHole: { value: new Vector3(...HOLE_POSITION) },
      uRadius: { value: HOLE_RADIUS },
      uUltra: { value: 0 },
      uShowHole: { value: 0 },
      uTime: { value: 0 },
      uLight: { value: 0 },
      uLayers: { value: 1 },
    }),
    [],
  );
  const lastFrame = useRef(0);
  const intervals = useRef<number[]>([]);
  const stalledFrames = useRef(0);
  const active = useRef(false);
  const probeFrames = useRef<number[]>([]);
  const warmupFrames = useRef(0);
  const targetFps = ultraCandidate && !reducedMotion ? 60 : settings.fps;
  const motion = !reducedMotion && !paused && settings.fps > 0;
  useEffect(() => {
    invalidate();
  }, [size, settings.stars, invalidate]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const stop = () => {
      clearTimeout(timer);
      active.current = false;
      gl.domElement.setAttribute("data-cosmic-running", "false");
      lastFrame.current = 0;
      intervals.current = [];
      stalledFrames.current = 0;
      probeFrames.current = [];
      warmupFrames.current = 0;
    };
    const wake = () => {
      stop();
      if (!motion || document.hidden) return;
      active.current = true;
      gl.domElement.setAttribute("data-cosmic-running", "true");
      const tick = () => {
        invalidate();
        timer = setTimeout(tick, 1000 / targetFps);
      };
      tick();
    };
    wake();
    document.addEventListener("visibilitychange", wake);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", wake);
    };
  }, [motion, targetFps, invalidate, gl]);

  useEffect(() => {
    invalidate();
  }, [theme, mode, quality, reducedMotion, invalidate]);
  useFrame((_, delta) => {
    if (document.hidden) return;
    const shader = material.current;
    const live = shader?.uniforms;
    const k = reducedMotion ? 1 : 1 - Math.exp(-Math.min(delta, 0.05) * 5);
    const light = theme === "light" ? 1 : 0;
    if (live) {
      camera.updateMatrixWorld();
      live.uCameraWorld.value.copy(camera.matrixWorld);
      live.uProjectionInverse.value.copy(camera.projectionMatrixInverse);
      live.uLayers.value = settings.stars;
      live.uUltra.value = quality === "ultra" ? 1 : 0;
      live.uShowHole.value = mode === "walk" ? 1 : 0;
      live.uLight.value += (light - live.uLight.value) * k;
      if (Math.abs(light - live.uLight.value) > 0.002) invalidate();
      if (active.current)
        live.uTime.value += Math.min(delta, 0.08) * (1 - 2 * live.uLight.value);
    }
    if (paused || quality === "basic") {
      lastFrame.current = 0;
      intervals.current = [];
      stalledFrames.current = 0;
      return;
    }
    const now = performance.now();
    const gap = now - lastFrame.current;
    if (ultraCandidate && active.current && lastFrame.current > 0) {
      // Let the initial shader compilation, model upload and camera settle.
      if (warmupFrames.current < 45) warmupFrames.current++;
      else probeFrames.current.push(gap);
      if (probeFrames.current.length >= 90) {
        onUltraAssessed(qualifiesForStudioUltra(probeFrames.current));
        probeFrames.current = [];
      }
    }
    // Continuously requested frames may be too slow to fill a normal window.
    // Isolated stalls and idle demand-rendering gaps don't count.
    stalledFrames.current =
      active.current && lastFrame.current > 0 && gap > 250
        ? stalledFrames.current + 1
        : 0;
    if (stalledFrames.current >= 8) {
      stalledFrames.current = 0;
      onDegrade(lowerStudioQuality(quality));
    }
    if (gap > 250) intervals.current = [];
    else if (lastFrame.current) intervals.current.push(gap);
    lastFrame.current = now;
    if (intervals.current.length >= 72) {
      gl.domElement.setAttribute(
        "data-render-fps",
        (
          1000 /
          (intervals.current.reduce((sum, value) => sum + value, 0) /
            intervals.current.length)
        ).toFixed(1),
      );
      gl.domElement.setAttribute(
        "data-render-calls",
        String(gl.info.render.calls),
      );
      const next = assessFrameWindow(
        quality,
        intervals.current,
        active.current ? settings.fps : 30,
      );
      intervals.current = [];
      if (next !== quality) onDegrade(next);
    }
  }, -1);
  if (quality === "basic") return null;
  return (
    <mesh frustumCulled={false} renderOrder={-1000} raycast={() => {}}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={material}
        vertexShader={cosmicVertexShader}
        fragmentShader={cosmicFragmentShader}
        uniforms={uniforms}
        depthTest={false}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}
