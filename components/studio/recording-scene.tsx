"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Mesh, type Object3D } from "three";
import { createRecordingLight } from "@/lib/recording-light";

export type RecordingLightProps = { lightOn: boolean; reducedMotion: boolean };

export function RecordingRigScene({
  source,
  lightOn,
  reducedMotion,
  shadows = false,
}: RecordingLightProps & { source: Object3D; shadows?: boolean }) {
  const control = useMemo(() => {
    const next = createRecordingLight(source);
    next.scene.traverse((object) => {
      if (object instanceof Mesh) {
        object.castShadow = shadows;
        object.receiveShadow = shadows;
      }
    });
    return next;
  }, [source, shadows]);
  const initialized = useRef<typeof control | null>(null);
  const invalidate = useThree((state) => state.invalidate);
  useLayoutEffect(() => {
    // Download completion and quality changes preserve the selected light state.
    if (initialized.current !== control) {
      control.update(lightOn, 0, true);
      initialized.current = control;
    }
    invalidate();
  }, [control, lightOn, reducedMotion, invalidate]);
  useEffect(() => () => control.dispose(), [control]);
  useFrame((_, delta) => {
    if (control.update(lightOn, delta, reducedMotion)) invalidate();
  });
  return <primitive object={control.scene} dispose={null} />;
}

export function RecordingPhoneScene({
  source,
  shadows = false,
}: {
  source: Object3D;
  shadows?: boolean;
}) {
  const scene = useMemo(() => {
    const clone = source.clone(true);
    clone.traverse((object) => {
      if (object instanceof Mesh) {
        object.castShadow = shadows;
        object.receiveShadow = shadows;
      }
    });
    return clone;
  }, [source, shadows]);
  return (
    <primitive
      object={scene}
      scale={1.5}
      rotation={[0, 0, -Math.PI / 2]}
      dispose={null}
    />
  );
}
