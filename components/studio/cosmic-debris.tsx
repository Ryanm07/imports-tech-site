"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Color, DynamicDrawUsage, Object3D, type InstancedMesh } from "three";
import { HOLE_POSITION, HOLE_RADIUS } from "@/lib/cosmic-space";
import {
  advanceCosmicDebris,
  createCosmicDebris,
  resetCosmicDebris,
  type CosmicDebrisSimulation,
} from "@/lib/cosmic-debris";

const noRaycast = () => {};

function writeMatrices(
  mesh: InstancedMesh,
  simulation: CosmicDebrisSimulation,
  transform: Object3D,
) {
  const { bodies, hole, captureRadius } = simulation;
  for (let index = 0; index < bodies.length; index++) {
    const body = bodies[index];
    const distance = Math.hypot(
      body.position[0] - hole[0],
      body.position[1] - hole[1],
      body.position[2] - hole[2],
    );
    const rim = Math.min(
      1,
      Math.max(0, (distance - captureRadius - 0.02) / 0.7),
    );
    const scale = body.captured ? 0 : rim * rim * (3 - 2 * rim);
    transform.position.set(...body.position);
    transform.rotation.set(...body.rotation);
    transform.scale.set(
      body.size[0] * scale,
      body.size[1] * scale,
      body.size[2] * scale,
    );
    transform.updateMatrix();
    mesh.setMatrixAt(index, transform.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
}

/** Loaded only for Ultra; all fragments share one geometry, material and draw call. */
export default function CosmicDebris({
  theme,
  paused,
  reducedMotion,
}: {
  theme: "light" | "dark";
  paused: boolean;
  reducedMotion: boolean;
}) {
  const mesh = useRef<InstancedMesh>(null);
  const resumePending = useRef(true);
  const { invalidate } = useThree();
  const simulation = useMemo(
    () => createCosmicDebris(HOLE_POSITION, HOLE_RADIUS),
    [],
  );
  const transform = useMemo(() => new Object3D(), []);
  const palettes = useMemo(
    () => ({
      dark: [new Color("#657166"), new Color("#aa865c"), new Color("#d7ac58")],
      light: [new Color("#b9c0b2"), new Color("#b9976c"), new Color("#bc893a")],
    }),
    [],
  );

  useLayoutEffect(() => {
    const instances = mesh.current;
    if (!instances) return;
    if (reducedMotion) resetCosmicDebris(simulation);
    instances.instanceMatrix.setUsage(DynamicDrawUsage);
    for (let index = 0; index < simulation.bodies.length; index++) {
      instances.setColorAt(
        index,
        palettes[theme][simulation.bodies[index].material],
      );
    }
    if (instances.instanceColor) instances.instanceColor.needsUpdate = true;
    writeMatrices(instances, simulation, transform);
    invalidate();
  }, [theme, reducedMotion, simulation, transform, palettes, invalidate]);

  useEffect(() => {
    resumePending.current = true;
  }, [paused, reducedMotion]);

  useEffect(() => {
    const onVisibility = () => {
      resumePending.current = true;
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useFrame((_, delta) => {
    if (paused || reducedMotion || document.hidden || !mesh.current) {
      resumePending.current = true;
      return;
    }
    // Ignore the first resumed delta, which can include time spent in another tab.
    if (resumePending.current) {
      resumePending.current = false;
      return;
    }
    advanceCosmicDebris(simulation, theme, delta);
    writeMatrices(mesh.current, simulation, transform);
  });

  return (
    <instancedMesh
      ref={mesh}
      name="cosmic-studio-fragments"
      args={[undefined, undefined, simulation.bodies.length]}
      frustumCulled={false}
      raycast={noRaycast}
      castShadow={false}
      receiveShadow={false}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        roughness={0.76}
        metalness={0.22}
        emissive="#9c671f"
        emissiveIntensity={theme === "dark" ? 0.13 : 0.035}
      />
    </instancedMesh>
  );
}
