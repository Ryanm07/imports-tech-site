"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Mesh, type Object3D } from "three";
import { createNitroLid, NITRO_STUDIO_SCALE } from "@/lib/nitro-lid";

export type NitroAnimationProps = { open: boolean; reducedMotion: boolean };

export function NitroScene({
  source,
  open,
  reducedMotion,
  shadows = true,
}: NitroAnimationProps & { source: Object3D; shadows?: boolean }) {
  const control = useMemo(() => {
    const next = createNitroLid(source);
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
    // A quality change or completed download preserves the current lid state.
    if (initialized.current !== control) {
      control.update(open, 0, true);
      initialized.current = control;
    }
    invalidate();
  }, [control, open, reducedMotion, invalidate]);
  useFrame((_, delta) => {
    if (control.update(open, delta, reducedMotion)) invalidate();
  });
  return (
    <primitive
      object={control.scene}
      scale={NITRO_STUDIO_SCALE}
      dispose={null}
    />
  );
}
