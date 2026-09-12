"use client";
/* eslint-disable react-hooks/immutability -- Three.js cameras, lights and the input ref are mutable engine objects; updates happen in effects/useFrame, never during React render. */

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, type MutableRefObject } from "react";
import {
  Color,
  MathUtils,
  PCFShadowMap,
  Vector3,
  type DirectionalLight,
  type HemisphereLight,
} from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { StudioRoom } from "./studio-room";
import { StudioInteractionContext } from "./interactive-object";
import { CosmicBackground } from "./cosmic-background";
import { QUALITY_SETTINGS, type StudioQuality } from "@/lib/studio-quality";
import {
  walkStep,
  type StudioMode,
  type StudioTheme,
} from "@/lib/studio-navigation";

export type MovementInput = { forward: number; right: number };
type Props = {
  theme: StudioTheme;
  mode: StudioMode;
  paused: boolean;
  resetKey: number;
  reducedMotion: boolean;
  earbudsOpen: boolean;
  quality: StudioQuality;
  onDegrade: (quality: StudioQuality) => void;
  movement: MutableRefObject<MovementInput>;
  onSelect: (id: string) => void;
  onReady: () => void;
  onFailure: () => void;
};

function Lighting({
  theme,
  reducedMotion,
}: Pick<Props, "theme" | "reducedMotion">) {
  const { scene, invalidate } = useThree();
  const sun = useRef<DirectionalLight>(null);
  const fill = useRef<HemisphereLight>(null);
  const target = useRef(new Color());
  useEffect(() => {
    target.current.set(theme === "light" ? "#e9e5dc" : "#10191e");
    if (!scene.background) scene.background = target.current.clone();
    invalidate();
  }, [theme, scene, invalidate]);
  useFrame((_, delta) => {
    const k = reducedMotion ? 1 : 1 - Math.exp(-delta * 8);
    const background = scene.background as Color;
    background?.lerp(target.current, k);
    const strength = theme === "light" ? 3.1 : 1.65;
    if (sun.current)
      sun.current.intensity = MathUtils.lerp(
        sun.current.intensity,
        strength,
        k,
      );
    if (fill.current)
      fill.current.intensity = MathUtils.lerp(
        fill.current.intensity,
        theme === "light" ? 2.1 : 1.0,
        k,
      );
    if (Math.abs((sun.current?.intensity || 0) - strength) > 0.002)
      invalidate();
  });
  return (
    <>
      <hemisphereLight ref={fill} args={["#c4d5e1", "#715341", 1.0]} />
      <directionalLight
        ref={sun}
        position={[2.5, 6, 4]}
        intensity={1.65}
        color="#ffe4bd"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
        shadow-normalBias={0.04}
        shadow-bias={-0.0001}
      />
      <pointLight
        position={[-1.9, 2.7, -0.5]}
        color="#69c7ca"
        intensity={theme === "dark" ? 8 : 2}
        distance={7}
        decay={2}
      />
      <pointLight
        position={[2.2, 1.8, -1.7]}
        color="#f1ad76"
        intensity={theme === "dark" ? 7 : 2}
        distance={6}
        decay={2}
      />
      <pointLight
        position={[0, 1.5, -1.5]}
        color="#c0e6ff"
        intensity={1.4}
        distance={3}
      />
    </>
  );
}

function CameraRig({
  mode,
  paused,
  resetKey,
  movement,
  reducedMotion,
}: Omit<
  Props,
  | "theme"
  | "onSelect"
  | "onReady"
  | "onFailure"
  | "earbudsOpen"
  | "quality"
  | "onDegrade"
>) {
  const { camera, gl, invalidate, size } = useThree();
  const framingScale = Math.max(1, 1.2 / (size.width / size.height));
  const orbit = useRef<OrbitControls | null>(null);
  const keys = useRef(new Set<string>());
  const angles = useRef({ yaw: 0, pitch: -0.13 });
  const dragging = useRef<{ id: number; x: number; y: number } | null>(null);
  const transition = useRef(false);
  const destination = useRef(new Vector3());
  const lookAt = useRef(new Vector3(0, 1, -0.2));
  const modeRef = useRef(mode);
  const pausedRef = useRef(paused);
  useEffect(() => {
    modeRef.current = mode;
    pausedRef.current = paused;
  }, [mode, paused]);

  useEffect(() => {
    const controls = new OrbitControls(camera, gl.domElement);
    controls.target.set(0, 1, -0.2);
    controls.enablePan = false;
    controls.enableDamping = false;
    controls.minDistance = 5.5;
    controls.maxDistance = 35;
    controls.minPolarAngle = 0.48;
    controls.maxPolarAngle = 1.35;
    controls.minAzimuthAngle = -0.05;
    controls.maxAzimuthAngle = 1.15;
    controls.rotateSpeed = 0.45;
    controls.zoomSpeed = 0.6;
    controls.addEventListener("change", () => invalidate());
    controls.addEventListener("start", () => {
      transition.current = false;
    });
    orbit.current = controls;
    return () => {
      controls.dispose();
      orbit.current = null;
    };
  }, [camera, gl, invalidate]);

  useEffect(() => {
    keys.current.clear();
    movement.current = { forward: 0, right: 0 };
    if (orbit.current) orbit.current.enabled = mode === "overview" && !paused;
    if (paused) return;
    if (mode === "walk") {
      camera.position.set(1.82, 1.62, 2.3);
      angles.current = { yaw: 0.28, pitch: -0.14 };
      camera.rotation.set(-0.14, 0.28, 0, "YXZ");
      transition.current = false;
    } else {
      destination.current.set(
        6.3 * framingScale,
        1 + 3.2 * framingScale,
        -0.12 + 7.72 * framingScale,
      );
      lookAt.current.set(0, 1.0, -0.12);
      if (orbit.current) orbit.current.target.copy(lookAt.current);
      if (reducedMotion) {
        camera.position.copy(destination.current);
        camera.lookAt(lookAt.current);
        orbit.current?.update();
      } else transition.current = true;
    }
    invalidate();
    // Opening or closing a detail must not reset the visitor's position.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, resetKey, framingScale, reducedMotion]);

  useEffect(() => {
    if (orbit.current) orbit.current.enabled = mode === "overview" && !paused;
    if (paused) {
      keys.current.clear();
      movement.current = { forward: 0, right: 0 };
      dragging.current = null;
    }
    invalidate();
  }, [mode, paused, movement, invalidate]);

  useEffect(() => {
    const canvas = gl.domElement;
    canvas.tabIndex = 0;
    canvas.setAttribute(
      "aria-label",
      "Estúdio 3D. Arraste para olhar; no modo livre, use W A S D ou as setas para andar.",
    );
    const movementKeys = new Set([
      "KeyW",
      "KeyA",
      "KeyS",
      "KeyD",
      "ArrowUp",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
    ]);
    const clear = () => {
      keys.current.clear();
      movement.current = { forward: 0, right: 0 };
      dragging.current = null;
    };
    const keydown = (event: KeyboardEvent) => {
      if (
        modeRef.current !== "walk" ||
        pausedRef.current ||
        !movementKeys.has(event.code)
      )
        return;
      const focused = document.activeElement;
      if (focused !== canvas && focused !== document.body) return;
      event.preventDefault();
      keys.current.add(event.code);
      invalidate();
    };
    const keyup = (event: KeyboardEvent) => keys.current.delete(event.code);
    const down = (event: PointerEvent) => {
      if (modeRef.current !== "walk" || pausedRef.current || event.button !== 0)
        return;
      canvas.focus({ preventScroll: true });
      dragging.current = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
      };
    };
    const move = (event: PointerEvent) => {
      const drag = dragging.current;
      if (!drag || drag.id !== event.pointerId || pausedRef.current) return;
      angles.current.yaw -= (event.clientX - drag.x) * 0.004;
      angles.current.pitch = MathUtils.clamp(
        angles.current.pitch - (event.clientY - drag.y) * 0.003,
        -1.12,
        0.75,
      );
      drag.x = event.clientX;
      drag.y = event.clientY;
      camera.rotation.set(angles.current.pitch, angles.current.yaw, 0, "YXZ");
      invalidate();
    };
    const up = () => {
      dragging.current = null;
    };
    canvas.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    window.addEventListener("keydown", keydown);
    window.addEventListener("keyup", keyup);
    window.addEventListener("blur", clear);
    document.addEventListener("visibilitychange", clear);
    return () => {
      clear();
      canvas.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      window.removeEventListener("keydown", keydown);
      window.removeEventListener("keyup", keyup);
      window.removeEventListener("blur", clear);
      document.removeEventListener("visibilitychange", clear);
    };
  }, [camera, gl, movement, invalidate]);

  useFrame((_, delta) => {
    if (transition.current) {
      camera.position.lerp(
        destination.current,
        1 - Math.exp(-Math.min(delta, 0.05) * 7),
      );
      camera.lookAt(lookAt.current);
      if (camera.position.distanceTo(destination.current) < 0.005) {
        camera.position.copy(destination.current);
        transition.current = false;
        orbit.current?.update();
      } else invalidate();
    }
    if (mode !== "walk" || paused) return;
    const pressed = keys.current;
    const forward =
      Number(pressed.has("KeyW") || pressed.has("ArrowUp")) -
      Number(pressed.has("KeyS") || pressed.has("ArrowDown")) +
      movement.current.forward;
    const right =
      Number(pressed.has("KeyD") || pressed.has("ArrowRight")) -
      Number(pressed.has("KeyA") || pressed.has("ArrowLeft")) +
      movement.current.right;
    if (!forward && !right) return;
    const yaw = angles.current.yaw;
    const next = walkStep(
      camera.position,
      right * Math.cos(yaw) - forward * Math.sin(yaw),
      -forward * Math.cos(yaw) - right * Math.sin(yaw),
      delta,
    );
    camera.position.x = next.x;
    camera.position.z = next.z;
    gl.domElement.dataset.cameraPosition = `${next.x.toFixed(3)},${camera.position.y.toFixed(3)},${next.z.toFixed(3)}`;
    invalidate();
  });
  return null;
}

function Ready({
  onReady,
  onFailure,
  movement,
}: Pick<Props, "onReady" | "onFailure" | "movement">) {
  const { gl, invalidate } = useThree();
  useEffect(() => {
    onReady();
    const lost = (event: Event) => {
      event.preventDefault();
      onFailure();
    };
    gl.domElement.addEventListener("webglcontextlost", lost);
    // Touch controls sit outside Canvas; this event wakes on-demand rendering.
    const wake = () => invalidate();
    window.addEventListener("imports-tech:studio-move", wake);
    return () => {
      movement.current = { forward: 0, right: 0 };
      gl.domElement.removeEventListener("webglcontextlost", lost);
      window.removeEventListener("imports-tech:studio-move", wake);
    };
  }, [gl, onReady, onFailure, movement, invalidate]);
  return null;
}

export default function StudioCanvas(props: Props) {
  const settings = QUALITY_SETTINGS[props.quality];
  return (
    <Canvas
      frameloop="demand"
      dpr={[1, settings.dpr]}
      shadows={settings.shadows ? { type: PCFShadowMap } : false}
      camera={{ position: [6.3, 4.2, 7.6], fov: 43, near: 0.1, far: 60 }}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
      }}
      fallback={
        <div className="studio-webgl-fallback">
          A visualização 3D não está disponível neste navegador. Explore pela
          lista de objetos.
        </div>
      }
    >
      <Lighting theme={props.theme} reducedMotion={props.reducedMotion} />
      <CosmicBackground
        theme={props.theme}
        mode={props.mode}
        quality={props.quality}
        reducedMotion={props.reducedMotion}
        paused={props.paused}
        onDegrade={props.onDegrade}
      />
      <StudioInteractionContext.Provider
        value={{ enabled: !props.paused, reducedMotion: props.reducedMotion }}
      >
        <StudioRoom
          theme={props.theme}
          onSelect={props.onSelect}
          earbudsOpen={props.earbudsOpen}
          reducedMotion={props.reducedMotion}
        />
      </StudioInteractionContext.Provider>
      <CameraRig {...props} />
      <Ready
        onReady={props.onReady}
        onFailure={props.onFailure}
        movement={props.movement}
      />
    </Canvas>
  );
}
