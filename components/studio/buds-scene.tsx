"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Mesh, type Object3D } from "three";
import { createBudsLid } from "@/lib/buds-lid";

export type BudsAnimationProps = { open: boolean; reducedMotion: boolean };

export function BudsScene({
  source,
  open,
  reducedMotion,
  shadows = true,
}: BudsAnimationProps & {
  source: Object3D;
  shadows?: boolean;
}) {
  const control = useMemo(() => {
    const next = createBudsLid(source);
    if (!shadows)
      next.scene.traverse((object) => {
        if (object instanceof Mesh) {
          object.castShadow = false;
          object.receiveShadow = false;
        }
      });
    return next;
  }, [source, shadows]);
  const initialized = useRef<typeof control | null>(null);
  const invalidate = useThree((state) => state.invalidate);
  useLayoutEffect(() => {
    // Upgrading the model must preserve an already-open case, including when
    // the detailed download finishes after the visitor opened the stand-in.
    if (initialized.current !== control) {
      control.update(open, 0, true);
      initialized.current = control;
    }
    invalidate();
  }, [control, open, reducedMotion, invalidate]);
  useFrame((_, delta) => {
    if (control.update(open, delta, reducedMotion)) invalidate();
  });
  return <primitive object={control.scene} scale={2.8} dispose={null} />;
}
