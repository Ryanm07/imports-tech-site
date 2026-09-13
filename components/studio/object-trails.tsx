"use client";
/* eslint-disable react-hooks/immutability -- Particle buffers are updated only in the render loop. */
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { DynamicDrawUsage, type BufferAttribute } from "three";
import type { StudioPhysics } from "@/lib/studio-physics";

const COUNT = 128;
/** A fixed visual pool, mounted only in Cinematic. Particles never become colliders. */
export function ObjectTrails({
  engine,
  paused,
}: {
  engine: StudioPhysics;
  paused: boolean;
}) {
  const attribute = useRef<BufferAttribute>(null);
  const pool = useMemo(
    () => ({
      positions: new Float32Array(COUNT * 3).fill(1000),
      life: new Float32Array(COUNT),
      cursor: 0,
      elapsed: 0,
    }),
    [],
  );
  useFrame((_, delta) => {
    if (paused || document.hidden || !attribute.current) return;
    const dt = Math.min(delta, 0.05);
    pool.elapsed += dt;
    let changed = false;
    for (let i = 0; i < COUNT; i++) {
      if (pool.life[i] <= 0) continue;
      pool.life[i] -= dt;
      if (pool.life[i] <= 0) pool.positions[i * 3 + 1] = 1000;
      else pool.positions[i * 3 + 1] += dt * 0.08;
      changed = true;
    }
    if (pool.elapsed >= 0.045) {
      pool.elapsed = 0;
      for (const body of engine.bodies) {
        if (body.state !== "flying" && body.state !== "returning") continue;
        for (let spark = 0; spark < 2; spark++) {
          const i = pool.cursor;
          pool.cursor = (i + 1) % COUNT;
          pool.life[i] = 0.35 + (i % 5) * 0.045;
          pool.positions[i * 3] = body.position[0] + Math.sin(i * 5.7) * 0.055;
          pool.positions[i * 3 + 1] =
            body.position[1] + Math.cos(i * 3.1) * 0.055;
          pool.positions[i * 3 + 2] =
            body.position[2] + Math.sin(i * 2.3) * 0.055;
          changed = true;
        }
      }
    }
    if (changed) attribute.current.needsUpdate = true;
  });
  return (
    <points
      frustumCulled={false}
      raycast={() => {}}
      name="object-golden-trails"
    >
      <bufferGeometry>
        <bufferAttribute
          ref={attribute}
          attach="attributes-position"
          args={[pool.positions, 3]}
          usage={DynamicDrawUsage}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.035}
        color="#ffd582"
        transparent
        opacity={0.75}
        depthWrite={false}
        toneMapped={false}
      />
    </points>
  );
}
